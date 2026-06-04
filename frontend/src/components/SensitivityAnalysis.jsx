import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

const TARGET_OPTIONS = [
  { value: "literacy_rate_bin",       label: "📚 Literacy Rate" },
  { value: "dropout_rate_bin",        label: "🚪 Dropout Rate" },
  { value: "enrollment_rate_bin",     label: "📋 Enrollment Rate" },
  { value: "gender_parity_index_bin", label: "⚖️ Gender Parity Index" },
  { value: "learning_outcome_bin",    label: "🎓 Learning Outcome" },
];

const DIRECTION_COLORS = {
  positive: "#10b981",
  negative: "#ef4444",
};

function TornadoChart({ data, targetLabel }) {
  if (!data?.length) return null;

  const maxImpact = Math.max(...data.map(d => d.impact_score));
  const width     = 600;
  const barH      = 36;
  const pad       = { top: 20, bottom: 20, left: 180, right: 80 };
  const totalH    = data.length * barH + pad.top + pad.bottom;
  const chartW    = width - pad.left - pad.right;

  return (
    <svg viewBox={`0 0 ${width} ${totalH}`} className="tornado-svg">
      {data.map((item, i) => {
        const barLen = (item.impact_score / maxImpact) * chartW;
        const y      = pad.top + i * barH;
        const color  = DIRECTION_COLORS[item.direction];

        return (
          <g key={item.variable}>
            {/* Label */}
            <text x={pad.left - 8} y={y + barH / 2 + 5}
                  textAnchor="end" className="tornado-label">
              {item.label}
            </text>
            {/* Bar */}
            <rect x={pad.left} y={y + 4} width={barLen} height={barH - 10}
                  rx={4} fill={color} opacity={0.85} />
            {/* Impact score */}
            <text x={pad.left + barLen + 8} y={y + barH / 2 + 5}
                  className="tornado-val" fill={color}>
              {(item.impact_score * 100).toFixed(1)}%
            </text>
            {/* Direction badge */}
            <text x={pad.left + barLen - 6} y={y + barH / 2 + 5}
                  textAnchor="end" className="tornado-dir" fill="white">
              {item.direction === "positive" ? "▲" : "▼"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function InsightCard({ item, rank }) {
  const color = DIRECTION_COLORS[item.direction];
  const pctLow  = (item.prob_high_when_low * 100).toFixed(0);
  const pctHigh = (item.prob_high_when_high * 100).toFixed(0);
  const delta   = (item.prob_high_when_high - item.prob_high_when_low) * 100;

  return (
    <div className="insight-card" style={{ "--accent": color }}>
      <div className="insight-rank">#{rank}</div>
      <div className="insight-body">
        <div className="insight-name">{item.label}</div>
        <div className="insight-stats">
          <div className="insight-stat">
            <span className="stat-label">When Low</span>
            <span className="stat-val">{pctLow}% chance of High outcome</span>
          </div>
          <div className="insight-arrow" style={{ color }}>
            {item.direction === "positive" ? "→" : "↘"} {delta > 0 ? "+" : ""}{delta.toFixed(0)}%
          </div>
          <div className="insight-stat">
            <span className="stat-label">When High</span>
            <span className="stat-val">{pctHigh}% chance of High outcome</span>
          </div>
        </div>
        <div className="insight-impact-bar">
          <div className="impact-fill"
               style={{ width: `${item.impact_score * 400}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

export default function SensitivityAnalysis() {
  const [target,          setTarget]          = useState("literacy_rate_bin");
  const [sensitivity,     setSensitivity]     = useState([]);
  const [recommendations, setRecommendations] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  const runAnalysis = async (tgt = target) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.sensitivity(tgt);
      setSensitivity(res.sensitivity || []);
      setRecommendations(res.recommendations || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAnalysis(); }, []);

  const handleTargetChange = (val) => {
    setTarget(val);
    runAnalysis(val);
  };

  const targetLabel = TARGET_OPTIONS.find(t => t.value === target)?.label || target;

  return (
    <div className="sensitivity-page">
      {/* Target selector */}
      <div className="target-selector">
        <div className="selector-label">Analyze sensitivity of:</div>
        <div className="selector-pills">
          {TARGET_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`target-pill ${target === opt.value ? "active" : ""}`}
              onClick={() => handleTargetChange(opt.value)}
              disabled={loading}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-msg">⚠ {error}</div>}

      {loading ? (
        <div className="loading-state">Running sensitivity analysis…</div>
      ) : sensitivity.length > 0 ? (
        <>
          {/* Tornado Chart */}
          <div className="chart-card">
            <div className="chart-title">
              Tornado Chart — Impact on {targetLabel}
              <span className="chart-subtitle">
                How much each variable shifts the probability of "High" outcome (Low → High)
              </span>
            </div>
            <TornadoChart data={sensitivity} targetLabel={targetLabel} />
            <div className="tornado-legend">
              <span className="legend-item"><span className="legend-dot" style={{background:"#10b981"}}/>Positive impact (more = better outcome)</span>
              <span className="legend-item"><span className="legend-dot" style={{background:"#ef4444"}}/>Negative impact (more = worse outcome)</span>
            </div>
          </div>

          {/* Insight Cards */}
          <div className="insights-section">
            <div className="section-title">Top Influencing Factors</div>
            <div className="insights-grid">
              {sensitivity.slice(0, 6).map((item, i) => (
                <InsightCard key={item.variable} item={item} rank={i + 1} />
              ))}
            </div>
          </div>

          {/* Key Finding */}
          <div className="key-finding">
            <div className="finding-title">🔑 Key Finding</div>
            <div className="finding-body">
              The most influential factor for{" "}
              <strong>{targetLabel}</strong> in Madhya Pradesh is{" "}
              <strong>{sensitivity[0]?.label}</strong>, with an impact score of{" "}
              <strong>{(sensitivity[0]?.impact_score * 100).toFixed(1)}%</strong>.
              This means moving this variable from Low to High increases the probability
              of a "High" outcome by {((sensitivity[0]?.prob_high_when_high - sensitivity[0]?.prob_high_when_low) * 100).toFixed(0)} percentage points.
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations && (
            <div className="explanation-box">
              <div className="expl-header">
                <span>🤖</span>
                <span>Strategic Recommendations (LLaMA 70B via Groq)</span>
              </div>
              <div className="expl-body">
                {recommendations.split("\n").map((line, i) =>
                  line ? <p key={i}>{line}</p> : <br key={i} />
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="loading-state">No data available</div>
      )}
    </div>
  );
}
