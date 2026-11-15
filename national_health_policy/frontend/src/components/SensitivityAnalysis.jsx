import React, { useState, useEffect } from "react";
import { apiClient, PRIMARY_OUTCOME_CONFIGS } from "../api/client";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function TornadoRow({ item, maxAbsScore }) {
  const isPositive = item.direction === "positive";
  const pct = maxAbsScore > 0 ? (Math.abs(item.impact_score) / maxAbsScore) * 100 : 0;

  return (
    <div className="grid grid-cols-12 items-center gap-3 py-2 px-3 rounded-lg bg-surface-elevated/30 border border-border/40 text-xs">
      <div className="col-span-4 flex items-center justify-between pr-2">
        <span className="font-medium text-text-primary truncate">{item.label}</span>
        <span className="text-[10px] text-text-tertiary font-mono">{item.domain}</span>
      </div>

      <div className="col-span-6 relative h-4 bg-surface-elevated rounded overflow-hidden flex items-center">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/80 z-10" />

        {isPositive ? (
          <div
            className="absolute left-1/2 h-full bg-emerald-500/80 rounded-r"
            style={{ width: `${pct / 2}%`, transition: "width 0.4s ease" }}
          />
        ) : (
          <div
            className="absolute right-1/2 h-full bg-rose-500/80 rounded-l"
            style={{ width: `${pct / 2}%`, transition: "width 0.4s ease" }}
          />
        )}
      </div>

      <div className="col-span-2 text-right font-mono font-semibold">
        <span style={{ color: isPositive ? "var(--semantic-positive)" : "var(--semantic-negative)" }}>
          {isPositive ? "+" : "−"}{Math.abs(item.impact_score).toFixed(3)}
        </span>
      </div>
    </div>
  );
}

export default function SensitivityAnalysis() {
  const outcomeKeys = Object.keys(PRIMARY_OUTCOME_CONFIGS);
  const [target, setTarget] = useState(
    outcomeKeys.length > 0 ? outcomeKeys[0] + "_bin" : "maternal_mortality_rate_bin"
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    setError(null);

    apiClient
      .sensitivity(target)
      .then((res) => {
        const sorted = [...(res.rankings || [])].sort(
          (a, b) => Math.abs(b.impact_score) - Math.abs(a.impact_score)
        );
        setData({ ...res, rankings: sorted });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load sensitivity analysis");
        setLoading(false);
      });
  }, [target]);

  const rankings = data?.rankings || [];
  const maxAbsScore = rankings.length > 0
    ? Math.max(...rankings.map((r) => Math.abs(r.impact_score)))
    : 1;

  function formatTargetLabel(key) {
    const base = key.replace(/_bin$/, "");
    return PRIMARY_OUTCOME_CONFIGS[base]?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Tornado Sensitivity Analysis
          </h2>
          <p className="text-xs text-text-secondary">
            Measure how each public health variable impacts outcome probabilities across the causal graph.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="target-select" className="text-xs text-text-tertiary">
            Target Outcome:
          </label>
          <select
            id="target-select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-surface border border-border text-text-primary px-3 py-1.5 rounded text-xs focus:border-primary-500"
          >
            {outcomeKeys.map((k) => (
              <option key={k} value={k + "_bin"}>
                {PRIMARY_OUTCOME_CONFIGS[k]?.label ?? formatTargetLabel(k + "_bin")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          {rankings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-xl p-4 space-y-1">
                <div className="text-[11px] font-semibold text-text-tertiary uppercase">Primary Lever</div>
                <div className="text-lg font-bold font-mono text-primary-400">{rankings[0].label}</div>
                <div className="text-xs text-text-secondary">
                  Impact score of {rankings[0].impact_score.toFixed(3)} ({rankings[0].domain})
                </div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4 space-y-1">
                <div className="text-[11px] font-semibold text-text-tertiary uppercase">Policy Implication</div>
                <div className="text-xs text-text-secondary leading-relaxed pt-1">
                  Prioritizing investments in {rankings[0].label} yields the highest marginal reduction in adverse outcomes.
                </div>
              </div>
            </div>
          )}

          {/* Tornado Rows */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-[11px] text-text-tertiary pb-2 border-b border-border">
              <span>Policy Lever & Domain</span>
              <span className="text-center">Negative Impact &larr; &nbsp; &rarr; Positive Impact</span>
              <span>Marginal Score</span>
            </div>

            <div className="space-y-1.5 pt-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {rankings.map((item) => (
                <TornadoRow key={item.variable} item={item} maxAbsScore={maxAbsScore} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
