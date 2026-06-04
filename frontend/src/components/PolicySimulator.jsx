import { useState, useCallback, useContext } from "react";
import { apiClient, DEFAULT_INPUTS, INPUT_CONFIGS, OUTPUT_CONFIGS } from "../api/client";
import { AppContext } from "../App";

function Slider({ config, value, onChange }) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100;
  const isGood = config.invertGood ? pct < 50 : pct > 50;

  return (
    <div className="slider-wrap">
      <div className="slider-header">
        <span className="slider-icon">{config.icon}</span>
        <span className="slider-label">{config.label}</span>
        <span className="slider-value" style={{ color: config.color }}>
          {config.format(value)}
        </span>
      </div>
      <div className="slider-track-wrap">
        <div className="slider-fill" style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
        }} />
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={e => onChange(+e.target.value)}
          className="slider-input"
          style={{ "--thumb-color": config.color }}
        />
      </div>
      <div className="slider-range">
        <span>{config.format(config.min)}</span>
        <span className={`slider-quality ${isGood ? "good" : "poor"}`}>
          {isGood ? "▲ Better" : "▼ Needs improvement"}
        </span>
        <span>{config.format(config.max)}</span>
      </div>
    </div>
  );
}

function OutcomeGauge({ label, icon, color, distribution, expectedValue, unit, highIsGood }) {
  if (!distribution) return null;

  // For "highIsGood" metrics: best = High, worst = Low → display Low→Med→High (worst→best)
  // For inverted metrics (dropout): best = Low, worst = High → display High→Med→Low (worst→best)
  // This keeps "best outcome at bottom" consistent across all cards
  const displayStates = highIsGood ? ["Low", "Medium", "High"] : ["High", "Medium", "Low"];

  const dominant = Object.entries(distribution).reduce((a, b) => b[1] > a[1] ? b : a, ["?", 0])[0];
  const isPositive = highIsGood ? dominant === "High" : dominant === "Low";

  // For the stacked bar: always order segments so the "good" side is brighter
  const getSegmentColor = (state) => {
    if (highIsGood) {
      return state === "High" ? color : state === "Medium" ? `${color}80` : `${color}30`;
    }
    // For inverted (dropout): Low = good = bright, High = bad = faint
    return state === "Low" ? color : state === "Medium" ? `${color}80` : `${color}30`;
  };

  // Color for probability bars: green for "good" state, red for "bad", neutral for medium
  const getProbBarColor = (state) => {
    const goodState = highIsGood ? "High" : "Low";
    const badState = highIsGood ? "Low" : "High";
    if (state === goodState) return "#10b981";  // green
    if (state === badState) return "#ef4444";    // red
    return "#f59e0b";  // amber for medium
  };

  // State quality tag for clarity
  const getStateTag = (state) => {
    const goodState = highIsGood ? "High" : "Low";
    const badState = highIsGood ? "Low" : "High";
    if (state === goodState) return "✓";
    if (state === badState) return "✗";
    return "~";
  };

  // Dominant label: show what the state actually means
  const dominantLabel = highIsGood
    ? (dominant === "High" ? "High" : dominant === "Low" ? "Low" : "Moderate")
    : (dominant === "Low" ? "Low" : dominant === "High" ? "High" : "Moderate");

  return (
    <div className="outcome-card" style={{ "--accent": color }}>
      <div className="outcome-header">
        <span className="outcome-icon">{icon}</span>
        <span className="outcome-label">{label}</span>
      </div>

      {/* Stacked bar */}
      <div className="outcome-bar">
        {displayStates.map(s => (
          <div
            key={s}
            className={`bar-segment segment-${s.toLowerCase()}`}
            style={{
              width: `${(distribution[s] || 0) * 100}%`,
              background: getSegmentColor(s),
            }}
            title={`${s}: ${((distribution[s] || 0) * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      <div className="outcome-stats">
        <div className={`outcome-dominant ${isPositive ? "positive" : "negative"}`}>
          {dominantLabel}
          <span className="dominant-prob">
            {((distribution[dominant] || 0) * 100).toFixed(0)}%
          </span>
          <span className={`dominant-tag ${isPositive ? "tag-good" : "tag-bad"}`}>
            {isPositive ? "Good" : "Poor"}
          </span>
        </div>
        <div className="outcome-ev">
          EV: {expectedValue?.toFixed(unit === "index" ? 2 : 1)}{unit}
        </div>
      </div>

      <div className="prob-breakdown">
        {displayStates.map(s => (
          <div key={s} className="prob-row">
            <span className="prob-label">
              {s} <span className="state-tag">{getStateTag(s)}</span>
            </span>
            <div className="prob-track">
              <div className="prob-fill"
                   style={{ width: `${(distribution[s] || 0) * 100}%`, background: getProbBarColor(s) }} />
            </div>
            <span className="prob-val">{((distribution[s] || 0) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PolicySimulator() {
  const { setLastSimResult } = useContext(AppContext);
  const [inputs,      setInputs]      = useState({ ...DEFAULT_INPUTS });
  const [ruralUrban,  setRuralUrban]  = useState("rural");
  const [results,     setResults]     = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [explLoading, setExplLoading] = useState(false);
  const [error,       setError]       = useState("");

  const handleSlider = useCallback((key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  }, []);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const inp = { ...inputs, rural_urban: ruralUrban };
      const res = await apiClient.simulate(inp);
      setResults(res.results);
      setLastSimResult({ inputs: inp, results: res.results });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [inputs, ruralUrban, setLastSimResult]);

  const getExplanation = useCallback(async () => {
    if (!results) return;
    setExplLoading(true);
    try {
      const inp = { ...inputs, rural_urban: ruralUrban };
      const res = await apiClient.explain(
        "Explain the impact of these policy parameters on education outcomes",
        inp,
        results
      );
      setExplanation(res.explanation);
    } catch (e) {
      setExplanation(`Error: ${e.message}`);
    } finally {
      setExplLoading(false);
    }
  }, [results, inputs, ruralUrban]);

  const resetToDefault = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setRuralUrban("rural");
    setResults(null);
    setExplanation("");
  };

  return (
    <div className="simulator-layout">
      {/* Left: Controls */}
      <div className="controls-panel">
        <div className="panel-section">
          <div className="section-label">Context</div>
          <div className="toggle-group">
            {["rural", "urban"].map(v => (
              <button
                key={v}
                className={`toggle-btn ${ruralUrban === v ? "active" : ""}`}
                onClick={() => setRuralUrban(v)}
              >
                {v === "rural" ? "🌾 Rural" : "🏙️ Urban"}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="section-label">Policy Variables</div>
          {INPUT_CONFIGS.map(cfg => (
            <Slider
              key={cfg.key}
              config={cfg}
              value={inputs[cfg.key]}
              onChange={val => handleSlider(cfg.key, val)}
            />
          ))}
        </div>

        <div className="controls-actions">
          <button className="btn-primary" onClick={runSimulation} disabled={loading}>
            {loading ? "Simulating…" : "▶ Run Simulation"}
          </button>
          <button className="btn-ghost" onClick={resetToDefault}>
            ↺ Reset
          </button>
        </div>

        {error && <div className="error-msg">⚠ {error}</div>}
      </div>

      {/* Right: Results */}
      <div className="results-panel">
        {!results ? (
          <div className="results-empty">
            <div className="empty-icon">◈</div>
            <div className="empty-title">Adjust sliders and run simulation</div>
            <div className="empty-sub">
              The Bayesian Network will predict education outcomes based on your policy inputs
            </div>
          </div>
        ) : (
          <>
            <div className="results-header">
              <div className="results-title">Simulation Results</div>
              <button
                className="btn-explain"
                onClick={getExplanation}
                disabled={explLoading}
              >
                {explLoading ? "Generating…" : "🤖 AI Explain"}
              </button>
            </div>

            <div className="outcomes-grid">
              {Object.entries(OUTPUT_CONFIGS).map(([key, cfg]) => (
                <OutcomeGauge
                  key={key}
                  label={cfg.label}
                  icon={cfg.icon}
                  color={cfg.color}
                  unit={cfg.unit}
                  highIsGood={cfg.highIsGood}
                  distribution={results[key]?.distribution}
                  expectedValue={results[key]?.expected_value}
                />
              ))}
            </div>

            {explanation && (
              <div className="explanation-box">
                <div className="expl-header">
                  <span>🤖</span>
                  <span>AI Policy Analysis (LLaMA 70B via Groq)</span>
                </div>
                <div className="expl-body">
                  {explanation.split("\n").map((line, i) =>
                    line ? <p key={i}>{line}</p> : <br key={i} />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
