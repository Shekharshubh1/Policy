import React, { useState, useCallback } from "react";
import {
  apiClient,
  DEFAULT_POLICY_INPUTS,
  INPUT_SLIDER_CONFIGS,
  PRIMARY_OUTCOME_CONFIGS,
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
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-text-tertiary shrink-0 text-[11px] font-mono">{label}</span>
      <div className="flex-1 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[11px] text-text-secondary">
        {Math.round(pct * 100)}%
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
  const diffColor = diff === null ? "var(--text-muted)" : (isGood ? "var(--semantic-positive)" : "var(--semantic-negative)");
  const diffLabel =
    diff !== null
      ? `${isPositiveDiff ? "+" : ""}${diff} vs baseline`
      : "—";

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-text-primary">
            {config.label}
          </div>
          {config.unit && (
            <div className="text-[11px] text-text-tertiary">{config.unit}</div>
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
            <div className="text-[10px] font-mono font-medium mt-0.5" style={{ color: diffColor }}>
              {diffLabel}
            </div>
          )}
        </div>
      </div>

      {/* Distribution bars */}
      {Object.keys(dist).length > 0 && (
        <div className="space-y-1 pt-2 border-t border-border/60">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
            Posterior Belief Distribution
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
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Active Causal Pathways (do-calculus chain)
      </h3>
      <div className="space-y-2">
        {pathways.map((pathway, idx) => (
          <div
            key={idx}
            className="bg-surface-elevated/40 rounded-lg p-3 border border-border/60 flex flex-wrap items-center gap-1.5 text-xs font-mono"
          >
            {pathway.path.map((node, nIdx) => (
              <span key={nIdx} className="flex items-center gap-1.5">
                <span className="bg-surface-elevated border border-border rounded px-2 py-0.5 text-text-primary text-[11px]">
                  {formatLabel(node)}
                </span>
                {nIdx < pathway.path.length - 1 && (
                  <span className="text-primary-400 font-bold">→</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareScenarios({ scenarioA }) {
  const [scenarioB, setScenarioB] = useState({ ...DEFAULT_POLICY_INPUTS });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSliderB = useCallback((key, val) => {
    setScenarioB((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.compare(scenarioA, scenarioB);
      setResult(res);
    } catch (err) {
      setError(err?.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Scenario Comparison</h3>
          <p className="text-xs text-text-secondary">Evaluate counterfactual policy interventions side-by-side.</p>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
        >
          {loading ? <Spinner size={14} /> : null}
          <span>Run Comparison</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {result && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-text-tertiary">
                <th className="text-left py-2 px-3">Metric</th>
                <th className="text-right py-2 px-3 font-semibold text-primary-400">Scenario A</th>
                <th className="text-right py-2 px-3 font-semibold text-amber-400">Scenario B</th>
                <th className="text-right py-2 px-3 font-semibold">Absolute Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {Object.entries(PRIMARY_OUTCOME_CONFIGS).map(([key, cfg]) => {
                const entry = result?.comparison?.[key] || result?.comparison?.[cfg.key];
                const a = entry?.scenario_a ?? result?.scenario_a?.expected_values?.[key];
                const b = entry?.scenario_b ?? result?.scenario_b?.expected_values?.[key];
                const diff = entry?.delta != null ? Number(entry.delta).toFixed(1) : (a != null && b != null ? (b - a).toFixed(1) : null);
                const isPositiveDiff = diff !== null && parseFloat(diff) > 0;
                const isGood = cfg.highIsGood ? isPositiveDiff : (diff !== null && parseFloat(diff) < 0);

                return (
                  <tr key={key} className="hover:bg-surface-elevated/30">
                    <td className="py-2.5 px-3 font-sans font-medium text-text-primary">
                      {cfg.label}
                    </td>
                    <td className="text-right py-2.5 px-3 text-text-secondary">
                      {formatNumber(a, cfg.decimals ?? 1)}
                    </td>
                    <td className="text-right py-2.5 px-3 text-text-primary font-bold">
                      {formatNumber(b, cfg.decimals ?? 1)}
                    </td>
                    <td
                      className="text-right py-2.5 px-3 font-bold"
                      style={{ color: diff === null ? "var(--text-muted)" : (isGood ? "var(--semantic-positive)" : "var(--semantic-negative)") }}
                    >
                      {diff !== null ? `${isPositiveDiff ? "+" : ""}${diff}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PolicySimulator() {
  const [inputs, setInputs] = useState({ ...DEFAULT_POLICY_INPUTS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleSliderChange = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(value) }));
  }, []);

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
    setInputs({ ...DEFAULT_POLICY_INPUTS });
  };

  const NATIONAL_BASELINE = {
    maternal_mortality_rate: 103,
    infant_mortality_rate: 32,
    life_expectancy: 67.2,
    health_equity_index: 55,
    universal_health_coverage_score: 61,
    overall_health_index: 58,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Causal Policy Intervention Simulator
          </h2>
          <p className="text-xs text-text-secondary">
            Simulate Pearl's structural causal interventions ($do$-calculus) across 37 public health nodes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded border border-border transition-colors"
          >
            Reset Levers
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Sliders on left (5 cols), Outcomes on right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Policy Sliders */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border p-4 space-y-3 max-h-[820px] overflow-y-auto">
          <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Policy Levers ({INPUT_SLIDER_CONFIGS.length})
          </div>

          <div className="space-y-2.5">
            {INPUT_SLIDER_CONFIGS.map((cfg) => {
              const val = inputs[cfg.key] ?? cfg.min;
              return (
                <div key={cfg.key} className="bg-surface-elevated/40 p-2.5 rounded-lg border border-border/60 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-text-primary">{cfg.label}</span>
                    <span className="font-mono text-primary-400 font-semibold">{cfg.format(val)}</span>
                  </div>
                  <input
                    type="range"
                    min={cfg.min}
                    max={cfg.max}
                    step={cfg.step}
                    value={val}
                    onChange={(e) => handleSliderChange(cfg.key, e.target.value)}
                    className="w-full"
                    style={{ accentColor: "var(--accent-highlight)" }}
                  />
                  <div className="flex justify-between text-[10px] text-text-tertiary font-mono">
                    <span>{cfg.domain}</span>
                    <span>{cfg.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Spinner size={16} /> : null}
            <span>{loading ? "Propagating Evidence..." : "Run Causal Simulation"}</span>
          </button>
        </div>

        {/* Results Pane */}
        <div className="lg:col-span-7 space-y-6">
          {results ? (
            <>
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Simulated Posterior Health Outcomes
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(PRIMARY_OUTCOME_CONFIGS).map(([key, cfg]) => (
                  <OutcomeCard
                    key={key}
                    config={{ ...cfg, key }}
                    value={results?.expected_values?.[key]}
                    distribution={results?.distributions}
                    baseline={NATIONAL_BASELINE[key]}
                  />
                ))}
              </div>

              {results?.causal_pathways?.length > 0 && (
                <CausalPathways pathways={results.causal_pathways} />
              )}

              <CompareScenarios scenarioA={inputs} />
            </>
          ) : (
            <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-tertiary space-y-3">
              <div className="text-sm font-medium text-text-secondary">Ready for Simulation</div>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Adjust policy variables on the left and click "Run Causal Simulation" to propagate interventions across the 37-node Bayesian network.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
