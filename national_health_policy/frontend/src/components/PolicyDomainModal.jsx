import React, { useState } from "react";
import {
  HeartPulse,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  Layers,
  Activity,
  Award
} from "lucide-react";

export default function PolicyDomainModal({
  isOpen,
  currentDomain,
  onSelectDomain,
  onClose,
  canDismiss = false
}) {
  const [rememberChoice, setRememberChoice] = useState(true);

  if (!isOpen) return null;

  const handleSelect = (domain) => {
    if (rememberChoice) {
      localStorage.setItem("nhp_dis_selected_domain", domain);
    }
    onSelectDomain(domain);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-surface border border-border/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Background gradient decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center text-white text-xs font-mono font-bold">
                Ψ
              </span>
              <span className="text-[11px] font-mono text-primary-400 font-semibold uppercase tracking-wider">
                Integrated National Policy Intelligence Platform
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Select Decision Intelligence Domain
            </h2>
            <p className="text-xs text-text-secondary">
              Choose your policy portfolio to access validated Bayesian causal simulations, empirical district observatories, and AI decision support.
            </p>
          </div>

          {canDismiss && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Portal Choice Cards (2-column layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative z-10">
          {/* Card 1: Healthcare Policy */}
          <div
            onClick={() => handleSelect("health")}
            className={`group relative rounded-xl border p-5 space-y-4 cursor-pointer transition-all hover:scale-[1.01] shadow-sm flex flex-col justify-between ${
              currentDomain === "health"
                ? "bg-sky-950/25 border-sky-500 ring-2 ring-sky-500/30"
                : "bg-surface-elevated/40 border-border hover:border-sky-500/60"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-900/40 border border-sky-700/60 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/70 border border-sky-800 text-sky-300 font-semibold">
                  MoHFW / NITI Aayog
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-text-primary group-hover:text-sky-300 transition-colors">
                  National Healthcare Policy
                </h3>
                <div className="text-[11px] font-mono text-text-tertiary">
                  NHP-DIS Decision Intelligence
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Empirical Bayesian modeling across maternal &amp; infant mortality, institutional deliveries, full immunization, and rural specialist surgery.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-border/50 text-[11px] font-mono text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>698 Districts • 34 States &amp; UTs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>NFHS-4, NFHS-5 &amp; RHS Open Data</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>10 Decision Modules &amp; India Map</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect("health");
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Enter Healthcare Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Education Policy */}
          <div
            onClick={() => handleSelect("education")}
            className={`group relative rounded-xl border p-5 space-y-4 cursor-pointer transition-all hover:scale-[1.01] shadow-sm flex flex-col justify-between ${
              currentDomain === "education"
                ? "bg-indigo-950/25 border-indigo-500 ring-2 ring-indigo-500/30"
                : "bg-surface-elevated/40 border-border hover:border-indigo-500/60"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-300 font-semibold">
                  School Education / NITI Aayog
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-text-primary group-hover:text-indigo-300 transition-colors">
                  State Education Policy
                </h3>
                <div className="text-[11px] font-mono text-text-tertiary">
                  EDIS Decision Intelligence (NEP 2020)
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Bayesian simulation for Pupil-Teacher Ratio (PTR), digital smart classrooms, female literacy advancement, dropout prevention, and tribal equity.
              </p>

              <div className="space-y-1.5 pt-2 border-t border-border/50 text-[11px] font-mono text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>52 Districts (MP) • 260 Panel Records</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>UDISE+, Census &amp; ASER Learning Data</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Causal DAG, Simulator &amp; Copilot</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect("education");
              }}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Enter Education Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer: Remember choice checkbox and switcher note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-text-secondary relative z-10">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="rounded border-border text-primary-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px] text-text-tertiary">Remember my policy domain preference for future visits</span>
          </label>

          <span className="text-[10px] font-mono text-text-tertiary">
            Tip: You can switch domains at any time via the top navigation bar.
          </span>
        </div>
      </div>
    </div>
  );
}
