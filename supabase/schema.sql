-- =====================================================================
-- Project SAHARA (SIH 26094) — Supabase PostgreSQL Database Schema
--
-- Security Invariant: Row Level Security (RLS) is ENABLED on ALL tables
-- with ZERO public policies defined. All mutations and queries occur
-- exclusively server-side via the Supabase Service Role Key.
-- =====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Persons Table
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pseudonym TEXT NOT NULL UNIQUE, -- e.g. 'A-4471', strictly no PII
    language TEXT NOT NULL DEFAULT 'en', -- 'en' | 'hi'
    is_minor_flag BOOLEAN NOT NULL DEFAULT FALSE,
    baseline_mean NUMERIC NULL,
    baseline_var NUMERIC NULL,
    checkin_count INT NOT NULL DEFAULT 0,
    missed_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cases Table (Deterministic S3 Case Context Source)
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    atrocity_category TEXT NOT NULL,
    stage TEXT NOT NULL, -- 'investigation' | 'trial' | 'rehabilitation' | 'compensation'
    next_hearing_date DATE NULL,
    adjournment_count INT NOT NULL DEFAULT 0,
    bail_status TEXT NOT NULL DEFAULT 'in_custody', -- 'in_custody' | 'accused_on_bail'
    relief_due_date DATE NULL,
    relief_paid BOOLEAN NOT NULL DEFAULT FALSE,
    social_boycott_flag BOOLEAN NOT NULL DEFAULT FALSE,
    last_intimidation_report DATE NULL,
    opened_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. Consents Table (Consent Gate)
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL DEFAULT 'distress_monitoring',
    capture_method TEXT NOT NULL DEFAULT 'tap', -- 'tap' | 'voice_simulated'
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ NULL
);

-- 4. Checkins Table (Interaction Logs)
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES consents(id) ON DELETE SET NULL,
    channel TEXT NOT NULL, -- 'chat' | 'call_sim'
    transcript TEXT NULL,
    structured JSONB NOT NULL DEFAULT '{}'::jsonb,
    abandoned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Assessments Table (Explainable Scoring Snapshots)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    components JSONB NOT NULL DEFAULT '{}'::jsonb,
    contributions JSONB NOT NULL DEFAULT '{}'::jsonb,
    composite NUMERIC NOT NULL,
    z_score NUMERIC NULL,
    change_point BOOLEAN NOT NULL DEFAULT FALSE,
    tier TEXT NOT NULL, -- 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL'
    trigger_source TEXT NOT NULL, -- 'policy' | 'lexicon' | 'panic_key' | 'self_report_q3'
    explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
    policy_version TEXT NOT NULL,
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Alerts Table (Staff Escalations)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    tier TEXT NOT NULL, -- 'AMBER' | 'RED' | 'CRITICAL'
    sla_minutes INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acked_at TIMESTAMPTZ NULL,
    acked_by TEXT NULL,
    disposition TEXT NULL -- 'contacted' | 'no_action_needed' | 'escalated' | 'pending'
);

-- 7. Audit Events Table (Immutable Staff Access Logs)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor TEXT NOT NULL,
    role TEXT NOT NULL, -- 'counsellor' | 'operator' | 'admin'
    action TEXT NOT NULL, -- 'view_queue' | 'view_person' | 'ack_alert' | 'dispose'
    subject_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance on foreign keys and queries
CREATE INDEX IF NOT EXISTS idx_cases_person_id ON cases(person_id);
CREATE INDEX IF NOT EXISTS idx_consents_person_id ON consents(person_id);
CREATE INDEX IF NOT EXISTS idx_checkins_person_id ON checkins(person_id);
CREATE INDEX IF NOT EXISTS idx_assessments_person_id ON assessments(person_id);
CREATE INDEX IF NOT EXISTS idx_alerts_person_id ON alerts(person_id);
CREATE INDEX IF NOT EXISTS idx_alerts_tier ON alerts(tier);

-- =====================================================================
-- ROW LEVEL SECURITY: ENABLE ON ALL TABLES WITH ZERO PUBLIC POLICIES
-- =====================================================================
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Note: Without any 'CREATE POLICY ... FOR SELECT/INSERT/UPDATE' statements,
-- standard queries using the anonymous or authenticated user JWTs are denied (0 rows).
-- Only the Supabase Service Role Key bypasses RLS on the server.
