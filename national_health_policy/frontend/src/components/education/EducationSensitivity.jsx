import React, { useState } from "react";
import { BarChart2, TrendingUp, Info } from "lucide-react";

export default function EducationSensitivity() {
  const [target, setTarget] = useState("literacy");

  const sensitivityData = {
    literacy: [
      { name: "Digital Smart Classrooms", impact: 0.32, direction: "positive", desc: "+32% causal shift on literacy advancement" },
      { name: "Female Teacher Ratio", impact: 0.28, direction: "positive", desc: "+28% mutual information on foundational literacy" },
      { name: "Pupil-Teacher Ratio (PTR)", impact: 0.22, direction: "positive", desc: "+22% sensitivity when PTR <= 25:1" },
      { name: "Infrastructure Index", impact: 0.16, direction: "positive", desc: "+16% impact from electricity & library facilities" },
      { name: "Per-Student Expenditure", impact: 0.12, direction: "positive", desc: "+12% direct budget elasticity" }
    ],
    dropout: [
      { name: "Female Teacher Ratio", impact: 0.34, direction: "positive", desc: "Reduces secondary girls' dropout by 34%" },
      { name: "Mid-Day Meal Quality", impact: 0.26, direction: "positive", desc: "Improves school retention by 26%" },
      { name: "Infrastructure (Toilets/WASH)", impact: 0.21, direction: "positive", desc: "Lowers adolescent dropout by 21%" },
      { name: "Digital Access", impact: 0.18, direction: "positive", desc: "Decreases disengagement dropout by 18%" },
      { name: "Pupil-Teacher Ratio", impact: 0.11, direction: "positive", desc: "Improves individualized attention by 11%" }
    ],
    learning: [
      { name: "Digital Smart Classrooms", impact: 0.35, direction: "positive", desc: "+35% correlation with ASER math & reading competency" },
      { name: "Pupil-Teacher Ratio", impact: 0.29, direction: "positive", desc: "+29% increase in classroom instructional time" },
      { name: "School Infrastructure", impact: 0.20, direction: "positive", desc: "+20% learning environment resilience" },
      { name: "Per-Student Expenditure", impact: 0.15, direction: "positive", desc: "+15% learning material availability" },
      { name: "Mid-Day Meal Quality", impact: 0.10, direction: "positive", desc: "+10% cognitive alertness and attendance" }
    ]
  };

  const currentData = sensitivityData[target] || sensitivityData.literacy;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <span>Educational Sensitivity &amp; Strategic Intervention Rankings</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Tornado impact analysis quantifying the relative causal sensitivity of educational policy levers (Pearl's mutual information).
          </p>
        </div>

        {/* Target Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-tertiary font-mono text-[11px]">Outcome Target:</span>
          {[
            { id: "literacy", label: "Literacy Rate" },
            { id: "dropout", label: "Dropout Reduction" },
            { id: "learning", label: "Learning Outcomes" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTarget(t.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                target === t.id
                  ? "bg-primary-600 text-white border-primary-500 font-semibold"
                  : "bg-surface border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tornado Impact Bars */}
      <div className="bg-surface rounded-xl border border-border p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="space-y-3">
          {currentData.map((item, idx) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-primary font-sans font-medium flex items-center gap-1.5">
                  <span className="w-4 text-center font-bold text-text-tertiary">#{idx + 1}</span>
                  <span>{item.name}</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  {(item.impact * 100).toFixed(0)}% Relative Elasticity
                </span>
              </div>

              <div className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden flex">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${item.impact * 250}%` }}
                />
              </div>

              <div className="text-[10px] text-text-secondary pl-5">
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-text-tertiary">
          <Info className="w-4 h-4 text-primary-400 shrink-0" />
          <span>
            Computed using Kullback-Leibler divergence on the discrete Bayesian DAG learned over 52 MP districts across 2017–2021.
          </span>
        </div>
      </div>
    </div>
  );
}
