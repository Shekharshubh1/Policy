# National Healthcare Policy Prediction and Decision Intelligence System (NHP-DIS)
## Document 06: RESTful API Gateway Specification

---

### API Architecture

The NHP-DIS backend exposes a high-performance asynchronous RESTful API powered by **FastAPI** (`backend/main.py`), running on Uvicorn with CORS middleware enabled for seamless frontend integration.

- **Base URL:** `http://localhost:8000`
- **Interactive Documentation:** `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc`
- **Protocol:** HTTP/1.1 & HTTP/2 with JSON payloads.

---

### 1. Endpoints Directory

| HTTP Verb | Endpoint | Purpose | Computational Complexity |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | System health, model readiness, record counts | $\mathcal{O}(1)$ |
| `GET` | `/summary` | National indicators and data provenance summary | $\mathcal{O}(1)$ |
| `GET` | `/districts` | Searchable directory of 698 official districts | $\mathcal{O}(N)$ filter |
| `GET` | `/district/{name}` | Historical waves & telemetry for a named district | $\mathcal{O}(1)$ index |
| `GET` | `/states` | Aggregated state rankings and performance table | $\mathcal{O}(N)$ groupby |
| `POST` | `/simulate` | Causal Bayesian simulation ($do$-calculus) | $\mathcal{O}(\text{VE})$ |
| `POST` | `/compare` | Side-by-side counterfactual scenario comparator | $2 \times \mathcal{O}(\text{VE})$ |
| `POST` | `/forecast` | Longitudinal 2015–2035 DBN trajectory simulation | $\mathcal{O}(T \times M)$ |
| `GET` | `/sensitivity` | Tornado impact ranking against target outcome | $K \times \mathcal{O}(\text{VE})$ |
| `POST` | `/optimize` | Multi-objective Pareto frontier policy package search| $\mathcal{O}(P \log P)$ |
| `POST` | `/nl-query` | Neuro-symbolic LLM copilot query synthesis | $\mathcal{O}(\text{VE}) + \text{LLM}$ |
| `GET` | `/dag` | Structural nodes, edges, and domain metadata | $\mathcal{O}(V + E)$ |

---

### 2. Core Endpoint Details & Schemas

#### 2.1 Causal Policy Simulation (`POST /simulate`)
Executes Pearl's interventional simulation. Converts continuous slider values into quantile bins and runs Variable Elimination.

**Request Payload:**
```json
{
  "inputs": {
    "per_capita_health_expenditure": 4200.0,
    "public_health_budget_share": 3.0,
    "insurance_coverage": 65.0,
    "hospital_density": 3.2,
    "phc_density": 7.0,
    "bed_availability": 22.0,
    "doctor_ratio": 12.0,
    "nurse_ratio": 24.0,
    "specialist_availability": 60.0,
    "asha_worker_density": 16.0,
    "immunization_rate": 92.0,
    "screening_coverage": 45.0,
    "institutional_delivery_rate": 96.0,
    "female_literacy": 82.0,
    "sanitation_access": 88.0,
    "clean_water_access": 95.0,
    "telemedicine_access": 70.0,
    "digital_health_records": 55.0
  }
}
```

**Response Payload (HTTP 200 OK):**
```json
{
  "status": "success",
  "interventions_applied": {
    "specialist_availability_bin": "High",
    "institutional_delivery_rate_bin": "High",
    "sanitation_access_bin": "High"
  },
  "expected_values": {
    "maternal_mortality_rate": 64.2,
    "infant_mortality_rate": 18.5,
    "life_expectancy": 72.4,
    "health_equity_index": 78.1,
    "universal_health_coverage_score": 79.4,
    "overall_health_index": 76.8
  },
  "distributions": {
    "maternal_mortality_rate_bin": { "Low": 0.65, "Medium": 0.25, "High": 0.10 }
  },
  "causal_pathways": [
    {
      "path": ["specialist_availability_bin", "service_quality_bin", "maternal_health_status_bin", "maternal_mortality_rate_bin"],
      "length": 4
    }
  ]
}
```

---

#### 2.2 Longitudinal Forecasting (`POST /forecast`)
Projects annual health trajectories from 2015 to 2035 via the 2-Time-Slice Dynamic Bayesian Network.

**Request Payload:**
```json
{
  "district_name": "Varanasi",
  "interventions": {
    "institutional_delivery_rate": "High",
    "specialist_availability": "High",
    "sanitation_access": "High"
  },
  "start_year": 2020,
  "end_year": 2035,
  "intervention_start_year": 2025
}
```

**Response Payload:**
```json
{
  "status": "success",
  "district_analyzed": "Varanasi",
  "forecast": {
    "years": [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035],
    "status_quo": {
      "infant_mortality_rate": [32.1, 31.8, 31.5, 31.1, 30.7, 30.2, 29.8, 29.3, 28.9, 28.4, 28.0, 27.5, 27.1, 26.6, 26.2, 25.7],
      "maternal_mortality_rate": [128, 126, 124, 122, 120, 118, 116, 114, 112, 110, 108, 106, 104, 102, 100, 98]
    },
    "intervention": {
      "infant_mortality_rate": [32.1, 31.8, 31.5, 31.1, 30.7, 28.5, 26.1, 23.8, 21.9, 20.2, 18.7, 17.4, 16.2, 15.1, 14.2, 13.4],
      "maternal_mortality_rate": [128, 126, 124, 122, 120, 104, 91, 80, 71, 64, 58, 53, 49, 45, 42, 39]
    }
  }
}
```

---

#### 2.3 Neuro-Symbolic Policy Copilot (`POST /nl-query`)
Processes free-text policy questions, extracts causal interventions, simulates outcomes, and generates an executive brief using Groq LLaMA-3.3-70B with deterministic fallback.

**Request Payload:**
```json
{
  "query": "What happens to maternal and infant mortality if we scale institutional deliveries to 95% and specialist doctor staffing to High in rural districts?",
  "district_name": "Sitapur"
}
```
