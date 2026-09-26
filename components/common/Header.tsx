"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, MessageCircle, Phone, Menu, X, HeartHandshake } from "lucide-react";

import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("nav.getImmediateHelp", "Get Immediate Help") },
    { href: "/#breathing", label: t("nav.selfCare", "Grounding & Breathing") },
    { href: "/checkin", label: t("nav.chatCheckin", "Text Check-in") },
    { href: "/call", label: t("nav.simulatedCall", "Simulated Call") },
    { href: "/staff", label: t("nav.staffDashboard", "Counsellor Triage") },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-outline-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 24/7 Hotline Quick Notice Sub-bar */}
        <div className="h-9 py-1 flex items-center justify-between border-b border-slate-100 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="hidden xs:inline">
                {t("common.emergencyHotline", "24/7 Free & Confidential Support:")}
              </span>
            </span>
            <a
              href="tel:14566"
              className="font-semibold text-primary hover:text-emerald-800 transition-colors"
              title="National Helpline Against Atrocities"
            >
              NHAA 14566
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="tel:14416"
              className="font-medium text-slate-700 hover:text-primary transition-colors"
              title="Tele-MANAS Mental Health"
            >
              Tele-MANAS 14416
            </a>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <a
              href="tel:112"
              className="hover:text-slate-900 transition-colors hidden sm:inline text-slate-600"
              title="National Emergency Dispatch"
            >
              Emergency 112
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1 text-slate-500 font-medium text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>{t("common.safeConnection", "Safe connection")}</span>
            </span>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight">
                  {t("common.appName", "Project SAHARA")}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Checkin button */}
            <Link
              href="/checkin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-medium hover:bg-emerald-800 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t("common.chatCheckin", "Text Check-in")}</span>
            </Link>

            {/* Mobile menu hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-slate-100 flex flex-col gap-1 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg ${
                  pathname === link.href
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link
                href="/checkin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 rounded-lg bg-primary text-white text-center text-xs font-semibold flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{t("common.chatCheckin", "Text Check-in")}</span>
              </Link>
              <Link
                href="/call"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-white text-center text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{t("common.callSimulated", "Simulated Call")}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
