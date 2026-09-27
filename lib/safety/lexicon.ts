/**
 * PROJECT SAHARA — Deterministic Safety Lexicon
 *
 * Reviewer Audit Metadata:
 * REVIEWED_BY: Clinical & Safety Working Group (SIH 26094)
 * REVIEWED_ON: 2026-09-24
 * LEXICON_VERSION: lexicon-v1.0.0
 *
 * Governing Invariants:
 * 1. ZERO 'g' flags on RegExp instances to prevent stateful .test() execution bugs.
 * 2. NO negation handling: "I don't want to die" STILL fires (fails safe).
 * 3. 4 Categories: self_harm, hopelessness, immediate_danger, direct_request.
 * 4. 3 written forms per category: English, Devanagari Hindi, Romanised Hindi.
 */

export const REVIEWED_BY = "Clinical & Safety Working Group (SIH 26094)";
export const REVIEWED_ON = "2026-09-24";
export const LEXICON_VERSION = "lexicon-v1.1.0";

export type LexiconCategory =
  | "self_harm"
  | "hopelessness"
  | "immediate_danger"
  | "direct_request";

export interface LexiconRule {
  id: string;
  category: LexiconCategory;
  language: "en" | "hi_dev" | "hi_rom";
  pattern: RegExp;
  description: string;
}

/**
 * Normalizes input text before lexicon matching:
 * - Converts to lower case
 * - Normalizes quotes and removes apostrophes so "don't" becomes "dont"
 * - Preserves Unicode letters and marks (essential for Devanagari matras) and digits
 * - Collapses consecutive spaces
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The master deterministic crisis lexicon.
 * ZERO 'g' flags allowed here.
 */
export const LEXICON_RULES: readonly LexiconRule[] = Object.freeze([
  // =========================================================================
  // 1. SELF-HARM INTENT
  // =========================================================================
  // English
  {
    id: "sh_en_01",
    category: "self_harm",
    language: "en",
    pattern: /\b(kill\s+my\s*self)\b/i,
    description: "English: kill myself",
  },
  {
    id: "sh_en_02",
    category: "self_harm",
    language: "en",
    pattern: /\b(want\s+to\s+die|wanna\s+die)\b/i,
    description: "English: want to die",
  },
  {
    id: "sh_en_03",
    category: "self_harm",
    language: "en",
    pattern: /\b(better\s+off\s+dead)\b/i,
    description: "English: better off dead",
  },
  {
    id: "sh_en_04",
    category: "self_harm",
    language: "en",
    pattern: /\b(end\s+(my\s*life|it\s*all))\b/i,
    description: "English: end my life / end it all",
  },
  {
    id: "sh_en_05",
    category: "self_harm",
    language: "en",
    pattern: /\b(commit(ting)?\s+suicide|suicid(e|al))\b/i,
    description: "English: commit suicide / suicidal",
  },
  {
    id: "sh_en_06",
    category: "self_harm",
    language: "en",
    pattern: /\b(harm\s+my\s*self|hurt\s+my\s*self)\b/i,
    description: "English: harm myself / hurt myself",
  },
  {
    id: "sh_en_07",
    category: "self_harm",
    language: "en",
    pattern: /\b(take\s+my\s*(own\s*)?life)\b/i,
    description: "English: take my own life",
  },
  {
    id: "sh_en_08",
    category: "self_harm",
    language: "en",
    pattern: /\b(dont\s+want\s+to\s+live|do\s+not\s+want\s+to\s+live)\b/i,
    description: "English: dont want to live",
  },
  {
    id: "sh_en_09",
    category: "self_harm",
    language: "en",
    pattern: /\b(slit\s+(my\s*)?wrist)\b/i,
    description: "English: slit wrist",
  },
  {
    id: "sh_en_10",
    category: "self_harm",
    language: "en",
    pattern: /\b(hang\s+my\s*self)\b/i,
    description: "English: hang myself",
  },
  {
    id: "sh_en_11",
    category: "self_harm",
    language: "en",
    pattern: /\b(poison\s+my\s*self|swallow\s+pills)\b/i,
    description: "English: poison myself / swallow pills",
  },
  {
    id: "sh_en_12",
    category: "self_harm",
    language: "en",
    pattern: /\b(no\s+reason\s+to\s+live|wish\s+i\s+(was|were)\s+dead)\b/i,
    description: "English: no reason to live / wish i was dead",
  },

  // Hindi (Devanagari)
  {
    id: "sh_dev_01",
    category: "self_harm",
    language: "hi_dev",
    pattern: /जीना\s*(नहीं|नही)\s*(चाहता|चाहती|है)/i,
    description: "Devanagari: जीना नहीं चाहता/चाहती/है",
  },
  {
    id: "sh_dev_02",
    category: "self_harm",
    language: "hi_dev",
    pattern: /मर\s*(जाऊ[ंन]?|जाना\s*चाहता|जाना\s*चाहती|जाने\s*का)/i,
    description: "Devanagari: मर जाऊं / मर जाना चाहता",
  },
  {
    id: "sh_dev_03",
    category: "self_harm",
    language: "hi_dev",
    pattern: /अपनी\s*जान\s*(दे\s*दूंगा|दे\s*दूंगी|देने|ले\s*लूं|खत्म)/i,
    description: "Devanagari: अपनी जान देने/लेने",
  },
  {
    id: "sh_dev_04",
    category: "self_harm",
    language: "hi_dev",
    pattern: /जान\s*दे\s*(दूंगा|दूंगी|दूँ|देंगे)/i,
    description: "Devanagari: जान दे दूंगा/दूंगी",
  },
  {
    id: "sh_dev_05",
    category: "self_harm",
    language: "hi_dev",
    pattern: /(खुदकुशी|आत्महत्या)/i,
    description: "Devanagari: खुदकुशी / आत्महत्या",
  },
  {
    id: "sh_dev_06",
    category: "self_harm",
    language: "hi_dev",
    pattern: /(फांसी\s*लगा|जहर\s*खा|नस\s*काट)/i,
    description: "Devanagari: फांसी लगा / जहर खा / नस काट",
  },
  {
    id: "sh_dev_07",
    category: "self_harm",
    language: "hi_dev",
    pattern: /जीने\s*का\s*कोई\s*फायदा\s*(नहीं|नही)/i,
    description: "Devanagari: जीने का कोई फायदा नहीं",
  },

  // Hindi (Romanised)
  {
    id: "sh_rom_01",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(jeena\s+nah?i\s+(chah?ta|chah?ti|hai))\b/i,
    description: "Romanised: jeena nahi chahta/chahti/hai",
  },
  {
    id: "sh_rom_02",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(marna\s+(nah?i|hai|chah?ta|chah?ti|h(oon|un))|mar\s+jana\s+chah?ta)\b/i,
    description: "Romanised: marna chahta hoon / marna nahi",
  },
  {
    id: "sh_rom_03",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(mar\s+jau(ng?a|ng?i)?)\b/i,
    description: "Romanised: mar jaunga / mar jaungi / mar jau",
  },
  {
    id: "sh_rom_04",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(jaan\s+de\s+d(unga|ungi|un|enge))\b/i,
    description: "Romanised: jaan de dunga / dungi",
  },
  {
    id: "sh_rom_05",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(apni\s+jaan\s+(le\s*lu|de\s*du|khatam|dene))\b/i,
    description: "Romanised: apni jaan le lu/de du",
  },
  {
    id: "sh_rom_06",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(khud\s*kushi|aatm\s*hatya|atma\s*hatya)\b/i,
    description: "Romanised: khudkushi / aatmhatya",
  },
  {
    id: "sh_rom_07",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(fa?ansi\s+laga|z[ea]h[ae]r\s+kha|nas\s+kaat)\b/i,
    description: "Romanised: faansi laga / zahar/zehar/zeher kha / nas kaat",
  },
  {
    id: "sh_rom_08",
    category: "self_harm",
    language: "hi_rom",
    pattern: /\b(jeene\s+ka\s+koi\s+(faida|fayda)\s+nah?i)\b/i,
    description: "Romanised: jeene ka koi fayda nahi",
  },

  // =========================================================================
  // 2. HOPELESSNESS + FINALITY
  // =========================================================================
  // English
  {
    id: "hl_en_01",
    category: "hopelessness",
    language: "en",
    pattern: /\b(no\s+way\s+out)\b/i,
    description: "English: no way out",
  },
  {
    id: "hl_en_02",
    category: "hopelessness",
    language: "en",
    pattern: /\b(nothing\s+(is\s+)?left(\s+for\s+me)?)\b/i,
    description: "English: nothing left for me",
  },
  {
    id: "hl_en_03",
    category: "hopelessness",
    language: "en",
    pattern: /\b(give\s+up\s+completely|giving\s+up\s+on\s+life)\b/i,
    description: "English: give up completely",
  },
  {
    id: "hl_en_04",
    category: "hopelessness",
    language: "en",
    pattern: /\b(cannot\s+take\s+this\s+anymore|cant\s+take\s+this\s+anymore)\b/i,
    description: "English: cannot take this anymore",
  },
  {
    id: "hl_en_05",
    category: "hopelessness",
    language: "en",
    pattern: /\b(cant\s+go\s+on|cannot\s+go\s+on)\b/i,
    description: "English: cannot go on",
  },
  {
    id: "hl_en_06",
    category: "hopelessness",
    language: "en",
    pattern: /\b(there\s+is\s+no\s+hope|everything\s+is\s+(completely\s+)?hopeless)\b/i,
    description: "English: no hope / hopeless",
  },
  {
    id: "hl_en_07",
    category: "hopelessness",
    language: "en",
    pattern: /\b(tired\s+of\s+(everything|living|life))\b/i,
    description: "English: tired of everything/life",
  },
  {
    id: "hl_en_08",
    category: "hopelessness",
    language: "en",
    pattern: /\b(my\s+final\s+note|goodbye\s+everyone|ready\s+to\s+end\s+it)\b/i,
    description: "English: final note / goodbye everyone",
  },
  {
    id: "hl_en_09",
    category: "hopelessness",
    language: "en",
    pattern: /\b((cant|cannot|can\s+not)\s+live\s+(like\s+this|like\s+that|this\s+way|anymore|any\s*longer)|(cant|cannot|can\s+not)\s+survive\s+(like\s+this|this\s+way|anymore)|unable\s+to\s+live\s+like\s+this)\b/i,
    description: "English: cannot live like this / anymore",
  },

  // Hindi (Devanagari)
  {
    id: "hl_dev_01",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /कोई\s*रास्ता\s*(नहीं|नही)/i,
    description: "Devanagari: कोई रास्ता नहीं",
  },
  {
    id: "hl_dev_02",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /कुछ\s*(नहीं|नही)\s*बचा/i,
    description: "Devanagari: कुछ नहीं बचा",
  },
  {
    id: "hl_dev_03",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /हिम्मत\s*टूट\s*गई/i,
    description: "Devanagari: हिम्मत टूट गई",
  },
  {
    id: "hl_dev_04",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /बर्दाश्त\s*(नहीं|नही)\s*होता/i,
    description: "Devanagari: बर्दाश्त नहीं होता",
  },
  {
    id: "hl_dev_05",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /उम्मीद\s*खत्म/i,
    description: "Devanagari: उम्मीद खत्म",
  },
  {
    id: "hl_dev_06",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /सब\s*खत्म\s*हो\s*गया/i,
    description: "Devanagari: सब खत्म हो गया",
  },
  {
    id: "hl_dev_07",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /(अलविदा\s*सबको|थक\s*चुका\s*हूँ|थक\s*चुकी\s*हूँ)/i,
    description: "Devanagari: अलविदा सबको / थक चुका हूँ",
  },
  {
    id: "hl_dev_08",
    category: "hopelessness",
    language: "hi_dev",
    pattern: /(ऐसे|इस\s*तरह)\s*(नहीं|नही)\s*(जी\s*सकता|जी\s*सकती|रह\s*सकता|रह\s*सकती|जीना|रहना)|अब\s*(नहीं|नही)\s*जी\s*(सकता|सकती)|अब\s*(नहीं|नही)\s*जिया\s*जाता/i,
    description: "Devanagari: ऐसे नहीं जी सकता/सकती",
  },

  // Hindi (Romanised)
  {
    id: "hl_rom_01",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b(koi\s+ra(s|st)a\s+nah?i)\b/i,
    description: "Romanised: koi rasta nahi",
  },
  {
    id: "hl_rom_02",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b((sab\s+)?kuch\s+nah?i\s+bacha)\b/i,
    description: "Romanised: kuch nahi bacha",
  },
  {
    id: "hl_rom_03",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b(himmat\s+toot\s+gayi)\b/i,
    description: "Romanised: himmat toot gayi",
  },
  {
    id: "hl_rom_04",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b(ab\s+bardasht\s+nah?i\s+hota|bardasht\s+nah?i\s+hota)\b/i,
    description: "Romanised: bardasht nahi hota",
  },
  {
    id: "hl_rom_05",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b(sab\s*(kuch)?\s+khatam\s+ho\s+gaya)\b/i,
    description: "Romanised: sab khatam ho gaya",
  },
  {
    id: "hl_rom_06",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b(u(m)?meed\s+khatam|give\s+up\s+kar\s+diya)\b/i,
    description: "Romanised: umeed khatam / give up kar diya",
  },
  {
    id: "hl_rom_07",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b(alvida\s+sabko|thak\s+chuka\s+h(oon|un)?|thak\s+chuki\s+h(oon|un)?)\b/i,
    description: "Romanised: alvida sabko / thak chuka hoon",
  },
  {
    id: "hl_rom_08",
    category: "hopelessness",
    language: "hi_rom",
    pattern: /\b((aise|is\s+tarah)\s+nah?i\s+(jee\s+(sakt[aei]|sakunga|sakungi)|jiya\s+jata|rehna)|ab\s+nah?i\s+(jee\s+sakt[aei]|jiya\s+jata))\b/i,
    description: "Romanised: aise nahi jee sakta/sakti",
  },

  // =========================================================================
  // 3. IMMEDIATE DANGER
  // =========================================================================
  // English
  {
    id: "id_en_01",
    category: "immediate_danger",
    language: "en",
    pattern: /\b(they\s+are\s+here)\b/i,
    description: "English: they are here",
  },
  {
    id: "id_en_02",
    category: "immediate_danger",
    language: "en",
    pattern: /\b(coming\s+for\s+me(\s+now)?)\b/i,
    description: "English: coming for me now",
  },
  {
    id: "id_en_03",
    category: "immediate_danger",
    language: "en",
    pattern: /\b((going\s+to|will)\s+kill\s+me)\b/i,
    description: "English: going to kill me / will kill me",
  },
  {
    id: "id_en_04",
    category: "immediate_danger",
    language: "en",
    pattern: /\b(breaking\s+in|outside\s+my\s+door)\b/i,
    description: "English: breaking in / outside my door",
  },
  {
    id: "id_en_05",
    category: "immediate_danger",
    language: "en",
    pattern: /\b((they\s+have|with)\s+weapons)\b/i,
    description: "English: they have weapons / with weapons",
  },
  {
    id: "id_en_06",
    category: "immediate_danger",
    language: "en",
    pattern: /\b(surrounded\s+my\s+house)\b/i,
    description: "English: surrounded my house",
  },
  {
    id: "id_en_07",
    category: "immediate_danger",
    language: "en",
    pattern: /\b(threatening\s+to\s+murder|going\s+to\s+attack)\b/i,
    description: "English: threatening to murder / attack",
  },
  {
    id: "id_en_08",
    category: "immediate_danger",
    language: "en",
    pattern: /\b(in\s+danger\s+right\s+now|about\s+to\s+hurt\s+me|chasing\s+me)\b/i,
    description: "English: in danger right now",
  },

  // Hindi (Devanagari)
  {
    id: "id_dev_01",
    category: "immediate_danger",
    language: "hi_dev",
    pattern: /(वो|वे|लोग)\s*आ\s*गए/i,
    description: "Devanagari: वो आ गए / लोग आ गए",
  },
  {
    id: "id_dev_02",
    category: "immediate_danger",
    language: "hi_dev",
    pattern: /(मार\s*डालेंगे|जान\s*से\s*मार|मार\s*देंगे)/i,
    description: "Devanagari: मार डालेंगे / जान से मार देंगे",
  },
  {
    id: "id_dev_03",
    category: "immediate_danger",
    language: "hi_dev",
    pattern: /दरवाजे\s*पर\s*हैं/i,
    description: "Devanagari: दरवाजे पर हैं",
  },
  {
    id: "id_dev_04",
    category: "immediate_danger",
    language: "hi_dev",
    pattern: /हथियार\s*(हैं|लेके|के\s*साथ)/i,
    description: "Devanagari: हथियार हैं / हथियार लेके",
  },
  {
    id: "id_dev_05",
    category: "immediate_danger",
    language: "hi_dev",
    pattern: /घर\s*घेर\s*लिया/i,
    description: "Devanagari: घर घेर लिया",
  },
  {
    id: "id_dev_06",
    category: "immediate_danger",
    language: "hi_dev",
    pattern: /(हमला\s*करने|खतरे\s*में\s*हूँ|खतरे\s*में\s*है)/i,
    description: "Devanagari: हमला करने / खतरे में हूँ",
  },

  // Hindi (Romanised)
  {
    id: "id_rom_01",
    category: "immediate_danger",
    language: "hi_rom",
    pattern: /\b((wo|vo|ve)\s+aa\s+gaye)\b/i,
    description: "Romanised: wo aa gaye",
  },
  {
    id: "id_rom_02",
    category: "immediate_danger",
    language: "hi_rom",
    pattern: /\b(maar\s+dalenge|jaan\s+se\s+maar\s+(denge|dalenge)|mujhe\s+maar\s+denge)\b/i,
    description: "Romanised: maar dalenge / jaan se maar denge",
  },
  {
    id: "id_rom_03",
    category: "immediate_danger",
    language: "hi_rom",
    pattern: /\b(darwaze\s+par\s+hain|darwaza\s+tod\s+rahe)\b/i,
    description: "Romanised: darwaze par hain",
  },
  {
    id: "id_rom_04",
    category: "immediate_danger",
    language: "hi_rom",
    pattern: /\b(hathiyar\s+(hain|leke|ke\s+saath))\b/i,
    description: "Romanised: hathiyar hain / leke",
  },
  {
    id: "id_rom_05",
    category: "immediate_danger",
    language: "hi_rom",
    pattern: /\b(ghar\s+gher\s+liya)\b/i,
    description: "Romanised: ghar gher liya",
  },
  {
    id: "id_rom_06",
    category: "immediate_danger",
    language: "hi_rom",
    pattern: /\b(humla\s+karne|khatre\s+mein\s+h(oon|un)?)\b/i,
    description: "Romanised: humla karne / khatre mein hoon",
  },

  // =========================================================================
  // 4. DIRECT REQUEST
  // =========================================================================
  // English
  {
    id: "dr_en_01",
    category: "direct_request",
    language: "en",
    pattern: /\b(help\s+me(\s+please)?|please\s+help\s+me|someone\s+please\s+help)\b/i,
    description: "English: help me please / someone help",
  },
  {
    id: "dr_en_02",
    category: "direct_request",
    language: "en",
    pattern: /\b(need\s+help\s+now|emergency\s+help)\b/i,
    description: "English: need help now",
  },
  {
    id: "dr_en_03",
    category: "direct_request",
    language: "en",
    pattern: /\b(save\s+me(\s+please)?|please\s+rescue\s+me|protect\s+me)\b/i,
    description: "English: save me / rescue me",
  },
  {
    id: "dr_en_04",
    category: "direct_request",
    language: "en",
    pattern: /\b(call\s+(the\s*)?police)\b/i,
    description: "English: call police",
  },
  {
    id: "dr_en_05",
    category: "direct_request",
    language: "en",
    pattern: /\b(send\s+someone\s+immediately|send\s+help)\b/i,
    description: "English: send someone immediately",
  },
  {
    id: "dr_en_06",
    category: "direct_request",
    language: "en",
    pattern: /\b(sos)\b/i,
    description: "English: sos",
  },
  {
    id: "dr_en_07",
    category: "direct_request",
    language: "en",
    pattern: /\b((i\s+)?(want|need|wish|would\s+like|id\s+like)\s+to\s+(talk|speak)\s+(to|with)\s+(a\s+)?(human|person|counsellor|counselor|caseworker|doctor)|(can|could|may)\s+i\s+(talk|speak)\s+(to|with)\s+(a\s+)?(human|person|counsellor|counselor|caseworker|doctor)|connect\s+me\s+to\s+(a\s+)?(human|person|counsellor|counselor|caseworker|doctor)|transfer\s+(me\s+)?to\s+(a\s+)?(human|person|counsellor|counselor|caseworker|doctor)|speak\s+with\s+(a\s+)?(real\s+person|human|counsellor|counselor|caseworker)|talk\s+to\s+(a\s+)?(counsellor|counselor|caseworker)|human\s+help\s+please)\b/i,
    description: "English: request to talk/speak to a human, person, or counsellor",
  },
  {
    id: "dr_en_08",
    category: "direct_request",
    language: "en",
    pattern: /\b((i\s+)?(want|need|wish|would\s+like|id\s+like)\s+to\s+(talk|speak)\s+(to|with)\s+(someone|somebody|anyone|anybody)|(can|could|may)\s+i\s+(talk|speak)\s+(to|with)\s+(someone|somebody|anyone|anybody)|(want|need)\s+(someone|somebody)\s+to\s+(talk|speak)\s+(to|with)|(talk|speak)\s+(to|with)\s+(someone|somebody)|connect\s+me\s+to\s+(someone|somebody)|transfer\s+(me\s+)?to\s+(someone|somebody))\b/i,
    description: "English: request to talk/speak to someone or somebody",
  },

  // Hindi (Devanagari)
  {
    id: "dr_dev_01",
    category: "direct_request",
    language: "hi_dev",
    pattern: /(मदद\s*करो|तुरंत\s*मदद|कोई\s*मदद\s*करो)/i,
    description: "Devanagari: मदद करो / तुरंत मदद",
  },
  {
    id: "dr_dev_02",
    category: "direct_request",
    language: "hi_dev",
    pattern: /(बचाओ|मुझे\s*बचा\s*लो|मेरी\s*रक्षा\s*करो)/i,
    description: "Devanagari: बचाओ / मुझे बचा लो",
  },
  {
    id: "dr_dev_03",
    category: "direct_request",
    language: "hi_dev",
    pattern: /पुलिस\s*(को\s*)?बुलाओ/i,
    description: "Devanagari: पुलिस बुलाओ",
  },
  {
    id: "dr_dev_04",
    category: "direct_request",
    language: "hi_dev",
    pattern: /((किसी(\s*(इंसान|व्यक्ति|काउंसलर))?|(इंसान|व्यक्ति|काउंसलर))\s*से\s*बात(\s*(करनी\s*है|करना\s*चाहता|करना\s*चाहती|कराओ|करवा\s*दो|कहो))?|किसी(\s*(इंसान|व्यक्ति|काउंसलर))?\s*से\s*(जोड़ो|कनेक्ट)|(इंसान|काउंसलर)\s*से\s*कनेक्ट)/i,
    description: "Devanagari: इंसान/व्यक्ति/काउंसलर/किसी से बात करने का अनुरोध",
  },

  // Hindi (Romanised)
  {
    id: "dr_rom_01",
    category: "direct_request",
    language: "hi_rom",
    pattern: /\b(madad\s+karo|turant\s+madad|koi\s+madad\s+karo|help\s+karo)\b/i,
    description: "Romanised: madad karo / turant madad",
  },
  {
    id: "dr_rom_02",
    category: "direct_request",
    language: "hi_rom",
    pattern: /\b(bachao|mujhe\s+bacha\s+lo|please\s+bachao|meri\s+raksha\s+karo)\b/i,
    description: "Romanised: bachao / mujhe bacha lo",
  },
  {
    id: "dr_rom_03",
    category: "direct_request",
    language: "hi_rom",
    pattern: /\b(police\s+(ko\s+)?bulao)\b/i,
    description: "Romanised: police bulao",
  },
  {
    id: "dr_rom_04",
    category: "direct_request",
    language: "hi_rom",
    pattern: /\b((kisi(\s+(insan|human|person|counsellor|counselor|caseworker|real\s+person))?|(insan|human|person|counsellor|counselor|caseworker|real\s+person))\s+se\s+baat(\s+(karni\s+hai|karni\s+h|karna\s+chah?ta|karna\s+chah?ti|karao|karwa\s+do|karo))?|kisi(\s+(human|person|counsellor|counselor))?\s*se\s*connect(\s+karo)?)\b/i,
    description: "Romanised: kisi/insan/person/counsellor se baat karni hai",
  },
]);
