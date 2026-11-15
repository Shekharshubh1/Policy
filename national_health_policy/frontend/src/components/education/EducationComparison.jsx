import React, { useState } from "react";
import { Scale, Award, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import educationData from "../../data/education_data.json";

export default function EducationComparison() {
  const avgs = educationData.state_averages;

  // Preset scenarios
  const presets = [
    {
      id: "digital",
      name: "NEP Digital Push",
      desc: "75% digital access + 85 infra score",
      a: { ptr: 26, digital: 54, infra: 70, female: 49 },
      b: { ptr: 24, digital: 85, infra: 88, female: 52 },
      outcomesA: { literacy: 68.3, dropout: 16.9, learning: 65.0, gpi: 1.00 },
      outcomesB: { literacy: 76.8, dropout: 11.2, learning: 77.4, gpi: 1.03 }
    },
    {
      id: "teachers",
      name: "Teacher Reform & Gender Parity",
      desc: "Surge female teachers to 65% + 1:18 PTR",
      a: { ptr: 26, digital: 54, infra: 70, female: 49 },
      b: { ptr: 18, digital: 60, infra: 75, female: 65 },
      outcomesA: { literacy: 68.3, dropout: 16.9, learning: 65.0, gpi: 1.00 },
      outcomesB: { literacy: 75.4, dropout: 9.8, learning: 74.2, gpi: 1.06 }
    },
    {
      id: "tribal",
      name: "Tribal Block Equity Surge",
      desc: "Alirajpur / Jhabua infrastructure overhaul",
      a: { ptr: 34, digital: 22, infra: 42, female: 32 },
      b: { ptr: 20, digital: 70, infra: 80, female: 55 },
      outcomesA: { literacy: 48.2, dropout: 26.5, learning: 49.0, gpi: 0.89 },
      outcomesB: { literacy: 64.5, dropout: 14.8, learning: 67.2, gpi: 1.01 }
    }
  ];

  const [activePreset, setActivePreset] = useState(presets[0]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span>State Education Policy Scenario Comparison</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Side-by-side scenario simulation (Scenario A: Baseline vs Scenario B: Policy Intervention).
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                activePreset.id === p.id
                  ? "bg-primary-600 text-white border-primary-500 font-semibold"
                  : "bg-surface border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario A Card */}
        <div className="bg-surface rounded-xl border border-sky-800/50 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold">
              Scenario A (Status Quo Baseline)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/70 border border-sky-800 text-sky-300">
              Empirical Data
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">PTR</span>
              <span className="font-bold text-text-primary">1:{activePreset.a.ptr}</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Digital Classrooms</span>
              <span className="font-bold text-sky-400">{activePreset.a.digital}%</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Infrastructure</span>
              <span className="font-bold text-indigo-400">{activePreset.a.infra}/100</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Female Teachers</span>
              <span className="font-bold text-text-primary">{activePreset.a.female}%</span>
            </div>
          </div>

          {/* Outcome Expectations */}
          <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-tertiary">Literacy Rate:</span>
              <span className="font-bold text-text-primary">{activePreset.outcomesA.literacy}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-tertiary">Dropout Rate:</span>
              <span className="font-bold text-rose-400">{activePreset.outcomesA.dropout}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-tertiary">Learning Score:</span>
              <span className="font-bold text-primary-300">{activePreset.outcomesA.learning}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-tertiary">Gender Parity Index:</span>
              <span className="font-bold text-text-primary">{activePreset.outcomesA.gpi}</span>
            </div>
          </div>
        </div>

        {/* Scenario B Card */}
        <div className="bg-surface rounded-xl border border-indigo-800/50 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
              Scenario B ({activePreset.name})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-800 text-indigo-300">
              Simulated Policy
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">PTR</span>
              <span className="font-bold text-text-primary">1:{activePreset.b.ptr}</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Digital Classrooms</span>
              <span className="font-bold text-sky-400">{activePreset.b.digital}%</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Infrastructure</span>
              <span className="font-bold text-indigo-400">{activePreset.b.infra}/100</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Female Teachers</span>
              <span className="font-bold text-text-primary">{activePreset.b.female}%</span>
            </div>
          </div>

          {/* Outcome Expectations & Deltas */}
          <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-tertiary">Literacy Rate:</span>
              <span className="font-bold text-emerald-400">
                {activePreset.outcomesB.literacy}% (+{(activePreset.outcomesB.literacy - activePreset.outcomesA.literacy).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-tertiary">Dropout Rate:</span>
              <span className="font-bold text-emerald-400">
                {activePreset.outcomesB.dropout}% ({(activePreset.outcomesB.dropout - activePreset.outcomesA.dropout).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-text-tertiary">Learning Score:</span>
              <span className="font-bold text-primary-300">
                {activePreset.outcomesB.learning} (+{(activePreset.outcomesB.learning - activePreset.outcomesA.learning).toFixed(1)})
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-tertiary">Gender Parity Index:</span>
              <span className="font-bold text-text-primary">
                {activePreset.outcomesB.gpi} (+{(activePreset.outcomesB.gpi - activePreset.outcomesA.gpi).toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
