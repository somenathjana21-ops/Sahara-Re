import { z } from "zod";

// ==========================================
// Core Enums & Primitive Literals
// ==========================================

export const TierEnum = z.enum(["GREEN", "AMBER", "RED", "CRITICAL"]);
export type Tier = z.infer<typeof TierEnum>;

export const ChannelEnum = z.enum(["chat", "call_sim"]);
export type Channel = z.infer<typeof ChannelEnum>;

export const TriggerSourceEnum = z.enum([
  "policy",
  "lexicon",
  "panic_key",
  "self_report_q3",
]);
export type TriggerSource = z.infer<typeof TriggerSourceEnum>;

export const LanguageEnum = z.enum(["en", "hi"]);
export type Language = z.infer<typeof LanguageEnum>;

export const AlertDispositionEnum = z.enum([
  "contacted",
  "no_action_needed",
  "escalated",
  "pending",
]);
export type AlertDisposition = z.infer<typeof AlertDispositionEnum>;

// ==========================================
// Wire Schemas (camelCase)
// ==========================================

export const StructuredCheckinSchema = z.object({
  q1: z.number().int().min(0).max(4).optional(),
  q2: z.number().int().min(0).max(4).optional(),
  q3: z.number().int().min(0).max(4).optional(),
});
export type StructuredCheckin = z.infer<typeof StructuredCheckinSchema>;

export const AudioMetricsSchema = z.object({
  pitchVariabilityPct: z.number().min(0).max(100).optional(),
  speechRateDeviationPct: z.number().min(0).max(100).optional(),
  pauseRatioPct: z.number().min(0).max(100).optional(),
});
export type AudioMetrics = z.infer<typeof AudioMetricsSchema>;

export const ChatMessagePayloadSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});
export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;

export const CheckInRequestSchema = z.object({
  personId: z.string().uuid(),
  consentId: z.string().uuid(),
  channel: ChannelEnum,
  transcript: z.string().nullable().optional(),
  structured: StructuredCheckinSchema.optional(),
  abandoned: z.boolean().optional().default(false),
  keypadDigit: z.string().optional(),
  audioMetrics: AudioMetricsSchema.optional(),
  history: z.array(ChatMessagePayloadSchema).optional(),
});
export type CheckInRequest = z.infer<typeof CheckInRequestSchema>;

export const ResourceItemSchema = z.object({
  name: z.string(),
  number: z.string(),
  description: z.string(),
});
export type ResourceItem = z.infer<typeof ResourceItemSchema>;

export const ComponentsBreakdownSchema = z.object({
  s1: z.number().min(0).max(100).nullable(),
  s2: z.number().min(0).max(100).nullable(),
  s3: z.number().min(0).max(100),
  s4: z.number().min(0).max(100),
  s5: z.number().min(0).max(100).nullable(),
});
export type ComponentsBreakdown = z.infer<typeof ComponentsBreakdownSchema>;

export const ContributionsBreakdownSchema = z.object({
  s1: z.number().min(0).max(100),
  s2: z.number().min(0).max(100),
  s3: z.number().min(0).max(100),
  s4: z.number().min(0).max(100),
  s5: z.literal(0),
});
export type ContributionsBreakdown = z.infer<typeof ContributionsBreakdownSchema>;

export const CheckInResponseSchema = z.object({
  status: z.enum(["ok", "critical", "minor_routed", "forbidden"]),
  checkinId: z.string().uuid().optional(),
  assessmentId: z.string().uuid().optional(),
  tier: TierEnum,
  reply: z.string(),
  resources: z.array(ResourceItemSchema).optional(),
  components: ComponentsBreakdownSchema.optional(),
  contributions: ContributionsBreakdownSchema.optional(),
  composite: z.number().min(0).max(100).optional(),
  zScore: z.number().nullable().optional(),
  changePoint: z.boolean().optional(),
  triggerSource: TriggerSourceEnum.optional(),
  explanation: z.array(z.string()).optional(),
  nextQuestionId: z.string().optional(),
});
export type CheckInResponse = z.infer<typeof CheckInResponseSchema>;

export const AlertAckRequestSchema = z.object({
  alertId: z.string().uuid(),
  ackedBy: z.string().min(1),
  disposition: AlertDispositionEnum,
});
export type AlertAckRequest = z.infer<typeof AlertAckRequestSchema>;

export const ConsentRequestSchema = z.object({
  personId: z.string().uuid(),
  purpose: z.string().default("distress_monitoring"),
  captureMethod: z.enum(["tap", "voice_simulated"]).default("tap"),
});
export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;

export const CustomPersonCaseDataSchema = z.object({
  atrocityCategory: z.string().default("general_distress"),
  stage: z.enum(["investigation", "trial", "rehabilitation", "compensation"]).default("trial"),
  bailStatus: z.enum(["in_custody", "accused_on_bail"]).default("in_custody"),
  nextHearingDays: z.number().int().nullable().optional(),
  nextHearingDate: z.string().nullable().optional(),
  adjournmentCount: z.number().int().min(0).default(0),
  reliefOverdueDays: z.number().int().nullable().optional(),
  reliefDueDate: z.string().nullable().optional(),
  reliefPaid: z.boolean().default(true),
  socialBoycott: z.boolean().default(false),
  intimidationReportDaysAgo: z.number().int().nullable().optional(),
  lastIntimidationReport: z.string().nullable().optional(),
  caseOpenDaysAgo: z.number().int().optional(),
  openedAt: z.string().optional(),
  customCategory: z.string().nullable().optional(),
  customCaseDetails: z.string().nullable().optional(),
  otherPressureDetails: z.string().nullable().optional(),
});
export type CustomPersonCaseData = z.infer<typeof CustomPersonCaseDataSchema>;

export const CustomPersonRequestSchema = z.object({
  id: z.string().uuid().optional(),
  pseudonym: z.string().min(1).max(30).optional(),
  language: LanguageEnum.default("en"),
  isMinor: z.boolean().default(false),
  baselineMean: z.number().nullable().optional(),
  baselineVar: z.number().nullable().optional(),
  checkinCount: z.number().int().min(0).default(0).optional(),
  missedCount: z.number().int().min(0).default(0).optional(),
  hasCase: z.boolean().default(false),
  caseData: CustomPersonCaseDataSchema.optional(),
  consentGranted: z.boolean().default(true),
});
export type CustomPersonRequest = z.infer<typeof CustomPersonRequestSchema>;


// ==========================================
// Database Models (snake_case)
// ==========================================

export interface PersonRecord {
  id: string;
  pseudonym: string; // A-XXXX
  language: "en" | "hi";
  is_minor_flag: boolean;
  baseline_mean: number | null;
  baseline_var: number | null;
  checkin_count: number;
  missed_count: number;
  created_at: string;
}

export interface CaseRecord {
  id: string;
  person_id: string;
  atrocity_category: string;
  stage: "investigation" | "trial" | "rehabilitation" | "compensation";
  next_hearing_date: string | null;
  adjournment_count: number;
  bail_status: "in_custody" | "accused_on_bail";
  relief_due_date: string | null;
  relief_paid: boolean;
  social_boycott_flag: boolean;
  last_intimidation_report: string | null;
  opened_at: string;
  custom_case_details?: string | null;
  other_pressure_details?: string | null;
}

export interface ConsentRecord {
  id: string;
  person_id: string;
  purpose: string;
  capture_method: "tap" | "voice_simulated";
  granted_at: string;
  withdrawn_at: string | null;
}

export interface CheckinRecord {
  id: string;
  person_id: string;
  consent_id: string;
  channel: "chat" | "call_sim";
  transcript: string | null;
  structured: StructuredCheckin;
  abandoned: boolean;
  created_at: string;
}

export interface AssessmentRecord {
  id: string;
  checkin_id: string;
  person_id: string;
  components: ComponentsBreakdown;
  contributions: ContributionsBreakdown;
  composite: number;
  z_score: number | null;
  change_point: boolean;
  tier: Tier;
  trigger_source: TriggerSource;
  explanation: string[];
  policy_version: string;
  model_version: string;
  created_at: string;
}

export interface AlertRecord {
  id: string;
  assessment_id: string;
  person_id: string;
  tier: Tier;
  sla_minutes: number;
  created_at: string;
  acked_at: string | null;
  acked_by: string | null;
  disposition: AlertDisposition | null;
}

export interface AuditEventRecord {
  id: string;
  actor: string;
  role: "counsellor" | "operator" | "admin";
  action: "view_queue" | "view_person" | "ack_alert" | "dispose";
  subject_id: string | null;
  created_at: string;
}
