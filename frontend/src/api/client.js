const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const apiClient = {
  health:     ()        => req("GET",  "/health"),
  summary:    ()        => req("GET",  "/summary"),
  trends:     ()        => req("GET",  "/trends"),
  dag:        ()        => req("GET",  "/dag"),
  districts:  ()        => req("GET",  "/districts"),
  district:   (name)    => req("GET",  `/district/${encodeURIComponent(name)}`),

  simulate: (inputs) =>
    req("POST", "/simulate", { inputs }),

  explain: (query, inputs, results = null) =>
    req("POST", "/explain", { query, inputs, results }),

  nlQuery: (query, district = null) =>
    req("POST", "/nl-query", { query, district }),

  compare: (scenarioA, scenarioB, labelA = "Scenario A", labelB = "Scenario B") =>
    req("POST", "/compare", {
      scenario_a: scenarioA,
      scenario_b: scenarioB,
      scenario_a_label: labelA,
      scenario_b_label: labelB,
    }),

  sensitivity: (target = "literacy_rate_bin") =>
    req("GET", `/sensitivity?target=${target}`),
};

// Default policy inputs (MP state averages)
export const DEFAULT_INPUTS = {
  per_student_exp:       9000,
  teacher_student_ratio: 28,
  infra_index:           58,
  digital_access:        35,
  mid_day_meal:          86,
  female_teacher_ratio:  38,
  rural_urban:           "rural",
};

export const INPUT_CONFIGS = [
  {
    key:     "per_student_exp",
    label:   "Per-Student Expenditure",
    unit:    "₹/year",
    min:     2000,
    max:     30000,
    step:    500,
    color:   "#f59e0b",
    icon:    "💰",
    format:  v => `₹${v.toLocaleString("en-IN")}`,
  },
  {
    key:     "teacher_student_ratio",
    label:   "Teacher-Student Ratio",
    unit:    "students/teacher",
    min:     10,
    max:     60,
    step:    1,
    color:   "#6366f1",
    icon:    "👩‍🏫",
    format:  v => `1:${v}`,
    invertGood: true,  // lower is better
  },
  {
    key:     "infra_index",
    label:   "Infrastructure Index",
    unit:    "score (0-100)",
    min:     0,
    max:     100,
    step:    1,
    color:   "#10b981",
    icon:    "🏫",
    format:  v => `${v}/100`,
  },
  {
    key:     "digital_access",
    label:   "Digital Access",
    unit:    "% schools",
    min:     0,
    max:     100,
    step:    1,
    color:   "#3b82f6",
    icon:    "💻",
    format:  v => `${v}%`,
  },
  {
    key:     "mid_day_meal",
    label:   "Mid-Day Meal Coverage",
    unit:    "% students",
    min:     0,
    max:     100,
    step:    1,
    color:   "#f97316",
    icon:    "🍱",
    format:  v => `${v}%`,
  },
  {
    key:     "female_teacher_ratio",
    label:   "Female Teacher Ratio",
    unit:    "% of teachers",
    min:     0,
    max:     80,
    step:    1,
    color:   "#ec4899",
    icon:    "👩",
    format:  v => `${v}%`,
  },
];

export const OUTPUT_CONFIGS = {
  literacy_rate_bin:       { label: "Literacy Rate",        icon: "📚", color: "#10b981", unit: "%",     highIsGood: true },
  dropout_rate_bin:        { label: "Dropout Rate",          icon: "🚪", color: "#ef4444", unit: "%",     highIsGood: false },
  enrollment_rate_bin:     { label: "Enrollment Rate",       icon: "📋", color: "#3b82f6", unit: "%",     highIsGood: true },
  gender_parity_index_bin: { label: "Gender Parity Index",   icon: "⚖️", color: "#8b5cf6", unit: "index", highIsGood: true },
  learning_outcome_bin:    { label: "Learning Outcome",      icon: "🎓", color: "#f59e0b", unit: "score", highIsGood: true },
};
