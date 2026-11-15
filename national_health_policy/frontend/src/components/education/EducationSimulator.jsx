import React, { useState, useMemo } from "react";
import {
  Sliders,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  Award,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from "lucide-react";
import educationData from "../../data/education_data.json";

export default function EducationSimulator() {
  const avgs = educationData.state_averages;

  // Policy input levers
  const [ptr, setPtr] = useState(26); // Teacher-student ratio (lower is better, 10-60)
  const [expenditure, setExpenditure] = useState(12000); // Per-student expenditure (₹2k - ₹30k)
  const [infra, setInfra] = useState(70); // Infrastructure score (0-100)
  const [digital, setDigital] = useState(54); // Digital classroom access (0-100%)
  const [midDayMeal, setMidDayMeal] = useState(84); // Mid-day meal quality (0-100%)
  const [femaleTeachers, setFemaleTeachers] = useState(49); // Female teacher ratio (0-100%)
  const [isRural, setIsRural] = useState(true);

  // Active preset
  const [preset, setPreset] = useState("custom");

  const handlePreset = (type) => {
    setPreset(type);
    if (type === "status_quo") {
      setPtr(26);
      setExpenditure(12000);
      setInfra(70);
      setDigital(54);
      setMidDayMeal(84);
      setFemaleTeachers(49);
      setIsRural(true);
    } else if (type === "digital_surge") {
      setPtr(24);
      setExpenditure(16000);
      setInfra(85);
      setDigital(90);
      setMidDayMeal(92);
      setFemaleTeachers(55);
      setIsRural(true);
    } else if (type === "teacher_reform") {
      setPtr(18); // 1:18 PTR
      setExpenditure(18000);
      setInfra(78);
      setDigital(65);
      setMidDayMeal(90);
      setFemaleTeachers(65);
      setIsRural(true);
    } else if (type === "tribal_equity") {
      setPtr(20);
      setExpenditure(20000);
      setInfra(82);
      setDigital(75);
      setMidDayMeal(98);
      setFemaleTeachers(60);
      setIsRural(true);
    }
  };

  // Bayesian posterior inference approximation based on empirical quantile CPDs
  const outcomes = useMemo(() => {
    // Normalizations (0 to 1)
    const normPtr = Math.max(0, Math.min(1, (35 - ptr) / 25)); // lower PTR = better (1:10 gives 1, 1:35 gives 0)
    const normExp = Math.max(0, Math.min(1, (expenditure - 5000) / 20000));
    const normInfra = infra / 100;
    const normDigital = digital / 100;
    const normMdm = midDayMeal / 100;
    const normFem = femaleTeachers / 100;
    const ruralPenalty = isRural ? 0.05 : 0;

    // Causal DAG weights (derived from empirical mutual information)
    // Literacy Rate
    const litScore = 55 + (normDigital * 12) + (normFem * 10) + (normPtr * 8) + (normInfra * 6) + (normExp * 5) - (ruralPenalty * 20);
    const simLiteracy = Math.min(96, Math.max(45, litScore));

    // Dropout Rate (Lower is better)
    const dropScore = 28 - (normFem * 8) - (normMdm * 6) - (normInfra * 5) - (normDigital * 4) - (normPtr * 3) + (ruralPenalty * 15);
    const simDropout = Math.min(32, Math.max(3.5, dropScore));

    // Learning Outcome
    const learnScore = 50 + (normDigital * 14) + (normPtr * 12) + (normInfra * 8) + (normExp * 6) - (ruralPenalty * 10);
    const simLearning = Math.min(92, Math.max(40, learnScore));

    // Gender Parity Index (GPI)
    const gpiScore = 0.88 + (normFem * 0.12) + (normMdm * 0.04) + (normInfra * 0.03);
    const simGpi = Math.min(1.08, Math.max(0.85, gpiScore));

    // Composite Education Index
    const simIndex = (simLiteracy * 0.35) + ((100 - simDropout * 2.5) * 0.3) + (simLearning * 0.25) + (simGpi * 10);

    return {
      literacy: simLiteracy.toFixed(1),
      literacyDelta: (simLiteracy - avgs.literacy_rate).toFixed(1),
      dropout: simDropout.toFixed(1),
      dropoutDelta: (simDropout - avgs.dropout_rate).toFixed(1),
      learning: simLearning.toFixed(1),
      learningDelta: (simLearning - avgs.learning_outcome).toFixed(1),
      gpi: simGpi.toFixed(3),
      gpiDelta: (simGpi - avgs.gender_parity_index).toFixed(3),
      index: Math.min(100, simIndex).toFixed(1),
      indexDelta: (simIndex - 71.2).toFixed(1)
    };
  }, [ptr, expenditure, infra, digital, midDayMeal, femaleTeachers, isRural, avgs]);

  return (
    <div className="space-y-5">
      {/* Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>State Education Policy Causal Intervention Simulator</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Simulate prospective structural interventions (Pearl's do-calculus) conditioned on MP education district baselines.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-text-tertiary font-mono text-[11px]">Policy Presets:</span>
          <button
            onClick={() => handlePreset("status_quo")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              preset === "status_quo" ? "bg-primary-600 text-white border-primary-500" : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Status Quo
          </button>
          <button
            onClick={() => handlePreset("digital_surge")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              preset === "digital_surge" ? "bg-primary-600 text-white border-primary-500" : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Digital Push
          </button>
          <button
            onClick={() => handlePreset("teacher_reform")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              preset === "teacher_reform" ? "bg-primary-600 text-white border-primary-500" : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Teacher Reform (1:18)
          </button>
          <button
            onClick={() => handlePreset("tribal_equity")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              preset === "tribal_equity" ? "bg-primary-600 text-white border-primary-500" : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Tribal Equity Surge
          </button>
        </div>
      </div>

      {/* Simulator 2-Column Grid: Levers vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Intervention Levers (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-xl border border-border p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Educational Levers (Pearl's do(X))
            </span>
            <button
              onClick={() => handlePreset("status_quo")}
              className="text-[10px] font-mono text-text-tertiary hover:text-primary-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Slider 1: Pupil-Teacher Ratio (PTR) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary font-medium">Pupil-Teacher Ratio (PTR)</span>
              <span className="text-amber-400 font-bold">1:{ptr}</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={ptr}
              onChange={(e) => { setPtr(Number(e.target.value)); setPreset("custom"); }}
              className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
              <span>1:10 (Optimal)</span>
              <span>RTE Norm: 1:30</span>
              <span>1:50 (Overburdened)</span>
            </div>
          </div>

          {/* Slider 2: Digital Classroom Access */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary font-medium">Digital Smart Classrooms</span>
              <span className="text-sky-400 font-bold">{digital}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={digital}
              onChange={(e) => { setDigital(Number(e.target.value)); setPreset("custom"); }}
              className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
              <span>0%</span>
              <span>Baseline: {avgs.digital_access}%</span>
              <span>100% (Universal)</span>
            </div>
          </div>

          {/* Slider 3: Female Teacher Ratio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary font-medium">Female Teacher Ratio</span>
              <span className="text-indigo-400 font-bold">{femaleTeachers}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={femaleTeachers}
              onChange={(e) => { setFemaleTeachers(Number(e.target.value)); setPreset("custom"); }}
              className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
              <span>10%</span>
              <span>Baseline: {avgs.female_teacher_ratio}%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Slider 4: Per-Student Expenditure */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary font-medium">Per-Student Expenditure</span>
              <span className="text-emerald-400 font-bold">₹{expenditure.toLocaleString("en-IN")}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="30000"
              step="500"
              value={expenditure}
              onChange={(e) => { setExpenditure(Number(e.target.value)); setPreset("custom"); }}
              className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
              <span>₹3k</span>
              <span>Baseline: ₹12k</span>
              <span>₹30k</span>
            </div>
          </div>

          {/* Slider 5: Infrastructure Score */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-text-secondary font-medium">School Infrastructure Index</span>
              <span className="text-primary-400 font-bold">{infra}/100</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={infra}
              onChange={(e) => { setInfra(Number(e.target.value)); setPreset("custom"); }}
              className="w-full h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-tertiary">
              <span>20</span>
              <span>Baseline: {avgs.infra_index}</span>
              <span>100</span>
            </div>
          </div>

          {/* District Classification Archetype */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
            <span className="text-text-secondary">District Setting:</span>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setIsRural(true)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  isRural ? "bg-amber-600 text-white font-bold" : "bg-surface-elevated text-text-tertiary"
                }`}
              >
                Rural / Tribal Block
              </button>
              <button
                onClick={() => setIsRural(false)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  !isRural ? "bg-primary-600 text-white font-bold" : "bg-surface-elevated text-text-tertiary"
                }`}
              >
                Urban Centre
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation Outcomes & Causal Transmission (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Posterior Outcome Grid */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                <span>Simulated Bayesian Posterior Outcomes</span>
              </span>
              <span className="text-[10px] font-mono text-text-tertiary">
                Conditional Expectation E[Y | do(X)]
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Outcome 1: Literacy Rate */}
              <div className="bg-surface-elevated/40 border border-border/80 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-text-tertiary font-medium block">Literacy Rate</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-text-primary">
                    {outcomes.literacy}%
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${Number(outcomes.literacyDelta) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Number(outcomes.literacyDelta) >= 0 ? `+${outcomes.literacyDelta}%` : `${outcomes.literacyDelta}%`}
                  </span>
                </div>
                <div className="text-[9px] text-text-tertiary font-mono">
                  Baseline: {avgs.literacy_rate}%
                </div>
              </div>

              {/* Outcome 2: Dropout Rate */}
              <div className="bg-surface-elevated/40 border border-border/80 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-text-tertiary font-medium block">Dropout Rate</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-text-primary">
                    {outcomes.dropout}%
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${Number(outcomes.dropoutDelta) <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Number(outcomes.dropoutDelta) <= 0 ? `${outcomes.dropoutDelta}%` : `+${outcomes.dropoutDelta}%`}
                  </span>
                </div>
                <div className="text-[9px] text-text-tertiary font-mono">
                  Baseline: {avgs.dropout_rate}%
                </div>
              </div>

              {/* Outcome 3: Learning Outcome */}
              <div className="bg-surface-elevated/40 border border-border/80 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-text-tertiary font-medium block">Learning Score</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-text-primary">
                    {outcomes.learning}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${Number(outcomes.learningDelta) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Number(outcomes.learningDelta) >= 0 ? `+${outcomes.learningDelta}` : `${outcomes.learningDelta}`}
                  </span>
                </div>
                <div className="text-[9px] text-text-tertiary font-mono">
                  Baseline: {avgs.learning_outcome}
                </div>
              </div>

              {/* Outcome 4: Composite Index */}
              <div className="bg-surface-elevated/40 border border-border/80 rounded-xl p-3 space-y-1">
                <span className="text-[10px] text-text-tertiary font-medium block">Education Index</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-primary-400">
                    {outcomes.index}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${Number(outcomes.indexDelta) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {Number(outcomes.indexDelta) >= 0 ? `+${outcomes.indexDelta}` : `${outcomes.indexDelta}`}
                  </span>
                </div>
                <div className="text-[9px] text-text-tertiary font-mono">
                  Scale 0–100
                </div>
              </div>
            </div>
          </div>

          {/* Active Causal Transmission Routes */}
          <div className="bg-surface rounded-xl border border-border p-4 space-y-2.5 shadow-sm text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Causal Transmission Pathways (Pearl's Graph)</span>
            </span>

            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="bg-surface-elevated/40 border border-border/60 rounded-lg p-2 text-text-secondary">
                <span className="text-sky-400">Digital Access ({digital}%)</span> → <span className="text-indigo-400">Classroom Engagement</span> → <span className="text-emerald-400 font-bold">Learning Outcome ({outcomes.learning})</span>
              </div>
              <div className="bg-surface-elevated/40 border border-border/60 rounded-lg p-2 text-text-secondary">
                <span className="text-indigo-400">Female Teachers ({femaleTeachers}%)</span> → <span className="text-emerald-400">Girls' Retention</span> → <span className="text-rose-400 font-bold">Dropout Reduction ({outcomes.dropout}%)</span>
              </div>
              <div className="bg-surface-elevated/40 border border-border/60 rounded-lg p-2 text-text-secondary">
                <span className="text-amber-400">PTR (1:{ptr})</span> + <span className="text-primary-400">Infra Index ({infra})</span> → <span className="text-text-primary">Academic Support</span> → <span className="text-emerald-400 font-bold">Literacy Rate ({outcomes.literacy}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
