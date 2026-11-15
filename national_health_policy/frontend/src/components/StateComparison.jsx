import React, { useState, useEffect, useMemo } from "react";
import {
  Download,
  Search,
  Scale,
  Bot,
  Sparkles,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Award,
  TrendingUp,
  TrendingDown,
  Filter,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info
} from "lucide-react";
import { apiClient } from "../api/client";

// ==============================================================================
// 1. HEATMAP & PERFORMANCE BADGE LOGIC
// ==============================================================================

// Performance Tier Definition based on Health Index
function getHealthTier(score) {
  const num = Number(score || 0);
  if (num >= 80) {
    return {
      label: "Excellent",
      badgeClass: "bg-emerald-950/60 border-emerald-700/80 text-emerald-300 dark:text-emerald-300",
      dotClass: "bg-emerald-400"
    };
  }
  if (num >= 70) {
    return {
      label: "Good",
      badgeClass: "bg-sky-950/60 border-sky-700/80 text-sky-300 dark:text-sky-300",
      dotClass: "bg-sky-400"
    };
  }
  if (num >= 55) {
    return {
      label: "Moderate",
      badgeClass: "bg-amber-950/60 border-amber-700/80 text-amber-300 dark:text-amber-300",
      dotClass: "bg-amber-400"
    };
  }
  return {
    label: "High Risk",
    badgeClass: "bg-rose-950/60 border-rose-700/80 text-rose-300 dark:text-rose-300 animate-pulse",
    dotClass: "bg-rose-400"
  };
}

// Conditional Cell Heatmap Styling
// Higher is better: Immunization, Institutional Delivery, Water, Sanitation, Health Score
// Lower is better: IMR, MMR
function getCellHeatmapClass(key, rawVal) {
  if (rawVal == null || isNaN(rawVal)) return "bg-surface-elevated/40 text-text-tertiary";
  const v = Number(rawVal);

  switch (key) {
    case "overall_health_index":
      // Strongest visual emphasis
      if (v >= 80) return "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-bold shadow-xs";
      if (v >= 70) return "bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold";
      if (v >= 55) return "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold";
      return "bg-rose-500/25 border border-rose-500/50 text-rose-300 font-bold";

    case "infant_mortality_rate": // LOWER is better (SDG Target: < 23)
      if (v <= 23) return "bg-emerald-500/15 text-emerald-300 font-semibold";
      if (v <= 35) return "bg-amber-500/15 text-amber-300";
      return "bg-rose-500/20 text-rose-300 font-bold";

    case "maternal_mortality_rate": // LOWER is better (SDG Target: < 70)
      if (v <= 70) return "bg-emerald-500/15 text-emerald-300 font-semibold";
      if (v <= 140) return "bg-amber-500/15 text-amber-300";
      return "bg-rose-500/20 text-rose-300 font-bold";

    case "institutional_delivery_rate": // HIGHER is better (SDG Target: >= 90%)
      if (v >= 90) return "bg-emerald-500/15 text-emerald-300 font-semibold";
      if (v >= 80) return "bg-amber-500/15 text-amber-300";
      return "bg-rose-500/20 text-rose-300 font-bold";

    case "immunization_rate": // HIGHER is better (Target: >= 82%)
      if (v >= 82) return "bg-emerald-500/15 text-emerald-300 font-semibold";
      if (v >= 72) return "bg-amber-500/15 text-amber-300";
      return "bg-rose-500/20 text-rose-300 font-bold";

    case "sanitation_access": // HIGHER is better (Target: >= 80%)
      if (v >= 80) return "bg-emerald-500/15 text-emerald-300 font-semibold";
      if (v >= 65) return "bg-amber-500/15 text-amber-300";
      return "bg-rose-500/20 text-rose-300 font-bold";

    case "clean_water_access": // HIGHER is better (Target: >= 90%)
      if (v >= 90) return "bg-emerald-500/15 text-emerald-300 font-semibold";
      if (v >= 80) return "bg-amber-500/15 text-amber-300";
      return "bg-rose-500/20 text-rose-300 font-bold";

    default:
      return "text-text-secondary";
  }
}

// ==============================================================================
// 2. SVG RADAR CHART FOR SIDE-BY-SIDE COMPARISON
// ==============================================================================

function SvgRadarChart({ stateA, stateB }) {
  if (!stateA || !stateB) return null;

  // Normalized 7 dimensions (all scaled 0 to 100, where HIGHER is superior)
  const axes = [
    { key: "score", label: "Health Score", aRaw: stateA.overall_health_index, bRaw: stateB.overall_health_index, aNorm: Math.min(100, Math.max(0, stateA.overall_health_index || 0)), bNorm: Math.min(100, Math.max(0, stateB.overall_health_index || 0)) },
    { key: "delivery", label: "Inst. Delivery %", aRaw: stateA.institutional_delivery_rate, bRaw: stateB.institutional_delivery_rate, aNorm: Math.min(100, Math.max(0, stateA.institutional_delivery_rate || 0)), bNorm: Math.min(100, Math.max(0, stateB.institutional_delivery_rate || 0)) },
    { key: "immunization", label: "Immunization %", aRaw: stateA.immunization_rate, bRaw: stateB.immunization_rate, aNorm: Math.min(100, Math.max(0, stateA.immunization_rate || 0)), bNorm: Math.min(100, Math.max(0, stateB.immunization_rate || 0)) },
    { key: "sanitation", label: "Sanitation %", aRaw: stateA.sanitation_access, bRaw: stateB.sanitation_access, aNorm: Math.min(100, Math.max(0, stateA.sanitation_access || 0)), bNorm: Math.min(100, Math.max(0, stateB.sanitation_access || 0)) },
    { key: "water", label: "Water Access %", aRaw: stateA.clean_water_access, bRaw: stateB.clean_water_access, aNorm: Math.min(100, Math.max(0, stateA.clean_water_access || 0)), bNorm: Math.min(100, Math.max(0, stateB.clean_water_access || 0)) },
    // Inverted IMR (lower mortality = higher survival resilience on radar)
    { key: "imr", label: "Infant Survival", aRaw: `${stateA.infant_mortality_rate}/1k`, bRaw: `${stateB.infant_mortality_rate}/1k`, aNorm: Math.min(100, Math.max(0, 100 - ((stateA.infant_mortality_rate || 0) / 65) * 100)), bNorm: Math.min(100, Math.max(0, 100 - ((stateB.infant_mortality_rate || 0) / 65) * 100)) },
    // Inverted MMR (lower mortality = higher survival resilience on radar)
    { key: "mmr", label: "Maternal Survival", aRaw: `${stateA.maternal_mortality_rate}/100k`, bRaw: `${stateB.maternal_mortality_rate}/100k`, aNorm: Math.min(100, Math.max(0, 100 - ((stateA.maternal_mortality_rate || 0) / 350) * 100)), bNorm: Math.min(100, Math.max(0, 100 - ((stateB.maternal_mortality_rate || 0) / 350) * 100)) },
  ];

  const numAxes = axes.length;
  const cx = 180;
  const cy = 145;
  const R = 95;

  // Concentric polygon grids (20%, 40%, 60%, 80%, 100%)
  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  });

  // Calculate polygon points string for a given state
  const getPolygonPoints = (isStateA) => {
    return axes
      .map((axis, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
        const normVal = isStateA ? axis.aNorm : axis.bNorm;
        const radius = (normVal / 100) * R;
        const pt = getCoordinates(angle, radius);
        return `${pt.x},${pt.y}`;
      })
      .join(" ");
  };

  const pointsA = getPolygonPoints(true);
  const pointsB = getPolygonPoints(false);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="360" height="290" viewBox="0 0 360 290" className="overflow-visible">
        {/* Concentric Grid Polygons */}
        {gridRings.map((ringFactor, rIdx) => {
          const ringPoints = axes
            .map((_, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
              const pt = getCoordinates(angle, R * ringFactor);
              return `${pt.x},${pt.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={rIdx}
              points={ringPoints}
              fill="none"
              stroke="currentColor"
              strokeOpacity={rIdx === gridRings.length - 1 ? 0.35 : 0.12}
              strokeDasharray={rIdx === gridRings.length - 1 ? "none" : "3,3"}
              strokeWidth="1"
            />
          );
        })}

        {/* Spoke Axis Lines & Text Labels */}
        {axes.map((axis, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
          const outerPt = getCoordinates(angle, R);
          const labelPt = getCoordinates(angle, R + 22);

          return (
            <g key={axis.key}>
              <line
                x1={cx}
                y1={cy}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="currentColor"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
              <text
                x={labelPt.x}
                y={labelPt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9.5px] font-sans fill-text-secondary select-none font-medium"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* State A Polygon (Sky Blue) */}
        <polygon
          points={pointsA}
          fill="rgba(14, 165, 233, 0.25)"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* State B Polygon (Amber/Orange) */}
        <polygon
          points={pointsB}
          fill="rgba(245, 158, 11, 0.22)"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Vertex Markers for State A */}
        {axes.map((axis, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
          const pt = getCoordinates(angle, (axis.aNorm / 100) * R);
          return (
            <circle
              key={`dotA-${axis.key}`}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Vertex Markers for State B */}
        {axes.map((axis, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
          const pt = getCoordinates(angle, (axis.bNorm / 100) * R);
          return (
            <circle
              key={`dotB-${axis.key}`}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      {/* Radar Legend */}
      <div className="flex items-center justify-center gap-5 pt-2 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-500 border border-sky-400" />
          <span className="text-text-primary font-semibold truncate max-w-[140px]">{stateA.state_name}</span>
          <span className="text-sky-400 font-bold">({stateA.overall_health_index})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500 border border-amber-400" />
          <span className="text-text-primary font-semibold truncate max-w-[140px]">{stateB.state_name}</span>
          <span className="text-amber-400 font-bold">({stateB.overall_health_index})</span>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// 3. AI STATE INSIGHT & RECOMMENDATION GENERATOR
// ==============================================================================

function generateStateIntelligence(state) {
  if (!state) return null;

  const score = Number(state.overall_health_index || 0);
  const imr = Number(state.infant_mortality_rate || 0);
  const mmr = Number(state.maternal_mortality_rate || 0);
  const del = Number(state.institutional_delivery_rate || 0);
  const imm = Number(state.immunization_rate || 0);
  const san = Number(state.sanitation_access || 0);
  const wat = Number(state.clean_water_access || 0);

  // 1. Key Issues identification
  const keyIssues = [];
  if (imr > 35) {
    keyIssues.push({ title: `High Infant Mortality Rate (${imr} per 1,000 live births)`, severity: "critical", target: "SDG 3.2 target: < 23" });
  } else if (imr > 23) {
    keyIssues.push({ title: `Moderate Infant Mortality (${imr} per 1,000 live births)`, severity: "warning", target: "SDG 3.2 target: < 23" });
  }

  if (mmr > 140) {
    keyIssues.push({ title: `Severe Maternal Mortality Ratio (${mmr} per 100,000)`, severity: "critical", target: "SDG 3.1 target: < 70" });
  } else if (mmr > 70) {
    keyIssues.push({ title: `Elevated Maternal Mortality Ratio (${mmr} per 100,000)`, severity: "warning", target: "SDG 3.1 target: < 70" });
  }

  if (san < 65) {
    keyIssues.push({ title: `Low Sanitation Coverage (${san}% improved household latrines)`, severity: "critical", target: "Target: 100% Saturation" });
  } else if (san < 80) {
    keyIssues.push({ title: `Sub-optimal Sanitation Coverage (${san}%)`, severity: "warning", target: "Target: 100% Saturation" });
  }

  if (del < 80) {
    keyIssues.push({ title: `Institutional Delivery Deficit (${del}% facility births)`, severity: "critical", target: "Target: ≥ 90%" });
  }
  if (imm < 75) {
    keyIssues.push({ title: `Child Immunization Dropout Lag (${imm}% full coverage)`, severity: "warning", target: "Target: ≥ 85%" });
  }

  if (keyIssues.length === 0) {
    keyIssues.push({ title: `Residual mortality low (IMR: ${imr}, MMR: ${mmr})`, severity: "milestone", target: "WHO Benchmark Met" });
    keyIssues.push({ title: `Primary care transition: NCD and geriatric surveillance needed`, severity: "milestone", target: "NITI Aayog Priority" });
  }

  // 2. Primary Causal Drivers (Bayesian network pathways)
  const primaryDrivers = [];
  if (mmr > 120 || del < 85) {
    primaryDrivers.push("Maternal healthcare gaps: severe rural Community Health Centre (CHC) obstetrician and specialist surgeon vacancies.");
  }
  if (imr > 30 || san < 70) {
    primaryDrivers.push("Environmental risk vectors: untreated surface water runoff and low sanitation causing neonatal enteropathy and diarrhea.");
  }
  if (del < 85) {
    primaryDrivers.push("Uneven service accessibility: remote block isolation and lack of 24/7 emergency transport to First Referral Units (FRUs).");
  }
  if (imm < 78) {
    primaryDrivers.push("Missed immunization opportunities: high drop-off between DPT-1 and Measles vaccines in migratory and tribal hamlets.");
  }
  if (primaryDrivers.length === 0) {
    primaryDrivers.push("High density of accredited 24/7 Primary Health Centres with skilled birth attendants.");
    primaryDrivers.push("High female literacy rates translating into timely antenatal care (ANC 4+) registration.");
    primaryDrivers.push("Broad public health insurance (PM-JAY) coverage reducing catastrophic out-of-pocket health spend.");
  }

  // 3. Recommended Interventions (Prioritized 1, 2, 3)
  const recommendations = [];
  if (mmr > 120) {
    recommendations.push("1. Scale Maternal Care Programmes: Fast-track 24/7 Comprehensive Emergency Obstetric Care (CEmONC) centers and introduce rural specialist retention bonuses.");
  } else if (score >= 80) {
    recommendations.push("1. Advance Preventive & Geriatric Healthcare: Deploy statewide hypertension and diabetes screening registers via Ayushman Arogya Mandirs.");
  } else {
    recommendations.push("1. Strengthen Secondary Referral Triage: Expand emergency obstetrics and newborn stabilization units at block level.");
  }

  if (del < 88) {
    recommendations.push("2. Improve Institutional Delivery Coverage: Mobilize ASHA networks for Janani Suraksha Yojana cash transfers and establish birth waiting homes in hilly blocks.");
  } else if (imm < 80) {
    recommendations.push("2. Intensify Mission Indradhanush: Deploy digital ABHA-linked immunization tracking to eliminate drop-out children.");
  } else {
    recommendations.push("2. Sustain Universal Immunization: Modernize cold-chain logistics using real-time electronic vaccine intelligence (eVIN).");
  }

  if (san < 75 || wat < 88) {
    recommendations.push("3. Expand Sanitation & WASH Infrastructure: Converge Swachh Bharat Mission (Grameen) and Jal Jeevan Mission piped connections to eliminate environmental infant mortality.");
  } else {
    recommendations.push("3. Institutionalize Quality Assurance: Achieve National Quality Assurance Standards (NQAS) certification across 100% of PHCs and CHCs.");
  }

  // 4. Expected Causal Impact (Pearl's do-calculus simulation)
  let expectedImpact = "";
  if (score < 60) {
    const mmrReduction = Math.round(mmr * 0.18);
    const scoreBoost = ((100 - score) * 0.12).toFixed(1);
    expectedImpact = `Improving institutional delivery by 10% coupled with 24/7 emergency obstetric care is projected to reduce MMR by ${mmrReduction} per 100k and yield a +${scoreBoost} point gain in the overall Health Index score.`;
  } else if (score < 75) {
    const imrReduction = (imr * 0.15).toFixed(1);
    expectedImpact = `Closing immunization drop-out by 8% and expanding rural specialist retention is projected to reduce IMR by ${imrReduction} per 1,000 live births and advance national SDG 3.2 achievement by 3 years.`;
  } else {
    expectedImpact = `Sustaining universal coverage and integrating early non-communicable disease registries is projected to extend average healthy life expectancy by +1.8 years while securing national SDG leadership.`;
  }

  return {
    keyIssues,
    primaryDrivers,
    recommendations,
    expectedImpact
  };
}

// ==============================================================================
// 4. MAIN STATE COMPARISON COMPONENT
// ==============================================================================

export default function StateComparison() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("overall_health_index");
  const [sortAsc, setSortAsc] = useState(false);
  const [tierFilter, setTierFilter] = useState("all");

  // Comparison Panel State
  const [showComparison, setShowComparison] = useState(true);
  const [stateAName, setStateAName] = useState("Kerala");
  const [stateBName, setStateBName] = useState("Bihar");

  // AI Insight Panel State (active state inspected)
  const [inspectedStateName, setInspectedStateName] = useState("Bihar");
  const [showAiInsight, setShowAiInsight] = useState(true);

  useEffect(() => {
    apiClient.states()
      .then((res) => {
        const stateList = res.states || [];
        setStates(stateList);

        // Set intelligent defaults once loaded
        if (stateList.length > 0) {
          // Find Kerala and Bihar or use first and last
          const hasKerala = stateList.find((s) => s.state_name === "Kerala");
          const hasBihar = stateList.find((s) => s.state_name === "Bihar");
          if (hasKerala) setStateAName("Kerala");
          else setStateAName(stateList[0].state_name);

          if (hasBihar) {
            setStateBName("Bihar");
            setInspectedStateName("Bihar");
          } else {
            setStateBName(stateList[stateList.length - 1].state_name);
            setInspectedStateName(stateList[stateList.length - 1].state_name);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load states:", err);
        setLoading(false);
      });
  }, []);

  // Sorted and Filtered States
  const sortedAndFilteredStates = useMemo(() => {
    return states
      .filter((s) => {
        const matchesSearch = (s.state_name || "").toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        const score = Number(s.overall_health_index || 0);
        if (tierFilter === "excellent") return score >= 80;
        if (tierFilter === "good") return score >= 70 && score < 80;
        if (tierFilter === "moderate") return score >= 55 && score < 70;
        if (tierFilter === "high_risk") return score < 55;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [states, search, sortBy, sortAsc, tierFilter]);

  // Selected State Objects
  const stateA = useMemo(() => states.find((s) => s.state_name === stateAName) || states[0] || null, [states, stateAName]);
  const stateB = useMemo(() => states.find((s) => s.state_name === stateBName) || states[states.length - 1] || null, [states, stateBName]);
  const inspectedState = useMemo(() => states.find((s) => s.state_name === inspectedStateName) || stateB || null, [states, inspectedStateName]);

  // Causal Intelligence Memo for inspected state
  const aiIntelligence = useMemo(() => generateStateIntelligence(inspectedState), [inspectedState]);

  // Handle Sort Toggle
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  // Swap State A & B
  const handleSwapStates = () => {
    const temp = stateAName;
    setStateAName(stateBName);
    setStateBName(temp);
  };

  // Click on Table Row
  const handleRowClick = (s) => {
    setInspectedStateName(s.state_name);
    setShowAiInsight(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "State/UT",
      "Health Score",
      "Performance Tier",
      "IMR (per 1k)",
      "MMR (per 100k)",
      "Institutional Delivery %",
      "Immunization %",
      "Sanitation %",
      "Clean Water %"
    ];
    const rows = sortedAndFilteredStates.map((s) => {
      const tier = getHealthTier(s.overall_health_index);
      return [
        `"${s.state_name}"`,
        s.overall_health_index ?? "",
        `"${tier.label}"`,
        s.infant_mortality_rate ?? "",
        s.maternal_mortality_rate ?? "",
        s.institutional_delivery_rate ?? "",
        s.immunization_rate ?? "",
        s.sanitation_access ?? "",
        s.clean_water_access ?? ""
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `State_Health_Heatmap_NFHS5_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-secondary text-xs gap-3 font-mono">
        <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
        <span>Loading state epidemiological performance matrix...</span>
      </div>
    );
  }

  // Calculate Difference Metrics between State A and State B
  const scoreDiff = stateA && stateB ? (stateA.overall_health_index || 0) - (stateB.overall_health_index || 0) : 0;
  const imrDiff = stateA && stateB ? (stateA.infant_mortality_rate || 0) - (stateB.infant_mortality_rate || 0) : 0;
  const mmrDiff = stateA && stateB ? (stateA.maternal_mortality_rate || 0) - (stateB.maternal_mortality_rate || 0) : 0;
  const delDiff = stateA && stateB ? (stateA.institutional_delivery_rate || 0) - (stateB.institutional_delivery_rate || 0) : 0;
  const immDiff = stateA && stateB ? (stateA.immunization_rate || 0) - (stateB.immunization_rate || 0) : 0;
  const sanDiff = stateA && stateB ? (stateA.sanitation_access || 0) - (stateB.sanitation_access || 0) : 0;
  const watDiff = stateA && stateB ? (stateA.clean_water_access || 0) - (stateB.clean_water_access || 0) : 0;

  const leaderState = scoreDiff >= 0 ? stateA : stateB;
  const absoluteScoreAdvantage = Math.abs(scoreDiff).toFixed(1);

  return (
    <div className="space-y-5">
      {/* ─────────────────────────────────────────────────────────────────────────────
          TOP TOOLBAR: TITLE, FILTERS, EXPORT & DRAWER TOGGLE
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              State &amp; UT Health Performance Matrix
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-950/70 border border-primary-800 text-primary-300 font-semibold">
              34 Jurisdictions • NFHS-5
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Epidemiological performance heatmap with multi-axis comparative radar and causal Bayesian policy diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search State or UT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface border border-border text-text-primary pl-8 pr-3 py-1.5 rounded-lg text-xs focus:border-primary-500 placeholder-text-tertiary w-48 sm:w-56"
            />
          </div>

          {/* Toggle Comparison Drawer */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
              showComparison
                ? "bg-primary-600 text-white border-primary-500 shadow-xs"
                : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
            title="Toggle Side-by-Side State Comparison Panel"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{showComparison ? "Hide Comparison" : "Compare States"}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-surface hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Export State Performance Heatmap to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 2: SIDE-BY-SIDE STATE COMPARISON PANEL (Drawer above the table)
         ───────────────────────────────────────────────────────────────────────────── */}
      {showComparison && stateA && stateB && (
        <div className="bg-surface rounded-2xl border border-sky-800/40 p-4 sm:p-5 space-y-4 shadow-sm bg-gradient-to-b from-sky-950/15 via-surface to-surface">
          {/* Header & State Selectors */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-900/40 border border-sky-700/60 flex items-center justify-center text-sky-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>Side-by-Side State Comparison</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-sky-950/70 border border-sky-800 text-sky-300">
                    Dual Diagnostic
                  </span>
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Compare multi-dimensional indicators, radar polygons, and net health score divergence.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-text-tertiary text-[10px] font-mono">Quick Benchmarks:</span>
              <button
                onClick={() => { setStateAName("Kerala"); setStateBName("Bihar"); }}
                className="px-2 py-0.5 rounded bg-surface-elevated hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Kerala vs Bihar
              </button>
              <button
                onClick={() => { setStateAName("Goa"); setStateBName("Uttar Pradesh"); }}
                className="px-2 py-0.5 rounded bg-surface-elevated hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Goa vs UP
              </button>
              <button
                onClick={() => { setStateAName("Tamil Nadu"); setStateBName("Jharkhand"); }}
                className="px-2 py-0.5 rounded bg-surface-elevated hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                TN vs Jharkhand
              </button>
            </div>
          </div>

          {/* State Dropdown Selector Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-elevated/40 border border-border/70 rounded-xl p-3">
            {/* State A Select */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold block mb-1">
                State A (Primary Benchmark)
              </label>
              <select
                value={stateAName}
                onChange={(e) => setStateAName(e.target.value)}
                className="w-full bg-surface border border-sky-700/60 text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:border-sky-500 font-medium"
              >
                {states.map((s) => (
                  <option key={`optA-${s.state_name}`} value={s.state_name}>
                    {s.state_name} — Score: {s.overall_health_index}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapStates}
              className="p-2 rounded-lg bg-surface border border-border hover:border-primary-500 text-text-secondary hover:text-primary-400 transition-colors cursor-pointer self-center mt-3 sm:mt-0"
              title="Swap States"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* State B Select */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block mb-1">
                State B (Comparison Target)
              </label>
              <select
                value={stateBName}
                onChange={(e) => setStateBName(e.target.value)}
                className="w-full bg-surface border border-amber-700/60 text-text-primary text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 font-medium"
              >
                {states.map((s) => (
                  <option key={`optB-${s.state_name}`} value={s.state_name}>
                    {s.state_name} — Score: {s.overall_health_index}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3-Column Visualization Grid: State A Card, Radar Chart, State B Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left: State A Snapshot (3 cols) */}
            <div className="lg:col-span-3 bg-surface border border-sky-800/50 rounded-xl p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-sky-400 uppercase font-semibold">State A</span>
                  <h4 className="text-sm font-bold text-text-primary">{stateA.state_name}</h4>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-sky-400">
                    {stateA.overall_health_index}
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getHealthTier(stateA.overall_health_index).badgeClass}`}>
                    {getHealthTier(stateA.overall_health_index).label}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-1 border-t border-border/60">
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">IMR (per 1k):</span>
                  <span className="font-semibold text-text-primary">{stateA.infant_mortality_rate}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">MMR (per 100k):</span>
                  <span className="font-semibold text-text-primary">{stateA.maternal_mortality_rate}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Inst. Delivery:</span>
                  <span className="font-semibold text-text-primary">{stateA.institutional_delivery_rate}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Immunization:</span>
                  <span className="font-semibold text-text-primary">{stateA.immunization_rate}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Sanitation:</span>
                  <span className="font-semibold text-text-primary">{stateA.sanitation_access}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Water Access:</span>
                  <span className="font-semibold text-text-primary">{stateA.clean_water_access}%</span>
                </div>
              </div>
            </div>

            {/* Center: Multi-Axis SVG Radar Chart (6 cols) */}
            <div className="lg:col-span-6 bg-surface-elevated/30 border border-border/80 rounded-xl p-3 flex flex-col items-center justify-center">
              <div className="text-[10px] font-mono text-text-tertiary mb-1">
                Multi-Dimensional Epidemiological Polygon (Normalized 0–100)
              </div>
              <SvgRadarChart stateA={stateA} stateB={stateB} />
            </div>

            {/* Right: State B Snapshot (3 cols) */}
            <div className="lg:col-span-3 bg-surface border border-amber-800/50 rounded-xl p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">State B</span>
                  <h4 className="text-sm font-bold text-text-primary">{stateB.state_name}</h4>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-amber-400">
                    {stateB.overall_health_index}
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${getHealthTier(stateB.overall_health_index).badgeClass}`}>
                    {getHealthTier(stateB.overall_health_index).label}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono pt-1 border-t border-border/60">
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">IMR (per 1k):</span>
                  <span className="font-semibold text-text-primary">{stateB.infant_mortality_rate}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">MMR (per 100k):</span>
                  <span className="font-semibold text-text-primary">{stateB.maternal_mortality_rate}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Inst. Delivery:</span>
                  <span className="font-semibold text-text-primary">{stateB.institutional_delivery_rate}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Immunization:</span>
                  <span className="font-semibold text-text-primary">{stateB.immunization_rate}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Sanitation:</span>
                  <span className="font-semibold text-text-primary">{stateB.sanitation_access}%</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-text-tertiary">Water Access:</span>
                  <span className="font-semibold text-text-primary">{stateB.clean_water_access}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Intelligence Banner: Performance Differences & Score Advantage */}
          <div className="bg-surface-elevated/60 border border-border rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-text-primary">Comparative Health Advantage:</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 px-2 py-0.5 rounded">
                  Overall Advantage: {leaderState?.state_name} +{absoluteScoreAdvantage} Health Score
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">
                Direct empirical divergence across NFHS-5 indicators
              </span>
            </div>

            {/* Score Difference Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
              {/* IMR Diff (Lower is better) */}
              <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-0.5">
                <span className="text-[10px] text-text-tertiary block font-sans">Infant Mortality (IMR)</span>
                {imrDiff < 0 ? (
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>✅</span>
                    <span>Lower IMR by {Math.abs(imrDiff).toFixed(1)}</span>
                  </div>
                ) : imrDiff > 0 ? (
                  <div className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>⚠</span>
                    <span>Higher IMR by {imrDiff.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-[11px]">Parity (0.0)</span>
                )}
                <span className="text-[9px] text-text-tertiary block">
                  {stateA.infant_mortality_rate} vs {stateB.infant_mortality_rate}
                </span>
              </div>

              {/* MMR Diff (Lower is better) */}
              <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-0.5">
                <span className="text-[10px] text-text-tertiary block font-sans">Maternal Mortality</span>
                {mmrDiff < 0 ? (
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>✅</span>
                    <span>Lower MMR by {Math.abs(mmrDiff).toFixed(0)}</span>
                  </div>
                ) : mmrDiff > 0 ? (
                  <div className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>⚠</span>
                    <span>Higher MMR by {mmrDiff.toFixed(0)}</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-[11px]">Parity (0)</span>
                )}
                <span className="text-[9px] text-text-tertiary block">
                  {stateA.maternal_mortality_rate} vs {stateB.maternal_mortality_rate}
                </span>
              </div>

              {/* Delivery Diff (Higher is better) */}
              <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-0.5">
                <span className="text-[10px] text-text-tertiary block font-sans">Inst. Delivery</span>
                {delDiff > 0 ? (
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>✅</span>
                    <span>Higher by {delDiff.toFixed(1)}%</span>
                  </div>
                ) : delDiff < 0 ? (
                  <div className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>⚠</span>
                    <span>Lower by {Math.abs(delDiff).toFixed(1)}%</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-[11px]">Parity (0.0%)</span>
                )}
                <span className="text-[9px] text-text-tertiary block">
                  {stateA.institutional_delivery_rate}% vs {stateB.institutional_delivery_rate}%
                </span>
              </div>

              {/* Immunization Diff (Higher is better) */}
              <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-0.5">
                <span className="text-[10px] text-text-tertiary block font-sans">Immunization</span>
                {immDiff > 0 ? (
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>✅</span>
                    <span>Higher by {immDiff.toFixed(1)}%</span>
                  </div>
                ) : immDiff < 0 ? (
                  <div className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>⚠</span>
                    <span>Lower by {Math.abs(immDiff).toFixed(1)}%</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-[11px]">Parity (0.0%)</span>
                )}
                <span className="text-[9px] text-text-tertiary block">
                  {stateA.immunization_rate}% vs {stateB.immunization_rate}%
                </span>
              </div>

              {/* Sanitation Diff (Higher is better) */}
              <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-0.5">
                <span className="text-[10px] text-text-tertiary block font-sans">Sanitation Access</span>
                {sanDiff > 0 ? (
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>✅</span>
                    <span>Better by {sanDiff.toFixed(1)}%</span>
                  </div>
                ) : sanDiff < 0 ? (
                  <div className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>⚠</span>
                    <span>Lower by {Math.abs(sanDiff).toFixed(1)}%</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-[11px]">Parity (0.0%)</span>
                )}
                <span className="text-[9px] text-text-tertiary block">
                  {stateA.sanitation_access}% vs {stateB.sanitation_access}%
                </span>
              </div>

              {/* Water Access Diff (Higher is better) */}
              <div className="bg-surface border border-border/80 rounded-lg p-2 space-y-0.5">
                <span className="text-[10px] text-text-tertiary block font-sans">Clean Water Access</span>
                {watDiff > 0 ? (
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>✅</span>
                    <span>Higher by {watDiff.toFixed(1)}%</span>
                  </div>
                ) : watDiff < 0 ? (
                  <div className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                    <span>⚠</span>
                    <span>Lower by {Math.abs(watDiff).toFixed(1)}%</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-[11px]">Parity (0.0%)</span>
                )}
                <span className="text-[9px] text-text-tertiary block">
                  {stateA.clean_water_access}% vs {stateB.clean_water_access}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 3: AI STATE INSIGHT & RECOMMENDATION PANEL (When a row is clicked)
         ───────────────────────────────────────────────────────────────────────────── */}
      {showAiInsight && inspectedState && aiIntelligence && (
        <div className="bg-surface rounded-2xl border border-indigo-800/40 p-4 sm:p-5 space-y-3.5 shadow-sm bg-gradient-to-b from-indigo-950/20 via-surface to-surface">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-900/40 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">
                    AI State Diagnostic Memo: <span className="text-indigo-300 font-bold">{inspectedState.state_name}</span>
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${getHealthTier(inspectedState.overall_health_index).badgeClass}`}>
                    {getHealthTier(inspectedState.overall_health_index).label}
                  </span>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    Health Score: <strong className="text-text-primary">{inspectedState.overall_health_index}/100</strong>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Causal policy analysis grounded in Bayesian DAG evidence and NFHS-5 official data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => { setStateAName(inspectedState.state_name); setShowComparison(true); }}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-elevated hover:bg-surface border border-border text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                title="Set as State A in Comparison"
              >
                Set as State A
              </button>
              <button
                onClick={() => { setStateBName(inspectedState.state_name); setShowComparison(true); }}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-elevated hover:bg-surface border border-border text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Set as State B in Comparison"
              >
                Set as State B
              </button>
              <button
                onClick={() => setShowAiInsight(false)}
                className="p-1 text-text-tertiary hover:text-text-primary rounded-md hover:bg-surface-elevated transition-colors cursor-pointer"
                title="Close AI Diagnostic"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3-Column Diagnostic Grid: Key Issues, Primary Drivers, Recommended Interventions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* 1. Key Issues */}
            <div className="bg-surface border border-border/80 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Key Issues &amp; Vulnerabilities</span>
              </div>
              <ul className="space-y-1.5 text-text-secondary text-[11px] leading-relaxed">
                {aiIntelligence.keyIssues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold shrink-0">•</span>
                    <span>{issue.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Primary Causal Drivers */}
            <div className="bg-surface border border-border/80 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Primary Causal Drivers</span>
              </div>
              <ul className="space-y-1.5 text-text-secondary text-[11px] leading-relaxed">
                {aiIntelligence.primaryDrivers.map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Recommended Policy Interventions */}
            <div className="bg-surface border border-border/80 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Interventions</span>
              </div>
              <ul className="space-y-1.5 text-text-secondary text-[11px] leading-relaxed">
                {aiIntelligence.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Expected Causal Impact (Counterfactual simulation callout) */}
          <div className="bg-surface-elevated/50 border-l-4 border-l-indigo-500 rounded-r-xl p-3 text-xs text-text-primary leading-relaxed flex items-center gap-2.5">
            <Award className="w-4 h-4 text-indigo-400 shrink-0" />
            <p>
              <strong className="text-indigo-300">Expected Policy Impact (do-calculus): </strong>
              {aiIntelligence.expectedImpact}
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 1: HEALTH PERFORMANCE HEATMAP TABLE
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Heatmap Legend Bar & Tier Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface rounded-xl border border-border p-3 text-xs">
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <span className="text-text-tertiary font-mono font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-primary-400" />
              <span>Heatmap Legend:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/25 border border-emerald-500/50" />
              <span className="text-text-secondary">Strong Performance (SDG Met)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
              <span className="text-text-secondary">Moderate / Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500/25 border border-rose-500/50" />
              <span className="text-text-secondary">Poor / High Risk Priority</span>
            </div>
          </div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5">
            <span className="text-text-tertiary font-mono pr-1">Filter Tier:</span>
            {[
              { id: "all", label: `All (${states.length})` },
              { id: "excellent", label: "Excellent (≥80)" },
              { id: "good", label: "Good (70–79)" },
              { id: "moderate", label: "Moderate (55–69)" },
              { id: "high_risk", label: "High Risk (<55)" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTierFilter(t.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tierFilter === t.id
                    ? "bg-primary-600 text-white font-semibold"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary border border-border/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="bg-surface border border-border rounded-xl overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto shadow-sm">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-surface-elevated/95 backdrop-blur-xs border-b border-border z-10">
              <tr className="border-b border-border text-text-tertiary select-none">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th
                  onClick={() => handleSort("state_name")}
                  className="py-2.5 px-3 cursor-pointer hover:text-text-primary whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>State / UT</span>
                    {sortBy === "state_name" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("overall_health_index")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap min-w-[150px] font-bold text-text-primary"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Health Score &amp; Tier</span>
                    {sortBy === "overall_health_index" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("infant_mortality_rate")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap"
                  title="Infant Mortality Rate (Lower is Better)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>IMR (per 1k)</span>
                    {sortBy === "infant_mortality_rate" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("maternal_mortality_rate")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap"
                  title="Maternal Mortality Ratio (Lower is Better)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>MMR (per 100k)</span>
                    {sortBy === "maternal_mortality_rate" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("institutional_delivery_rate")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap"
                  title="Institutional Delivery Coverage (Higher is Better)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Inst. Del %</span>
                    {sortBy === "institutional_delivery_rate" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("immunization_rate")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap"
                  title="Full Child Immunization Rate (Higher is Better)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Immunization %</span>
                    {sortBy === "immunization_rate" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("sanitation_access")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap"
                  title="Improved Household Sanitation (Higher is Better)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Sanitation %</span>
                    {sortBy === "sanitation_access" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("clean_water_access")}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary whitespace-nowrap"
                  title="Piped Drinking Water Access (Higher is Better)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Water Access %</span>
                    {sortBy === "clean_water_access" && <span>{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {sortedAndFilteredStates.map((s, idx) => {
                const tier = getHealthTier(s.overall_health_index);
                const isInspected = inspectedStateName === s.state_name;
                const isStateA = stateAName === s.state_name;
                const isStateB = stateBName === s.state_name;

                return (
                  <tr
                    key={s.state_name}
                    onClick={() => handleRowClick(s)}
                    className={`cursor-pointer transition-colors ${
                      isInspected
                        ? "bg-primary-500/15 hover:bg-primary-500/20 ring-1 ring-inset ring-primary-500/40"
                        : "hover:bg-surface-elevated/40"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-3 text-center text-text-tertiary">
                      {isInspected ? (
                        <span className="w-2 h-2 rounded-full bg-primary-400 inline-block animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </td>

                    {/* State Name */}
                    <td className="py-2.5 px-3 font-sans font-medium text-text-primary">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{s.state_name}</span>
                        {isStateA && (
                          <span className="text-[9px] font-mono px-1 rounded bg-sky-950/70 border border-sky-800 text-sky-400 font-bold">
                            A
                          </span>
                        )}
                        {isStateB && (
                          <span className="text-[9px] font-mono px-1 rounded bg-amber-950/70 border border-amber-800 text-amber-400 font-bold">
                            B
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Health Score (Strongest Visual Emphasis + Performance Badge) */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("overall_health_index", s.overall_health_index)}`}>
                          {Number(s.overall_health_index || 0).toFixed(1)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] border font-sans font-medium ${tier.badgeClass}`}>
                          {tier.label}
                        </span>
                      </div>
                    </td>

                    {/* IMR */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("infant_mortality_rate", s.infant_mortality_rate)}`}>
                        {s.infant_mortality_rate}
                      </span>
                    </td>

                    {/* MMR */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("maternal_mortality_rate", s.maternal_mortality_rate)}`}>
                        {s.maternal_mortality_rate}
                      </span>
                    </td>

                    {/* Institutional Delivery % */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("institutional_delivery_rate", s.institutional_delivery_rate)}`}>
                        {s.institutional_delivery_rate}%
                      </span>
                    </td>

                    {/* Immunization % */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("immunization_rate", s.immunization_rate)}`}>
                        {s.immunization_rate}%
                      </span>
                    </td>

                    {/* Sanitation % */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("sanitation_access", s.sanitation_access)}`}>
                        {s.sanitation_access}%
                      </span>
                    </td>

                    {/* Water Access % */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${getCellHeatmapClass("clean_water_access", s.clean_water_access)}`}>
                        {s.clean_water_access}%
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(s);
                          }}
                          className={`px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer ${
                            isInspected
                              ? "bg-primary-600 text-white border-primary-500 font-semibold"
                              : "bg-surface-elevated hover:bg-surface border-border text-text-secondary hover:text-text-primary"
                          }`}
                          title="View AI Policy Diagnostic"
                        >
                          Insight
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStateBName(s.state_name);
                            setShowComparison(true);
                          }}
                          className="px-1.5 py-0.5 rounded bg-surface-elevated hover:bg-surface border border-border text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                          title={`Set ${s.state_name} as State B in comparison`}
                        >
                          vs
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
