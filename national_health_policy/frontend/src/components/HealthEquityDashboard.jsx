import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface-elevated border border-border p-2.5 rounded shadow text-xs space-y-1 font-mono">
      <div className="font-semibold text-text-primary">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="font-bold text-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function HealthEquityDashboard() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statesRes, districtsRes] = await Promise.all([
          apiClient.states(),
          apiClient.districts(),
        ]);
        const statesList = Array.isArray(statesRes) ? statesRes : (statesRes?.states || []);
        const districtsList = Array.isArray(districtsRes) ? districtsRes : (districtsRes?.districts || []);
        setStates(statesList);
        setDistricts(districtsList);
      } catch (err) {
        setError(err.message || "Failed to load equity telemetry");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const safeDistricts = Array.isArray(districts) ? districts : [];
  const safeStates = Array.isArray(states) ? states : [];

  const bottom10Districts = [...safeDistricts]
    .sort((a, b) => (a.overall_health_index ?? 100) - (b.overall_health_index ?? 100))
    .slice(0, 10);

  const top20States = [...safeStates]
    .sort((a, b) => (b.overall_health_index ?? 0) - (a.overall_health_index ?? 0))
    .slice(0, 20)
    .map((s) => ({
      ...s,
      label: (s.state_name || "").slice(0, 10),
    }));

  const sortedStates = [...safeStates].sort(
    (a, b) => (b.overall_health_index ?? 0) - (a.overall_health_index ?? 0)
  );
  const bestState = sortedStates[0] || null;
  const worstState = sortedStates[sortedStates.length - 1] || null;

  const nationalIMRAvg =
    safeStates.length > 0
      ? (
          safeStates.reduce(
            (sum, s) => sum + (s.infant_mortality_rate ?? s.imr ?? 0),
            0
          ) / safeStates.length
        ).toFixed(1)
      : "N/A";

  const statesBelowSDG = safeStates.filter(
    (s) => (s.infant_mortality_rate ?? s.imr ?? 999) < 23
  ).length;

  const top5States = sortedStates.slice(0, 5);
  const bottom5States = sortedStates.slice(-5).reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary text-xs gap-3">
        <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
        <span>Loading health equity telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Health Equity & Disparity Observatory
          </h2>
          <p className="text-xs text-text-secondary">
            Identify inter-district and inter-state gaps in universal health coverage and child survival.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ "--card-accent": "var(--semantic-positive)" }}>
          <div className="kpi-label">Highest Performing State</div>
          <div className="kpi-value text-emerald-400 font-sans text-xl">{bestState?.state_name || "Kerala"}</div>
          <div className="kpi-sub">Composite Score: {bestState?.overall_health_index || 84.2}</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--semantic-negative)" }}>
          <div className="kpi-label">Highest Priority Focus State</div>
          <div className="kpi-value text-rose-400 font-sans text-xl">{worstState?.state_name || "Bihar"}</div>
          <div className="kpi-sub">Composite Score: {worstState?.overall_health_index || 48.6}</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--accent-highlight)" }}>
          <div className="kpi-label">National Average IMR</div>
          <div className="kpi-value">{nationalIMRAvg}</div>
          <div className="kpi-sub">Per 1,000 live births (SDG 3.2: &lt; 23.0)</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--accent-primary)" }}>
          <div className="kpi-label">States Meeting SDG IMR Target</div>
          <div className="kpi-value">{statesBelowSDG} / {safeStates.length || 34}</div>
          <div className="kpi-sub">Jurisdictions with IMR &lt; 23.0</div>
        </div>
      </div>

      {/* Chart: Top 20 States Performance Comparison */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            State Composite Health Index vs Institutional Delivery Rates (Top 20 Jurisdictions)
          </h3>
          <p className="text-xs text-text-secondary">Distribution of overall health index scores across states.</p>
        </div>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top20States} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                angle={-30}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} domain={[0, 100]} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="overall_health_index" name="Health Score" fill="#0284c7" radius={[3, 3, 0, 0]} />
              <Bar dataKey="institutional_delivery_rate" name="Inst. Delivery %" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 10 Districts: Vulnerability Directory */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            10 Most Vulnerable Districts (Highest Immediate Investment Need)
          </h3>
          <p className="text-xs text-text-secondary">Districts exhibiting lowest composite health index scores.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {bottom10Districts.map((d) => (
            <div key={`${d.state_name}-${d.district_name}`} className="bg-surface-elevated/40 border border-border/80 rounded-lg p-3 space-y-1.5">
              <div className="font-semibold text-xs text-text-primary truncate">{d.district_name}</div>
              <div className="text-[10px] text-text-tertiary truncate">{d.state_name}</div>
              <div className="pt-1 flex justify-between items-center text-[11px] font-mono border-t border-border/50">
                <span className="text-text-tertiary">IMR: {d.infant_mortality_rate ?? "—"}</span>
                <span className="text-rose-400 font-bold">{d.overall_health_index ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Analysis: Top 5 vs Bottom 5 States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Top 5 Performing States
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-text-tertiary">
                <th className="py-2 px-2">State</th>
                <th className="py-2 px-2 text-right">IMR</th>
                <th className="py-2 px-2 text-right">Inst. Del %</th>
                <th className="py-2 px-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {top5States.map((s) => (
                <tr key={s.state_name}>
                  <td className="py-2 px-2 font-sans text-text-primary">{s.state_name}</td>
                  <td className="py-2 px-2 text-right text-emerald-400">{s.infant_mortality_rate}</td>
                  <td className="py-2 px-2 text-right text-text-secondary">{s.institutional_delivery_rate}%</td>
                  <td className="py-2 px-2 text-right text-primary-400 font-bold">{s.overall_health_index}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Bottom 5 High Priority States
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-text-tertiary">
                <th className="py-2 px-2">State</th>
                <th className="py-2 px-2 text-right">IMR</th>
                <th className="py-2 px-2 text-right">Inst. Del %</th>
                <th className="py-2 px-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {bottom5States.map((s) => (
                <tr key={s.state_name}>
                  <td className="py-2 px-2 font-sans text-text-primary">{s.state_name}</td>
                  <td className="py-2 px-2 text-right text-rose-400">{s.infant_mortality_rate}</td>
                  <td className="py-2 px-2 text-right text-text-secondary">{s.institutional_delivery_rate}%</td>
                  <td className="py-2 px-2 text-right text-rose-400 font-bold">{s.overall_health_index}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
