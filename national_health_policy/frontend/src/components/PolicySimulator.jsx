import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sliders,
  MapPin,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Layers,
  Download,
  Activity,
  BarChart2,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
  GitBranch,
  Table,
  Cpu,
  Info
} from "lucide-react";
import {
  apiClient,
  DEFAULT_POLICY_INPUTS,
  INPUT_SLIDER_CONFIGS,
  PRIMARY_OUTCOME_CONFIGS,
  POLICY_PRESETS,
} from "../api/client";

function formatLabel(key) {
  return key
    .replace(/_bin$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumber(val, decimals = 1) {
  if (val === null || val === undefined) return "—";
  return Number(val).toFixed(decimals);
}

function Spinner({ size = 14 }) {
  return (
    <svg
      style={{ width: size, height: size }}
      className="animate-spin text-primary-400 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// Compact Probability Sparkline
function ProbabilityShiftBar({ dist }) {
  const low = Math.round((dist?.Low ?? 0) * 100);
  const med = Math.round((dist?.Medium ?? 0) * 100);
  const high = Math.round((dist?.High ?? 0) * 100);

  return (
    <div className="space-y-0.5">
      <div className="h-1.5 w-full bg-surface-elevated rounded-full flex overflow-hidden">
        <div style={{ width: `${low}%` }} className="bg-sky-500 transition-all" title={`Low: ${low}%`} />
        <div style={{ width: `${med}%` }} className="bg-amber-500 transition-all" title={`Medium: ${med}%`} />
        <div style={{ width: `${high}%` }} className="bg-emerald-500 transition-all" title={`High: ${high}%`} />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
        <span className="text-sky-400">L:{low}%</span>
        <span className="text-amber-400">M:{med}%</span>
        <span className="text-emerald-400">H:{high}%</span>
      </div>
    </div>
  );
}

// Compact Outcome Card
function CompactOutcomeCard({ config, value, distribution, baseline }) {
  const distKey = config.key + "_bin";
  const dist = distribution?.[distKey] ?? {};
  const diff = baseline != null && value != null ? (value - baseline).toFixed(1) : null;
  const isPositiveDiff = diff !== null && parseFloat(diff) > 0;
  const isGood = config.highIsGood ? isPositiveDiff : (diff !== null && parseFloat(diff) < 0);
  const diffColor = diff === null ? "var(--text-muted)" : isGood ? "var(--semantic-positive)" : "var(--semantic-negative)";
  const meetsTarget = config.target != null && (config.highIsGood ? value >= config.target : value <= config.target);

  return (
    <div className="bg-surface border border-border rounded-lg p-2.5 flex flex-col justify-between space-y-1.5 hover:border-border/80 transition-colors shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-text-primary truncate">{config.label}</div>
          <div className="text-[9px] text-text-tertiary font-mono">{config.unit}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold font-mono" style={{ color: config.color || "var(--accent-highlight)" }}>
            {formatNumber(value, config.decimals ?? 1)}
          </div>
          {diff !== null && (
            <div className="text-[10px] font-mono font-medium flex items-center justify-end gap-0.5" style={{ color: diffColor }}>
              {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositiveDiff ? "+" : ""}{diff}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-1 border-t border-border/50">
        <div className="flex items-center justify-between text-[9px] font-mono text-text-tertiary mb-0.5">
          <span>Posterior</span>
          {meetsTarget ? (
            <span className="text-emerald-400 font-semibold">SDG Met</span>
          ) : (
            <span className="text-amber-400 font-semibold">{config.target != null ? `SDG: ${config.target}` : "Active"}</span>
          )}
        </div>
        <ProbabilityShiftBar dist={dist} />
      </div>
    </div>
  );
}

// Ultra-compact Lever Item with Hover/Click-Activated Slider to Save Space
function CompactLeverItem({ cfg, val, baselineVal, isModified, onChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`p-2 rounded-lg border transition-all ${
        isModified
          ? "bg-primary-950/25 border-primary-500/50 shadow-sm"
          : "bg-surface-elevated/30 border-border/60 hover:border-border hover:bg-surface-elevated/60"
      }`}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex justify-between items-center text-xs cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
          <span className="font-medium text-text-primary text-[11px] truncate">{cfg.label}</span>
          <span className="text-[9px] font-mono text-text-tertiary truncate hidden sm:inline">
            ({cfg.domain})
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
          <span className="text-primary-400 font-bold">{cfg.format(val)}</span>
          {isModified && (
            <span className="text-[9px] text-text-tertiary hidden sm:inline">
              (base: {cfg.format(baselineVal)})
            </span>
          )}
        </div>
      </div>

      {/* Slider reveals smoothly on Hover or Click */}
      {isExpanded && (
        <div className="pt-1.5 mt-1 border-t border-border/40 space-y-1 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={val}
              onChange={(e) => onChange(cfg.key, e.target.value)}
              className="w-full cursor-pointer h-1.5"
              style={{ accentColor: "var(--accent-highlight)" }}
            />
            <span className="text-[10px] font-mono text-text-secondary shrink-0 w-12 text-right">
              {cfg.format(val)}
            </span>
          </div>
          <div className="flex justify-between text-[9px] text-text-tertiary font-mono">
            <span>Min: {cfg.min}</span>
            <span className="text-text-secondary">{cfg.unit}</span>
            <span>Max: {cfg.max}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PolicySimulator({ districtContext, onClearDistrictContext }) {
  const [inputs, setInputs] = useState({ ...DEFAULT_POLICY_INPUTS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // District selector state
  const [allDistricts, setAllDistricts] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [districtLoading, setDistrictLoading] = useState(false);
  const [activeDistrictProfile, setActiveDistrictProfile] = useState(null);
  const [nationalAverages, setNationalAverages] = useState(null);

  // AI Recommendation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false); // Hover/Click modal for brief summary

  // Sector filter tabs & Right Panel Active Tab
  const [activeSector, setActiveSector] = useState("all");
  const [rightPanelTab, setRightPanelTab] = useState("outcomes"); // 'outcomes' | 'causal' | 'delta'

  // Load district catalog and dynamic national baseline averages
  useEffect(() => {
    async function loadDistrictsCatalog() {
      try {
        const [distRes, stateRes, sumRes] = await Promise.all([
          apiClient.districts(),
          apiClient.states(),
          apiClient.summary(),
        ]);
        const dists = Array.isArray(distRes) ? distRes : distRes?.districts || [];
        setAllDistricts(dists);

        const states = Array.isArray(stateRes) ? stateRes : stateRes?.states || [];
        const stateNames = states.map((s) => (typeof s === "string" ? s : s.state_name)).filter(Boolean);
        setStatesList(stateNames);

        if (sumRes?.national_averages) {
          setNationalAverages(sumRes.national_averages);
        }

        // Auto-run baseline simulation on initial mount
        apiClient.simulate(DEFAULT_POLICY_INPUTS).then((res) => setResults(res)).catch(() => {});
      } catch (e) {
        console.warn("Could not load district catalog for simulator:", e);
      }
    }
    loadDistrictsCatalog();
  }, []);

  // Handle passed district context from District Explorer
  useEffect(() => {
    if (districtContext && districtContext.district_name) {
      applyDistrictBaseline(districtContext);
    }
  }, [districtContext]);

  // Apply a district's empirical government metrics to inputs and baseline
  const applyDistrictBaseline = (dist) => {
    setActiveDistrictProfile(dist);
    setSelectedDistrictName(dist.district_name);
    setSelectedState(dist.state_name || "");
    setAiRecommendations(null);

    const newInputs = { ...DEFAULT_POLICY_INPUTS };
    if (dist.specialist_availability != null) newInputs.specialist_availability = dist.specialist_availability;
    if (dist.doctor_ratio != null) newInputs.doctor_ratio = dist.doctor_ratio;
    if (dist.institutional_delivery_rate != null) newInputs.institutional_delivery_rate = dist.institutional_delivery_rate;
    if (dist.immunization_rate != null) newInputs.immunization_rate = dist.immunization_rate;
    if (dist.clean_water_access != null) newInputs.clean_water_access = dist.clean_water_access;
    if (dist.sanitation_access != null) newInputs.sanitation_access = dist.sanitation_access;
    if (dist.female_literacy != null) newInputs.female_literacy = dist.female_literacy;
    if (dist.insurance_coverage != null) newInputs.insurance_coverage = dist.insurance_coverage;
    if (dist.bed_availability != null) newInputs.bed_availability = dist.bed_availability;
    if (dist.asha_worker_density != null) newInputs.asha_worker_density = dist.asha_worker_density;
    if (dist.telemedicine_access != null) newInputs.telemedicine_access = dist.telemedicine_access;

    newInputs.district_name = dist.district_name;
    setInputs(newInputs);

    // Auto-run simulation on the district's baseline
    apiClient.simulate(newInputs).then((res) => setResults(res)).catch(() => {});
  };

  const handleSelectDistrict = async (name) => {
    if (!name) {
      setActiveDistrictProfile(null);
      setSelectedDistrictName("");
      setInputs({ ...DEFAULT_POLICY_INPUTS });
      setAiRecommendations(null);
      setShowAiModal(false);
      apiClient.simulate(DEFAULT_POLICY_INPUTS).then((res) => setResults(res)).catch(() => {});
      return;
    }
    setDistrictLoading(true);
    try {
      const res = await apiClient.district(name);
      const latest = res?.latest_data || res?.latest || res;
      if (latest) {
        applyDistrictBaseline(latest);
      }
    } catch (err) {
      setError(`Failed to load empirical data for ${name}: ${err.message}`);
    } finally {
      setDistrictLoading(false);
    }
  };

  // Fetch AI Policy Lever Recommendations via Groq LLaMA-3.3-70B
  const handleFetchAiRecommendations = async () => {
    if (!selectedDistrictName) return;
    setAiLoading(true);
    try {
      const recs = await apiClient.districtRecommendations(selectedDistrictName);
      if (recs && recs.status === "success") {
        setAiRecommendations(recs);
        setShowAiModal(true);
      }
    } catch (err) {
      console.warn("Could not retrieve AI recommendations:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // One-click apply AI suggested levers to sliders and re-simulate
  const handleApplyAiLevers = () => {
    if (!aiRecommendations?.recommended_levers) return;
    const recs = aiRecommendations.recommended_levers;
    const updated = { ...inputs, ...recs };
    setInputs(updated);
    apiClient.simulate(updated).then((res) => setResults(res)).catch(() => {});
    setShowAiModal(false);
  };

  const handleSliderChange = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) }));
  }, []);

  const handleApplyPreset = (preset) => {
    const updated = {
      ...inputs,
      ...preset.inputs,
      district_name: activeDistrictProfile?.district_name || null,
    };
    setInputs(updated);
    apiClient.simulate(updated).then((res) => setResults(res)).catch(() => {});
  };

  const handleRunSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.simulate(inputs);
      setResults(res);
    } catch (err) {
      setError(err?.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  }, [inputs]);

  const handleReset = () => {
    setActiveDistrictProfile(null);
    setSelectedDistrictName("");
    setInputs({ ...DEFAULT_POLICY_INPUTS });
    setAiRecommendations(null);
    setShowAiModal(false);
    if (onClearDistrictContext) onClearDistrictContext();
    apiClient.simulate(DEFAULT_POLICY_INPUTS).then((res) => setResults(res)).catch(() => {});
  };

  // Active baseline calculations
  const activeBaseline = useMemo(() => {
    if (activeDistrictProfile) {
      return {
        maternal_mortality_rate: activeDistrictProfile.maternal_mortality_rate ?? nationalAverages?.maternal_mortality_rate,
        infant_mortality_rate: activeDistrictProfile.infant_mortality_rate ?? nationalAverages?.infant_mortality_rate,
        life_expectancy: activeDistrictProfile.life_expectancy ?? nationalAverages?.life_expectancy,
        health_equity_index: activeDistrictProfile.health_equity_index ?? nationalAverages?.health_equity_index,
        universal_health_coverage_score: activeDistrictProfile.universal_health_coverage_score ?? nationalAverages?.universal_health_coverage_score,
        overall_health_index: activeDistrictProfile.overall_health_index ?? nationalAverages?.overall_health_index,
      };
    }
    return nationalAverages || {};
  }, [activeDistrictProfile, nationalAverages]);

  const filteredDistricts = useMemo(() => {
    if (!selectedState) return allDistricts;
    return allDistricts.filter(
      (d) => d.state_name && d.state_name.toLowerCase() === selectedState.toLowerCase()
    );
  }, [allDistricts, selectedState]);

  const filteredSliders = useMemo(() => {
    if (activeSector === "all") return INPUT_SLIDER_CONFIGS;
    if (activeSector === "hrh") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Human Resources");
    if (activeSector === "delivery") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Preventive Care" || s.domain === "Infrastructure");
    if (activeSector === "social") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Social Determinants");
    if (activeSector === "finance") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Spending");
    if (activeSector === "digital") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Digital Health");
    return INPUT_SLIDER_CONFIGS;
  }, [activeSector]);

  // Grouped Causal Pathways
  const groupedPathways = useMemo(() => {
    if (!results?.causal_pathways) return [];
    const groups = {
      "Workforce & Staffing": [],
      "Clinical Care & Facilities": [],
      "Social & Environmental Determinants": [],
      "Digital Health & Governance": []
    };
    results.causal_pathways.forEach((p) => {
      const type = p.origin_type || "";
      if (type.includes("Human")) groups["Workforce & Staffing"].push(p);
      else if (type.includes("Environmental") || type.includes("Social")) groups["Social & Environmental Determinants"].push(p);
      else if (type.includes("Digital")) groups["Digital Health & Governance"].push(p);
      else groups["Clinical Care & Facilities"].push(p);
    });
    return Object.entries(groups).filter(([_, paths]) => paths.length > 0);
  }, [results?.causal_pathways]);

  // Export memo handler
  const handleExportMemo = () => {
    const memo = `# Policy Decision Briefing Memo
Generated: ${new Date().toLocaleString()}
Context: ${activeDistrictProfile ? `${activeDistrictProfile.district_name}, ${activeDistrictProfile.state_name}` : "National Baseline (India 698 Districts)"}
Methodology: Pearl's SCM (do-calculus) Exact Inference via Variable Elimination (DiscreteBayesianNetwork)

## 1. Active Interventions Applied:
${Object.entries(inputs)
  .filter(([k]) => k !== "district_name")
  .map(([k, v]) => `- ${formatLabel(k)}: ${v}`)
  .join("\n")}

## 2. Predicted Posterior Health Outcomes:
${Object.entries(PRIMARY_OUTCOME_CONFIGS)
  .map(([k, cfg]) => {
    const baselineVal = activeBaseline[k];
    const predictedVal = results?.expected_values?.[k];
    const diff = predictedVal != null && baselineVal != null ? (predictedVal - baselineVal).toFixed(1) : "N/A";
    return `- ${cfg.label}: Baseline = ${baselineVal}, Simulated = ${predictedVal != null ? predictedVal.toFixed(1) : "—"} (Δ ${diff} ${cfg.unit})`;
  })
  .join("\n")}
`;

    const blob = new Blob([memo], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Policy_Memo_${activeDistrictProfile?.district_name || "National"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2.5">
      {/* ── Compact Header & Action Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary-400" />
            Causal Policy Intervention Simulator
          </h2>
          <p className="text-[11px] text-text-secondary">
            Simulate structural interventions (Pearl's do-calculus) conditioned on empirical NFHS-5 district baselines.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {results && (
            <button
              onClick={handleExportMemo}
              className="px-2 py-0.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Memo</span>
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-2 py-0.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-2 rounded text-xs">
          {error}
        </div>
      )}

      {/* ── Compact Control Bar: District Selection, Presets & AI Recommender ── */}
      <div className="bg-surface rounded-xl border border-border p-2 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* District Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary-400" />
              District:
            </span>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrictName("");
              }}
              className="bg-surface-elevated border border-border rounded px-2 py-0.5 text-xs text-text-primary focus:outline-none"
            >
              <option value="">All States ({statesList.length})</option>
              {statesList.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* District Dropdown */}
            <select
              value={selectedDistrictName}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              disabled={districtLoading}
              className="bg-surface-elevated border border-border rounded px-2 py-0.5 text-xs text-text-primary focus:outline-none min-w-[160px]"
            >
              <option value="">National Baseline (698 Districts)</option>
              {filteredDistricts.map((d) => (
                <option key={d.district_name} value={d.district_name}>
                  {d.district_name} ({d.state_name})
                </option>
              ))}
            </select>

            {districtLoading && <Spinner size={13} />}

            {activeDistrictProfile && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {activeDistrictProfile.district_name}, {activeDistrictProfile.state_name}
                <button onClick={() => handleSelectDistrict("")} className="hover:text-emerald-200 ml-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>

          {/* AI Advisor Button & Dropdown Trigger */}
          {selectedDistrictName && (
            <div className="relative">
              <button
                onClick={handleFetchAiRecommendations}
                disabled={aiLoading}
                className="px-2.5 py-0.5 text-xs font-semibold rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-700/60 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                {aiLoading ? <Spinner size={12} /> : <Sparkles className="w-3 h-3 text-indigo-400" />}
                <span>{aiLoading ? "Consulting AI..." : "AI Health Need Diagnosis & Advice"}</span>
              </button>

              {/* Hover or Click Modal for Brief Summary */}
              {showAiModal && aiRecommendations && (
                <div className="absolute right-0 top-8 z-30 w-80 bg-surface border border-indigo-700/80 rounded-xl p-3 shadow-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-border">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      LLaMA-3.3-70B Diagnosis
                    </span>
                    <button onClick={() => setShowAiModal(false)} className="text-text-tertiary hover:text-text-primary">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {aiRecommendations.diagnostic_summary}
                  </p>

                  <div className="space-y-1">
                    <div className="text-[9px] font-mono text-text-tertiary uppercase">Prescribed Interventions:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(aiRecommendations.recommended_levers || {}).slice(0, 4).map(([k, v]) => (
                        <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-indigo-200">
                          {formatLabel(k)}: <strong>{formatNumber(v, 1)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleApplyAiLevers}
                    className="w-full py-1 text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Apply Levers & Re-simulate</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Presets Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-border/40 text-xs">
          <span className="text-[9px] font-semibold text-text-tertiary uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Presets:
          </span>
          {POLICY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="px-2 py-0.5 rounded-full bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-[9px] text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── District Empirical Baseline ("Before" Actual Data) Compact Strip ── */}
      {activeDistrictProfile && (
        <div className="bg-surface rounded-xl border border-border p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-text-primary flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>{activeDistrictProfile.district_name} — "Before" Actual Baseline (NFHS-5)</span>
            </div>
            <span className="text-[9px] font-mono text-text-tertiary">Official Survey Benchmarks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {[
              { label: "Maternal Mortality", val: activeDistrictProfile.maternal_mortality_rate, unit: "/100k", nat: 103.0, lowerIsGood: true },
              { label: "Infant Mortality", val: activeDistrictProfile.infant_mortality_rate, unit: "/1k", nat: 32.6, lowerIsGood: true },
              { label: "Doctor Ratio", val: activeDistrictProfile.doctor_ratio, unit: "/10k", nat: 7.5, lowerIsGood: false },
              { label: "Specialist Posts", val: activeDistrictProfile.specialist_availability, unit: "%", nat: 35.0, lowerIsGood: false },
              { label: "Institutional Births", val: activeDistrictProfile.institutional_delivery_rate, unit: "%", nat: 88.6, lowerIsGood: false },
              { label: "Full Immunization", val: activeDistrictProfile.immunization_rate, unit: "%", nat: 77.0, lowerIsGood: false }
            ].map((m, idx) => {
              const diff = m.val != null && m.nat != null ? m.val - m.nat : 0;
              const isDeficit = m.lowerIsGood ? diff > 0 : diff < 0;
              return (
                <div key={idx} className="bg-surface-elevated/40 border border-border/60 rounded p-1.5 font-mono text-center">
                  <div className="text-[9px] text-text-tertiary truncate">{m.label}</div>
                  <div className="text-xs font-bold text-text-primary">
                    {formatNumber(m.val, 1)} <span className="text-[8px] font-normal text-text-tertiary">{m.unit}</span>
                  </div>
                  <div className={`text-[8px] font-semibold ${isDeficit ? "text-rose-400" : "text-emerald-400"}`}>
                    {isDeficit ? "Deficit" : "At/Above"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Viewport-Constrained Split Console (Zero Infinite Scrolling) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* Left: Compact Levers Console (5 cols) with internal scroll container */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border p-2.5 flex flex-col h-[520px]">
          {/* Levers Header */}
          <div className="pb-2 border-b border-border space-y-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-primary-400" />
                Interventions ({filteredSliders.length})
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={loading}
                className="px-2.5 py-0.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-sm select-none"
              >
                {loading ? <Spinner size={12} /> : <Activity className="w-3 h-3" />}
                <span>Simulate</span>
              </button>
            </div>

            {/* Sector Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "hrh", label: "Workforce" },
                { id: "delivery", label: "Delivery" },
                { id: "social", label: "Social" },
                { id: "finance", label: "Finance" },
                { id: "digital", label: "Digital" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSector(tab.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeSector === tab.id
                      ? "bg-primary-600 text-white font-semibold"
                      : "bg-surface-elevated text-text-secondary hover:text-text-primary border border-border/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Sliders List with Hover-Activated Space-Saving Sliders */}
          <div className="flex-1 overflow-y-auto pr-1 py-1.5 space-y-1.5">
            {filteredSliders.map((cfg) => {
              const val = inputs[cfg.key] ?? cfg.min;
              const baselineVal = activeDistrictProfile?.[cfg.key] ?? DEFAULT_POLICY_INPUTS[cfg.key];
              const isModified = Math.abs(val - baselineVal) > 0.05;

              return (
                <CompactLeverItem
                  key={cfg.key}
                  cfg={cfg}
                  val={val}
                  baselineVal={baselineVal}
                  isModified={isModified}
                  onChange={handleSliderChange}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Policy Intelligence Hub (7 cols) with Tab Controller */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-border p-2.5 flex flex-col h-[520px]">
          {/* Sub-View Tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-border shrink-0">
            <div className="flex items-center gap-1">
              {[
                { id: "outcomes", label: "Simulated Outcomes", icon: BarChart2 },
                { id: "causal", label: "Causal Transmission", icon: GitBranch, count: results?.causal_pathways?.length },
                { id: "delta", label: "Delta & SDG Matrix", icon: Table },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRightPanelTab(tab.id)}
                    className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      rightPanelTab === tab.id
                        ? "bg-surface-elevated text-text-primary border border-border font-semibold shadow-sm"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                    {tab.count != null && (
                      <span className="text-[9px] px-1 rounded-full bg-surface border border-border text-text-secondary">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] font-mono text-text-tertiary hidden sm:block">
              {activeDistrictProfile ? activeDistrictProfile.district_name : "National"} • 37 Nodes
            </div>
          </div>

          {/* Scrollable Tab Content Container */}
          <div className="flex-1 overflow-y-auto py-2 pr-1">
            {/* TAB 1: OUTCOMES & POSTERIORS */}
            {rightPanelTab === "outcomes" && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(PRIMARY_OUTCOME_CONFIGS).map(([key, cfg]) => (
                    <CompactOutcomeCard
                      key={key}
                      config={{ ...cfg, key }}
                      value={results?.expected_values?.[key]}
                      distribution={results?.distributions}
                      baseline={activeBaseline[key]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CAUSAL TRANSMISSION PATHWAYS */}
            {rightPanelTab === "causal" && (
              <div className="space-y-2">
                {groupedPathways.length > 0 ? (
                  groupedPathways.map(([groupName, paths], gIdx) => (
                    <div key={gIdx} className="bg-surface-elevated/30 border border-border/60 rounded-lg p-2 space-y-1.5">
                      <div className="text-[11px] font-semibold text-text-primary flex items-center justify-between">
                        <span>{groupName}</span>
                        <span className="text-[9px] font-mono text-text-tertiary">{paths.length} routes</span>
                      </div>
                      <div className="space-y-1">
                        {paths.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-surface border border-border/50 rounded p-1.5 text-[10px] font-mono flex flex-wrap items-center gap-1"
                          >
                            {p.path.map((node, nIdx) => (
                              <span key={nIdx} className="flex items-center gap-1">
                                <span className="bg-surface-elevated px-1.5 py-0.5 rounded text-text-primary">
                                  {formatLabel(node)}
                                </span>
                                {nIdx < p.path.length - 1 && (
                                  <span className="text-primary-400 font-bold">→</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-text-tertiary">
                    No active causal pathways reported for this intervention configuration.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BASELINE VS POLICY DELTA MATRIX */}
            {rightPanelTab === "delta" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-secondary font-mono text-[10px]">
                      <th className="text-left py-1.5 px-2 font-semibold">Health Indicator</th>
                      <th className="text-right py-1.5 px-2 font-semibold">Baseline</th>
                      <th className="text-right py-1.5 px-2 font-semibold text-primary-400">Simulated Policy</th>
                      <th className="text-right py-1.5 px-2 font-semibold">Absolute Δ</th>
                      <th className="text-right py-1.5 px-2 font-semibold">SDG 2030 Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono text-[10px]">
                    {Object.entries(PRIMARY_OUTCOME_CONFIGS).map(([key, cfg]) => {
                      const base = activeBaseline[key];
                      const sim = results?.expected_values?.[key];
                      const diff = base != null && sim != null ? (sim - base).toFixed(1) : null;
                      const isPos = diff !== null && parseFloat(diff) > 0;
                      const isGood = cfg.highIsGood ? isPos : (diff !== null && parseFloat(diff) < 0);
                      const meetsTarget = cfg.target != null && (cfg.highIsGood ? sim >= cfg.target : sim <= cfg.target);

                      return (
                        <tr key={key} className="hover:bg-surface-elevated/40">
                          <td className="py-2 px-2 font-sans font-medium text-text-primary">
                            {cfg.label}
                          </td>
                          <td className="text-right py-2 px-2 text-text-secondary">
                            {formatNumber(base, 1)}
                          </td>
                          <td className="text-right py-2 px-2 text-text-primary font-bold">
                            {formatNumber(sim, 1)}
                          </td>
                          <td
                            className="text-right py-2 px-2 font-bold"
                            style={{
                              color: diff === null ? "var(--text-muted)" : isGood ? "var(--semantic-positive)" : "var(--semantic-negative)",
                            }}
                          >
                            {diff !== null ? `${isPos ? "+" : ""}${diff}` : "—"}
                          </td>
                          <td className="text-right py-2 px-2">
                            {meetsTarget ? (
                              <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                                On Track
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800">
                                Gap ({cfg.target != null ? `${cfg.target}` : "—"})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
