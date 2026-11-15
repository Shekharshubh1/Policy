# ◈ Agent Operational Guide: MP Education Policy Modeling System

> **Target Audience:** Autonomous AI Agents, Coding Copilots, and LLM-assisted tools operating within this repository.  
> **Version:** 1.0.0  
> **Workspace Root:** `D:\research\basyian\mp_edu_policy`  
> **Companion Document:** [REPO_UNDERSTANDING.md](file:///D:/research/basyian/mp_edu_policy/REPO_UNDERSTANDING.md) (Human-Developer Guide)

---

## 1. Quick Repository Map & Responsibility Matrix

| Path | Primary Responsibility | Critical Invariants |
|---|---|---|
| `backend/main.py` | FastAPI app, routes, state management | Holds global `state: AppState`. Lifespan auto-loads data and model on port 8000. |
| `backend/bayesian_model.py` | Causal DAG, pgmpy BN, inference, sensitivity | Uses `VariableElimination`. `teacher_student_ratio` has **inverted binning**. |
| `backend/data_pipeline.py` | Seed data (52 districts), quantile binning | Generates/validates `mp_education_data.csv`. Discretizes into `Low`, `Medium`, `High`. |
| `backend/llm_integration.py` | Groq LLaMA 70B client, prompt engineering | Model: `llama-3.3-70b-versatile`. Fallback strings returned if `GROQ_API_KEY` missing. |
| `data/mp_education_data.csv` | Historical panel data (2017–2021) | 260 rows (52 districts × 5 years). Ground truth for quantiles. |
| `models/bn_model.pkl` | Pickled `MPEducationBN` instance | Dictionary with `{"model": BayesianNetwork, "states": dict}`. |
| `frontend/src/api/client.js` | REST client, input bounds, UI configs | Base URL defaults to `http://localhost:8000`. Direct fetch calls. |
| `frontend/src/App.jsx` | Master navigation and global React context | Tab IDs: `dashboard`, `simulate`, `compare`, `sensitivity`, `districts`, `nlquery`, `dag`. |
| `frontend/src/components/` | React dashboard UI views | Custom inline SVG rendering. `DAGViewer` & `NLQueryPanel` defined inside `DistrictExplorer.jsx`. |
| `scripts/train_model.py` | Standalone CLI training and eval pipeline | `--rebuild` flag forces dataset regeneration; `--method bayes` uses BDeu prior. |
| `scripts/download_data.py` | Government portal scraper & fallback seed | Downloads UDISE+/data.gov.in data or seeds district statistics. |
| `scripts/create_ppt.py` | Presentation generator | Generates 14-slide executive presentation `MP_Education_Policy_Presentation.pptx`. |

---

## 2. Critical Invariants & Non-Obvious Gotchas

### ⚠️ Invariant 1: Inverted Binning for Teacher-Student Ratio
In education policy, a **lower** teacher-student ratio is **better** (e.g., 15 students per teacher is better than 40).
- In `backend/data_pipeline.py` (`discretize_for_bn`):
  ```python
  "teacher_student_ratio": ["High", "Medium", "Low"] # Inverted!
  ```
- In `backend/bayesian_model.py` (`value_to_bin`):
  - Values $\le$ 33rd percentile $\rightarrow$ **"High"** (desirable condition)
  - Values $\ge$ 67th percentile $\rightarrow$ **"Low"** (undesirable condition)
- If editing input or inference logic, **do not reverse this**, or the Bayesian model will calculate that having more students per teacher improves outcomes.

### ⚠️ Invariant 2: Quantile-Based Discretization
`pgmpy` handles discrete variables. All continuous columns are converted to 3 bins via `pd.qcut` (`Low`, `Medium`, `High`) based on empirical quantiles of `mp_education_data.csv`. Fixed fallbacks only apply if a column is missing from the reference dataframe.

### ⚠️ Invariant 3: Expected Value (EV) Interpolation Scale
BN inference returns probability vectors: `{"Low": p1, "Medium": p2, "High": p3}`.
To display continuous estimates on the UI:
- **Default Scale (0–100):** $EV = (p_{Low} \times 20) + (p_{Med} \times 55) + (p_{High} \times 85)$
- **Dropout Rate (Actual %):** $EV = (p_{Low} \times 7) + (p_{Med} \times 18) + (p_{High} \times 35)$
- **Gender Parity Index (GPI):** $EV = (p_{Low} \times 0.85) + (p_{Med} \times 0.95) + (p_{High} \times 1.05)$
When adding new output variables to `backend/main.py::format_simulation_output()`, explicit midpoint coefficients must be defined.

### ⚠️ Invariant 4: Vite Proxy vs. `client.js` URL
- `frontend/vite.config.js` configures `/api` proxying to `http://localhost:8000`.
- However, `frontend/src/api/client.js` uses `import.meta.env.VITE_API_URL || "http://localhost:8000"` and calls endpoints directly without `/api` (e.g., `/simulate`).
- **Agent Rule:** When introducing new endpoints in the backend, route them at the root level (e.g., `/my-new-endpoint`) unless you also refactor `client.js` and `vite.config.js` together.

### ⚠️ Invariant 5: Component Re-Exporting in `DistrictExplorer.jsx`
`frontend/src/components/DAGViewer.jsx` and `NLQueryPanel.jsx` are 1-line re-exports:
```javascript
export { DAGViewer } from "./DistrictExplorer";
export { NLQueryPanel } from "./DistrictExplorer";
```
The actual code for both components lives inside `DistrictExplorer.jsx` (lines 200–480). When modifying DAG visual logic or NL Query panel behavior, modify `DistrictExplorer.jsx` or extract them cleanly.

---

## 3. Bayesian Network DAG Specification

The directed acyclic graph represents causal policy dependencies:

```
Nodes (12 Total):
  Inputs (6):
    - per_student_exp_bin
    - teacher_student_ratio_bin
    - infra_index_bin
    - digital_access_bin
    - mid_day_meal_bin
    - female_teacher_ratio_bin
  Context (1):
    - rural_urban (binary: 'rural' | 'urban')
  Intermediate (1):
    - learning_outcome_bin
  Outputs (4):
    - enrollment_rate_bin
    - dropout_rate_bin
    - literacy_rate_bin
    - gender_parity_index_bin

Edges (18 Directed Edges):
  per_student_exp_bin       ──> infra_index_bin
  per_student_exp_bin       ──> teacher_student_ratio_bin
  per_student_exp_bin       ──> digital_access_bin
  infra_index_bin           ──> enrollment_rate_bin
  infra_index_bin           ──> digital_access_bin
  teacher_student_ratio_bin ──> learning_outcome_bin
  teacher_student_ratio_bin ──> dropout_rate_bin
  digital_access_bin        ──> learning_outcome_bin
  rural_urban               ──> infra_index_bin
  rural_urban               ──> digital_access_bin
  rural_urban               ──> enrollment_rate_bin
  rural_urban               ──> dropout_rate_bin
  rural_urban               ──> learning_outcome_bin
  mid_day_meal_bin          ──> enrollment_rate_bin
  mid_day_meal_bin          ──> dropout_rate_bin
  female_teacher_ratio_bin  ──> gender_parity_index_bin
  enrollment_rate_bin       ──> literacy_rate_bin
  learning_outcome_bin      ──> literacy_rate_bin
  dropout_rate_bin          ──> literacy_rate_bin
  enrollment_rate_bin       ──> gender_parity_index_bin
```

---

## 4. API Request/Response Schemas

### POST `/simulate`
- **Request:**
  ```json
  {
    "inputs": {
      "per_student_exp": 12000,
      "teacher_student_ratio": 22,
      "infra_index": 70,
      "digital_access": 60,
      "mid_day_meal": 90,
      "female_teacher_ratio": 45,
      "rural_urban": "rural",
      "district": "Alirajpur"
    }
  }
  ```
- **Response Structure:**
  ```json
  {
    "status": "success",
    "evidence": { "per_student_exp_bin": "High", "digital_access_bin": "High", ... },
    "inputs": { ... },
    "results": {
      "literacy_rate_bin": {
        "label": "Literacy Rate",
        "unit": "%",
        "high_is_good": true,
        "distribution": { "Low": 0.12, "Medium": 0.38, "High": 0.50 },
        "expected_value": 65.8,
        "dominant_state": "High",
        "confidence": 0.50
      },
      ...
    }
  }
  ```

### POST `/nl-query`
- **Pipeline:** `request.query` $\rightarrow$ `parse_policy_query()` (Groq JSON) $\rightarrow$ Merge with `DEFAULT_INPUTS` $\rightarrow$ `policy_input_to_evidence()` $\rightarrow$ `bn.query()` $\rightarrow$ `explain_results()` (Groq) $\rightarrow$ Combined JSON.

### GET `/sensitivity?target=literacy_rate_bin`
- Computes $\Delta P(Target=High)$ when each input swings from `Low` to `High`.
- Returns sorted list: `[{"variable": "...", "impact_score": 0.28, "direction": "positive", ...}]` + LLM recommendations.

---

## 5. Development & Execution Recipes

### Backend Setup & Dependencies
```powershell
cd D:\research\basyian\mp_edu_policy\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Model Re-Training & Evaluation
```powershell
cd D:\research\basyian\mp_edu_policy
python scripts/train_model.py --rebuild --method bayes --evaluate
```

### Start Backend (Port 8000)
```powershell
cd D:\research\basyian\mp_edu_policy\backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Build & Run (Port 3000)
```powershell
cd D:\research\basyian\mp_edu_policy\frontend
npm install
npm run dev
```

### Health Check Verification
```powershell
curl http://localhost:8000/health
```

---

## 6. Guidelines for Agent Modifications

1. **Adding a New Policy Variable:**
   - Update `DISTRICT_SEED_DATA` and `build_augmented_mp_dataset()` in `backend/data_pipeline.py`.
   - Update `bins_map` in `discretize_for_bn()`.
   - Add node and edges to `EDGES` and `NODE_METADATA` in `backend/bayesian_model.py`.
   - Add field to `PolicyInput` Pydantic model in `backend/main.py`.
   - Retrain model (`python scripts/train_model.py`).
   - Add input config and slider metadata to `frontend/src/api/client.js` (`INPUT_CONFIGS`).

2. **Refactoring the LLM Integration:**
   - To force strict JSON output from Groq, pass `response_format={"type": "json_object"}` inside `_call_groq()`.
   - Ensure `_safe_parse_json()` remains as a fallback.
   - Always handle missing `GROQ_API_KEY` gracefully without raising unhandled 500 errors.

3. **Frontend Component Isolation:**
   - If refactoring `DistrictExplorer.jsx`, extract `NLQueryPanel` into `NLQueryPanel.jsx` and `DAGViewer` into `DAGViewer.jsx`.
   - Ensure imports in `App.jsx` point to the respective modular files.
