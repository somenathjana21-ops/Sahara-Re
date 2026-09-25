/**
 * PROJECT SAHARA — Fixed Reply Bank & Safety Resources
 *
 * Governing Principle:
 * "All safety-critical text is fixed, human-written. LLM never generates any of it."
 *
 * Immutably frozen reply templates for:
 * - Voluntary Consent Notices
 * - Immediate Crisis Helplines & Direct Referral
 * - Minor Caseworker Diversions
 * - Pass-2 Fallback Sanitizations
 * - Session Closing Statements
 */

import { ResourceItem, Language } from "@/types/contract";

export const CRISIS_RESOURCES: Record<Language, ResourceItem[]> = {
  en: [
    {
      name: "National Helpline Against Atrocities (NHAA)",
      number: "14566",
      description: "24/7 toll-free assistance for SC/ST protection and legal atrocity support.",
    },
    {
      name: "Tele-MANAS (Mental Health)",
      number: "14416",
      description: "24/7 government psychological counseling and distress intervention.",
    },
    {
      name: "Kiran Mental Health Helpline",
      number: "1800-599-0019",
      description: "National helpline for mental wellbeing and crisis support.",
    },
    {
      name: "National Emergency Response Support",
      number: "112",
      description: "All-in-one emergency service for immediate police, fire, or medical dispatch.",
    },
  ],
  hi: [
    {
      name: "राष्ट्रीय अत्याचार निवारण हेल्पलाइन (NHAA)",
      number: "14566",
      description: "अत्याचार रोकथाम एवं कानूनी सहायता हेतु 24/7 निःशुल्क सरकारी हेल्पलाइन।",
    },
    {
      name: "टेली-मानस (मानसिक स्वास्थ्य हेल्पलाइन)",
      number: "14416",
      description: "मानसिक स्वास्थ्य एवं संकट सहायता हेतु 24/7 निःशुल्क सरकारी परामर्श।",
    },
    {
      name: "किरण मानसिक स्वास्थ्य हेल्पलाइन",
      number: "1800-599-0019",
      description: "मानसिक राहत और संकट प्रबंधन हेतु राष्ट्रीय सहायता सेवा।",
    },
    {
      name: "राष्ट्रीय आपातकालीन सहायता प्रणाली",
      number: "112",
      description: "पुलिस, चिकित्सा या आपातकालीन सुरक्षा सहायता के लिए एकीकृत नंबर।",
    },
  ],
};

export interface ReplyBankContent {
  consent_notice: string;
  crisis_immediate: string;
  fallback_reply: string;
  llm_unavailable: string;
  closing_low: string;
  closing_med: string;
  minor_detected: string;
  wrong_person: string;
}

export const REPLY_BANK: Record<Language, ReplyBankContent> = {
  en: {
    consent_notice:
      "This check-in is completely voluntary. Your answers help us understand your wellbeing and will never affect your compensation, relief claim, or court proceedings.",
    crisis_immediate:
      "We hear you, and your safety is the absolute priority right now. A support coordinator has been alerted to review this immediately. Please connect with the emergency resources listed below right away.",
    fallback_reply:
      "Thank you for sharing that with me. I am listening carefully. How has your sleep or rest been over the past day?",
    llm_unavailable:
      "Thank you for sharing your thoughts. Your responses are being recorded securely, and our team is monitoring your check-in.",
    closing_low:
      "Thank you for completing today's check-in. Your responses have been safely recorded. Take care until our next scheduled talk.",
    closing_med:
      "Thank you for checking in with us today. We have recorded your responses and our team will keep a close watch on your schedule. Support is always available.",
    minor_detected:
      "Thank you for reaching out. Support for individuals under 18 is provided directly through dedicated child welfare coordinators and Childline (1098). A specialist will be assigned to support you safely.",
    wrong_person:
      "This channel is reserved for confidential check-ins. No case information or private details can be shared on this line.",
  },
  hi: {
    consent_notice:
      "यह बातचीत पूरी तरह स्वैच्छिक है। आपके उत्तर केवल आपकी स्थिति समझने के लिए हैं और इससे आपके मुहावजे, कानूनी अधिकार या अदालती कार्यवाही पर कोई प्रभाव नहीं पड़ेगा।",
    crisis_immediate:
      "हम आपकी बात सुन रहे हैं और इस समय आपकी सुरक्षा सबसे महत्वपूर्ण है। हमारे सहायता दल को तुरंत सूचित कर दिया गया है। कृपया नीचे दिए गए आपातकालीन नंबरों पर तुरंत संपर्क करें।",
    fallback_reply:
      "अपनी बात साझा करने के लिए धन्यवाद। मैं ध्यानपूर्वक सुन रहा हूँ। पिछले दिन आपकी नींद और विश्राम कैसा रहा?",
    llm_unavailable:
      "अपनी बात साझा करने के लिए धन्यवाद। आपके उत्तर सुरक्षित रूप से दर्ज हो गए हैं और हमारा दल आपकी स्थिति पर ध्यान दे रहा है।",
    closing_low:
      "आज की बातचीत पूरी करने के लिए धन्यवाद। आपकी जानकारी सुरक्षित दर्ज कर ली गई है। अगली बातचीत तक अपना ध्यान रखें।",
    closing_med:
      "आज बातचीत करने के लिए धन्यवाद। हमने आपकी जानकारी दर्ज कर ली है और हमारा दल आपकी स्थिति पर नजर रखेगा। सहायता हमेशा उपलब्ध है।",
    minor_detected:
      "संपर्क करने के लिए धन्यवाद। 18 वर्ष से कम उम्र के साथियों के लिए सहायता बाल कल्याण समिति एवं चाइल्डलाइन (1098) के माध्यम से सीधे प्रदान की जाती है। एक विशेषज्ञ जल्द ही आपसे संपर्क करेंगे।",
    wrong_person:
      "यह संपर्क माध्यम केवल गोपनीय सुरक्षा जांच के लिए है। इस लाइन पर किसी भी मामले की निजी जानकारी साझा नहीं की जा सकती।",
  },
};

/**
 * Retrieves fixed crisis resources for the given language.
 */
export function getCrisisResources(language: Language = "en"): ResourceItem[] {
  return CRISIS_RESOURCES[language] || CRISIS_RESOURCES.en;
}

/**
 * Retrieves a static reply text for the specified key and language.
 */
export function getStaticReply(
  key: keyof ReplyBankContent,
  language: Language = "en"
): string {
  const langReplies = REPLY_BANK[language] || REPLY_BANK.en;
  return langReplies[key];
}
