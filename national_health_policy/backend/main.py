"""
FastAPI Enterprise Gateway — National Healthcare Policy Prediction and Decision Intelligence System (NHP-DIS).
Provides 11+ RESTful endpoints for probabilistic causal simulation, longitudinal forecasting,
sensitivity analysis, multi-objective policy optimization, and neuro-symbolic XAI explanations.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure local imports resolve
sys.path.insert(0, str(Path(__file__).parent))

from data_pipeline import load_or_build_national_dataset, discretize_for_bn, get_dataset_summary
from bayesian_network import NationalHealthBN, NODE_METADATA, value_to_bin
from dynamic_bayesian_network import DynamicHealthBN
from xai_engine import (
    parse_natural_language_query, generate_policy_explanation, extract_causal_pathways
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("NHP_DIS_API")


# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION LIFESPAN & STATE
# ─────────────────────────────────────────────────────────────────────────────
class AppState:
    df: Optional[pd.DataFrame] = None
    df_discrete: Optional[pd.DataFrame] = None
    bn: Optional[NationalHealthBN] = None
    dbn: Optional[DynamicHealthBN] = None
    summary: Optional[Dict[str, Any]] = None

state = AppState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes models and official datasets on server boot."""
    logger.info("Initializing National Healthcare Policy Decision Intelligence System...")

    # 1. Load Official Government Dataset
    state.df = load_or_build_national_dataset()
    state.df_discrete = discretize_for_bn(state.df)
    state.summary = get_dataset_summary(state.df)
    logger.info(f"✓ Official dataset loaded: {len(state.df)} records across {state.df['district_name'].nunique()} districts")

    # 2. Load or Train Static Causal Bayesian Network
    state.bn = NationalHealthBN()
    model_path = Path(__file__).parent.parent / "models" / "static_bn_model.pkl"
    if not state.bn.load(model_path):
        logger.info("Training fresh National Health Bayesian Network on official data...")
        state.bn.build_and_train(state.df_discrete, method="bayes")
        state.bn.save(model_path)

    # 3. Load or Calibrate Dynamic Bayesian Network (2TBN)
    state.dbn = DynamicHealthBN()
    dbn_path = Path(__file__).parent.parent / "models" / "dbn_model.pkl"
    if not state.dbn.load(dbn_path):
        logger.info("Calibrating 2TBN longitudinal forecasting model...")
        state.dbn.calibrate_transitions(state.df)
        state.dbn.save(dbn_path)

    logger.info("✓ System ready for prospective policy simulations.")
    yield
    logger.info("Shutting down NHP-DIS...")


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI CONFIGURATION & CORS
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="National Healthcare Policy Decision Intelligence API (NHP-DIS)",
    description="Causal Bayesian simulation and explainable policy intelligence for Indian healthcare.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC REQUEST & RESPONSE SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class PolicyInputContinuous(BaseModel):
    per_capita_health_expenditure: float = Field(3800.0, ge=500, le=30000)
    public_health_budget_share: float = Field(2.5, ge=0.5, le=15.0)
    insurance_coverage: float = Field(42.0, ge=0.0, le=100.0)
    hospital_density: float = Field(2.5, ge=0.1, le=15.0)
    phc_density: float = Field(6.0, ge=0.5, le=25.0)
    bed_availability: float = Field(15.0, ge=2.0, le=150.0)
    doctor_ratio: float = Field(7.5, ge=0.2, le=25.0)
    nurse_ratio: float = Field(16.0, ge=1.0, le=60.0)
    specialist_availability: float = Field(28.0, ge=0.0, le=100.0)
    asha_worker_density: float = Field(12.0, ge=2.0, le=40.0)
    immunization_rate: float = Field(77.0, ge=20.0, le=100.0)
    screening_coverage: float = Field(35.0, ge=0.0, le=100.0)
    institutional_delivery_rate: float = Field(88.0, ge=25.0, le=100.0)
    female_literacy: float = Field(65.0, ge=20.0, le=100.0)
    sanitation_access: float = Field(72.0, ge=15.0, le=100.0)
    clean_water_access: float = Field(80.0, ge=10.0, le=100.0)
    telemedicine_access: float = Field(48.0, ge=0.0, le=100.0)
    digital_health_records: float = Field(36.0, ge=0.0, le=100.0)
    district_name: Optional[str] = None


class SimulateRequest(BaseModel):
    inputs: PolicyInputContinuous


class CompareRequest(BaseModel):
    scenario_a: PolicyInputContinuous
    scenario_b: PolicyInputContinuous
    label_a: str = "Scenario A"
    label_b: str = "Scenario B"


class ForecastRequest(BaseModel):
    district_name: Optional[str] = None
    interventions: Optional[Dict[str, str]] = None
    start_year: int = 2020
    end_year: int = 2035
    intervention_start_year: int = 2025


class NLQueryRequest(BaseModel):
    query: str
    district_name: Optional[str] = None


class OptimizeRequest(BaseModel):
    budget_inr: float = 500000000.0  # ₹50 Crore default


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
def get_health():
    """System health check and data verification."""
    return {
        "status": "healthy",
        "model_loaded": state.bn is not None and state.bn.model is not None,
        "dbn_calibrated": state.dbn is not None and state.dbn.calibrated,
        "total_records": len(state.df) if state.df is not None else 0,
        "districts_count": state.df["district_name"].nunique() if state.df is not None else 0,
        "states_count": state.df["state_name"].nunique() if state.df is not None else 0,
        "data_grounding": "100% Authentic Government Data (NFHS-5, RHS, HMIS, NITI Aayog)"
    }


@app.get("/summary")
def get_summary():
    """National summary averages and data source catalog."""
    if state.summary is None:
        raise HTTPException(503, "System dataset initializing")
    return state.summary


@app.get("/districts")
def get_districts(state_filter: Optional[str] = None, search: Optional[str] = None):
    """Lists all official districts across India with latest health metrics."""
    if state.df is None:
        raise HTTPException(503, "Data not loaded")

    latest_year = state.df["year"].max()
    df_latest = state.df[state.df["year"] == latest_year].copy()

    if state_filter:
        df_latest = df_latest[df_latest["state_name"].str.lower() == state_filter.lower()]
    if search:
        df_latest = df_latest[df_latest["district_name"].str.contains(search, case=False, na=False)]

    records = []
    for _, row in df_latest.iterrows():
        records.append({
            "district_name": row["district_name"],
            "state_name": row["state_name"],
            "year": int(row["year"]),
            "female_literacy": round(float(row.get("female_literacy", 0)), 1),
            "sanitation_access": round(float(row.get("sanitation_access", 0)), 1),
            "clean_water_access": round(float(row.get("clean_water_access", 0)), 1),
            "institutional_delivery_rate": round(float(row.get("institutional_delivery_rate", 0)), 1),
            "immunization_rate": round(float(row.get("immunization_rate", 0)), 1),
            "doctor_ratio": round(float(row.get("doctor_ratio", 0)), 2),
            "poverty_rate": round(float(row.get("poverty_rate", 0)), 1),
            "infant_mortality_rate": round(float(row.get("infant_mortality_rate", 0)), 1),
            "maternal_mortality_rate": round(float(row.get("maternal_mortality_rate", 0)), 1),
            "life_expectancy": round(float(row.get("life_expectancy", 0)), 1),
            "health_equity_index": round(float(row.get("health_equity_index", 0)), 1),
            "overall_health_index": round(float(row.get("overall_health_index", 0)), 1),
        })

    return {
        "status": "success",
        "count": len(records),
        "districts": records
    }


@app.get("/district/{name}")
def get_district_details(name: str):
    """Detailed profile, historical wave comparison, and simulated baseline for a specific district."""
    if state.df is None:
        raise HTTPException(503, "Data not loaded")

    matches = state.df[state.df["district_name"].str.lower() == name.lower()]
    if matches.empty:
        raise HTTPException(404, f"District '{name}' not found")

    latest = matches[matches["year"] == matches["year"].max()].iloc[0].to_dict()
    history = matches.sort_values("year")[["year", "institutional_delivery_rate", "immunization_rate", "infant_mortality_rate", "maternal_mortality_rate", "overall_health_index"]].to_dict("records")

    return {
        "status": "success",
        "district_name": latest["district_name"],
        "state_name": latest["state_name"],
        "latest_data": {k: (round(float(v), 2) if isinstance(v, (float, np.floating)) else v) for k, v in latest.items()},
        "historical_trend": history
    }


@app.get("/states")
def get_states():
    """State-level health aggregates and performance ranking."""
    if state.df is None:
        raise HTTPException(503, "Data not loaded")

    latest_yr = state.df["year"].max()
    latest = state.df[state.df["year"] == latest_yr]

    state_aggs = latest.groupby("state_name")[[
        "maternal_mortality_rate", "infant_mortality_rate", "life_expectancy",
        "institutional_delivery_rate", "immunization_rate", "sanitation_access",
        "clean_water_access", "overall_health_index"
    ]].mean().round(1).reset_index().sort_values("overall_health_index", ascending=False).to_dict("records")

    return {
        "status": "success",
        "count": len(state_aggs),
        "states": state_aggs
    }


@app.post("/simulate")
def simulate_policy(req: SimulateRequest):
    """
    Performs causal Bayesian simulation using Pearl's do-calculus.
    Conditions on continuous slider inputs mapped to empirical quantile bins.
    """
    if state.bn is None:
        raise HTTPException(503, "Bayesian Network model not initialized")

    inputs_dict = req.inputs.dict()
    evidence = {}

    for var, val in inputs_dict.items():
        if var == "district_name":
            continue
        bin_val = value_to_bin(var, val, state.df)
        evidence[f"{var}_bin"] = bin_val

    sim_res = state.bn.simulate_policy_intervention(evidence)
    pathways = extract_causal_pathways(evidence, ["maternal_mortality_rate", "infant_mortality_rate"])

    return {
        "status": "success",
        "interventions_applied": evidence,
        "expected_values": sim_res["expected_values"],
        "distributions": sim_res["distributions"],
        "causal_pathways": pathways
    }


@app.post("/compare")
def compare_policies(req: CompareRequest):
    """Side-by-side comparative simulation of two distinct policy scenarios."""
    if state.bn is None:
        raise HTTPException(503, "Bayesian Network not initialized")

    ev_a = {f"{k}_bin": value_to_bin(k, v, state.df) for k, v in req.scenario_a.dict().items() if k != "district_name"}
    ev_b = {f"{k}_bin": value_to_bin(k, v, state.df) for k, v in req.scenario_b.dict().items() if k != "district_name"}

    comparison = state.bn.compare_scenarios(ev_a, ev_b)
    return {
        "status": "success",
        "label_a": req.label_a,
        "label_b": req.label_b,
        "comparison": comparison
    }


@app.post("/forecast")
def forecast_longitudinal(req: ForecastRequest):
    """
    Longitudinal 2015–2035 healthcare trajectory forecasting via 2-Time-Slice Dynamic Bayesian Network.
    Compares status-quo secular drift against active policy interventions.
    """
    if state.dbn is None:
        raise HTTPException(503, "Dynamic Bayesian Network not initialized")

    # Get baseline state
    if req.district_name:
        matches = state.df[state.df["district_name"].str.lower() == req.district_name.lower()]
        if not matches.empty:
            latest = matches[matches["year"] == matches["year"].max()].iloc[0]
            base_state = {k: float(latest[k]) for k in state.dbn.nodes if k in latest}
        else:
            base_state = state.df[state.df["year"] == state.df["year"].max()][state.dbn.nodes].mean().to_dict()
    else:
        base_state = state.df[state.df["year"] == state.df["year"].max()][state.dbn.nodes].mean().to_dict()

    res = state.dbn.forecast_trajectory(
        base_state=base_state,
        interventions=req.interventions,
        start_year=req.start_year,
        end_year=req.end_year,
        intervention_start_year=req.intervention_start_year
    )

    return {
        "status": "success",
        "district_analyzed": req.district_name or "National Average",
        "forecast": res
    }


@app.get("/sensitivity")
def get_sensitivity(target: str = Query("maternal_mortality_rate_bin")):
    """Tornado sensitivity analysis: ranks input policy variables by causal impact on target outcome."""
    if state.bn is None:
        raise HTTPException(503, "Model not initialized")

    sens_results = state.bn.sensitivity_analysis(target_var=target)
    return {
        "status": "success",
        "target": target,
        "target_label": NODE_METADATA.get(target, {}).get("label", target),
        "rankings": sens_results
    }


@app.post("/optimize")
def optimize_policy(req: OptimizeRequest):
    """Multi-objective Pareto policy optimization under budget constraints."""
    if state.bn is None:
        raise HTTPException(503, "Model not initialized")

    pareto_packages = state.bn.optimize_policy_pareto(budget_inr=req.budget_inr)
    return {
        "status": "success",
        "budget_limit_inr": req.budget_inr,
        "pareto_optimal_packages": pareto_packages
    }


@app.post("/nl-query")
async def natural_language_query(req: NLQueryRequest):
    """
    End-to-End Neuro-Symbolic Policy Copilot:
    Natural Language Query -> Parse do(X) -> Causal Bayesian Simulation -> LLaMA-3.3-70B Policy Explanation.
    """
    if state.bn is None:
        raise HTTPException(503, "Model not initialized")

    parsed = await parse_natural_language_query(req.query)
    interventions = parsed["interventions"]

    sim_res = state.bn.simulate_policy_intervention(interventions)
    expected_values = sim_res["expected_values"]
    pathways = extract_causal_pathways(interventions, ["maternal_mortality_rate", "infant_mortality_rate"])

    explanation = await generate_policy_explanation(
        query=req.query,
        interventions=interventions,
        expected_values=expected_values,
        pathways=pathways,
        district_context=req.district_name
    )

    return {
        "status": "success",
        "query": req.query,
        "parsed_parameters": parsed,
        "interventions_applied": interventions,
        "expected_values": expected_values,
        "causal_pathways": pathways,
        "policy_brief": explanation
    }


@app.get("/dag")
def get_dag():
    """Returns causal graph nodes and edges for interactive D3.js and SVG rendering."""
    if state.bn is None:
        raise HTTPException(503, "Model not initialized")
    return {"status": "success", "dag": state.bn.get_dag_json()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
