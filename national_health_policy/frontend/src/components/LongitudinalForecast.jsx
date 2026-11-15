import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const INTERVENTION_OPTIONS = ["Low", "Medium", "High"];

const DEFAULT_INTERVENTIONS = {
  immunization_rate: "High",
  institutional_delivery_rate: "High",
  sanitation_access: "High",
};

function buildChartData(forecast) {
  if (!forecast || !forecast.years) return [];
  const years = forecast.years || [];
  const status_quo = forecast.status_quo || {};
  const intervention = forecast.trajectories || forecast.intervention || {};
  return years.map((year, i) => ({
    year,
    sq_imr: status_quo.infant_mortality_rate?.[i] ?? 0,
    int_imr: intervention.infant_mortality_rate?.[i] ?? 0,
    sq_mmr: status_quo.maternal_mortality_rate?.[i] ?? 0,
    int_mmr: intervention.maternal_mortality_rate?.[i] ?? 0,
  }));
}

function deltaLabel(forecast, key, year = 2035) {
  if (!forecast || !forecast.years) return null;
  const years = forecast.years || [];
  const status_quo = forecast.status_quo || {};
  const intervention = forecast.trajectories || forecast.intervention || {};
  const idx = years.indexOf(year);
  if (idx === -1) return null;
  const intVal = intervention[key]?.[idx];
  const sqVal = status_quo[key]?.[idx];
  if (intVal == null || sqVal == null) return null;
  const delta = intVal - sqVal;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} by ${year}`;
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface-elevated border border-border p-3 rounded-lg shadow-lg text-xs space-y-1">
      <div className="text-text-tertiary font-mono">Year {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4 font-mono">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="font-semibold text-text-primary">
            {p.value} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrajectoryChart({
  title,
  data,
  sqKey,
  intKey,
  sdgTarget,
  sdgLabel,
  unit,
  badgeText,
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary">Status Quo Drift vs. Target Policy Package</p>
        </div>
        {badgeText && (
          <span className="px-2.5 py-1 rounded bg-surface-elevated border border-border text-emerald-400 font-mono text-xs">
            {badgeText}
          </span>
        )}
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(val) => <span className="text-text-secondary">{val}</span>}
            />
            {sdgTarget != null && (
              <ReferenceLine
                y={sdgTarget}
                stroke="#0284c7"
                strokeDasharray="4 4"
                label={{ value: sdgLabel, position: "insideTopRight", fill: "#38bdf8", fontSize: 10 }}
              />
            )}
            <Line
              type="monotone"
              dataKey={sqKey}
              name="Status Quo Drift"
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey={intKey}
              name="Active Policy Package"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function LongitudinalForecast() {
  const [districtName, setDistrictName] = useState("");
  const [districtsList, setDistrictsList] = useState([]);
  const [interventions, setInterventions] = useState({ ...DEFAULT_INTERVENTIONS });
  const [forecast, setForecast] = useState(null);
  const [districtAnalyzed, setDistrictAnalyzed] = useState("National Average");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.forecast(null, null, 2015, 2035, 2025),
      apiClient.districts()
    ])
      .then(([foreRes, distRes]) => {
        setForecast(foreRes.forecast);
        setDistrictAnalyzed(foreRes.district_analyzed || "National Average");
        const list = Array.isArray(distRes) ? distRes : distRes?.districts || [];
        setDistrictsList(list);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load baseline forecast.");
        setLoading(false);
      });
  }, []);

  const handleRunForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.forecast(
        districtName.trim() || null,
        interventions,
        2020,
        2035,
        2025
      );
      setForecast(res.forecast);
      setDistrictAnalyzed(res.district_analyzed || (districtName.trim() || "National Average"));
    } catch (err) {
      setError(err.message || "Failed to execute longitudinal forecast.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = buildChartData(forecast);
  const imrDelta = deltaLabel(forecast, "infant_mortality_rate", 2035);
  const mmrDelta = deltaLabel(forecast, "maternal_mortality_rate", 2035);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Longitudinal Health Trajectory Forecast (2015–2035)
          </h2>
          <p className="text-xs text-text-secondary">
            2-Time-Slice Dynamic Bayesian Network (2TBN) projecting multi-year health impacts against SDG targets.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 bg-surface rounded-full border border-border text-primary-400">
          Target: {districtAnalyzed}
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">
            District Focus (optional):
          </label>
          <input
            type="text"
            list="districts-forecast-list"
            placeholder="Type or pick any of 698 districts..."
            value={districtName}
            onChange={(e) => setDistrictName(e.target.value)}
            className="w-full bg-surface-elevated border border-border text-text-primary px-3 py-1.5 rounded text-xs focus:border-primary-500 placeholder-text-tertiary"
          />
          <datalist id="districts-forecast-list">
            {districtsList.map((d) => (
              <option key={`${d.state_name}-${d.district_name}`} value={d.district_name}>
                {d.state_name}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">
            Immunization Coverage:
          </label>
          <select
            value={interventions.immunization_rate}
            onChange={(e) => setInterventions({ ...interventions, immunization_rate: e.target.value })}
            className="w-full bg-surface-elevated border border-border text-text-primary px-3 py-1.5 rounded text-xs focus:border-primary-500"
          >
            {INTERVENTION_OPTIONS.map((o) => (
              <option key={o} value={o}>{o} Level</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">
            Institutional Deliveries:
          </label>
          <select
            value={interventions.institutional_delivery_rate}
            onChange={(e) => setInterventions({ ...interventions, institutional_delivery_rate: e.target.value })}
            className="w-full bg-surface-elevated border border-border text-text-primary px-3 py-1.5 rounded text-xs focus:border-primary-500"
          >
            {INTERVENTION_OPTIONS.map((o) => (
              <option key={o} value={o}>{o} Level</option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleRunForecast}
            disabled={loading}
            className="w-full py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Running 2TBN..." : "Run Forecast"}
          </button>
        </div>
      </div>

      {/* Trajectory Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrajectoryChart
          title="Infant Mortality Rate (IMR)"
          data={chartData}
          sqKey="sq_imr"
          intKey="int_imr"
          sdgTarget={23.0}
          sdgLabel="SDG 3.2 Target (23.0)"
          unit="per 1k"
          badgeText={imrDelta ? `Delta: ${imrDelta}` : null}
        />

        <TrajectoryChart
          title="Maternal Mortality Ratio (MMR)"
          data={chartData}
          sqKey="sq_mmr"
          intKey="int_mmr"
          sdgTarget={70.0}
          sdgLabel="SDG 3.1 Target (70.0)"
          unit="per 100k"
          badgeText={mmrDelta ? `Delta: ${mmrDelta}` : null}
        />
      </div>
    </div>
  );
}
