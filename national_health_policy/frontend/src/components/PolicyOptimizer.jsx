import React, { useState } from "react";
import { apiClient } from "../api/client";

export function PolicyOptimizer() {
  const [budgetCr, setBudgetCr] = useState(50); // Default ₹50 Crore
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optimizerResults, setOptimizerResults] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const budgetInr = budgetCr * 10000000;
      const res = await apiClient.optimize(budgetInr);
      setOptimizerResults(res);
    } catch (err) {
      setError(err.message || "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Multi-Objective Policy Optimizer (Pareto Frontier)
          </h2>
          <p className="text-xs text-text-secondary">
            Compute non-dominated public health investment packages under defined budget envelopes.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-surface rounded-full border border-border text-primary-400">
          37-Node Bayesian Topology
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Control Panel: Budget Slider */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-text-primary">
              Public Health Budget Constraint (INR)
            </label>
            <p className="text-[11px] text-text-secondary">
              Set district or state programmatic funding envelope for intervention packages.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold font-mono text-emerald-400">
              ₹{budgetCr} Crore
            </span>
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              {loading ? "Computing Frontier..." : "Find Optimal Packages"}
            </button>
          </div>
        </div>

        <div>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={budgetCr}
            onChange={(e) => setBudgetCr(parseInt(e.target.value, 10))}
            className="w-full"
            style={{ accentColor: "var(--accent-highlight)" }}
          />
          <div className="flex justify-between text-[10px] text-text-tertiary font-mono mt-1">
            <span>₹10 Cr (Targeted Pilot)</span>
            <span>₹250 Cr (State Mission)</span>
            <span>₹500 Cr (National Scale)</span>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {optimizerResults ? (
        <div className="space-y-6">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Pareto-Optimal Intervention Packages ({optimizerResults.pareto_optimal_packages?.length || 0} Found)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {optimizerResults.pareto_optimal_packages?.map((pkg, idx) => {
              const isTop = idx === 0;
              const costCr = (pkg.estimated_cost_inr / 10000000).toFixed(1);
              const interventionsList = Array.isArray(pkg.interventions)
                ? pkg.interventions
                : Object.entries(pkg.interventions || {}).map(([k, v]) => ({
                    label: k.replace(/_bin$/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    action: String(v)
                  }));
              const outcomes = pkg.outcomes || pkg.expected_outcomes || {};
              const score = pkg.overall_score != null ? (pkg.overall_score * 100).toFixed(0) : (outcomes.overall_health_index != null ? Number(outcomes.overall_health_index).toFixed(0) : "80");

              return (
                <div
                  key={pkg.rank || idx}
                  className={`bg-surface rounded-xl border p-5 space-y-4 transition-all relative ${
                    isTop
                      ? "border-primary-500 shadow-sm"
                      : "border-border"
                  }`}
                >
                  {isTop && (
                    <div className="absolute -top-2.5 right-4 bg-primary-600 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      Top Efficiency
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-text-tertiary">PACKAGE #{pkg.rank || idx + 1}</span>
                      <h4 className="text-sm font-bold text-text-primary mt-0.5">{pkg.package_name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-emerald-400">₹{costCr} Cr</div>
                      <div className="text-[10px] text-text-tertiary">Estimated Outlay</div>
                    </div>
                  </div>

                  {/* Interventions in this package */}
                  <div className="space-y-1.5 bg-surface-elevated/40 p-3 rounded-lg border border-border/50 text-xs">
                    <div className="text-[10px] font-semibold text-text-tertiary uppercase">Included Interventions</div>
                    <ul className="space-y-1">
                      {interventionsList.map((item, i) => (
                        <li key={i} className="flex justify-between items-center text-text-secondary">
                          <span className="text-text-primary text-[11px]">{item.label}</span>
                          <span className="font-mono text-primary-400 bg-surface-elevated px-1.5 py-0.5 rounded text-[10px]">
                            {item.action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Outcomes */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60 text-center">
                    <div className="p-2 bg-surface-elevated/30 rounded border border-border/40">
                      <div className="text-[10px] text-text-tertiary">MMR</div>
                      <div className="text-xs font-bold font-mono text-rose-400 mt-0.5">
                        {outcomes.maternal_mortality_rate != null ? Number(outcomes.maternal_mortality_rate).toFixed(0) : "N/A"}
                      </div>
                    </div>
                    <div className="p-2 bg-surface-elevated/30 rounded border border-border/40">
                      <div className="text-[10px] text-text-tertiary">IMR</div>
                      <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">
                        {outcomes.infant_mortality_rate != null ? Number(outcomes.infant_mortality_rate).toFixed(1) : "N/A"}
                      </div>
                    </div>
                    <div className="p-2 bg-surface-elevated/30 rounded border border-border/40">
                      <div className="text-[10px] text-text-tertiary">Health Index</div>
                      <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                        {outcomes.overall_health_index != null ? Number(outcomes.overall_health_index).toFixed(1) : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-text-tertiary">Efficiency Score</span>
                    <span className="font-mono font-bold text-primary-300">
                      {score} / 100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-tertiary space-y-2">
          <div className="text-sm font-medium text-text-secondary">Ready for Optimization</div>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Select your budgetary envelope above and click "Find Optimal Packages" to compute non-dominated policy intervention bundles.
          </p>
        </div>
      )}
    </div>
  );
}

export default PolicyOptimizer;
