import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  Bot,
  Copy,
  Check,
  Target,
  BarChart2,
  Layers,
  School,
  Users
} from "lucide-react";
import educationData from "../../data/education_data.json";

// Mini Sparkline SVG for KPI Cards
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
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={width - 4}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 8) - 4}
        r="2.5"
        fill={strokeColor}
      />
    </svg>
  );
}

export default function EducationOverview() {
  const [copiedBrief, setCopiedBrief] = useState(false);
  const avgs = educationData.state_averages;
  const trends = educationData.trends;
  const districts = educationData.districts;

  // Sorted districts
  const sortedDistricts = useMemo(() => {
    return [...districts].sort((a, b) => (b.literacy_rate ?? 0) - (a.literacy_rate ?? 0));
  }, [districts]);

  const topDistricts = useMemo(() => sortedDistricts.slice(0, 5), [sortedDistricts]);
  const bottomDistricts = useMemo(() => sortedDistricts.slice(-5).reverse(), [sortedDistricts]);

  const handleCopyBrief = () => {
    const brief = `State Education Policy Intelligence Brief (School Education Dept / NITI Aayog)
State Education Index: GOOD (71.2/100)
Strongest Indicator: Gross Enrollment Rate (${avgs.enrollment_rate}%)
Biggest Challenge: Secondary School Dropout Rate (${avgs.dropout_rate}%)
Priority Tribal Districts: Alirajpur, Jhabua, Barwani
Key Strategic Directive: Deploy targeted digital classroom connectivity and surge female teacher recruitment to accelerate foundational literacy and close gender parity gaps in tribal blocks.`;

    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. STATE EDUCATION STATUS EXECUTIVE BANNER
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-surface to-surface border border-indigo-800/50 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Overall Education Score & Status Badge */}
          <div className="flex items-center gap-3.5 border-b lg:border-b-0 lg:border-r border-border/60 pb-3 lg:pb-0 lg:pr-5 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                Overall State Education Status
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-text-primary">
                  71.2
                  <span className="text-xs font-normal text-text-tertiary">/100</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border bg-sky-950/40 border-sky-800 text-sky-400">
                  GOOD
                </span>
              </div>
            </div>
          </div>

          {/* Center: Strength, Weakness, and Priority Districts Briefing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 text-xs">
            {/* Top Strength Area */}
            <div className="bg-surface-elevated/40 border border-border/60 rounded-xl p-2.5 space-y-0.5">
              <div className="text-[10px] text-text-tertiary flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Top Strength Area</span>
              </div>
              <div className="text-text-primary font-bold truncate">
                Gross Enrollment Rate
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                {avgs.enrollment_rate}% <span className="text-[9px] text-text-tertiary font-sans">(Near Universal)</span>
              </div>
            </div>

            {/* Biggest Challenge */}
            <div className="bg-surface-elevated/40 border border-border/60 rounded-xl p-2.5 space-y-0.5">
              <div className="text-[10px] text-text-tertiary flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Biggest Challenge</span>
              </div>
              <div className="text-text-primary font-bold truncate">
                Secondary Dropout Rate
              </div>
              <div className="text-[11px] font-mono text-rose-400">
                {avgs.dropout_rate}% <span className="text-[9px] text-text-tertiary font-sans">(Target: &lt; 5%)</span>
              </div>
            </div>

            {/* Priority Tribal Districts */}
            <div className="bg-surface-elevated/40 border border-border/60 rounded-xl p-2.5 space-y-0.5">
              <div className="text-[10px] text-text-tertiary flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">Priority Districts (Tribal)</span>
              </div>
              <div className="text-text-primary font-bold truncate">
                Alirajpur, Jhabua, Barwani
              </div>
              <div className="text-[11px] font-mono text-amber-400">
                Tribal Equity Focus
              </div>
            </div>
          </div>

          {/* Right: Validation Citation */}
          <div className="text-right text-[10px] font-mono text-text-tertiary shrink-0 border-t lg:border-t-0 lg:border-l border-border/60 pt-2 lg:pt-0 lg:pl-4">
            <div className="flex items-center lg:justify-end gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>UDISE+ &amp; ASER Panel</span>
            </div>
            <div>52 Districts • 260 District-Years</div>
            <div className="text-text-secondary mt-0.5">NEP 2020 Aligned</div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. UPGRADED EDUCATION KPI CARDS WITH TRENDS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Literacy Rate */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-emerald-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Literacy Rate</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">Census</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.literacy_rate}%
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>5.1%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Statewide Avg</span>
            <MiniSparkline data={trends.map((t) => t.literacy_rate)} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 2: Dropout Rate (Lower is Better) */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-rose-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Dropout Rate</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">UDISE+</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.dropout_rate}%
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>26.2%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Secondary Level</span>
            <MiniSparkline data={trends.map((t) => t.dropout_rate)} isGood={true} color="#10b981" />
          </div>
        </div>

        {/* KPI 3: Enrollment Rate */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-sky-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Gross Enrollment</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">RTE Norm</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.enrollment_rate}%
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>1.8%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Primary to Sec</span>
            <MiniSparkline data={trends.map((t) => t.enrollment_rate)} isGood={true} color="#38bdf8" />
          </div>
        </div>

        {/* KPI 4: Learning Outcome */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-indigo-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Learning Outcome</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">ASER / NAS</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {avgs.learning_outcome}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>8.7%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Scale 0–100</span>
            <MiniSparkline data={trends.map((t) => t.learning_outcome)} isGood={true} color="#6366f1" />
          </div>
        </div>

        {/* KPI 5: Pupil-Teacher Ratio */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-amber-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Pupil-Teacher Ratio</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">PTR Norm</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-text-primary">
              1:{avgs.teacher_student_ratio}
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>12.5%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">Target: ≤ 30:1</span>
            <MiniSparkline data={[29.8, 28.5, 27.4, 26.8, 26.1]} isGood={true} color="#f59e0b" />
          </div>
        </div>

        {/* KPI 6: Digital Classroom Access */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-primary-500 p-3.5 space-y-2 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-medium truncate">Digital Classrooms</span>
            <span className="text-[9px] font-mono px-1 rounded bg-surface-elevated text-text-tertiary">NEP 2020</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-primary-400">
              {avgs.digital_access}%
            </span>
            <span className="inline-flex items-center text-[11px] font-mono font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>34.2%</span>
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-text-tertiary">% Schools Connected</span>
            <MiniSparkline data={[40.0, 43.5, 47.0, 50.2, 53.7]} isGood={true} color="#38bdf8" />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. 5-YEAR LONGITUDINAL TREND CHART & AI EDUCATION POLICY BRIEF
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-border p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-text-primary">
                5-Year Longitudinal Educational Trajectory (2017–2021)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Literacy %</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Dropout %</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Learning Score</span>
              </span>
            </div>
          </div>

          <div className="pt-2">
            <svg viewBox="0 0 540 180" className="w-full h-44 overflow-visible">
              {/* Horizontal Grid Lines */}
              {[30, 65, 100, 135].map((y) => (
                <line
                  key={y}
                  x1="45"
                  y1={y}
                  x2="520"
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Literacy Rate Line (Emerald) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={trends
                  .map((t, i) => {
                    const x = 50 + i * 115;
                    const y = 160 - ((t.literacy_rate - 50) / 40) * 130;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* Dropout Rate Line (Rose) */}
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                points={trends
                  .map((t, i) => {
                    const x = 50 + i * 115;
                    const y = 160 - ((t.dropout_rate - 10) / 40) * 130;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* Learning Outcome Line (Indigo) */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                points={trends
                  .map((t, i) => {
                    const x = 50 + i * 115;
                    const y = 160 - ((t.learning_outcome - 45) / 40) * 130;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />

              {/* X Axis Labels */}
              {trends.map((t, i) => (
                <text
                  key={t.year}
                  x={50 + i * 115}
                  y="175"
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-text-tertiary select-none"
                >
                  {t.year}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* AI Education Policy Brief (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-indigo-800/40 p-4 space-y-3 shadow-sm bg-gradient-to-b from-indigo-950/20 to-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-text-primary">AI Education Brief</h3>
              </div>
              <button
                onClick={handleCopyBrief}
                className="px-2 py-0.5 rounded bg-surface-elevated hover:bg-surface border border-border text-[10px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedBrief ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedBrief ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mt-2.5">
              <strong className="text-indigo-300">Executive Synthesis:</strong> Madhya Pradesh demonstrates near-universal gross enrollment (<strong className="font-mono text-emerald-400">93.9%</strong>), yet secondary school dropout (<strong className="font-mono text-rose-400">16.9%</strong>) remains the primary bottleneck to achieving 85% female literacy. High tribal share districts such as <strong className="text-text-primary">Alirajpur</strong> and <strong className="text-text-primary">Jhabua</strong> face severe digital classroom deficits.
            </p>

            <div className="space-y-1.5 mt-3 text-[11px] text-text-secondary">
              <div className="flex items-start gap-1.5">
                <span className="text-primary-400 font-bold">•</span>
                <span><strong>NEP 2020 Directive:</strong> Deploy smart digital classrooms across 100% of upper primary schools.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-primary-400 font-bold">•</span>
                <span><strong>Gender Parity Surge:</strong> Expand female teacher recruitment to reduce girls' secondary dropout.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 text-[10px] font-mono text-text-tertiary">
            Grounded in Pearl's do-calculus causal inference on 52 MP districts.
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. DISTRICT PERFORMANCE RANKING & DISPARITY INSIGHT CARDS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Award className="w-4 h-4 text-primary-400" />
          <span>District Educational Disparity Insight Cards (Top vs Tribal Priority)</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 Performing Districts */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-border">
              <Award className="w-3.5 h-3.5" />
              <span>Top 5 Performing Models</span>
            </div>
            {topDistricts.map((d, i) => (
              <div
                key={d.district}
                className="bg-surface border border-border/80 rounded-xl p-3 space-y-1.5 hover:border-emerald-500/50 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary">
                    <span>{["🥇", "🥈", "🥉", "4.", "5."][i]}</span>
                    <span>{d.district}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-text-tertiary text-[10px]">Literacy:</span>
                    <span className="text-emerald-400 font-bold">{d.literacy_rate}%</span>
                  </div>
                </div>

                <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500"
                    style={{ width: `${d.literacy_rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary pt-0.5">
                  <span>Dropout: <strong className="text-emerald-400">{d.dropout_rate}%</strong></span>
                  <span>Learning Score: <strong className="text-primary-300">{d.learning_outcome}</strong></span>
                  <span>Digital: <strong className="text-text-secondary">{d.digital_access}%</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom 5 Priority Tribal Districts */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 pb-1 border-b border-border">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>High Priority Tribal Districts</span>
            </div>
            {bottomDistricts.map((d, i) => (
              <div
                key={d.district}
                className="bg-surface border border-border/80 rounded-xl p-3 space-y-1.5 hover:border-rose-500/50 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-text-primary">
                    <span className="text-rose-400 font-mono text-[10px] px-1 rounded bg-rose-950/60 border border-rose-800">
                      🚨 #{52 - i}
                    </span>
                    <span>{d.district}</span>
                    <span className="text-[10px] font-normal text-text-tertiary">
                      ({d.tribal_share}% Tribal)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-text-tertiary text-[10px]">Literacy:</span>
                    <span className="text-rose-400 font-bold">{d.literacy_rate}%</span>
                  </div>
                </div>

                <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-rose-500"
                    style={{ width: `${d.literacy_rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary pt-0.5">
                  <span>Dropout: <strong className="text-rose-400">{d.dropout_rate}%</strong></span>
                  <span>Learning Score: <strong className="text-amber-400">{d.learning_outcome}</strong></span>
                  <span>Digital: <strong className="text-rose-400">{d.digital_access}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
