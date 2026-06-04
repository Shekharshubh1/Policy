import { useState } from "react";
import { apiClient, DEFAULT_INPUTS, INPUT_CONFIGS, OUTPUT_CONFIGS } from "../api/client";

const SCENARIO_PRESETS = [
  {
    name: "Digital Push",
    desc: "High digital access + better infrastructure",
    inputs: { ...DEFAULT_INPUTS, digital_access: 70, infra_index: 80 }
  },
  {
    name: "Teacher Reform",
    desc: "Better teacher-student ratio + more female teachers",
    inputs: { ...DEFAULT_INPUTS, teacher_student_ratio: 18, female_teacher_ratio: 55 }
  },
  {
    name: "High Spending",
    desc: "Doubled per-student expenditure",
    inputs: { ...DEFAULT_INPUTS, per_student_exp: 18000 }
  },
  {
    name: "Nutrition Focus",
    desc: "Near-universal mid-day meal + modest infrastructure",
    inputs: { ...DEFAULT_INPUTS, mid_day_meal: 98, infra_index: 68 }
  },
  {
    name: "Tribal District",
    desc: "Challenging baseline (tribal, rural, low resources)",
    inputs: { ...DEFAULT_INPUTS, per_student_exp: 5000, infra_index: 30, digital_access: 10, rural_urban: "rural" }
  },
  {
    name: "Urban Ideal",
    desc: "Urban well-resourced school district",
    inputs: { ...DEFAULT_INPUTS, per_student_exp: 18000, infra_index: 88, digital_access: 80, rural_urban: "urban" }
  },
];

function MiniSlider({ config, value, onChange }) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100;
  return (
    <div className="mini-slider">
      <div className="mini-slider-header">
        <span>{config.icon}</span>
        <span className="mini-label">{config.label}</span>
        <span className="mini-val" style={{ color: config.color }}>{config.format(value)}</span>
      </div>
      <input
        type="range"
        min={config.min} max={config.max} step={config.step}
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="mini-range"
        style={{ "--fill": `${pct}%`, "--color": config.color }}
      />
    </div>
  );
}

function DeltaBadge({ delta, highIsGood }) {
  const positive = highIsGood ? delta > 0 : delta < 0;
  const neutral  = Math.abs(delta) < 0.5;
  const cls = neutral ? "delta-neutral" : positive ? "delta-positive" : "delta-negative";
  const icon = neutral ? "—" : (positive ? "▲" : "▼");
  return (
    <span className={`delta-badge ${cls}`}>
      {icon} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

function ResultBar({ evA, evB, color, highIsGood }) {
  const maxVal = 100;
  const winner = highIsGood ? (evA > evB ? "a" : "b") : (evA < evB ? "a" : "b");
  return (
    <div className="comp-bars">
      <div className={`comp-bar-row ${winner === "a" ? "winner" : ""}`}>
        <span className="bar-label">A</span>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${(evA/maxVal)*100}%`, background: "#6366f1" }} />
        </div>
        <span className="bar-val">{evA.toFixed(1)}</span>
      </div>
      <div className={`comp-bar-row ${winner === "b" ? "winner" : ""}`}>
        <span className="bar-label">B</span>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${(evB/maxVal)*100}%`, background: "#10b981" }} />
        </div>
        <span className="bar-val">{evB.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function PolicyComparison() {
  const [inputsA,   setInputsA]   = useState({ ...DEFAULT_INPUTS });
  const [inputsB,   setInputsB]   = useState({ ...DEFAULT_INPUTS, digital_access: 65, infra_index: 75 });
  const [labelA,    setLabelA]    = useState("Current Policy");
  const [labelB,    setLabelB]    = useState("Proposed Policy");
  const [results,   setResults]   = useState(null);
  const [narrative, setNarrative] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const applyPreset = (scenario, side) => {
    const fn = side === "a" ? setInputsA : setInputsB;
    const lfn = side === "a" ? setLabelA : setLabelB;
    fn({ ...scenario.inputs });
    lfn(scenario.name);
  };

  const runComparison = async () => {
    setLoading(true);
    setError("");
    setResults(null);
    setNarrative("");
    try {
      const res = await apiClient.compare(inputsA, inputsB, labelA, labelB);
      setResults(res.comparison);
      setNarrative(res.narrative);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compare-page">
      {/* Preset row */}
      <div className="presets-row">
        <div className="presets-label">Quick Presets</div>
        <div className="presets-list">
          {SCENARIO_PRESETS.map(p => (
            <div key={p.name} className="preset-card">
              <div className="preset-name">{p.name}</div>
              <div className="preset-desc">{p.desc}</div>
              <div className="preset-actions">
                <button onClick={() => applyPreset(p, "a")}>→ A</button>
                <button onClick={() => applyPreset(p, "b")}>→ B</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two scenario columns */}
      <div className="compare-scenarios">
        {/* Scenario A */}
        <div className="scenario-panel scenario-a">
          <div className="scenario-header">
            <input
              className="scenario-name-input"
              value={labelA}
              onChange={e => setLabelA(e.target.value)}
              placeholder="Scenario A name"
            />
            <div className="scenario-badge badge-a">A</div>
          </div>
          <div className="scenario-context">
            {["rural","urban"].map(v => (
              <button key={v}
                className={`ctx-btn ${inputsA.rural_urban === v ? "active-a" : ""}`}
                onClick={() => setInputsA(p => ({...p, rural_urban: v}))}>
                {v === "rural" ? "🌾" : "🏙️"} {v}
              </button>
            ))}
          </div>
          {INPUT_CONFIGS.map(cfg => (
            <MiniSlider
              key={cfg.key}
              config={cfg}
              value={inputsA[cfg.key]}
              onChange={v => setInputsA(p => ({ ...p, [cfg.key]: v }))}
            />
          ))}
        </div>

        {/* VS divider */}
        <div className="vs-divider">
          <div className="vs-text">VS</div>
          <button className="btn-compare" onClick={runComparison} disabled={loading}>
            {loading ? "…" : "⇌"}
          </button>
        </div>

        {/* Scenario B */}
        <div className="scenario-panel scenario-b">
          <div className="scenario-header">
            <input
              className="scenario-name-input"
              value={labelB}
              onChange={e => setLabelB(e.target.value)}
              placeholder="Scenario B name"
            />
            <div className="scenario-badge badge-b">B</div>
          </div>
          <div className="scenario-context">
            {["rural","urban"].map(v => (
              <button key={v}
                className={`ctx-btn ${inputsB.rural_urban === v ? "active-b" : ""}`}
                onClick={() => setInputsB(p => ({...p, rural_urban: v}))}>
                {v === "rural" ? "🌾" : "🏙️"} {v}
              </button>
            ))}
          </div>
          {INPUT_CONFIGS.map(cfg => (
            <MiniSlider
              key={cfg.key}
              config={cfg}
              value={inputsB[cfg.key]}
              onChange={v => setInputsB(p => ({ ...p, [cfg.key]: v }))}
            />
          ))}
        </div>
      </div>

      <div className="compare-run-row">
        <button className="btn-primary btn-wide" onClick={runComparison} disabled={loading}>
          {loading ? "Comparing Scenarios…" : "⇌ Compare Scenarios"}
        </button>
        {error && <div className="error-msg">⚠ {error}</div>}
      </div>

      {/* Results */}
      {results && (
        <div className="compare-results">
          <div className="results-title">Comparison Results</div>

          <div className="comp-outcomes-grid">
            {Object.entries(results).map(([key, data]) => {
              const cfg = OUTPUT_CONFIGS[key] || { label: key, highIsGood: true };
              return (
                <div key={key} className="comp-outcome-card">
                  <div className="comp-outcome-header">
                    <span>{OUTPUT_CONFIGS[key]?.icon} {data.label || cfg.label}</span>
                    <DeltaBadge delta={data.delta} highIsGood={cfg.highIsGood} />
                  </div>
                  <ResultBar
                    evA={data.scenario_a?.expected_value || 0}
                    evB={data.scenario_b?.expected_value || 0}
                    color={cfg.color}
                    highIsGood={cfg.highIsGood}
                  />
                  <div className="comp-winner-label">
                    {Math.abs(data.delta) < 0.5
                      ? "No significant difference"
                      : `${data.winner === "B" ? labelB : labelA} performs better`}
                  </div>
                </div>
              );
            })}
          </div>

          {narrative && (
            <div className="explanation-box">
              <div className="expl-header">
                <span>🤖</span>
                <span>AI Policy Comparison (LLaMA 70B via Groq)</span>
              </div>
              <div className="expl-body">
                {narrative.split("\n").map((line, i) =>
                  line ? <p key={i}>{line}</p> : <br key={i} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
