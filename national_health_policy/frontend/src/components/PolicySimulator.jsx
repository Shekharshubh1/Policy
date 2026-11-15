import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sliders,
  MapPin,
  RotateCcw,
  FileText,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Layers,
  Download,
  Search,
  Filter,
  Activity,
  BarChart2,
  X
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

function Spinner({ size = 16 }) {
  return (
    <svg
      style={{ width: size, height: size }}
      className="animate-spin text-primary-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function DistributionBar({ label, pct, color }) {
  const percentage = Math.round((pct ?? 0) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-text-tertiary shrink-0 text-[10px] font-mono">{label}</span>
      <div className="flex-1 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[10px] text-text-secondary">
        {percentage}%
      </span>
    </div>
  );
}

function OutcomeCard({ config, value, distribution, baseline }) {
  const distKey = config.key + "_bin";
  const dist = distribution?.[distKey] ?? {};
  const diff =
    baseline != null && value != null ? (value - baseline).toFixed(1) : null;
  const isPositiveDiff = diff !== null && parseFloat(diff) > 0;
  const isGood = config.highIsGood ? isPositiveDiff : (diff !== null && parseFloat(diff) < 0);
  const diffColor =
    diff === null
      ? "var(--text-muted)"
      : isGood
      ? "var(--semantic-positive)"
      : "var(--semantic-negative)";
  const diffLabel =
    diff !== null
      ? `${isPositiveDiff ? "+" : ""}${diff} vs baseline`
      : "—";

  // SDG target check
  const meetsTarget = config.target != null && (config.highIsGood ? value >= config.target : value <= config.target);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <span>{config.label}</span>
            {meetsTarget && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                SDG Met
              </span>
            )}
          </div>
          {config.unit && (
            <div className="text-[11px] text-text-tertiary font-mono">{config.unit}</div>
          )}
        </div>
        <div className="text-right">
          <div
            className="text-xl font-bold font-mono"
            style={{ color: config.color || "var(--accent-highlight)" }}
          >
            {formatNumber(value, config.decimals ?? 1)}
          </div>
          {diff !== null && (
            <div className="text-[10px] font-mono font-medium mt-0.5 flex items-center justify-end gap-1" style={{ color: diffColor }}>
              {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{diffLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Posterior belief distribution */}
      {Object.keys(dist).length > 0 && (
        <div className="space-y-1 pt-2 border-t border-border/60">
          <div className="text-[9px] uppercase tracking-wider text-text-tertiary font-mono">
            Bayesian Posterior Belief (Dirichlet Prior)
          </div>
          <DistributionBar label="Low" pct={dist.Low ?? 0} color="#3b82f6" />
          <DistributionBar label="Med" pct={dist.Medium ?? 0} color="#f59e0b" />
          <DistributionBar label="High" pct={dist.High ?? 0} color="#10b981" />
        </div>
      )}
    </div>
  );
}

function CausalPathways({ pathways }) {
  if (!pathways || pathways.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary-400" />
          Active Causal Pathways (Pearl's do-calculus chain)
        </h3>
        <span className="text-[10px] font-mono text-text-tertiary">{pathways.length} transmission routes</span>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {pathways.map((pathway, idx) => (
          <div
            key={idx}
            className="bg-surface-elevated/40 rounded-lg p-2.5 border border-border/60 flex flex-wrap items-center gap-1.5 text-xs font-mono"
          >
            {pathway.path.map((node, nIdx) => (
              <span key={nIdx} className="flex items-center gap-1.5">
                <span className="bg-surface-elevated border border-border rounded px-2 py-0.5 text-text-primary text-[10px]">
                  {formatLabel(node)}
                </span>
                {nIdx < pathway.path.length - 1 && (
                  <span className="text-primary-400 font-bold text-xs">→</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PolicySimulator({ districtContext, onClearDistrictContext }) {
  const [inputs, setInputs] = useState({ ...DEFAULT_POLICY_INPUTS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // District selector & dynamic national averages state
  const [allDistricts, setAllDistricts] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [districtLoading, setDistrictLoading] = useState(false);
  const [activeDistrictProfile, setActiveDistrictProfile] = useState(null);
  const [nationalAverages, setNationalAverages] = useState(null);

  // Sector filter tabs
  const [activeSector, setActiveSector] = useState("all");

  // Load district catalog and dynamic national baseline averages from government open data
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

        // Auto-run baseline simulation on initial load so user immediately sees Bayesian posteriors
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

    const newInputs = { ...DEFAULT_POLICY_INPUTS };
    // Map known district metrics into slider inputs
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
  };

  const handleSelectDistrict = async (name) => {
    if (!name) {
      setActiveDistrictProfile(null);
      setSelectedDistrictName("");
      setInputs({ ...DEFAULT_POLICY_INPUTS });
      return;
    }
    setDistrictLoading(true);
    try {
      const res = await apiClient.district(name);
      const latest = res?.latest || res;
      if (latest) {
        applyDistrictBaseline(latest);
      }
    } catch (err) {
      setError(`Failed to load empirical data for ${name}: ${err.message}`);
    } finally {
      setDistrictLoading(false);
    }
  };

  const handleSliderChange = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) }));
  }, []);

  const handleApplyPreset = (preset) => {
    setInputs((prev) => ({
      ...prev,
      ...preset.inputs,
      district_name: activeDistrictProfile?.district_name || null,
    }));
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
    setResults(null);
    if (onClearDistrictContext) onClearDistrictContext();
  };

  // Compute active baseline dynamically from selected district or official national averages
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

  // Filtered districts for dropdown
  const filteredDistricts = useMemo(() => {
    if (!selectedState) return allDistricts;
    return allDistricts.filter(
      (d) => d.state_name && d.state_name.toLowerCase() === selectedState.toLowerCase()
    );
  }, [allDistricts, selectedState]);

  // Sector filtering for sliders
  const filteredSliders = useMemo(() => {
    if (activeSector === "all") return INPUT_SLIDER_CONFIGS;
    if (activeSector === "hrh") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Human Resources");
    if (activeSector === "delivery") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Preventive Care" || s.domain === "Infrastructure");
    if (activeSector === "social") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Social Determinants");
    if (activeSector === "finance") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Spending");
    if (activeSector === "digital") return INPUT_SLIDER_CONFIGS.filter((s) => s.domain === "Digital Health");
    return INPUT_SLIDER_CONFIGS;
  }, [activeSector]);

  // Download simulation briefing memo
  const handleExportMemo = () => {
    const memo = `# Policy Decision Briefing Memo
Generated: ${new Date().toLocaleString()}
Context: ${activeDistrictProfile ? `${activeDistrictProfile.district_name}, ${activeDistrictProfile.state_name}` : "National Baseline (India 698 Districts)"}
Methodology: Pearl's SCM (do-calculus) Exact Inference via Variable Elimination (DiscreteBayesianNetwork)

## 1. Simulated Policy Interventions Applied:
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

## 3. Active Causal Transmission Pathways:
${results?.causal_pathways?.map((p, idx) => `Pathway ${idx + 1}: ${p.path.map(formatLabel).join(" → ")}`).join("\n") || "Direct propagation"}
`;

    const blob = new Blob([memo], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Policy_Briefing_Memo_${activeDistrictProfile?.district_name || "National"}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary-400" />
            Causal Policy Intervention Simulator
          </h2>
          <p className="text-xs text-text-secondary">
            Simulate prospective structural interventions (Pearl's $do$-calculus) conditioned on real NFHS-5 district baselines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {results && (
            <button
              onClick={handleExportMemo}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Policy Memo</span>
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Real District Selector & Policy Presets Bar */}
      <div className="bg-surface rounded-xl border border-border p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* District Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary-400" />
              Simulate Real District:
            </span>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrictName("");
              }}
              className="bg-surface-elevated border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus"
            >
              <option value="">All States/UTs ({statesList.length})</option>
              {statesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* District Dropdown */}
            <select
              value={selectedDistrictName}
              onChange={(e) => handleSelectDistrict(e.target.value)}
              disabled={districtLoading}
              className="bg-surface-elevated border border-border rounded px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border-focus min-w-[180px]"
            >
              <option value="">National Baseline (698 Districts)</option>
              {filteredDistricts.map((d) => (
                <option key={d.district_name} value={d.district_name}>
                  {d.district_name} ({d.state_name})
                </option>
              ))}
            </select>

            {districtLoading && <Spinner size={14} />}
          </div>

          {/* Active District Status Badge */}
          {activeDistrictProfile ? (
            <div className="flex items-center gap-2 bg-primary-950/40 border border-primary-800/80 rounded-full px-3 py-1 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-text-primary font-semibold">
                {activeDistrictProfile.district_name}, {activeDistrictProfile.state_name}
              </span>
              <span className="text-text-tertiary">| NFHS-5 Empirical Data</span>
              <button
                onClick={() => handleSelectDistrict("")}
                className="text-text-tertiary hover:text-text-primary ml-1"
                title="Clear district context"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-mono text-text-tertiary">
              Baseline: National Population Averages
            </span>
          )}
        </div>

        {/* Policy Presets Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/40 pb-0.5">
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Presets:
          </span>
          {POLICY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 rounded-full bg-surface-elevated hover:bg-surface-elevated/70 border border-border text-[11px] text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors cursor-pointer select-none"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout with Independent Internal Scroll Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Levers Panel (5 Cols) with internal scroll */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border p-4 flex flex-col max-h-[calc(100vh-220px)] min-h-[580px]">
          {/* Header & Sector Tabs */}
          <div className="pb-3 border-b border-border space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary-400" />
                Intervention Levers ({filteredSliders.length})
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">
                Continuous $\to$ Dirichlet Quantiles
              </span>
            </div>

            {/* Sector Sub-Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
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
                  className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
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

          {/* Scrollable Sliders Container */}
          <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-2.5">
            {filteredSliders.map((cfg) => {
              const val = inputs[cfg.key] ?? cfg.min;
              const baselineVal = activeDistrictProfile?.[cfg.key] ?? DEFAULT_POLICY_INPUTS[cfg.key];
              const isModified = Math.abs(val - baselineVal) > 0.05;

              return (
                <div
                  key={cfg.key}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isModified
                      ? "bg-primary-950/30 border-primary-500/50"
                      : "bg-surface-elevated/40 border-border/60 hover:border-border"
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-text-primary text-[12px]">{cfg.label}</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-primary-400 font-bold text-[12px]">{cfg.format(val)}</span>
                      {isModified && (
                        <span className="text-[10px] text-text-tertiary">
                          (base: {cfg.format(baselineVal)})
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={val}
                    onChange={(e) => handleSliderChange(cfg.key, e.target.value)}
                    className="w-full cursor-pointer h-1.5"
                    style={{ accentColor: "var(--accent-highlight)" }}
                  />
                  <div className="flex justify-between text-[10px] text-text-tertiary font-mono mt-1">
                    <span>{cfg.domain}</span>
                    <span>{cfg.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Simulation Action Button */}
          <div className="pt-3 border-t border-border shrink-0">
            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
            >
              {loading ? <Spinner size={16} /> : <Activity className="w-4 h-4" />}
              <span>{loading ? "Propagating Causal Network..." : "Simulate Causal Effect (do-calculus)"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Outcomes & Impact Intelligence (7 Cols) with internal scroll */}
        <div className="lg:col-span-7 flex flex-col max-h-[calc(100vh-220px)] min-h-[580px] overflow-y-auto pr-1 space-y-4">
          {results ? (
            <>
              {/* Context Summary Header */}
              <div className="bg-surface rounded-xl border border-border p-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary-400" />
                  <span className="text-xs font-semibold text-text-primary">
                    Simulation Results: {activeDistrictProfile ? activeDistrictProfile.district_name : "National Aggregate"}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-text-tertiary">
                  Exact Inference • Variable Elimination • 37 Nodes
                </div>
              </div>

              {/* 6 Outcome KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                {Object.entries(PRIMARY_OUTCOME_CONFIGS).map(([key, cfg]) => (
                  <OutcomeCard
                    key={key}
                    config={{ ...cfg, key }}
                    value={results?.expected_values?.[key]}
                    distribution={results?.distributions}
                    baseline={activeBaseline[key]}
                  />
                ))}
              </div>

              {/* Causal Pathways Chain */}
              {results?.causal_pathways?.length > 0 && (
                <div className="shrink-0">
                  <CausalPathways pathways={results.causal_pathways} />
                </div>
              )}

              {/* Baseline vs Intervention Comparison Table */}
              <div className="bg-surface rounded-xl border border-border p-4 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Baseline vs Policy Intervention Comparison
                  </h3>
                  <span className="text-[10px] font-mono text-text-tertiary">
                    {activeDistrictProfile ? "Empirical NFHS-5 Delta" : "National Delta"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-text-secondary font-mono text-[11px]">
                        <th className="text-left py-2 px-2.5 font-semibold">Health Indicator</th>
                        <th className="text-right py-2 px-2.5 font-semibold">Baseline</th>
                        <th className="text-right py-2 px-2.5 font-semibold text-primary-400">Simulated Policy</th>
                        <th className="text-right py-2 px-2.5 font-semibold">Absolute Δ</th>
                        <th className="text-right py-2 px-2.5 font-semibold">SDG 2030 Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {Object.entries(PRIMARY_OUTCOME_CONFIGS).map(([key, cfg]) => {
                        const base = activeBaseline[key];
                        const sim = results?.expected_values?.[key];
                        const diff = base != null && sim != null ? (sim - base).toFixed(1) : null;
                        const isPos = diff !== null && parseFloat(diff) > 0;
                        const isGood = cfg.highIsGood ? isPos : (diff !== null && parseFloat(diff) < 0);
                        const meetsTarget = cfg.target != null && (cfg.highIsGood ? sim >= cfg.target : sim <= cfg.target);

                        return (
                          <tr key={key} className="hover:bg-surface-elevated/30">
                            <td className="py-2.5 px-2.5 font-sans font-medium text-text-primary">
                              {cfg.label}
                            </td>
                            <td className="text-right py-2.5 px-2.5 text-text-secondary">
                              {formatNumber(base, 1)}
                            </td>
                            <td className="text-right py-2.5 px-2.5 text-text-primary font-bold">
                              {formatNumber(sim, 1)}
                            </td>
                            <td
                              className="text-right py-2.5 px-2.5 font-bold"
                              style={{
                                color: diff === null ? "var(--text-muted)" : isGood ? "var(--semantic-positive)" : "var(--semantic-negative)",
                              }}
                            >
                              {diff !== null ? `${isPos ? "+" : ""}${diff}` : "—"}
                            </td>
                            <td className="text-right py-2.5 px-2.5">
                              {meetsTarget ? (
                                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                                  On Track
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800">
                                  Gap ({cfg.target != null ? `Target: ${cfg.target}` : "—"})
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-tertiary space-y-3 flex flex-col items-center justify-center my-auto">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-primary-400 mb-1">
                <Sliders className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-text-primary">Ready to Simulate</div>
              <p className="text-xs max-w-md mx-auto leading-relaxed text-text-secondary">
                Select an authentic Indian district from the dropdown or pick a policy preset, adjust any specific health system levers, and click <strong>Simulate Causal Effect</strong> to propagate interventions across Pearl's causal Bayesian network.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Run Initial National Baseline Simulation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
