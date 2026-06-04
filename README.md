# ◈ MP Education Policy Modeling System
### AI-powered Bayesian simulation for education policy in Madhya Pradesh

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![pgmpy](https://img.shields.io/badge/pgmpy-0.1.25-orange)](https://pgmpy.org)
[![LLaMA](https://img.shields.io/badge/LLaMA-70B%20via%20Groq-purple)](https://groq.com)

---

## 🎯 Overview

A full-stack AI system that simulates the causal impact of education policies across
**52 districts of Madhya Pradesh** using:
- **Bayesian Network** (pgmpy) — causal probabilistic modeling
- **LLaMA 70B via Groq** — natural language query parsing & policy explanation
- **FastAPI** backend with 7 REST endpoints
- **React** dashboard with sliders, charts, sensitivity analysis, and district explorer

---

## 📊 Data Sources

All data is grounded in official published statistics:

| Source | Coverage | URL |
|--------|----------|-----|
| **UDISE+ 2021-22** | Enrollment, teachers, infrastructure | https://udiseplus.gov.in/ |
| **NFHS-5 (2019-21)** | Literacy, gender indicators | https://rchiips.org/nfhs/ |
| **Census 2011** | District literacy rates | https://censusindia.gov.in |
| **ASER 2022** | Learning outcomes (NAS proxy) | https://asercentre.org/ |
| **MP State Budget 2021-22** | Per-student expenditure | https://mpfinance.gov.in/ |

> **Note:** The system attempts real downloads from data.gov.in and UDISE+ APIs.
> If unavailable (login walls, API limits), it uses a statistically-grounded dataset
> seeded from official published district-level factsheets for all 52 MP districts.
> See `data/data_sources.json` after running for full source documentation.

---

## 🏗️ Architecture

```
User Input
    │
    ▼
React Frontend (Vite + React 18)
    │  Sliders, Charts, NL Query Box
    │
    ▼ REST API
FastAPI Backend
    ├── /simulate  ──→ Bayesian Network (pgmpy)
    │                      ├── Variable Elimination inference
    │                      └── Probability distributions
    ├── /explain   ──→ Groq LLaMA 70B
    │                      └── Policy explanation
    ├── /compare   ──→ BN + LLM
    ├── /nl-query  ──→ LLM parse → BN → LLM explain
    ├── /sensitivity ──→ Tornado analysis
    ├── /districts ──→ District explorer
    └── /dag       ──→ Graph structure
```

### Bayesian Network DAG

```
per_student_exp ──────→ infra_index ────────→ enrollment_rate ──→ literacy_rate
      │                     │                                           ↑
      ├──→ teacher_ratio     └──→ digital_access ──→ learning_outcome ──┤
      │          │                     │                  ↑             │
      └──→ digital_access              └──────────────────┘             │
                                                                        │
teacher_ratio ──→ learning_outcome ──→ dropout_rate ──────────────→ literacy_rate
mid_day_meal  ──→ enrollment_rate
mid_day_meal  ──→ dropout_rate
female_teacher_ratio ──→ gender_parity_index
rural_urban   ──→ infra_index
rural_urban   ──→ digital_access
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API key](https://console.groq.com/) (free tier available — for LLM features)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd mp_edu_policy

# Copy environment file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Download data & train model
cd ..
python scripts/download_data.py   # Downloads/generates dataset
python scripts/train_model.py     # Trains Bayesian Network

# Start backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 4. Verify Installation

```bash
# Check backend health
curl http://localhost:8000/health

# Run a test simulation
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"per_student_exp": 12000, "teacher_student_ratio": 22, "infra_index": 70, "digital_access": 60, "mid_day_meal": 90, "female_teacher_ratio": 45, "rural_urban": "rural"}}'
```

---

## 🔌 API Reference

### `POST /simulate`
Run Bayesian Network simulation.

```json
Request:
{
  "inputs": {
    "per_student_exp": 9000,
    "teacher_student_ratio": 28,
    "infra_index": 58,
    "digital_access": 35,
    "mid_day_meal": 86,
    "female_teacher_ratio": 38,
    "rural_urban": "rural"
  }
}

Response:
{
  "results": {
    "literacy_rate_bin": {
      "distribution": {"Low": 0.15, "Medium": 0.45, "High": 0.40},
      "expected_value": 62.5,
      "dominant_state": "Medium",
      "confidence": 0.45
    },
    ...
  }
}
```

### `POST /explain`
LLM explanation of simulation results.

### `POST /nl-query`
End-to-end natural language query.

```json
{"query": "What if we double digital access in rural schools?"}
```

### `POST /compare`
Compare two policy scenarios.

### `GET /sensitivity?target=literacy_rate_bin`
Sensitivity analysis (tornado chart data).

### `GET /districts`
All 52 MP districts with statistics.

### `GET /district/{name}`
District-specific data and AI analysis.

### `GET /dag`
Bayesian Network structure.

---

## 🧠 Bayesian Network Details

### Variables

**Inputs (Policy Controls):**
| Variable | Range | Description |
|----------|-------|-------------|
| `per_student_exp` | ₹1,000–50,000/year | Annual per-student expenditure |
| `teacher_student_ratio` | 10–80 students/teacher | Lower = better |
| `infra_index` | 0–100 | School infrastructure quality |
| `digital_access` | 0–100% | Schools with internet/computers |
| `mid_day_meal` | 0–100% | Students with mid-day meal |
| `female_teacher_ratio` | 0–100% | Female teachers percentage |
| `rural_urban` | rural/urban | Geographic context |

**Outputs (Policy Targets):**
| Variable | Description |
|----------|-------------|
| `literacy_rate` | Adult literacy rate % |
| `dropout_rate` | Secondary school dropout % |
| `enrollment_rate` | Primary enrollment % |
| `gender_parity_index` | GPI (1.0 = parity) |
| `learning_outcome` | NAS/ASER score proxy |

### Inference
- **Algorithm:** Variable Elimination
- **Parameter learning:** Bayesian Dirichlet (BDeu prior, ESS=5)
- **Discretization:** Quantile-based tertile (Low/Medium/High)

---

## 🔑 Sensitivity Analysis

The system computes how much each input variable shifts the probability of "High"
outcomes when moving from Low to High setting. Visualized as a tornado chart.

Example (Literacy Rate sensitivity):
```
Infrastructure Index    ████████████  0.35 (positive)
Digital Access          ██████████    0.29 (positive)
Teacher-Student Ratio   █████████     0.26 (positive)
Per-Student Exp         ███████       0.21 (positive)
Mid-Day Meal            █████         0.16 (positive)
Female Teacher Ratio    ████          0.12 (positive)
```

---

## 📁 Project Structure

```
mp_edu_policy/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── data_pipeline.py     # Data loading, preprocessing, augmentation
│   ├── bayesian_model.py    # pgmpy BN model, DAG, inference, sensitivity
│   ├── llm_integration.py   # Groq API + LLaMA 70B integration
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Root app + navigation
│   │   ├── index.css         # Full design system CSS
│   │   ├── api/client.js     # API client + config constants
│   │   └── components/
│   │       ├── Dashboard.jsx          # KPIs + trend charts
│   │       ├── PolicySimulator.jsx    # Slider controls + outcomes
│   │       ├── PolicyComparison.jsx   # Side-by-side comparison
│   │       ├── SensitivityAnalysis.jsx # Tornado chart
│   │       └── DistrictExplorer.jsx   # Districts + NL Query + DAG
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── mp_education_data.csv  # Generated after first run
│   └── data_sources.json      # Source documentation
│
├── models/
│   └── bn_model.pkl           # Saved Bayesian Network
│
├── scripts/
│   ├── download_data.py       # Data download pipeline
│   └── train_model.py         # Model training pipeline
│
├── .env.example
└── README.md
```

---

## 🌏 MP District Coverage

The system includes all 52 districts of Madhya Pradesh with realistic
differentiation by region type:

**Tribal/Disadvantaged Districts** (lower baseline, more improvement potential):
Jhabua, Alirajpur, Dindori, Mandla, Barwani, Sheopur, Sidhi, Singrauli, Umaria

**Urban/Developed Districts** (higher baseline):
Indore, Bhopal, Gwalior, Jabalpur, Ujjain

**Average Districts:** All remaining 35 districts with intermediate profiles

---

## 🤖 LLM Integration

The system uses **LLaMA 3.3-70B** (via Groq API) for three tasks:

1. **Query Parsing** — Extracts structured parameters from natural language:
   > "Double digital access in rural schools" → `{"digital_access": 70, "rural_urban": "rural"}`

2. **Result Explanation** — Converts BN probability outputs to policy language:
   > "High digital access increases literacy probability by 29%..."

3. **Recommendations** — Strategic policy recommendations from sensitivity analysis

**Without Groq API key:** Simulation and sensitivity still work fully.
Only LLM explanation features are disabled.

---

## 📋 Key Policy Programs Modeled

- **Samagra Shiksha** — Umbrella scheme for school education
- **PM Poshan (Mid-Day Meal)** — Nutrition → enrollment → retention
- **NEP 2020** — Digital access, learning outcome improvements
- **RTE Act 2009** — Teacher-pupil ratio norms (1:30 primary, 1:35 upper primary)
- **KGBV** — Kasturba Gandhi Balika Vidyalaya for girls
- **EMRS** — Eklavya Model Residential Schools (tribal areas)

---

## ⚠️ Limitations & Assumptions

1. **Causal assumptions** are expert-defined, not purely data-driven (standard for BNs)
2. **Augmented data** is grounded in published statistics but not raw UDISE+ microdata
3. **Temporal effects** are simplified — in reality, policy impacts have 3-7 year lags
4. **Discretization** to 3 levels loses some granularity
5. **GPI** model is simplified — actual gender parity depends on many social factors

---

## 🔬 References

1. UDISE+ Annual Report 2021-22, Ministry of Education, Government of India
2. NFHS-5 (2019-21), International Institute for Population Sciences, Mumbai
3. ASER 2022, Pratham Education Foundation
4. Census 2011 Primary Census Abstract, Office of Registrar General, India
5. Hanushek & Woessmann (2007), "Education Production Functions"
6. pgmpy: Ankan et al., "A Library for Probabilistic Graphical Models"
7. NEP 2020, Ministry of Education, Government of India
8. MP School Education Quality Report 2021, SCERT Madhya Pradesh

---

## 📜 License

MIT License — for educational and research use.
Data used is from public government sources under Government Open Data License (GODL).
