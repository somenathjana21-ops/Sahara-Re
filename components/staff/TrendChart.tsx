"use client";

import React, { useState } from "react";
import { TrendingUp, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { AssessmentRecord } from "@/types/contract";

interface TrendChartProps {
  assessments: AssessmentRecord[];
  baselineMean: number | null;
  baselineVar: number | null;
  personPseudonym: string;
}

export default function TrendChart({
  assessments,
  baselineMean,
  baselineVar,
  personPseudonym,
}: TrendChartProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(
    assessments.length > 0 ? assessments.length - 1 : null
  );

  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500">
        <TrendingUp className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm">No historical check-in assessments recorded yet.</p>
      </div>
    );
  }

  // Use prior baseline if available, or current
  const mu = baselineMean ?? 28.9;
  const rawVar = baselineVar ?? 2.7;
  const sigma = Math.max(Math.sqrt(rawVar), 8); // Invariant noise floor = 8
  const upperThreshold = Math.min(100, mu + 2 * sigma);

  // SVG dimensions
  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Coordinate scales
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return paddingTop + chartHeight - (clamped / 100) * chartHeight;
  };

  const getX = (index: number) => {
    if (assessments.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (assessments.length - 1)) * chartWidth;
  };

  // Build SVG path for distress trajectory
  const points = assessments.map((a, i) => ({
    x: getX(i),
    y: getY(a.composite),
    a,
    i,
  }));

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  const selectedAssessment = selectedIdx !== null ? assessments[selectedIdx] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Personal Baseline & EWMA Trajectory
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              z-Score Anomaly Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Running mean $\mu_t$ with noise-floored standard deviation band ($\sigma \ge 8$).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
            <span className="w-2.5 h-0.5 bg-blue-600 inline-block" />
            <span className="text-slate-600 font-medium">Baseline Mean $\mu$:</span>
            <span className="font-bold text-slate-800 font-mono">{mu.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200/80 px-3 py-1.5 rounded-lg">
            <span className="w-2.5 h-0.5 bg-red-500 inline-block" />
            <span className="text-red-700 font-medium">+2σ Alert:</span>
            <span className="font-bold text-red-900 font-mono">{upperThreshold.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="mt-4 relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          aria-label="Distress trajectory chart"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Anomaly threshold zone (above mu + 2*sigma) */}
          <rect
            x={paddingLeft}
            y={getY(upperThreshold)}
            width={chartWidth}
            height={getY(0) - getY(upperThreshold)}
            fill="rgba(239, 68, 68, 0.04)"
          />

          {/* Upper Threshold Line (+2*sigma) */}
          <line
            x1={paddingLeft}
            y1={getY(upperThreshold)}
            x2={width - paddingRight}
            y2={getY(upperThreshold)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={width - paddingRight - 4}
            y={getY(upperThreshold) - 5}
            textAnchor="end"
            fontSize="9"
            fill="#dc2626"
            fontWeight="bold"
          >
            +2σ Threshold ({upperThreshold.toFixed(1)})
          </text>

          {/* Baseline Mean Line (mu) */}
          <line
            x1={paddingLeft}
            y1={getY(mu)}
            x2={width - paddingRight}
            y2={getY(mu)}
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
          <text
            x={width - paddingRight - 4}
            y={getY(mu) - 5}
            textAnchor="end"
            fontSize="9"
            fill="#2563eb"
            fontWeight="bold"
          >
            Baseline μ ({mu.toFixed(1)})
          </text>

          {/* Trajectory Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#206140"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {points.map((pt) => {
            const isChangePoint = pt.a.change_point;
            const isSelected = selectedIdx === pt.i;
            const isRed = pt.a.tier === "RED" || pt.a.tier === "CRITICAL";

            return (
              <g
                key={pt.i}
                className="cursor-pointer group"
                onClick={() => setSelectedIdx(pt.i)}
              >
                {/* Pulse ring on change point */}
                {isChangePoint && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Outer ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "8" : "6"}
                  fill={isRed ? "#ef4444" : "#206140"}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Score label above point */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isRed ? "#dc2626" : "#1e293b"}
                  fontFamily="monospace"
                >
                  {pt.a.composite.toFixed(1)}
                </text>

                {/* X-axis label */}
                <text
                  x={pt.x}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isSelected ? "#0f172a" : "#64748b"}
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  Check-in #{pt.i + 1}
                </text>

                {/* Change point banner text */}
                {isChangePoint && (
                  <text
                    x={pt.x}
                    y={pt.y - 24}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#b91c1c"
                  >
                    ⚠️ z = {pt.a.z_score !== null ? pt.a.z_score.toFixed(2) : "N/A"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Point Inspector */}
      {selectedAssessment && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  selectedAssessment.tier === "RED"
                    ? "bg-red-500"
                    : selectedAssessment.tier === "AMBER"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
              <span className="text-xs font-bold text-slate-800">
                Check-in #{selectedIdx! + 1} Inspection:
              </span>
              <span className="text-xs text-slate-500">
                {new Date(selectedAssessment.created_at).toLocaleDateString()}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedAssessment.tier === "RED"
                    ? "bg-red-100 text-red-800"
                    : selectedAssessment.tier === "AMBER"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {selectedAssessment.tier}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 font-sans">Composite: </span>
                <span className="font-bold text-slate-900">{selectedAssessment.composite.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans">z-Score: </span>
                <span
                  className={`font-bold ${
                    (selectedAssessment.z_score ?? 0) > 2.0
                      ? "text-red-600"
                      : "text-slate-700"
                  }`}
                >
                  {selectedAssessment.z_score !== null
                    ? selectedAssessment.z_score.toFixed(2)
                    : "N/A (init)"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-sans">Change Point: </span>
                <span
                  className={`font-bold ${
                    selectedAssessment.change_point ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {selectedAssessment.change_point ? "FLAGGED (z > 2.0)" : "False"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Math Engine Context Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Formula: z_t = (x_t - &mu;_(t-1)) / max(&sigma;_(t-1), 8.0) evaluated before baseline absorption
        </span>
        <span>Smoothing factor: &lambda; = 0.3</span>
      </div>
    </div>
  );
}
