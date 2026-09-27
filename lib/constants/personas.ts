/**
 * Preset demo personas for seamless interactive testing & demonstration.
 * Centralised to avoid duplication across check-in and call pages.
 */
export interface PresetPersona {
  id: string;
  consentId: string;
  pseudonym: string;
  label: string;
  language: string;
  isMinor?: boolean;
  s3Standing: number;
  isCustom?: boolean;
}

export const DEFAULT_CUSTOM_PERSONA: PresetPersona = {
  id: "99999999-9999-9999-9999-999999999999",
  consentId: "99999999-3333-9999-9999-999999999999",
  pseudonym: "U-Custom",
  label: "Without Persona (Direct User Data)",
  language: "en",
  isMinor: false,
  s3Standing: 0,
  isCustom: true,
};


export const PRESET_PERSONAS: PresetPersona[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    consentId: "11111111-3333-1111-1111-111111111111",
    pseudonym: "A-4471",
    label: "A-4471 (Golden Path — Land Dispossession, Trial hearing in 6 days, Accused on bail)",
    language: "hi",
    isMinor: false,
    s3Standing: 90,
  },
  {
    id: "22222222-1111-2222-2222-222222222222",
    consentId: "22222222-3333-2222-2222-222222222222",
    pseudonym: "A-6218",
    label: "A-6218 (Minor Flag — Direct Caseworker Diversion, Zero automated scoring)",
    language: "hi",
    isMinor: true,
    s3Standing: 0,
  },
  {
    id: "33333333-1111-3333-3333-333333333333",
    consentId: "33333333-3333-3333-3333-333333333333",
    pseudonym: "A-2301",
    label: "A-2301 (Stable Control Persona)",
    language: "en",
    isMinor: false,
    s3Standing: 10,
  },
  {
    id: "44444444-1111-4444-4444-444444444444",
    consentId: "44444444-3333-4444-4444-444444444444",
    pseudonym: "A-7892",
    label: "A-7892 (Engagement Monotonicity — 3 Missed Check-ins, Amber Floor)",
    language: "hi",
    isMinor: false,
    s3Standing: 25,
  },
  {
    id: "55555555-1111-5555-5555-555555555555",
    consentId: "55555555-3333-5555-5555-555555555555",
    pseudonym: "A-1911",
    label: "A-1911 (Returning Persona — 1 prior check-in, 1 missed check-in)",
    language: "en",
    isMinor: false,
    s3Standing: 45,
  },
];
