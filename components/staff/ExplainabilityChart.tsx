"use client";

import React from "react";
import { Scale, ShieldCheck, AlertTriangle, FileText, Activity, MicOff, Star } from "lucide-react";
import { ComponentsBreakdown, ContributionsBreakdown } from "@/types/contract";

interface ExplainabilityChartProps {
  components: ComponentsBreakdown;
  contributions: ContributionsBreakdown;
  composite: number;
  explanations?: string[];
}

export default function ExplainabilityChart({
  components,
  contributions,
  composite,
  explanations = [],
}: ExplainabilityChartProps) {
  // Sort components to find dominant contributor
  const items = [
    {
      key: "s3",
      label: "S₃ Legal & Case Context",
      subtitle: "Deterministic court docket, bail status, relief delay & intimidation",
      icon: Scale,
      color: "bg-amber-600",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      barColor: "bg-amber-600",
      raw: components.s3,
      weight: 0.25,
      contribution: contributions.s3,
    },
    {
      key: "s1",
      label: "S₁ Self-Report Survey",
      subtitle: "Answers to structured check-in questions (sleep, functioning, safety)",
      icon: FileText,
      color: "bg-emerald-600",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      barColor: "bg-emerald-600",
      raw: components.s1,
      weight: 0.35,
      contribution: contributions.s1,
    },
    {
      key: "s2",
      label: "S₂ Linguistic Distress",
      subtitle: "LLM-extracted distress marker from conversational transcript",
      icon: Activity,
      color: "bg-blue-600",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      barColor: "bg-blue-600",
      raw: components.s2,
      weight: 0.25,
      contribution: contributions.s2,
    },
    {
      key: "s4",
      label: "S₄ Engagement Monotonicity",
      subtitle: "Monotonically non-decreasing penalty for missed check-ins & mid-flow drops",
      icon: ShieldCheck,
      color: "bg-indigo-600",
      textColor: "text-indigo-700",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      barColor: "bg-indigo-600",
      raw: components.s4,
      weight: 0.15,
      contribution: contributions.s4,
    },
    {
      key: "s5",
      label: "S₅ Paralinguistic Acoustic",
      subtitle: "Acoustic speech metrics (weight strictly pinned to 0.00 to avoid dialect bias)",
      icon: MicOff,
      color: "bg-slate-400",
      textColor: "text-slate-500",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      barColor: "bg-slate-300",
      raw: components.s5,
      weight: 0.0,
      contribution: 0,
    },
  ];

  // Identify highest contributing component
  const dominantItem = [...items].sort((a, b) => b.contribution - a.contribution)[0]!;
  const isS3Dominant = dominantItem.key === "s3";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Explainable Distress Breakdown
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Additive Math
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent point attribution by construction: each component contributes exactly W × Raw score.
          </p>
        </div>

        <div className="flex items-baseline gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 shrink-0">
          <span className="text-xs font-medium text-slate-600">Composite Score:</span>
          <span className="text-xl font-extrabold text-slate-900">{composite.toFixed(2)}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Dominant Contributor Highlight Callout */}
      {isS3Dominant && (
        <div className="mt-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Star className="w-4 h-4 fill-white" />
          </div>
          <div className="text-xs leading-relaxed">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>S₃ Case Context is the Dominant Distress Driver</span>
              <span className="px-1.5 py-0.2 bg-amber-200/70 text-amber-800 rounded font-semibold text-[10px]">
                {contributions.s3.toFixed(2)} pts ({((contributions.s3 / composite) * 100).toFixed(1)}% of total)
              </span>
            </div>
            <p className="text-amber-800/90 mt-1">
              Case context contributes <span className="font-semibold text-amber-950">{contributions.s3.toFixed(2)} points</span>,
              surpassing self-report (<span className="font-semibold text-amber-950">{contributions.s1.toFixed(2)} pts</span>)
              and linguistic NLP (<span className="font-semibold text-amber-950">{contributions.s2.toFixed(2)} pts</span>).
              Distress is heavily driven by deterministic systemic milestones (bail release, impending court hearing, overdue relief, intimidation).
            </p>
          </div>
        </div>
      )}

      {/* Additive Composite Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-700">Additive Score Composition</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {contributions.s1.toFixed(2)} + {contributions.s2.toFixed(2)} + {contributions.s3.toFixed(2)} + {contributions.s4.toFixed(2)} = {composite.toFixed(2)} pts
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
          {items.map((item) => {
            if (item.contribution <= 0) return null;
            const pct = (item.contribution / 100) * 100;
            return (
              <div
                key={item.key}
                style={{ width: `${pct}%` }}
                className={`${item.barColor} h-full relative group transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white`}
                title={`${item.label}: +${item.contribution.toFixed(2)} pts`}
              >
                {pct > 8 && <span>{item.key.toUpperCase()}</span>}
              </div>
            );
          })}
        </div>

        {/* Bar Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2.5 text-[11px] text-slate-600">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${item.barColor}`} />
              <span className="font-medium text-slate-700">{item.key.toUpperCase()}</span>
              <span className="text-slate-400 font-mono">({item.contribution.toFixed(2)} pts)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Component Rows */}
      <div className="mt-6 space-y-3">
        {items.map((item) => {
          const isDominant = item.key === dominantItem.key;
          const IconComponent = item.icon;

          return (
            <div
              key={item.key}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isDominant
                  ? `${item.bgColor} ${item.borderColor} ring-1 ring-amber-400/40`
                  : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${item.bgColor} border ${item.borderColor} ${item.textColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{item.label}</span>
                      {isDominant && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          Dominant Contributor
                        </span>
                      )}
                      {item.weight === 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          Weight Locked 0.00
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Raw Score
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                      {item.raw !== null ? item.raw.toFixed(1) : "null"}
                      <span className="text-slate-400 text-[11px] font-normal"> / 100</span>
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Effective Weight
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 font-mono">
                      {(item.weight * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-left sm:text-right min-w-[70px]">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Contribution
                    </span>
                    <span className={`text-xs sm:text-base font-extrabold font-mono ${item.textColor}`}>
                      +{item.contribution.toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal"> pts</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Individual Progress Fill */}
              <div className="mt-3 w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${item.barColor} transition-all duration-300`}
                  style={{ width: `${item.contribution > 0 ? (item.contribution / 35) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Reasons List */}
      {explanations.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-700 block mb-2">
            Clinical & Systemic Explanations
          </span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {explanations.map((exp, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>{exp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
