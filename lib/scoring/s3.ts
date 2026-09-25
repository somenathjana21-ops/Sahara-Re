import { CaseRecord } from "@/types/contract";

export interface S3ConditionBreakdown {
  id: string;
  name: string;
  points: number;
  kind: "static" | "time_windowed";
  matched: boolean;
  detail: string;
}

export interface S3Result {
  score: number;
  standingPoints: number;
  timeWindowedPoints: number;
  totalPoints: number;
  capped: boolean;
  conditions: S3ConditionBreakdown[];
  reasons: string[];
}

/**
 * Normalises a date input (string YYYY-MM-DD or ISO string, or Date) to UTC midnight epoch ms.
 */
function toMidnightMs(dateInput: string | Date): number {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Computes S3 (Case Context Distress Score) deterministically from case dockets and court calendar.
 *
 * Formula:
 *   S3 = min(100, sum of applicable condition points)
 *
 * Rubric:
 * 1. Intimidation report filed within last 14 days (+25, time-windowed)
 * 2. Accused released on bail (+20, static)
 * 3. Next court hearing within 7 days (+15, time-windowed)
 * 4. Relief compensation overdue > 30 days (+15, static)
 * 5. Adjournment count >= 3 (+10, static)
 * 6. Social boycott flag active (+10, static)
 * 7. Case open > 365 days (+5, static)
 *
 * Max points possible: 100 (capped).
 *
 * Snapshot Semantics:
 * S3 is computed strictly at check-in time and frozen into assessment records.
 */
export function computeS3(
  caseRecord: CaseRecord,
  referenceDate: Date | string = new Date()
): S3Result {
  const refMs = toMidnightMs(referenceDate);
  const oneDayMs = 24 * 60 * 60 * 1000;

  const conditions: S3ConditionBreakdown[] = [];
  let standingPoints = 0;
  let timeWindowedPoints = 0;
  const reasons: string[] = [];

  // Condition 1: Intimidation report filed in last 14 days (+25, time-windowed)
  if (caseRecord.last_intimidation_report) {
    const reportMs = toMidnightMs(caseRecord.last_intimidation_report);
    const daysSince = Math.floor((refMs - reportMs) / oneDayMs);
    const matched = daysSince >= 0 && daysSince <= 14;
    conditions.push({
      id: "intimidation_14d",
      name: "Intimidation report filed within last 14 days",
      points: 25,
      kind: "time_windowed",
      matched,
      detail: `Reported ${daysSince} day(s) ago`,
    });
    if (matched) {
      timeWindowedPoints += 25;
      reasons.push("Intimidation report filed within last 14 days (+25)");
    }
  } else {
    conditions.push({
      id: "intimidation_14d",
      name: "Intimidation report filed within last 14 days",
      points: 25,
      kind: "time_windowed",
      matched: false,
      detail: "No intimidation report on file",
    });
  }

  // Condition 2: Accused released on bail (+20, static)
  const bailMatched = caseRecord.bail_status === "accused_on_bail";
  conditions.push({
    id: "accused_on_bail",
    name: "Accused released on bail",
    points: 20,
    kind: "static",
    matched: bailMatched,
    detail: bailMatched ? "Accused is currently on bail" : "Accused in custody",
  });
  if (bailMatched) {
    standingPoints += 20;
    reasons.push("Accused released on bail (+20)");
  }

  // Condition 3: Next court hearing within 7 days (+15, time-windowed)
  if (caseRecord.next_hearing_date) {
    const hearingMs = toMidnightMs(caseRecord.next_hearing_date);
    const daysUntil = Math.floor((hearingMs - refMs) / oneDayMs);
    const matched = daysUntil >= 0 && daysUntil <= 7;
    conditions.push({
      id: "hearing_7d",
      name: "Next hearing within 7 days",
      points: 15,
      kind: "time_windowed",
      matched,
      detail: `Hearing scheduled in ${daysUntil} day(s)`,
    });
    if (matched) {
      timeWindowedPoints += 15;
      reasons.push(`Court hearing in ${daysUntil} day(s) (+15)`);
    }
  } else {
    conditions.push({
      id: "hearing_7d",
      name: "Next hearing within 7 days",
      points: 15,
      kind: "time_windowed",
      matched: false,
      detail: "No upcoming hearing scheduled",
    });
  }

  // Condition 4: Relief compensation overdue > 30 days (+15, static)
  if (caseRecord.relief_due_date && !caseRecord.relief_paid) {
    const dueMs = toMidnightMs(caseRecord.relief_due_date);
    const daysOverdue = Math.floor((refMs - dueMs) / oneDayMs);
    const matched = daysOverdue > 30;
    conditions.push({
      id: "relief_overdue_30d",
      name: "Relief compensation overdue > 30 days",
      points: 15,
      kind: "static",
      matched,
      detail: `Overdue by ${daysOverdue} day(s)`,
    });
    if (matched) {
      standingPoints += 15;
      reasons.push(`Relief compensation overdue by ${daysOverdue} days (+15)`);
    }
  } else {
    conditions.push({
      id: "relief_overdue_30d",
      name: "Relief compensation overdue > 30 days",
      points: 15,
      kind: "static",
      matched: false,
      detail: caseRecord.relief_paid ? "Relief compensation already paid" : "No overdue relief date",
    });
  }

  // Condition 5: Adjournment count >= 3 (+10, static)
  const adjournmentMatched = (caseRecord.adjournment_count || 0) >= 3;
  conditions.push({
    id: "adjournment_count_gte_3",
    name: "Adjournment count >= 3",
    points: 10,
    kind: "static",
    matched: adjournmentMatched,
    detail: `${caseRecord.adjournment_count || 0} adjournments recorded`,
  });
  if (adjournmentMatched) {
    standingPoints += 10;
    reasons.push(`High court adjournments (${caseRecord.adjournment_count}) (+10)`);
  }

  // Condition 6: Social boycott flag active (+10, static)
  const boycottMatched = Boolean(caseRecord.social_boycott_flag);
  conditions.push({
    id: "social_boycott_flag",
    name: "Social boycott flag active",
    points: 10,
    kind: "static",
    matched: boycottMatched,
    detail: boycottMatched ? "Active social boycott reported" : "No boycott flag",
  });
  if (boycottMatched) {
    standingPoints += 10;
    reasons.push("Community social boycott active (+10)");
  }

  // Condition 7: Case open > 365 days (+5, static)
  if (caseRecord.opened_at) {
    const openedMs = toMidnightMs(caseRecord.opened_at);
    const daysOpen = Math.floor((refMs - openedMs) / oneDayMs);
    const matched = daysOpen > 365;
    conditions.push({
      id: "case_open_gt_365d",
      name: "Case open > 365 days",
      points: 5,
      kind: "static",
      matched,
      detail: `Case open for ${daysOpen} day(s)`,
    });
    if (matched) {
      standingPoints += 5;
      reasons.push(`Case open protracted duration (${daysOpen} days) (+5)`);
    }
  } else {
    conditions.push({
      id: "case_open_gt_365d",
      name: "Case open > 365 days",
      points: 5,
      kind: "static",
      matched: false,
      detail: "Opened date not recorded",
    });
  }

  const totalPoints = standingPoints + timeWindowedPoints;
  const score = Math.min(100, totalPoints);
  const capped = totalPoints > 100;

  return {
    score,
    standingPoints,
    timeWindowedPoints,
    totalPoints,
    capped,
    conditions,
    reasons,
  };
}
