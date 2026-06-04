// ─────────────────────────────────────────────────────────────────────────────
// DistrictExplorer.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

export function DistrictExplorer() {
  const [districts,   setDistricts]   = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [distData,    setDistData]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [detailLoad,  setDetailLoad]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("literacy_rate");
  const [sortAsc,     setSortAsc]     = useState(false);

  useEffect(() => {
    apiClient.districts().then(d => {
      setDistricts(d.districts || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadDistrict = async (name) => {
    setSelected(name);
    setDistData(null);
    setDetailLoad(true);
    try {
      const res = await apiClient.district(name);
      setDistData(res);
    } catch (e) {
      setDistData({ error: e.message });
    } finally {
      setDetailLoad(false);
    }
  };

  const sortedDistricts = [...districts]
    .filter(d => d.district.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff = (a[sortBy] || 0) - (b[sortBy] || 0);
      return sortAsc ? diff : -diff;
    });

  const METRICS = [
    { key: "literacy_rate",         label: "Literacy %",    color: "#10b981" },
    { key: "dropout_rate",          label: "Dropout %",     color: "#ef4444" },
    { key: "enrollment_rate",       label: "Enroll %",      color: "#3b82f6" },
    { key: "gender_parity_index",   label: "GPI",           color: "#8b5cf6" },
    { key: "digital_access",        label: "Digital %",     color: "#f59e0b" },
    { key: "teacher_student_ratio", label: "TSR",           color: "#6366f1" },
  ];

  if (loading) return <div className="loading-state">Loading district data…</div>;

  return (
    <div className="district-layout">
      {/* Left: District List */}
      <div className="district-list-panel">
        <input
          className="search-input"
          placeholder="Search district…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="sort-row">
          <span className="sort-label">Sort by:</span>
          {["literacy_rate", "dropout_rate", "digital_access"].map(k => (
            <button
              key={k}
              className={`sort-btn ${sortBy === k ? "active" : ""}`}
              onClick={() => { setSortBy(k); setSortAsc(s => sortBy === k ? !s : false); }}
            >
              {k.replace(/_/g," ")}
              {sortBy === k && (sortAsc ? "↑" : "↓")}
            </button>
          ))}
        </div>
        <div className="district-list">
          {sortedDistricts.map(d => (
            <div
              key={d.district}
              className={`district-item ${selected === d.district ? "active" : ""}`}
              onClick={() => loadDistrict(d.district)}
            >
              <div className="district-item-name">
                {d.district}
                {d.tribal_share > 0.30 && <span className="tag tribal">Tribal</span>}
                {d.rural_urban === "urban" && <span className="tag urban">Urban</span>}
              </div>
              <div className="district-item-stats">
                <span style={{color:"#10b981"}}>{d.literacy_rate.toFixed(0)}%</span>
                <span style={{color:"#ef4444"}}>{d.dropout_rate.toFixed(0)}%↑</span>
                <span style={{color:"#8b5cf6"}}>GPI {d.gender_parity_index.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="district-detail-panel">
        {!selected ? (
          <div className="results-empty">
            <div className="empty-icon">◉</div>
            <div className="empty-title">Select a district</div>
            <div className="empty-sub">{districts.length} districts in Madhya Pradesh</div>
          </div>
        ) : detailLoad ? (
          <div className="loading-state">Loading {selected}…</div>
        ) : distData?.error ? (
          <div className="error-msg">⚠ {distData.error}</div>
        ) : distData ? (
          <>
            <div className="district-header">
              <h2>{selected}</h2>
              {distData.latest_data?.tribal_share > 0.30 && (
                <span className="tag tribal">Tribal District</span>
              )}
              {distData.latest_data?.rural_urban === "urban" && (
                <span className="tag urban">Urban</span>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="district-metrics-grid">
              {METRICS.map(({ key, label, color }) => {
                const val = distData.latest_data?.[key];
                return (
                  <div key={key} className="metric-chip" style={{ "--accent": color }}>
                    <div className="metric-val">{val != null ? val.toFixed(key === "gender_parity_index" ? 2 : 1) : "—"}</div>
                    <div className="metric-label">{label}</div>
                  </div>
                );
              })}
            </div>

            {/* Historical trend mini chart */}
            {distData.historical_trend?.length > 1 && (
              <div className="chart-card mini-chart-card">
                <div className="chart-title">Historical Literacy Rate Trend</div>
                <div className="mini-trend">
                  {distData.historical_trend.map((t, i) => (
                    <div key={t.year} className="mini-trend-bar">
                      <div className="trend-bar-fill"
                           style={{ height: `${t.literacy_rate}%`, background: "#10b981" }} />
                      <div className="trend-bar-year">{t.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {distData.analysis && (
              <div className="explanation-box">
                <div className="expl-header">
                  <span>🤖</span>
                  <span>District Analysis — {selected}</span>
                </div>
                <div className="expl-body">
                  {distData.analysis.split("\n").map((line, i) =>
                    line ? <p key={i}>{line}</p> : <br key={i} />
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NLQueryPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────

export function NLQueryPanel() {
  const [query,   setQuery]   = useState("");
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [history, setHistory] = useState([]);

  const EXAMPLE_QUERIES = [
    "What happens if we double digital access in rural schools?",
    "Impact of improving teacher-student ratio from 1:35 to 1:20",
    "If we increase per-student expenditure to ₹15,000 and improve infrastructure by 30%",
    "What if we ensure universal mid-day meal coverage?",
    "Effect of increasing female teacher ratio to 60% on gender parity",
    "Simulate a well-resourced urban district with high infrastructure",
  ];

  const handleSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiClient.nlQuery(query.trim());
      setResult(res);
      setHistory(h => [{ query: query.trim(), result: res }, ...h.slice(0, 4)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const OUTPUT_LABELS = {
    literacy_rate_bin:       { label: "Literacy Rate",   icon: "📚", color: "#10b981" },
    dropout_rate_bin:        { label: "Dropout Rate",    icon: "🚪", color: "#ef4444" },
    enrollment_rate_bin:     { label: "Enrollment Rate", icon: "📋", color: "#3b82f6" },
    gender_parity_index_bin: { label: "Gender Parity",  icon: "⚖️", color: "#8b5cf6" },
    learning_outcome_bin:    { label: "Learning",        icon: "🎓", color: "#f59e0b" },
  };

  return (
    <div className="nlquery-page">
      <div className="nlquery-header">
        <div className="nlquery-title">Ask a Policy Question in Plain English</div>
        <div className="nlquery-sub">
          LLaMA 70B parses your query → Bayesian Network simulates → AI explains results
        </div>
      </div>

      {/* Input */}
      <div className="query-input-wrap">
        <textarea
          className="query-textarea"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. What happens if we double digital access in rural schools?"
          rows={3}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
        />
        <button className="btn-primary btn-query" onClick={handleSubmit} disabled={loading || !query.trim()}>
          {loading ? "Processing…" : "◆ Ask"}
        </button>
      </div>

      {/* Examples */}
      <div className="example-queries">
        <div className="examples-label">Example queries:</div>
        <div className="examples-list">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button key={i} className="example-pill"
                    onClick={() => setQuery(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-msg">⚠ {error}</div>}

      {/* Result */}
      {result && (
        <div className="nlquery-result">
          {/* Parsed inputs */}
          {result.parsed_inputs && Object.keys(result.parsed_inputs).length > 0 && (
            <div className="parsed-inputs">
              <div className="parsed-title">🔍 Extracted Policy Parameters</div>
              <div className="parsed-chips">
                {Object.entries(result.parsed_inputs).map(([k, v]) => (
                  <span key={k} className="parsed-chip">
                    {k.replace(/_/g, " ")}: <strong>{typeof v === "number" ? v.toLocaleString("en-IN") : v}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Outcomes */}
          {result.results && (
            <div className="nlquery-outcomes">
              {Object.entries(result.results).map(([key, data]) => {
                const cfg = OUTPUT_LABELS[key];
                if (!cfg || !data.distribution) return null;
                return (
                  <div key={key} className="nlquery-outcome-card" style={{ "--accent": cfg.color }}>
                    <div className="nlq-outcome-label">{cfg.icon} {cfg.label}</div>
                    <div className="nlq-dominant" style={{ color: cfg.color }}>
                      {data.dominant_state}
                      <span className="nlq-prob">{(data.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="nlq-bar">
                      {["Low","Medium","High"].map(s => (
                        <div key={s} className="nlq-seg"
                             style={{
                               flex: data.distribution[s] || 0,
                               background: s === "High" ? cfg.color :
                                           s === "Medium" ? `${cfg.color}70` : `${cfg.color}25`,
                             }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Explanation */}
          {result.explanation && (
            <div className="explanation-box">
              <div className="expl-header">
                <span>🤖</span>
                <span>AI Policy Explanation</span>
              </div>
              <div className="expl-body">
                {result.explanation.split("\n").map((line, i) =>
                  line ? <p key={i}>{line}</p> : <br key={i} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && !result && (
        <div className="query-history">
          <div className="history-title">Recent Queries</div>
          {history.map((h, i) => (
            <div key={i} className="history-item" onClick={() => { setQuery(h.query); setResult(h.result); }}>
              <span className="history-icon">◆</span>
              <span className="history-q">{h.query}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAGViewer.jsx
// ─────────────────────────────────────────────────────────────────────────────

export function DAGViewer() {
  const [dag,     setDag]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [hover,   setHover]   = useState(null);

  useEffect(() => {
    apiClient.dag()
      .then(d => { setDag(d.dag); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Loading network structure…</div>;
  if (!dag)    return <div className="error-msg">Could not load DAG</div>;

  // Simple force-layout positions (manual for this known graph)
  const POSITIONS = {
    "per_student_exp_bin":       { x: 100, y: 120 },
    "rural_urban":               { x: 100, y: 280 },
    "teacher_student_ratio_bin": { x: 320, y: 60  },
    "infra_index_bin":           { x: 320, y: 200 },
    "mid_day_meal_bin":          { x: 100, y: 400 },
    "female_teacher_ratio_bin":  { x: 100, y: 520 },
    "digital_access_bin":        { x: 540, y: 160 },
    "learning_outcome_bin":      { x: 540, y: 300 },
    "enrollment_rate_bin":       { x: 540, y: 420 },
    "dropout_rate_bin":          { x: 760, y: 240 },
    "literacy_rate_bin":         { x: 760, y: 420 },
    "gender_parity_index_bin":   { x: 760, y: 560 },
  };

  const TYPE_COLORS = {
    input:        "#6366f1",
    context:      "#94a3b8",
    intermediate: "#f59e0b",
    output:       "#10b981",
  };

  const W = 920, H = 640;

  return (
    <div className="dag-page">
      <div className="dag-header">
        <div className="dag-title">Bayesian Network Structure</div>
        <div className="dag-sub">
          Directed Acyclic Graph showing causal relationships between policy inputs and education outcomes
        </div>
      </div>

      <div className="dag-legend">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="dag-legend-item">
            <span className="dag-legend-dot" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>

      <div className="dag-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="dag-svg">
          {/* Edges */}
          {dag.edges.map(({ source, target }, i) => {
            const s = POSITIONS[source];
            const t = POSITIONS[target];
            if (!s || !t) return null;
            const dx = t.x - s.x, dy = t.y - s.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const r = 38;
            const x1 = s.x + (dx/len) * r;
            const y1 = s.y + (dy/len) * r;
            const x2 = t.x - (dx/len) * r;
            const y2 = t.y - (dy/len) * r;
            const isHovered = hover === source || hover === target;
            return (
              <g key={i}>
                <defs>
                  <marker id={`arr-${i}`} markerWidth="8" markerHeight="8"
                          refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z"
                          fill={isHovered ? "#a5b4fc" : "rgba(255,255,255,0.25)"} />
                  </marker>
                </defs>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={isHovered ? "#a5b4fc" : "rgba(255,255,255,0.18)"}
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      markerEnd={`url(#arr-${i})`} />
              </g>
            );
          })}

          {/* Nodes */}
          {dag.nodes.map(node => {
            const pos = POSITIONS[node.id];
            if (!pos) return null;
            const color = TYPE_COLORS[node.type] || "#94a3b8";
            const isHov = hover === node.id;
            return (
              <g key={node.id} transform={`translate(${pos.x},${pos.y})`}
                 onMouseEnter={() => setHover(node.id)}
                 onMouseLeave={() => setHover(null)}
                 style={{ cursor: "pointer" }}>
                <circle r={isHov ? 42 : 38} fill={`${color}22`}
                        stroke={color} strokeWidth={isHov ? 3 : 2} />
                <circle r={isHov ? 36 : 32} fill={`${color}33`} />
                {/* Label */}
                {node.label.split(" ").map((word, wi, arr) => (
                  <text key={wi}
                        y={arr.length === 1 ? 5 : wi === 0 ? -6 : wi === 1 ? 8 : 22}
                        textAnchor="middle" className="dag-node-label" fill={color}>
                    {word}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dag-table">
        <div className="dag-table-title">All Causal Relationships</div>
        <div className="dag-edges-list">
          {dag.edges.map(({ source, target }, i) => {
            const sNode = dag.nodes.find(n => n.id === source);
            const tNode = dag.nodes.find(n => n.id === target);
            return (
              <div key={i} className="dag-edge-row">
                <span className="edge-source" style={{ color: TYPE_COLORS[sNode?.type] }}>
                  {sNode?.label || source}
                </span>
                <span className="edge-arrow">→</span>
                <span className="edge-target" style={{ color: TYPE_COLORS[tNode?.type] }}>
                  {tNode?.label || target}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DistrictExplorer;
