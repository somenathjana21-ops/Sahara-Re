import {
  PersonRecord,
  CaseRecord,
  ConsentRecord,
  CheckinRecord,
  AssessmentRecord,
  AlertRecord,
  AuditEventRecord,
} from "@/types/contract";
import { getSupabaseClient } from "./client";

export interface IRepository {
  getPerson(id: string): Promise<PersonRecord | null>;
  getPersonByPseudonym(pseudonym: string): Promise<PersonRecord | null>;
  listPersons(): Promise<PersonRecord[]>;
  savePerson(person: PersonRecord): Promise<void>;
  updatePersonBaseline(
    id: string,
    mean: number,
    variance: number,
    checkinCount: number
  ): Promise<void>;
  incrementMissedCheckin(id: string): Promise<void>;

  getCaseByPersonId(personId: string): Promise<CaseRecord | null>;
  saveCase(caseRecord: CaseRecord): Promise<void>;

  getActiveConsent(personId: string): Promise<ConsentRecord | null>;
  saveConsent(consent: ConsentRecord): Promise<void>;
  revokeConsent(personId: string): Promise<void>;

  createCheckin(
    data: Omit<CheckinRecord, "id" | "created_at">
  ): Promise<CheckinRecord>;
  getCheckinsByPersonId(personId: string): Promise<CheckinRecord[]>;

  createAssessment(
    data: Omit<AssessmentRecord, "id" | "created_at">
  ): Promise<AssessmentRecord>;
  getAssessmentsByPersonId(personId: string): Promise<AssessmentRecord[]>;

  createAlert(
    data: Omit<AlertRecord, "id" | "created_at" | "acked_at" | "acked_by" | "disposition">
  ): Promise<AlertRecord>;
  listAlerts(): Promise<AlertRecord[]>;
  acknowledgeAlert(
    alertId: string,
    ackedBy: string,
    disposition: AlertRecord["disposition"]
  ): Promise<AlertRecord | null>;

  createAuditEvent(
    data: Omit<AuditEventRecord, "id" | "created_at">
  ): Promise<AuditEventRecord>;
  listAuditEvents(): Promise<AuditEventRecord[]>;

  seed(initialData: {
    persons: PersonRecord[];
    cases: CaseRecord[];
    consents: ConsentRecord[];
    checkins?: CheckinRecord[];
    assessments?: AssessmentRecord[];
    alerts?: AlertRecord[];
  }): Promise<void>;
}

// ==========================================
// In-Memory Repository (Deterministic & Offline Fallback)
// ==========================================

export class InMemoryRepository implements IRepository {
  private persons = new Map<string, PersonRecord>();
  private cases = new Map<string, CaseRecord>();
  private consents = new Map<string, ConsentRecord>();
  private checkins: CheckinRecord[] = [];
  private assessments: AssessmentRecord[] = [];
  private alerts: AlertRecord[] = [];
  private auditEvents: AuditEventRecord[] = [];

  async getPerson(id: string): Promise<PersonRecord | null> {
    return this.persons.get(id) || null;
  }

  async getPersonByPseudonym(pseudonym: string): Promise<PersonRecord | null> {
    for (const p of this.persons.values()) {
      if (p.pseudonym === pseudonym) return p;
    }
    return null;
  }

  async listPersons(): Promise<PersonRecord[]> {
    return Array.from(this.persons.values());
  }

  async savePerson(person: PersonRecord): Promise<void> {
    this.persons.set(person.id, { ...person });
  }

  async updatePersonBaseline(
    id: string,
    mean: number,
    variance: number,
    checkinCount: number
  ): Promise<void> {
    const p = this.persons.get(id);
    if (p) {
      p.baseline_mean = mean;
      p.baseline_var = variance;
      p.checkin_count = checkinCount;
    }
  }

  async incrementMissedCheckin(id: string): Promise<void> {
    const p = this.persons.get(id);
    if (p) {
      p.missed_count += 1;
    }
  }

  async getCaseByPersonId(personId: string): Promise<CaseRecord | null> {
    for (const c of this.cases.values()) {
      if (c.person_id === personId) return c;
    }
    return null;
  }

  async saveCase(caseRecord: CaseRecord): Promise<void> {
    this.cases.set(caseRecord.id, { ...caseRecord });
  }

  async getActiveConsent(personId: string): Promise<ConsentRecord | null> {
    const matches = Array.from(this.consents.values()).filter(
      (c) => c.person_id === personId && c.withdrawn_at === null
    );
    if (matches.length === 0) return null;
    // Return latest granted
    return (
      matches.sort(
        (a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime()
      )[0] ?? null
    );
  }

  async saveConsent(consent: ConsentRecord): Promise<void> {
    this.consents.set(consent.id, { ...consent });
  }

  async revokeConsent(personId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const c of this.consents.values()) {
      if (c.person_id === personId && c.withdrawn_at === null) {
        c.withdrawn_at = now;
      }
    }
  }

  async createCheckin(
    data: Omit<CheckinRecord, "id" | "created_at">
  ): Promise<CheckinRecord> {
    const checkin: CheckinRecord = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.checkins.push(checkin);
    return checkin;
  }

  async getCheckinsByPersonId(personId: string): Promise<CheckinRecord[]> {
    return this.checkins
      .filter((c) => c.person_id === personId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async createAssessment(
    data: Omit<AssessmentRecord, "id" | "created_at">
  ): Promise<AssessmentRecord> {
    const assessment: AssessmentRecord = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.assessments.push(assessment);
    return assessment;
  }

  async getAssessmentsByPersonId(personId: string): Promise<AssessmentRecord[]> {
    return this.assessments
      .filter((a) => a.person_id === personId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async createAlert(
    data: Omit<AlertRecord, "id" | "created_at" | "acked_at" | "acked_by" | "disposition">
  ): Promise<AlertRecord> {
    const alert: AlertRecord = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      acked_at: null,
      acked_by: null,
      disposition: null,
    };
    this.alerts.push(alert);
    return alert;
  }

  async listAlerts(): Promise<AlertRecord[]> {
    return [...this.alerts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async acknowledgeAlert(
    alertId: string,
    ackedBy: string,
    disposition: AlertRecord["disposition"]
  ): Promise<AlertRecord | null> {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return null;
    alert.acked_at = new Date().toISOString();
    alert.acked_by = ackedBy;
    alert.disposition = disposition;
    return { ...alert };
  }

  async createAuditEvent(
    data: Omit<AuditEventRecord, "id" | "created_at">
  ): Promise<AuditEventRecord> {
    const event: AuditEventRecord = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    this.auditEvents.push(event);
    return event;
  }

  async listAuditEvents(): Promise<AuditEventRecord[]> {
    return [...this.auditEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async seed(initialData: {
    persons: PersonRecord[];
    cases: CaseRecord[];
    consents: ConsentRecord[];
    checkins?: CheckinRecord[];
    assessments?: AssessmentRecord[];
    alerts?: AlertRecord[];
  }): Promise<void> {
    for (const p of initialData.persons) this.persons.set(p.id, { ...p });
    for (const c of initialData.cases) this.cases.set(c.id, { ...c });
    for (const cn of initialData.consents) this.consents.set(cn.id, { ...cn });
    if (initialData.checkins) this.checkins = [...initialData.checkins];
    if (initialData.assessments) this.assessments = [...initialData.assessments];
    if (initialData.alerts) this.alerts = [...initialData.alerts];
  }
}

import {
  SEED_PERSONS,
  SEED_CASES,
  SEED_CONSENTS,
  SEED_CHECKINS,
  SEED_ASSESSMENTS,
} from "@/scripts/fixtures";

// Singleton repository holder
let globalRepo: IRepository | null = null;

export function createDefaultSeededRepository(): InMemoryRepository {
  const repo = new InMemoryRepository();
  repo.seed({
    persons: JSON.parse(JSON.stringify(SEED_PERSONS)),
    cases: JSON.parse(JSON.stringify(SEED_CASES)),
    consents: JSON.parse(JSON.stringify(SEED_CONSENTS)),
    checkins: JSON.parse(JSON.stringify(SEED_CHECKINS)),
    assessments: JSON.parse(JSON.stringify(SEED_ASSESSMENTS)),
  });
  return repo;
}

export function getRepository(): IRepository {
  if (!globalRepo) {
    // Note: If Supabase credentials are present, SupabaseRepository can be returned.
    // For universal portability, development, and unit testing, InMemoryRepository is initialized with default seeds.
    globalRepo = createDefaultSeededRepository();
  }
  return globalRepo;
}

export function resetRepository(): IRepository {
  globalRepo = createDefaultSeededRepository();
  return globalRepo;
}

export function setRepository(repo: IRepository): void {
  globalRepo = repo;
}
