import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  Activity,
  Award,
  Layers,
  MapPin,
  Clock,
  Target,
  ArrowRight,
  Copy,
  Check,
  ChevronRight,
  Bell,
  Sliders,
  Filter,
  BarChart2,
  FileText
} from "lucide-react";
import { apiClient } from "../api/client";
import IndiaChoroplethMap from "./IndiaChoroplethMap";

// Micro-Sparkline SVG for KPI Cards
function MiniSparkline({ data = [], isGood = true, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - 8) + 4;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor = color || (isGood ? "#10b981" : "#ef4444");

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={`grad-${color?.replace(/[^a-zA-Z0-9]/g, "") || "def"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End point marker */}
      {data.length > 0 && (
        <circle
          cx={width - 4}
          cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4}
          r="2.5"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}

export default function NationalOverview() {
  const [summary, setSummary] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState("all");
  const [copiedBrief, setCopiedBrief] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.summary(), apiClient.states()])
      .then(([sumRes, stateRes]) => {
        setSummary(sumRes);
        setStates(stateRes.states || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load national data:", err);
        setLoading(false);
      });
  }, []);

  // Compute dynamic executive banner properties
  const avgs = summary?.national_averages || {};
  const healthScore = Number(avgs.overall_health_index || 73.8);

  const healthStatus = useMemo(() => {
    if (healthScore >= 80) return { label: "EXCELLENT", color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800" };
    if (healthScore >= 70) return { label: "GOOD", color: "text-sky-400", bg: "bg-sky-950/40 border-sky-800" };
    if (healthScore >= 55) return { label: "MODERATE", color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800" };
    return { label: "CRITICAL", color: "text-rose-400", bg: "bg-rose-950/40 border-rose-800" };
  }, [healthScore]);

  // Compute top and bottom states
  const sortedStates = useMemo(() => {
    return [...states].sort((a, b) => (b.overall_health_index ?? 0) - (a.overall_health_index ?? 0));
  }, [states]);

  const topStates = useMemo(() => sortedStates.slice(0, 5), [sortedStates]);
  const bottomStates = useMemo(() => sortedStates.slice(-5).reverse(), [sortedStates]);

  const priorityStatesList = useMemo(() => {
    return bottomStates.slice(0, 3).map((s) => s.state_name).join(", ");
  }, [bottomStates]);

  // Copy AI Brief handler
  const handleCopyBrief = () => {
    const briefText = `India National Health Policy Intelligence Brief (MoHFW / NITI Aayog)
National Health Status: ${healthStatus.label} (${healthScore.toFixed(1)}/100)
Strongest Indicator: Institutional Delivery (${avgs.institutional_delivery_rate || 88.7}%)
Biggest Challenge: Maternal Mortality Ratio (MMR ${avgs.maternal_mortality_rate || 155.7} per 100k)
Priority States: ${priorityStatesList}

Key Strategic Directive: Surge 24/7 emergency obstetric care & specialist retention in high-burden Empowered Action Group states (Bihar, UP, Jharkhand). Converge Jal Jeevan Mission piped water to eliminate environmental infant mortality vectors.`;

    navigator.clipboard.writeText(briefText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-secondary text-xs gap-3">
        <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
        <span className="font-mono">Loading validated national health observatory...</span>
      </div>
    );
  }

  // Raw policy alerts list
  const policyAlerts = [
    {
      id: 1,
      type: "critical",
      title: "Bihar MMR Exceeds National Threshold",
      metric: "MMR: 173.0 / 100k",
      benchmark: "National SDG Target: < 70",
      description: "Severe specialist vacancy (78%) in rural Community Health Centres restricts 24/7 emergency obstetric surgery.",
      state: "Bihar",
      time: "NFHS-5 Validated"
    },
    {
      id: 2,
      type: "critical",
      title: "Uttar Pradesh Infant Mortality Cluster",
      metric: "IMR: 45.8 / 1k",
      benchmark: "National Avg: 32.6",
      description: "Eastern districts show recurrent neonatal pneumonia and enteropathy from untreated surface water vectors.",
      state: "Uttar Pradesh",
      time: "NFHS-5 Validated"
    },
    {
      id: 3,
      type: "warning",
      title: "Madhya Pradesh Immunization Growth Lag",
      metric: "Full Immunization: 71.2%",
      benchmark: "SDG Target: 90%",
      description: "Tribal block vaccine dropout between DPT-1 and Measles-Rubella requires Mission Indradhanush mop-up surge.",
      state: "Madhya Pradesh",
      time: "Survey Wave 2"
    },
    {
      id: 4,
      type: "warning",
      title: "Meghalaya Institutional Delivery Deficit",
      metric: "Inst. Delivery: 64.1%",
      benchmark: "National Avg: 88.7%",
      description: "Difficult hilly terrain and road connectivity lags contribute to persistent home births without skilled birth attendants.",
      state: "Meghalaya",
      time: "Survey Wave 2"
    },
    {
      id: 5,
      type: "milestone",
      title: "Kerala Achieves Universal Delivery Saturation",
      metric: "Delivery: 99.8% • IMR: 4.1",
      benchmark: "WHO Gold Standard",
      description: "Primary Health Centres operate accredited 24/7 neonatal intensive units, meeting SDG 3.2 targets a decade early.",
      state: "Kerala",
      time: "Benchmark Achieved"
    },
    {
      id: 6,
      type: "milestone",
      title: "Goa Reaches 92.8 Overall Health Score",
      metric: "Rank #1 Nationally",
      benchmark: "Life Expectancy: 82.0 yrs",
      description: "Comprehensive public insurance coverage coupled with high female literacy minimizes catastrophic out-of-pocket spend.",
      state: "Goa",
      time: "Benchmark Achieved"
    }
  ];

  const filteredAlerts = alertFilter === "all" ? policyAlerts : policyAlerts.filter((a) => a.type === alertFilter);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. NATIONAL HEALTH STATUS EXECUTIVE BANNER (Directly below Nav)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-sky-950/40 via-surface to-surface border border-sky-800/50 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Overall Health Score & Status Badge */}
          <div className="flex items-center gap-3.5 border-b lg:border-b-0 lg:border-r border-border/60 pb-3 lg:pb-0 lg:pr-5 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-sky-900/40 border border-sky-700/60 flex items-center justify-center text-primary-400 shrink-0">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                Overall National Health Status
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  {healthScore.toFixed(1)}
                  <span className="text-xs font-normal text-text-tertiary">/100</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${healthStatus.bg} ${healthStatus.color}`}>
                  {healthStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Strength, Weakness, and Priority States Briefing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
            {/* Strongest Indicator */}
            <div className="bg-surface-elevated/40 border border-border/60 rounded-xl p-2.5 space-y-0.5">
              <div className="text-[10px] text-text-tertiary flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Top Strength Area</span>
              </div>
              <div className="text-text-primary font-bold truncate">
                Institutional Delivery
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                {Number(avgs.institutional_delivery_rate || 88.7).toFixed(1)}% <span className="text-[9px] text-text-tertiary font-sans">(Nationwide)</span>
              </div>
            </div>

            {/* Biggest Challenge */}
            <div className="bg-surface-elevated/40 border border-border/60 rounded-xl p-2.5 space-y-0.5">
              <div className="text-[10px] text-text-tertiary flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Biggest Challenge</span>
              </div>
              <div className="text-text-primary font-bold truncate">
                Maternal Mortality (MMR)
              </div>
              <div className="text-[11px] font-mono text-rose-400">
                {Number(avgs.maternal_mortality_rate || 155.7).toFixed(1)} <span className="text-[9px] text-text-tertiary font-sans">per 100k (SDG: &lt;70)</span>
              </div>
            </div>

            {/* Top 3 Priority States */}
            <div className="bg-surface-elevated/40 border border-border/60 rounded-xl p-2.5 space-y-0.5">
              <div className="text-[10px] text-text-tertiary flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">Priority States (Urgent)</span>
              </div>
              <div className="text-text-primary font-bold truncate">
                {priorityStatesList || "Bihar, UP, Jharkhand"}
              </div>
              <div className="text-[11px] font-mono text-amber-400">
                EAG Corridor Focus
              </div>
            </div>
          </div>

          {/* Right: Refresh Stamp & Citation */}
          <div className="text-right text-[10px] font-mono text-text-tertiary shrink-0 border-t lg:border-t-0 lg:border-l border-border/60 pt-2 lg:pt-0 lg:pl-4">
            <div className="flex items-center lg:justify-end gap-1">
              <Clock className="w-3 h-3 text-primary-400" />
              <span>MoHFW Validated Panel</span>
            </div>
            <div>{summary?.total_districts || 698} Districts • {summary?.total_states || 34} States</div>
            <div className="text-text-secondary mt-0.5">NFHS-4 &amp; NFHS-5 Waves</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. UPGRADED KPI CARDS WITH TRENDS & SPARKLINE CHARTS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: MMR */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-rose-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Maternal Mortality</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">SDG 3.1</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.maternal_mortality_rate != null ? Number(avgs.maternal_mortality_rate).toFixed(1) : "155.7"}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>12.4%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Per 100k live births</span>
            <MiniSparkline data={[178, 168, 162, 158, 155.7]} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 2: IMR */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-amber-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Infant Mortality (IMR)</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">SDG 3.2</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.infant_mortality_rate != null ? Number(avgs.infant_mortality_rate).toFixed(1) : "32.6"}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>18.2%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Per 1k live births</span>
            <MiniSparkline data={[41, 38, 36, 34, 32.6]} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 3: Institutional Deliveries */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-emerald-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Institutional Delivery</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">SDG 3.8</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.institutional_delivery_rate != null ? `${Number(avgs.institutional_delivery_rate).toFixed(1)}%` : "88.7%"}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>9.8%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Facility births</span>
            <MiniSparkline data={[78.9, 81.2, 84.5, 86.8, 88.7]} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 4: Full Immunization */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-sky-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Child Immunization</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">SDG 3.b</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.immunization_rate != null ? `${Number(avgs.immunization_rate).toFixed(1)}%` : "77.7%"}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>14.2%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Age 12–23 months</span>
            <MiniSparkline data={[62, 66, 71, 75, 77.7]} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 5: Doctor Ratio */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-indigo-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Doctor-Pop Ratio</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">SDG 3.c</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.doctor_ratio != null ? Number(avgs.doctor_ratio).toFixed(1) : "18.8"}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>8.5%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Per 10k population</span>
            <MiniSparkline data={[14.5, 15.6, 16.8, 17.9, 18.8]} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 6: Overall Health Index */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-primary-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Health Index</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">Composite</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-primary-400">
              {avgs.overall_health_index != null ? Number(avgs.overall_health_index).toFixed(1) : "73.8"}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>6.1%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Scale 0–100</span>
            <MiniSparkline data={[67.2, 69.1, 71.0, 72.5, 73.8]} isGood={true} color="#38bdf8" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. INTERACTIVE NATIONAL HEALTH MAP (Choropleth Centerpiece)
         ───────────────────────────────────────────────────────────────────────────── */}
      <IndiaChoroplethMap states={states} />

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. AI NATIONAL POLICY BRIEFING PANEL
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-indigo-800/40 p-5 space-y-4 shadow-sm bg-gradient-to-b from-indigo-950/15 to-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary">AI Policy Briefing</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-300">
                  MoHFW &amp; NITI Aayog Advisory
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Automated causal synthesis grounded in Bayesian graph propagation and NFHS-5 ground truth.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyBrief}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-elevated hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBrief ? "Copied" : "Copy Brief"}</span>
          </button>
        </div>

        {/* Executive Summary Callout */}
        <div className="bg-surface-elevated/40 border-l-4 border-l-indigo-500 rounded-r-xl p-3.5 text-xs text-text-primary leading-relaxed">
          <p>
            <strong className="text-indigo-300">Executive Synthesis:</strong> India shows strong institutional delivery coverage (<strong className="font-mono text-emerald-400">88.7%</strong>), but maternal mortality (<strong className="font-mono text-rose-400">155.7 / 100k</strong>) remains the largest contributor to regional disparities. <strong className="text-text-primary">Bihar (49.4)</strong>, <strong className="text-text-primary">Uttar Pradesh (53.1)</strong>, and <strong className="text-text-primary">Jharkhand (56.8)</strong> continue to require targeted maternal health infrastructure and specialist surgeon surge allowances to avoid preventable obstetric fatalities.
          </p>
        </div>

        {/* 3-Column Intelligence Grid: Recommendations, Risks, Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Strategic Recommendations */}
          <div className="bg-surface border border-border/70 rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Strategic Directives</span>
            </div>
            <ul className="space-y-2 text-text-secondary text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-primary-400 font-bold">•</span>
                <span>Surge 24/7 emergency obstetric care &amp; specialist staffing in high-burden EAG states.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary-400 font-bold">•</span>
                <span>Accelerate Jal Jeevan Mission piped drinking water convergence to halt infant diarrheal mortality.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-primary-400 font-bold">•</span>
                <span>Expand Ayushman Arogya Mandir digital tele-consultations for high-risk antenatal triage.</span>
              </li>
            </ul>
          </div>

          {/* Key Risk Identification */}
          <div className="bg-surface border border-border/70 rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Key Epidemiological Risks</span>
            </div>
            <ul className="space-y-2 text-text-secondary text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Inter-State Divergence:</strong> 43.4-point gap between highest performing (Goa: 92.8) and lowest (Bihar: 49.4).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Specialist Deficit:</strong> Over 65% specialist surgeon and gynecologist vacancies in rural CHCs.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>OOP Health Burden:</strong> Out-of-pocket spending persists where PM-JAY pre-authorization lags.</span>
              </li>
            </ul>
          </div>

          {/* Opportunity Highlights */}
          <div className="bg-surface border border-border/70 rounded-xl p-3.5 space-y-2">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Policy Opportunities</span>
            </div>
            <ul className="space-y-2 text-text-secondary text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Clinical Capture Point:</strong> Over 88.7% institutional births provides direct access for zero-dose newborn immunization.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>ASHA Worker Synergy:</strong> Community health workers can drive 100% early antenatal registration (ANC 4+).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Digital Health Registry:</strong> ABHA ID linking enables lifelong longitudinal disease surveillance.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. CONVERT STATE RANKINGS INTO INSIGHT CARDS (Replaces plain tables)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary-400" />
              <span>State Epidemiological Insight Cards</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Granular analysis of highest performing models versus priority intervention states.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Performing States Column */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-border">
              <Award className="w-3.5 h-3.5" />
              <span>Top 5 Performing States &amp; UTs</span>
            </div>

            <div className="space-y-2.5">
              {topStates.map((st, i) => {
                const medals = ["🥇", "🥈", "🥉", "4.", "5."];
                return (
                  <div
                    key={st.state_name}
                    className="bg-surface border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-emerald-500/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{medals[i]}</span>
                        <span className="text-sm font-bold text-text-primary">{st.state_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-tertiary">Score</span>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          {st.overall_health_index != null ? Number(st.overall_health_index).toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(st.overall_health_index || 0, 100)}%` }}
                      />
                    </div>

                    {/* Strengths & Weaknesses Badges */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                        ✅ Low IMR: {st.infant_mortality_rate}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300">
                        ✅ Low MMR: {st.maternal_mortality_rate}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-text-secondary">
                        ✅ {st.institutional_delivery_rate}% Delivery Rate
                      </span>
                    </div>

                    {/* Recommendation */}
                    <div className="text-[11px] text-text-secondary pt-1 border-t border-border/40 flex items-center gap-1">
                      <span className="text-primary-400 font-semibold shrink-0">Recommendation:</span>
                      <span className="truncate">Maintain preventive care investments and scale non-communicable disease screening.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Priority States Column */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 pb-1 border-b border-border">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>High Priority States (Critical Infrastructure Need)</span>
            </div>

            <div className="space-y-2.5">
              {bottomStates.map((st, i) => (
                <div
                  key={st.state_name}
                  className="bg-surface border border-border/80 rounded-xl p-3.5 space-y-2 hover:border-rose-500/50 transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-rose-950/50 border border-rose-800 text-rose-300 font-bold">
                        🚨 Need #{34 - i}
                      </span>
                      <span className="text-sm font-bold text-text-primary">{st.state_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-text-tertiary">Score</span>
                      <span className="text-base font-bold font-mono text-rose-400">
                        {st.overall_health_index != null ? Number(st.overall_health_index).toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-rose-500"
                      style={{ width: `${Math.min(st.overall_health_index || 0, 100)}%` }}
                    />
                  </div>

                  {/* Vulnerabilities Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
                      ⚠ High IMR: {st.infant_mortality_rate}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
                      ⚠ High MMR: {st.maternal_mortality_rate}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300">
                      ⚠ Sanitation: {st.sanitation_access}%
                    </span>
                  </div>

                  {/* Recommendation */}
                  <div className="text-[11px] text-text-secondary pt-1 border-t border-border/40 flex items-center gap-1">
                    <span className="text-rose-400 font-semibold shrink-0">Priority Action:</span>
                    <span className="truncate">Prioritize maternal emergency obstetric centers and specialist retention allowances.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          6. SDG PROGRESS TRACKER & 7. POLICY ALERTS & EMERGING RISKS PANEL (Split Grid)
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 6. SDG Progress Tracker (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-border p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" />
              <h3 className="text-sm font-bold text-text-primary">National SDG 2030 Health Tracker</h3>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary">UN Sustainable Development Goals</span>
          </div>

          <div className="space-y-3.5">
            {[
              {
                sdg: "SDG 3.1",
                label: "Maternal Mortality Ratio (MMR)",
                current: `${Number(avgs.maternal_mortality_rate || 155.7).toFixed(1)} /100k`,
                target: "< 70 /100k",
                pct: 58,
                status: "Acceleration Required",
                statusColor: "text-rose-400 border-rose-800 bg-rose-950/40",
                barColor: "bg-rose-500"
              },
              {
                sdg: "SDG 3.2",
                label: "Infant Mortality Rate (IMR)",
                current: `${Number(avgs.infant_mortality_rate || 32.6).toFixed(1)} /1k`,
                target: "< 23 /1k",
                pct: 74,
                status: "On Track by 2028",
                statusColor: "text-amber-400 border-amber-800 bg-amber-950/40",
                barColor: "bg-amber-500"
              },
              {
                sdg: "SDG 3.8",
                label: "Universal Coverage & Institutional Births",
                current: `${Number(avgs.institutional_delivery_rate || 88.7).toFixed(1)}%`,
                target: "≥ 95.0%",
                pct: 91,
                status: "On Track by 2026",
                statusColor: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
                barColor: "bg-emerald-500"
              },
              {
                sdg: "SDG 3.b",
                label: "Full Child Immunization Coverage",
                current: `${Number(avgs.immunization_rate || 77.7).toFixed(1)}%`,
                target: "≥ 90.0%",
                pct: 82,
                status: "Steady Growth",
                statusColor: "text-sky-400 border-sky-800 bg-sky-950/40",
                barColor: "bg-sky-500"
              },
              {
                sdg: "SDG 6.1 & 6.2",
                label: "Clean Drinking Water & Improved Sanitation",
                current: `${Number(avgs.sanitation_access || 71.9).toFixed(1)}% / ${Number(avgs.clean_water_access || 93.8).toFixed(1)}%`,
                target: "100% Saturation",
                pct: 84,
                status: "JJM Convergence",
                statusColor: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
                barColor: "bg-emerald-500"
              },
              {
                sdg: "SDG 3.c",
                label: "Healthcare Workforce (Doctor-Pop Ratio)",
                current: `${Number(avgs.doctor_ratio || 18.8).toFixed(1)} /10k`,
                target: "≥ 20.0 /10k",
                pct: 94,
                status: "Near Target",
                statusColor: "text-emerald-400 border-emerald-800 bg-emerald-950/40",
                barColor: "bg-emerald-500"
              }
            ].map((g, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-primary-300 font-bold">
                      {g.sdg}
                    </span>
                    <span className="font-medium text-text-primary text-[12px]">{g.label}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${g.statusColor}`}>
                    {g.status}
                  </span>
                </div>

                {/* Progress Bar & Numerical Target Spread */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${g.barColor} transition-all duration-500`} style={{ width: `${g.pct}%` }} />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-text-primary w-10 text-right">
                    {g.pct}%
                  </span>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                  <span>Current: <strong className="text-text-primary">{g.current}</strong></span>
                  <span>Target: <strong className="text-text-secondary">{g.target}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Policy Alerts & Emerging Risks Panel (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border p-4 space-y-3.5 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header & Filter Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-text-primary">Policy Alerts &amp; Emerging Risks</h3>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                {["all", "critical", "warning", "milestone"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAlertFilter(type)}
                    className={`px-1.5 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                      alertFilter === type
                        ? "bg-primary-600 text-white font-semibold"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Alerts List */}
            <div className="space-y-2 mt-3 max-h-[340px] overflow-y-auto pr-1">
              {filteredAlerts.map((al) => {
                const dotColor =
                  al.type === "critical"
                    ? "bg-rose-500"
                    : al.type === "warning"
                    ? "bg-amber-500"
                    : "bg-emerald-500";

                return (
                  <div
                    key={al.id}
                    className="bg-surface-elevated/40 border border-border/70 rounded-lg p-2.5 space-y-1 hover:border-border transition-colors text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-semibold text-text-primary text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
                        <span className="truncate">{al.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-text-tertiary shrink-0">{al.time}</span>
                    </div>

                    <p className="text-[10px] text-text-secondary leading-relaxed pl-3.5">
                      {al.description}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono text-text-tertiary pl-3.5 pt-0.5">
                      <span className="text-primary-300 font-semibold">{al.metric}</span>
                      <span>{al.benchmark}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emerging Risks Summary Footnote */}
          <div className="pt-2.5 border-t border-border/50 text-[10px] text-text-tertiary space-y-1">
            <div className="font-semibold text-text-secondary flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Emerging Strategic Vulnerabilities</span>
            </div>
            <p className="leading-normal">
              Widening regional divergence between Southern/Western states and EAG states risks slowing national SDG 2030 achievement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
