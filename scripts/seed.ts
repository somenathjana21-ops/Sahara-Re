import { getRepository } from "@/lib/db/repository";
import { getSupabaseClient } from "@/lib/db/client";
import {
  SEED_PERSONS,
  SEED_CASES,
  SEED_CONSENTS,
  SEED_CHECKINS,
  SEED_ASSESSMENTS,
} from "./fixtures";

export async function runSeed() {
  console.log("🌱 [SAHARA] Starting seed process...");

  // 1. Seed In-Memory repository
  const repo = getRepository();
  await repo.seed({
    persons: SEED_PERSONS,
    cases: SEED_CASES,
    consents: SEED_CONSENTS,
    checkins: SEED_CHECKINS,
    assessments: SEED_ASSESSMENTS,
  });
  console.log(`✅ [SAHARA] Seeded in-memory repository with ${SEED_PERSONS.length} personas.`);

  // 2. Seed Supabase PostgreSQL if credentials are provided
  const supabase = getSupabaseClient();
  if (supabase) {
    console.log("📡 [SAHARA] SUPABASE credentials detected. Seeding PostgreSQL...");
    try {
      // Upsert Persons
      const { error: pErr } = await supabase.from("persons").upsert(SEED_PERSONS);
      if (pErr) console.warn("Supabase persons seed warning:", pErr.message);

      // Upsert Cases
      const { error: cErr } = await supabase.from("cases").upsert(SEED_CASES);
      if (cErr) console.warn("Supabase cases seed warning:", cErr.message);

      // Upsert Consents
      const { error: cnErr } = await supabase.from("consents").upsert(SEED_CONSENTS);
      if (cnErr) console.warn("Supabase consents seed warning:", cnErr.message);

      // Upsert Checkins
      const { error: chkErr } = await supabase.from("checkins").upsert(SEED_CHECKINS);
      if (chkErr) console.warn("Supabase checkins seed warning:", chkErr.message);

      // Upsert Assessments
      const { error: aErr } = await supabase.from("assessments").upsert(SEED_ASSESSMENTS);
      if (aErr) console.warn("Supabase assessments seed warning:", aErr.message);

      console.log("✅ [SAHARA] Supabase remote seed complete.");
    } catch (err) {
      console.warn("⚠️ [SAHARA] Supabase seed skipped or partial:", err);
    }
  } else {
    console.log("ℹ️ [SAHARA] No SUPABASE_URL configured; in-memory repository active.");
  }

  console.log("🎉 [SAHARA] Seeding complete. Golden Path persona A-4471 ready.");
}

// Execute if run directly
if (process.argv[1]?.includes("seed.ts")) {
  runSeed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
}
