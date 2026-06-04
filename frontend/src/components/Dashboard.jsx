import { useState, useEffect } from "react";
import { apiClient, OUTPUT_CONFIGS } from "../api/client";

const COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444"];

function KPICard({ label, value, unit, icon, color, trend }) {
  return (
    <div className="kpi-card" style={{ "--accent": color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">
          {value !== null ? `${value}${unit}` : "—"}
        </div>
        <div className="kpi-label">{label}</div>
        {trend !== undefined && (
          <div className={`kpi-trend ${trend > 0 ? "up" : "down"}`}>
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}{unit} vs prior year
          </div>
        )}
      </div>
    </div>
  );
}

function TrendChart({ trends, keys, colors }) {
  if (!trends?.length) return <div className="chart-empty">Loading…</div>;

  const width  = 560;
  const height = 200;
  const pad    = { top: 20, right: 20, bottom: 40, left: 50 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;

  const years = trends.map(t => t.year);
  const xScale = i => (i / (years.length - 1)) * W;

  const allVals = keys.flatMap(k => trends.map(t => t[k])).filter(Boolean);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const yScale = v => H - ((v - minV) / (maxV - minV + 0.01)) * H;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
      <g transform={`translate(${pad.left},${pad.top})`}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={0} x2={W} y1={H * t} y2={H * t}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        {/* Lines */}
        {keys.map((key, ki) => {
          const pts = trends.map((t, i) => `${xScale(i)},${yScale(t[key] || 0)}`);
          const d   = "M" + pts.join(" L");
          return (
            <g key={key}>
              <path d={d} fill="none" stroke={colors[ki]} strokeWidth={2.5}
                    strokeLinecap="round" strokeLinejoin="round" />
              {trends.map((t, i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(t[key] || 0)} r={4}
                        fill={colors[ki]} stroke="var(--bg-card)" strokeWidth={2} />
              ))}
            </g>
          );
        })}
        {/* X axis */}
        {years.map((y, i) => (
          <text key={y} x={xScale(i)} y={H + 20} textAnchor="middle"
                className="axis-label">{y}</text>
        ))}
        {/* Y axis */}
        {[minV, maxV].map((v, i) => (
          <text key={i} x={-8} y={i === 0 ? H : 6} textAnchor="end"
                className="axis-label">{v.toFixed(0)}</text>
        ))}
      </g>
    </svg>
  );
}

function DistrictRankChart({ districts, metric, color }) {
  if (!districts?.length) return null;
  const sorted = [...districts].sort((a, b) => b[metric] - a[metric]);
  const top10  = sorted.slice(0, 10);
  const max    = top10[0]?.[metric] || 100;

  return (
    <div className="rank-chart">
      {top10.map((d, i) => (
        <div key={d.district} className="rank-row">
          <span className="rank-num">{i + 1}</span>
          <span className="rank-name">{d.district}</span>
          <div className="rank-bar-wrap">
            <div className="rank-bar"
                 style={{ width: `${(d[metric] / max) * 100}%`, background: color }} />
          </div>
          <span className="rank-val">{d[metric].toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [summary,   setSummary]   = useState(null);
  const [trends,    setTrends]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.summary(),
      apiClient.trends(),
      apiClient.districts(),
    ]).then(([s, t, d]) => {
      setSummary(s);
      setTrends(t.trends || []);
      setDistricts(d.districts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading MP education data…</div>;

  const latest     = trends[trends.length - 1] || {};
  const prevYear   = trends[trends.length - 2] || {};
  const stateAvg   = summary || {};

  const kpis = [
    { key: "literacy_rate",   label: "Literacy Rate",      icon: "📚", color: "#10b981", unit: "%" },
    { key: "dropout_rate",    label: "Dropout Rate",        icon: "🚪", color: "#ef4444", unit: "%" },
    { key: "enrollment_rate", label: "Enrollment Rate",     icon: "📋", color: "#3b82f6", unit: "%" },
    { key: "gender_parity_index", label: "Gender Parity",  icon: "⚖️", color: "#8b5cf6", unit: "" },
    { key: "digital_access",  label: "Digital Access",      icon: "💻", color: "#f59e0b", unit: "%" },
  ];

  return (
    <div className="dashboard-page">
      {/* Intro banner */}
      <div className="info-banner">
        <span className="banner-icon">ℹ</span>
        <span>
          Data based on UDISE+ 2021-22, NFHS-5, Census 2011, and ASER 2022 for <strong>Madhya Pradesh</strong> —
          52 districts · 5 years of education statistics
        </span>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map(({ key, label, icon, color, unit }) => (
          <KPICard
            key={key}
            label={label}
            value={latest[key] != null ? latest[key].toFixed(1) : stateAvg[`state_avg_${key.replace("_rate","")}`] || null}
            unit={unit}
            icon={icon}
            color={color}
            trend={prevYear[key] != null ? (latest[key] - prevYear[key]) : undefined}
          />
        ))}
      </div>

      {/* Trend Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">📈 Literacy & Enrollment Trends</div>
          <TrendChart
            trends={trends}
            keys={["literacy_rate", "enrollment_rate"]}
            colors={["#10b981", "#3b82f6"]}
          />
          <div className="chart-legend">
            {[{k:"literacy_rate",l:"Literacy",c:"#10b981"},{k:"enrollment_rate",l:"Enrollment",c:"#3b82f6"}]
              .map(({l,c}) => (
                <span key={l} className="legend-item">
                  <span className="legend-dot" style={{background:c}}/>
                  {l}
                </span>
              ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">📉 Dropout Rate Trend</div>
          <TrendChart
            trends={trends}
            keys={["dropout_rate"]}
            colors={["#ef4444"]}
          />
          <div className="chart-note">Lower is better — target: &lt;10% by 2030</div>
        </div>

        <div className="chart-card">
          <div className="chart-title">💻 Digital Access Growth</div>
          <TrendChart
            trends={trends}
            keys={["digital_access", "infra_index"]}
            colors={["#3b82f6", "#10b981"]}
          />
          <div className="chart-legend">
            {[{l:"Digital Access",c:"#3b82f6"},{l:"Infrastructure",c:"#10b981"}]
              .map(({l,c}) => (
                <span key={l} className="legend-item">
                  <span className="legend-dot" style={{background:c}}/>
                  {l}
                </span>
              ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">⚖️ Gender Parity Trend</div>
          <TrendChart
            trends={trends}
            keys={["gender_parity_index"]}
            colors={["#8b5cf6"]}
          />
          <div className="chart-note">GPI=1.0 means perfect parity · Target: &gt;0.98</div>
        </div>
      </div>

      {/* District Rankings */}
      <div className="rankings-grid">
        <div className="chart-card">
          <div className="chart-title">🏆 Top Districts — Literacy Rate</div>
          <DistrictRankChart districts={districts} metric="literacy_rate" color="#10b981" />
        </div>
        <div className="chart-card">
          <div className="chart-title">⚠️ Highest Dropout Districts</div>
          <DistrictRankChart districts={districts} metric="dropout_rate" color="#ef4444" />
        </div>
      </div>

      {/* Data Note */}
      <div className="data-note">
        <strong>Data Note:</strong> Augmented dataset grounded in UDISE+ 2021-22, NFHS-5 (2019-21),
        Census 2011, and ASER 2022 published district-level statistics. Tribal districts (Jhabua,
        Alirajpur, Dindori, Mandla) reflect documented lower outcomes; urban districts (Indore,
        Bhopal) reflect higher outcomes per official reports.
      </div>
    </div>
  );
}
