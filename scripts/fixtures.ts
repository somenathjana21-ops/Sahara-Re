import {
  PersonRecord,
  CaseRecord,
  ConsentRecord,
  CheckinRecord,
  AssessmentRecord,
  AlertRecord,
} from "@/types/contract";

// Helper to compute ISO dates relative to now
const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const daysAhead = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

// =====================================================================
// Persona A-4471 (Golden Path Persona)
// - Language: Hindi
// - Case: Land dispossession, trial stage
// - Standing pressure: Accused on bail (+20), relief overdue 62d (+15), 4 adjournments (+10), case open 400d (+5) = 50 pts
// - D-1 update: Intimidation report filed yesterday (+25), trial hearing in 6 days (+15) -> S3 = 90
// - Day -3: Composite = 28.00, GREEN, baseline init mu0 = 28.00
// - Day -2: Composite = 31.00, GREEN, z = 0.375, mu1 = 28.90, var = 2.70 (sigma floored to 8)
// - Day 0 (Live test): S1=50, S2=55, S3=90, S4=0 -> Composite=53.75, z=3.11, change_point=true, Tier=RED
// =====================================================================

export const PERSON_A4471: PersonRecord = {
  id: "11111111-1111-1111-1111-111111111111",
  pseudonym: "A-4471",
  language: "hi",
  is_minor_flag: false,
  baseline_mean: 28.9,
  baseline_var: 2.7,
  checkin_count: 2,
  missed_count: 0,
  created_at: daysAgo(400),
};

export const CASE_A4471: CaseRecord = {
  id: "11111111-2222-1111-1111-111111111111",
  person_id: PERSON_A4471.id,
  atrocity_category: "land_dispossession",
  stage: "trial",
  next_hearing_date: daysAhead(6).split("T")[0]!, // Within 7 days (+15)
  adjournment_count: 4, // >= 3 (+10)
  bail_status: "accused_on_bail", // (+20)
  relief_due_date: daysAgo(62).split("T")[0]!, // >30 days overdue (+15)
  relief_paid: false,
  social_boycott_flag: false,
  last_intimidation_report: daysAgo(1).split("T")[0]!, // Within 14 days (+25)
  opened_at: daysAgo(400).split("T")[0]!, // >365 days (+5)
  // Total S3: 15 + 10 + 20 + 15 + 25 + 5 = 90 pts!
};

export const CONSENT_A4471: ConsentRecord = {
  id: "11111111-3333-1111-1111-111111111111",
  person_id: PERSON_A4471.id,
  purpose: "distress_monitoring",
  capture_method: "tap",
  granted_at: daysAgo(30),
  withdrawn_at: null,
};

export const CHECKINS_A4471: CheckinRecord[] = [
  {
    id: "11111111-4444-1111-1111-111111111101",
    person_id: PERSON_A4471.id,
    consent_id: CONSENT_A4471.id,
    channel: "chat",
    transcript: "sab theek hai abhi",
    structured: { q1: 1, q2: 1, q3: 1 },
    abandoned: false,
    created_at: daysAgo(3),
  },
  {
    id: "11111111-4444-1111-1111-111111111102",
    person_id: PERSON_A4471.id,
    consent_id: CONSENT_A4471.id,
    channel: "chat",
    transcript: "neend thodi kam aayi",
    structured: { q1: 1, q2: 2, q3: 1 },
    abandoned: false,
    created_at: daysAgo(2),
  },
];

export const ASSESSMENTS_A4471: AssessmentRecord[] = [
  {
    id: "11111111-5555-1111-1111-111111111101",
    checkin_id: CHECKINS_A4471[0]!.id,
    person_id: PERSON_A4471.id,
    components: { s1: 25, s2: 20, s3: 50, s4: 0, s5: null },
    contributions: { s1: 8.75, s2: 5.0, s3: 12.5, s4: 0.0, s5: 0 },
    composite: 28.0,
    z_score: null,
    change_point: false,
    tier: "GREEN",
    trigger_source: "policy",
    explanation: ["Baseline established", "S3 case context: standing pressure 50 pts"],
    policy_version: "v1.1.0",
    model_version: "mock:default+prompt-1.0.0",
    created_at: daysAgo(3),
  },
  {
    id: "11111111-5555-1111-1111-111111111102",
    checkin_id: CHECKINS_A4471[1]!.id,
    person_id: PERSON_A4471.id,
    components: { s1: 33.33, s2: 25, s3: 50, s4: 0, s5: null },
    contributions: { s1: 11.67, s2: 6.25, s3: 12.5, s4: 0.0, s5: 0 },
    composite: 31.0,
    z_score: 0.375,
    change_point: false,
    tier: "GREEN",
    trigger_source: "policy",
    explanation: ["Within personal baseline", "S3 case context: standing pressure 50 pts"],
    policy_version: "v1.1.0",
    model_version: "mock:default+prompt-1.0.0",
    created_at: daysAgo(2),
  },
];

// =====================================================================
// Persona A-6218 (Minor Persona -> Safe Caseworker Bypass)
// =====================================================================

export const PERSON_A6218: PersonRecord = {
  id: "22222222-1111-2222-2222-222222222222",
  pseudonym: "A-6218",
  language: "hi",
  is_minor_flag: true, // HARD REQUIREMENT: 0 automated scoring
  baseline_mean: null,
  baseline_var: null,
  checkin_count: 0,
  missed_count: 0,
  created_at: daysAgo(10),
};

export const CASE_A6218: CaseRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  person_id: PERSON_A6218.id,
  atrocity_category: "caste_discrimination",
  stage: "investigation",
  next_hearing_date: null,
  adjournment_count: 0,
  bail_status: "in_custody",
  relief_due_date: null,
  relief_paid: false,
  social_boycott_flag: false,
  last_intimidation_report: null,
  opened_at: daysAgo(10).split("T")[0]!,
};

export const CONSENT_A6218: ConsentRecord = {
  id: "22222222-3333-2222-2222-222222222222",
  person_id: PERSON_A6218.id,
  purpose: "distress_monitoring",
  capture_method: "tap",
  granted_at: daysAgo(10),
  withdrawn_at: null,
};

// =====================================================================
// Persona A-2301 (Stable Control Persona)
// =====================================================================

export const PERSON_A2301: PersonRecord = {
  id: "33333333-1111-3333-3333-333333333333",
  pseudonym: "A-2301",
  language: "en",
  is_minor_flag: false,
  baseline_mean: 22.0,
  baseline_var: 1.5,
  checkin_count: 5,
  missed_count: 0,
  created_at: daysAgo(60),
};

export const CASE_A2301: CaseRecord = {
  id: "33333333-2222-3333-3333-333333333333",
  person_id: PERSON_A2301.id,
  atrocity_category: "verbal_abuse",
  stage: "rehabilitation",
  next_hearing_date: daysAhead(45).split("T")[0]!,
  adjournment_count: 1,
  bail_status: "in_custody",
  relief_due_date: daysAgo(10).split("T")[0]!,
  relief_paid: true,
  social_boycott_flag: false,
  last_intimidation_report: null,
  opened_at: daysAgo(60).split("T")[0]!,
};

export const CONSENT_A2301: ConsentRecord = {
  id: "33333333-3333-3333-3333-333333333333",
  person_id: PERSON_A2301.id,
  purpose: "distress_monitoring",
  capture_method: "tap",
  granted_at: daysAgo(60),
  withdrawn_at: null,
};

// =====================================================================
// Persona A-7892 (Engagement Monotonicity Persona with 3 Missed Check-ins)
// =====================================================================

export const PERSON_A7892: PersonRecord = {
  id: "44444444-1111-4444-4444-444444444444",
  pseudonym: "A-7892",
  language: "hi",
  is_minor_flag: false,
  baseline_mean: 35.0,
  baseline_var: 4.0,
  checkin_count: 3,
  missed_count: 3, // Force minimum Amber rule
  created_at: daysAgo(90),
};

export const CASE_A7892: CaseRecord = {
  id: "44444444-2222-4444-4444-444444444444",
  person_id: PERSON_A7892.id,
  atrocity_category: "physical_assault",
  stage: "trial",
  next_hearing_date: daysAhead(20).split("T")[0]!,
  adjournment_count: 2,
  bail_status: "in_custody",
  relief_due_date: null,
  relief_paid: true,
  social_boycott_flag: true, // +10
  last_intimidation_report: null,
  opened_at: daysAgo(90).split("T")[0]!,
};

export const CONSENT_A7892: ConsentRecord = {
  id: "44444444-3333-4444-4444-444444444444",
  person_id: PERSON_A7892.id,
  purpose: "distress_monitoring",
  capture_method: "tap",
  granted_at: daysAgo(90),
  withdrawn_at: null,
};

// =====================================================================
// Persona A-1911 (Returning Persona — Checked in, then missed check-in)
// =====================================================================

export const PERSON_A1911: PersonRecord = {
  id: "55555555-1111-5555-5555-555555555555",
  pseudonym: "A-1911",
  language: "en",
  is_minor_flag: false,
  baseline_mean: 32.5,
  baseline_var: 2.0,
  checkin_count: 1,
  missed_count: 1, // Checked in, then didn't (1 missed)
  created_at: daysAgo(5),
};

export const CASE_A1911: CaseRecord = {
  id: "55555555-2222-5555-5555-555555555555",
  person_id: PERSON_A1911.id,
  atrocity_category: "caste_discrimination",
  stage: "investigation",
  next_hearing_date: daysAhead(14).split("T")[0]!,
  adjournment_count: 1,
  bail_status: "accused_on_bail", // +20
  relief_due_date: null,
  relief_paid: true,
  social_boycott_flag: false,
  last_intimidation_report: daysAgo(10).split("T")[0]!, // +25 within 14d
  opened_at: daysAgo(60).split("T")[0]!,
  custom_case_details: "Pressure from opposing parties after filing FIR; lawyer requested police protection.",
};

export const CONSENT_A1911: ConsentRecord = {
  id: "55555555-3333-5555-5555-555555555555",
  person_id: PERSON_A1911.id,
  purpose: "distress_monitoring",
  capture_method: "tap",
  granted_at: daysAgo(5),
  withdrawn_at: null,
};

export const CHECKINS_A1911: CheckinRecord[] = [
  {
    id: "55555555-4444-5555-5555-555555555501",
    person_id: PERSON_A1911.id,
    consent_id: CONSENT_A1911.id,
    channel: "chat",
    transcript: "Feeling tense about the investigation, hoping things stay peaceful.",
    structured: { q1: 1, q2: 2, q3: 1 },
    abandoned: false,
    created_at: daysAgo(4),
  },
];

export const ASSESSMENTS_A1911: AssessmentRecord[] = [
  {
    id: "55555555-5555-5555-5555-555555555501",
    checkin_id: CHECKINS_A1911[0]!.id,
    person_id: PERSON_A1911.id,
    components: { s1: 33.33, s2: 30, s3: 45, s4: 0, s5: null },
    contributions: { s1: 11.67, s2: 7.5, s3: 11.25, s4: 0.0, s5: 0 },
    composite: 32.5,
    z_score: null,
    change_point: false,
    tier: "GREEN",
    trigger_source: "policy",
    explanation: ["Baseline established on Day -4 at 32.50"],
    policy_version: "v1.1.0",
    model_version: "mock:default+prompt-1.0.0",
    created_at: daysAgo(4),
  },
];

// Aggregated Seed Fixtures
export const SEED_PERSONS: PersonRecord[] = [
  PERSON_A4471,
  PERSON_A6218,
  PERSON_A2301,
  PERSON_A7892,
  PERSON_A1911,
];

export const SEED_CASES: CaseRecord[] = [
  CASE_A4471,
  CASE_A6218,
  CASE_A2301,
  CASE_A7892,
  CASE_A1911,
];

export const SEED_CONSENTS: ConsentRecord[] = [
  CONSENT_A4471,
  CONSENT_A6218,
  CONSENT_A2301,
  CONSENT_A7892,
  CONSENT_A1911,
];

export const SEED_CHECKINS: CheckinRecord[] = [...CHECKINS_A4471, ...CHECKINS_A1911];

export const SEED_ASSESSMENTS: AssessmentRecord[] = [...ASSESSMENTS_A4471, ...ASSESSMENTS_A1911];

