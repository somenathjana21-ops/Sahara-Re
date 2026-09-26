"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PhoneCall,
  MessageSquare,
  Smartphone,
  Shield,
  Heart,
  Clock,
  Lock,
  ChevronDown,
  ArrowRight,
  School,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  Wind,
  MapPin,
  Cloud,
  Scale,
  Users,
  AlertOctagon,
  Building,
} from "lucide-react";
import BreathingWidget from "@/components/common/BreathingWidget";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HomePage() {
  const { t, language } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const pathways = [
    {
      icon: Wind,
      title: t("pathways.p1Title", "Anxiety & Panic"),
      desc: t(
        "pathways.p1Desc",
        "Racing thoughts, tight chest sensations, sensory overload, or feelings of spiraling."
      ),
      action: t("pathways.p1Action", "Talk through panic"),
      href: "/checkin",
    },
    {
      icon: Users,
      title: t("pathways.p2Title", "Loneliness & Isolation"),
      desc: t(
        "pathways.p2Desc",
        "Feeling detached, without anyone who understands, or simply seeking a sincere voice."
      ),
      action: t("pathways.p2Action", "Find connection"),
      href: "/checkin",
    },
    {
      icon: Cloud,
      title: t("pathways.p3Title", "Depression & Heavy Thoughts"),
      desc: t(
        "pathways.p3Desc",
        "Numbness, loss of energy, feeling ungrounded, or wondering if things will ever lighten."
      ),
      action: t("pathways.p3Action", "Share the weight"),
      href: "/checkin",
    },
    {
      icon: Scale,
      title: t("pathways.p4Title", "Court & Legal Stress"),
      desc: t(
        "pathways.p4Desc",
        "Upcoming trial hearings, bail anxiety, relief compensation delays, or fear of retaliation."
      ),
      action: t("pathways.p4Action", "Explore legal support"),
      href: "/checkin",
    },
    {
      icon: Heart,
      title: t("pathways.p5Title", "Grief & Loss"),
      desc: t(
        "pathways.p5Desc",
        "Coping with the loss of a loved one, a life stage, security, or an unexpected trauma."
      ),
      action: t("pathways.p5Action", "Hold space with us"),
      href: "/checkin",
    },
    {
      icon: AlertOctagon,
      title: t("pathways.p6Title", "Immediate Fear & Intimidation"),
      desc: t(
        "pathways.p6Desc",
        "Threats from accused, village hostility, or urgent safety concerns."
      ),
      action: t("pathways.p6Action", "Access urgent safety"),
      href: "/checkin",
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section */}
      <section className="w-full pt-6 pb-12 md:pb-16 bg-gradient-to-b from-emerald-50/40 via-surface to-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Live Status Bar */}
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-200/80 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-slate-900">
                {t("hero.liveStatus", "Listeners active and ready")}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                {t("hero.waitTime", "Wait time under 60 seconds")}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>{t("common.anonymousBadge", "100% Anonymous")}</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-primary" />
                <span>{t("common.freeBadge", "100% Free")}</span>
              </span>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="max-w-3xl mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight md:leading-[1.18] mb-4">
              {t("hero.title", "You do not have to carry this alone.")}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              {t(
                "hero.subtitle",
                "Free, confidential crisis guidance available 24 hours a day. Talk with an empathetic trained listener at whatever pace feels manageable."
              )}
            </p>
          </div>

          {/* 3 Primary Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Channel 1: Voice Call */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-primary flex items-center justify-center">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {t("hero.channel1Wait", "Wait: Under 1m")}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  {t("hero.channel1Title", "Call Confidential Line")}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  {t(
                    "hero.channel1Desc",
                    "Direct voice connection with an accredited crisis counselor. Safe, warm, and zero pressure to speak quickly."
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="tel:14566"
                  className="w-full h-12 rounded-xl bg-primary hover:bg-emerald-800 text-white flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t("hero.channel1Action", "Call 14566 / 14416")}</span>
                </a>
                <Link
                  href="/call"
                  className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>{t("hero.channel1Sim", "Try Voice Call (Simulated)")}</span>
                </Link>
                <p className="text-center text-[11px] text-slate-500 font-normal">
                  {t("hero.channel1Subtext", "Toll-free across India • 24/7 Available")}
                </p>
              </div>
            </div>

            {/* Channel 2: Live Web Chat */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between relative ring-1 ring-emerald-600/15">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    {t("hero.channel2Badge", "Most Discreet")}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  {t("hero.channel2Title", "Live Web Chat")}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  {t(
                    "hero.channel2Desc",
                    "Completely anonymous browser dialogue. No personal info needed, and messages leave zero footprint when closed."
                  )}
                </p>
              </div>

              <div>
                <Link
                  href="/checkin"
                  className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t("hero.channel2Action", "Start Anonymous Chat")}</span>
                </Link>
                <p className="text-center text-xs text-slate-500 mt-2 font-normal">
                  {t("hero.channel2Subtext", "Opens isolated secure sandbox")}
                </p>
              </div>
            </div>

            {/* Channel 3: Text With Us */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                    {t("hero.channel3Badge", "Silent Check-in")}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  {t("hero.channel3Title", "Text With Us")}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  {t(
                    "hero.channel3Desc",
                    "Text quietly without needing audio. Ideal if you are near others and cannot speak aloud or prefer deliberate typing."
                  )}
                </p>
              </div>

              <div>
                <Link
                  href="/checkin"
                  className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-slate-700" />
                  <span>{t("hero.channel3Action", "Open Text Check-in")}</span>
                </Link>
                <p className="text-center text-xs text-slate-500 mt-2 font-normal">
                  {t("hero.channel3Subtext", "Structured self-report & gentle dialogue")}
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges Strip */}
          <div className="mt-10 pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>{t("common.confidentialBadge", "100% Confidential")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <span>{t("common.zeroJudgmentBadge", "Zero Judgment")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t("common.freeBadge", "Free Forever")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span>{t("common.noAccountBadge", "No Account Required")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grounding Breathing Tool & Pre-Contact Questions */}
      <section id="breathing" className="w-full py-16 bg-slate-100/70 border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Box Breathing Widget */}
            <div className="lg:col-span-5">
              <BreathingWidget />
            </div>

            {/* Common Thoughts & Questions Accordion */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
                  {t("faq.heading", "Common thoughts before reaching out")}
                </h2>
                <p className="text-sm text-slate-600 font-normal">
                  {t("faq.subheading", "It is entirely normal to feel hesitant. Here is what to expect.")}
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Item 1 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => toggleFaq(0)}
                    className="w-full flex items-center justify-between text-left cursor-pointer list-none text-base font-semibold text-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-emerald-50 text-primary flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      {t("faq.q1Title", "What if I do not know what to say?")}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        openFaq === 0 ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === 0 && (
                    <div className="pt-3 pl-9 text-sm text-slate-600 leading-relaxed font-normal animate-in fade-in">
                      {t(
                        "faq.q1Desc",
                        "You do not need a structured story. You can begin with 'I feel overwhelmed' or even a single word. Our listeners are trained to help guide the pace calmly and without pressure."
                      )}
                    </div>
                  )}
                </div>

                {/* Item 2 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => toggleFaq(1)}
                    className="w-full flex items-center justify-between text-left cursor-pointer list-none text-base font-semibold text-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-emerald-50 text-primary flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      {t("faq.q2Title", "Is this genuinely confidential?")}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        openFaq === 1 ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === 1 && (
                    <div className="pt-3 pl-9 text-sm text-slate-600 leading-relaxed font-normal animate-in fade-in">
                      {t(
                        "faq.q2Desc",
                        "Yes. Your IP is scrubbed immediately, conversations are not recorded or sold, and you do not need to provide a real name, email address, or phone number."
                      )}
                    </div>
                  )}
                </div>

                {/* Item 3 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                  <button
                    onClick={() => toggleFaq(2)}
                    className="w-full flex items-center justify-between text-left cursor-pointer list-none text-base font-semibold text-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-emerald-50 text-primary flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      {t("faq.q3Title", "What happens the moment we connect?")}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        openFaq === 2 ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === 2 && (
                    <div className="pt-3 pl-9 text-sm text-slate-600 leading-relaxed font-normal animate-in fade-in">
                      {t(
                        "faq.q3Desc",
                        "A trained human listener will greet you warmly and ask how you are doing today. There are no mandatory surveys or clinical checkboxes. If you need quiet moments, they will stay present with you."
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {t("faq.libraryPrompt", "Prefer self-guided comfort exercises first?")}
                </span>
                <Link
                  href="/checkin"
                  className="text-sm font-semibold text-primary hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>{t("common.chatCheckin", "Text Check-in")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Empathetic Listeners Standards Section */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-50/60 rounded-3xl border border-slate-200 p-8 md:p-12">
            <div className="max-w-3xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-snug mb-4">
                {t("listeners.quote", "\"We listen without judgment, and we always move at your pace.\"")}
              </h2>
              <p className="text-base text-slate-600 font-normal leading-relaxed">
                {t(
                  "listeners.subtitle",
                  "In difficult moments, having someone listen with patience and empathy changes everything. Our listeners are rigorously trained humans, dedicated to being present when life feels heavy."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <School className="w-6 h-6 text-primary mb-2" />
                <h3 className="text-base font-bold text-slate-900">
                  {t("listeners.card1Title", "200+ Hours")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                  {t("listeners.card1Desc", "Comprehensive crisis intervention & psychological first-aid training.")}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <CheckCircle2 className="w-6 h-6 text-primary mb-2" />
                <h3 className="text-base font-bold text-slate-900">
                  {t("listeners.card2Title", "Thoroughly Vetted")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                  {t("listeners.card2Desc", "Verified background and ethics certification for trauma care.")}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Heart className="w-6 h-6 text-primary mb-2" />
                <h3 className="text-base font-bold text-slate-900">
                  {t("listeners.card3Title", "Trauma-Informed")}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                  {t("listeners.card3Desc", "Gentle de-escalation with non-intrusive emotional support.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guided Pathways */}
      <section className="w-full py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">
              {t("pathways.title", "What brings you here today?")}
            </h2>
            <p className="text-base text-slate-600 font-normal">
              {t(
                "pathways.subtitle",
                "Select what you are experiencing right now. We tailor our dialogue to fit what you need most."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathways.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <Link
                  key={idx}
                  href={p.href}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-primary flex items-center justify-center mb-4 group-hover:bg-emerald-50 transition-colors">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">{p.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal mb-4">
                      {p.desc}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>{p.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-50/60 rounded-3xl p-8 md:p-12 border border-slate-200">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                {t("privacy.title", "Our strict privacy guarantee")}
              </h2>
              <p className="text-base text-slate-600 font-normal">
                {t(
                  "privacy.subtitle",
                  "In crisis support, trust is paramount. We treat complete anonymity as an absolute fundamental right."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Shield className="w-6 h-6 text-primary mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {t("privacy.card1Title", "Your IP is never logged")}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t(
                    "privacy.card1Desc",
                    "Every connection passes through an instantaneous scrubbing reverse proxy. We store zero geolocation data or device markers."
                  )}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <Lock className="w-6 h-6 text-primary mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {t("privacy.card2Title", "Zero Transcripts Retained")}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t(
                    "privacy.card2Desc",
                    "Once a chat or call ends, session memory is wiped permanently. Monitored records use unlinked pseudonyms."
                  )}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <ExternalLink className="w-6 h-6 text-primary mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {t("privacy.card3Title", "One-click instant exit")}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {t(
                    "privacy.card3Desc",
                    "Press the ESC key or tap Quick Exit at any time to immediately replace this site with a neutral weather forecast."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Search */}
      <section className="w-full py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                  {t("directory.title", "Find in-person help near you")}
                </h2>
                <p className="text-base text-slate-600 font-normal leading-relaxed mb-6">
                  {t(
                    "directory.subtitle",
                    "Looking for shelter, legal aid, walk-in mental health clinics, or crisis response centers? Search our confidential directory."
                  )}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearchSubmitted(true);
                  }}
                  className="flex flex-col sm:flex-row items-center gap-3"
                >
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t(
                        "directory.placeholder",
                        "Enter district, state, or PIN code (e.g. Pune or 411001)"
                      )}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto h-12 px-6 rounded-xl bg-primary hover:bg-emerald-800 text-white font-semibold text-sm whitespace-nowrap transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t("directory.button", "Search")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                {searchSubmitted && (
                  <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg inline-block border border-emerald-200">
                    {language === "hi"
                      ? "खोज परिणाम: निकटतम ज़िला विधिक सेवा प्राधिकरण (DLSA) एवं टेली-मानस केंद्र (14416) सक्रिय हैं।"
                      : "Search result: Nearest District Legal Services Authority (DLSA) and Tele-MANAS Center (14416) are operational."}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500 font-normal">
                  {t(
                    "directory.subtext",
                    "Searches are processed anonymously and never recorded."
                  )}
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {t("directory.item1Title", "Emergency Shelters")}
                    </span>
                    <span className="text-xs text-slate-500 block leading-tight mt-0.5 font-normal">
                      {t("directory.item1Desc", "Safe, non-punitive overnight beds and sanctuary")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {t("directory.item2Title", "District Legal Aid")}
                    </span>
                    <span className="text-xs text-slate-500 block leading-tight mt-0.5 font-normal">
                      {t("directory.item2Desc", "Free legal counsel under SC/ST Protection Act")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {t("directory.item3Title", "Mental Health Clinics")}
                    </span>
                    <span className="text-xs text-slate-500 block leading-tight mt-0.5 font-normal">
                      {t("directory.item3Desc", "Government district hospital psychiatric counseling")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="w-full bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-4">
            <div className="flex flex-col gap-3">
              <span className="text-base font-bold text-slate-900">
                {t("common.appName", "Project SAHARA")}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                {t(
                  "hero.subtitle",
                  "A free, non-judgmental crisis sanctuary providing continuous human emotional support around the clock."
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t("helplines.title", "Immediate Crisis Lines")}
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                <a
                  href="tel:14566"
                  className="text-primary font-semibold hover:underline"
                >
                  NHAA: 14566 (Atrocity Support)
                </a>
                <a href="tel:14416" className="text-slate-600 hover:text-slate-900">
                  Tele-MANAS: 14416 (Distress)
                </a>
                <a
                  href="tel:18005990019"
                  className="text-slate-600 hover:text-slate-900"
                >
                  Kiran: 1800-599-0019
                </a>
                <a href="tel:112" className="text-slate-600 hover:text-slate-900">
                  Emergency Police/Ambulance: 112
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t("nav.howItWorks", "System Pathways")}
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                <Link href="/checkin" className="text-slate-600 hover:text-slate-900">
                  {t("common.chatCheckin", "Text Check-in UI")}
                </Link>
                <Link href="/call" className="text-slate-600 hover:text-slate-900">
                  {t("common.callSimulated", "Simulated Call IVRS")}
                </Link>
                <Link href="/staff" className="text-slate-600 hover:text-slate-900">
                  {t("common.staffPortal", "Counsellor Triage Portal")}
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t("privacy.title", "Privacy & Safety")}
              </span>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                {t(
                  "privacy.card1Desc",
                  "Every connection passes through an instantaneous scrubbing reverse proxy. We store zero geolocation data or device markers."
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-100 text-xs text-slate-500 gap-4">
            <p className="text-center md:text-left font-normal">
              {t(
                "common.emergencyDisclaimer",
                "If you or someone you know is in immediate life-threatening danger, call 112 or visit the nearest emergency facility immediately."
              )}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <span>Project SAHARA • SIH 26094</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
