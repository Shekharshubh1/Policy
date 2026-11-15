/**
 * REST API Client for National Healthcare Policy Decision Intelligence System (NHP-DIS).
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(method, endpoint, payload = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  };
  if (payload) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }
  return response.json();
}

export const apiClient = {
  health: () => request("GET", "/health"),
  summary: () => request("GET", "/summary"),
  states: () => request("GET", "/states"),
  districts: (stateFilter = null, search = null) => {
    const params = new URLSearchParams();
    if (stateFilter) params.append("state_filter", stateFilter);
    if (search) params.append("search", search);
    const q = params.toString() ? `?${params.toString()}` : "";
    return request("GET", `/districts${q}`);
  },
  district: (name) => request("GET", `/district/${encodeURIComponent(name)}`),
  simulate: (inputs) => request("POST", "/simulate", { inputs }),
  compare: (scenarioA, scenarioB, labelA = "Scenario A", labelB = "Scenario B") =>
    request("POST", "/compare", {
      scenario_a: scenarioA,
      scenario_b: scenarioB,
      label_a: labelA,
      label_b: labelB
    }),
  forecast: (districtName = null, interventions = null, startYear = 2020, endYear = 2035, interventionStartYear = 2025) =>
    request("POST", "/forecast", {
      district_name: districtName,
      interventions,
      start_year: startYear,
      end_year: endYear,
      intervention_start_year: interventionStartYear
    }),
  sensitivity: (target = "maternal_mortality_rate_bin") =>
    request("GET", `/sensitivity?target=${target}`),
  optimize: (budgetInr = 500000000.0) =>
    request("POST", "/optimize", { budget_inr: budgetInr }),
  nlQuery: (query, districtName = null) =>
    request("POST", "/nl-query", { query, district_name: districtName }),
  dag: () => request("GET", "/dag"),
};

// National Default Baseline Policy Inputs (Calibrated from NFHS-5 & RHS Official Data)
export const DEFAULT_POLICY_INPUTS = {
  per_capita_health_expenditure: 3800,
  public_health_budget_share: 2.5,
  insurance_coverage: 40.2,
  hospital_density: 2.5,
  phc_density: 6.0,
  bed_availability: 15.0,
  doctor_ratio: 8.5,
  nurse_ratio: 16.0,
  specialist_availability: 28.0,
  asha_worker_density: 12.0,
  immunization_rate: 77.7,
  screening_coverage: 35.0,
  institutional_delivery_rate: 88.7,
  female_literacy: 73.4,
  sanitation_access: 71.9,
  clean_water_access: 93.8,
  telemedicine_access: 48.0,
  digital_health_records: 36.0,
};

// Continuous Slider Configurations for Frontend Interactive Controls
export const INPUT_SLIDER_CONFIGS = [
  {
    key: "specialist_availability",
    label: "CHC Specialist Doctors",
    unit: "% required posts",
    domain: "Human Resources",
    min: 0,
    max: 100,
    step: 1,
    color: "#ec4899",
    icon: "👨‍⚕️",
    format: (v) => `${v}%`
  },
  {
    key: "doctor_ratio",
    label: "Doctor-Patient Ratio",
    unit: "per 10k population",
    domain: "Human Resources",
    min: 0.5,
    max: 25.0,
    step: 0.1,
    color: "#8b5cf6",
    icon: "🩺",
    format: (v) => `${v} / 10k`
  },
  {
    key: "institutional_delivery_rate",
    label: "Institutional Deliveries",
    unit: "% live births",
    domain: "Preventive Care",
    min: 30,
    max: 100,
    step: 0.5,
    color: "#3b82f6",
    icon: "🏥",
    format: (v) => `${v}%`
  },
  {
    key: "immunization_rate",
    label: "Full Child Immunization",
    unit: "% children 12-23m",
    domain: "Preventive Care",
    min: 30,
    max: 100,
    step: 0.5,
    color: "#10b981",
    icon: "💉",
    format: (v) => `${v}%`
  },
  {
    key: "clean_water_access",
    label: "Piped Clean Tap Water",
    unit: "% households (JJM)",
    domain: "Social Determinants",
    min: 20,
    max: 100,
    step: 0.5,
    color: "#06b6d4",
    icon: "🚰",
    format: (v) => `${v}%`
  },
  {
    key: "sanitation_access",
    label: "Improved Sanitation (IHHL)",
    unit: "% households (SBM)",
    domain: "Social Determinants",
    min: 20,
    max: 100,
    step: 0.5,
    color: "#f59e0b",
    icon: "🚻",
    format: (v) => `${v}%`
  },
  {
    key: "female_literacy",
    label: "Female Literacy Rate",
    unit: "% females age 7+",
    domain: "Social Determinants",
    min: 25,
    max: 100,
    step: 0.5,
    color: "#a855f7",
    icon: "📚",
    format: (v) => `${v}%`
  },
  {
    key: "public_health_budget_share",
    label: "Public Health Budget Share",
    unit: "% of GSDP",
    domain: "Spending",
    min: 0.5,
    max: 10.0,
    step: 0.1,
    color: "#10b981",
    icon: "💰",
    format: (v) => `${v}%`
  },
  {
    key: "insurance_coverage",
    label: "Health Insurance (PM-JAY)",
    unit: "% population",
    domain: "Spending",
    min: 0,
    max: 100,
    step: 1,
    color: "#38bdf8",
    icon: "🛡️",
    format: (v) => `${v}%`
  },
  {
    key: "telemedicine_access",
    label: "eSanjeevani Teleconsultation",
    unit: "% HWCs connected",
    domain: "Digital Health",
    min: 0,
    max: 100,
    step: 1,
    color: "#6366f1",
    icon: "💻",
    format: (v) => `${v}%`
  },
  {
    key: "bed_availability",
    label: "Hospital Bed Density",
    unit: "beds / 10k pop",
    domain: "Infrastructure",
    min: 3,
    max: 100,
    step: 1,
    color: "#f97316",
    icon: "🛏️",
    format: (v) => `${v} beds`
  },
  {
    key: "asha_worker_density",
    label: "Community ASHAs",
    unit: "per 10k rural",
    domain: "Human Resources",
    min: 2,
    max: 35,
    step: 0.5,
    color: "#f43f5e",
    icon: "👩‍🌾",
    format: (v) => `${v} / 10k`
  }
];

export const PRIMARY_OUTCOME_CONFIGS = {
  maternal_mortality_rate: {
    label: "Maternal Mortality Ratio (MMR)",
    icon: "🤰",
    unit: "per 100k live births",
    target: 70.0,
    color: "#ef4444",
    highIsGood: false,
    format: (v) => `${Math.round(v)} / 100k`
  },
  infant_mortality_rate: {
    label: "Infant Mortality Rate (IMR)",
    icon: "👶",
    unit: "per 1,000 live births",
    target: 23.0,
    color: "#f59e0b",
    highIsGood: false,
    format: (v) => `${v.toFixed(1)} / 1k`
  },
  life_expectancy: {
    label: "Life Expectancy at Birth",
    icon: "⏳",
    unit: "years",
    target: 75.0,
    color: "#10b981",
    highIsGood: true,
    format: (v) => `${v.toFixed(1)} yrs`
  },
  health_equity_index: {
    label: "Health Equity Score",
    icon: "⚖️",
    unit: "index (0-100)",
    target: 80.0,
    color: "#8b5cf6",
    highIsGood: true,
    format: (v) => `${v.toFixed(1)} / 100`
  },
  universal_health_coverage_score: {
    label: "Universal Health Coverage (UHC)",
    icon: "🌐",
    unit: "SDG 3.8.1 (0-100)",
    target: 80.0,
    color: "#06b6d4",
    highIsGood: true,
    format: (v) => `${v.toFixed(1)} / 100`
  },
  overall_health_index: {
    label: "Overall Health Index",
    icon: "🏆",
    unit: "Composite (0-100)",
    target: 75.0,
    color: "#3b82f6",
    highIsGood: true,
    format: (v) => `${v.toFixed(1)} / 100`
  }
};
