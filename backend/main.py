"""
FastAPI Backend — MP Education Policy Modeling System

Endpoints:
  POST /simulate         → Run policy simulation with Bayesian Network
  POST /explain          → Get LLM explanation for simulation results
  POST /compare          → Compare two policy scenarios
  GET  /sensitivity      → Sensitivity analysis (which input matters most)
  GET  /districts        → List all MP districts with stats
  GET  /district/{name}  → District-specific data and analysis
  GET  /dag              → BN DAG structure for visualization
  GET  /health           → Health check
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from contextlib import asynccontextmanager

# Local imports
import sys
sys.path.insert(0, str(Path(__file__).parent))

from data_pipeline import (
    load_or_build_dataset, discretize_for_bn,
    get_summary_stats, MP_DISTRICTS
)
from bayesian_model import (
    MPEducationBN, build_evidence, value_to_bin,
    NODE_METADATA, EDGES
)
from llm_integration import (
    parse_policy_query, explain_results,
    explain_comparison, generate_recommendations,
    district_analysis
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────
# App State
# ─────────────────────────────────────────────────────────────────────

class AppState:
    df: Optional[pd.DataFrame] = None
    df_discrete: Optional[pd.DataFrame] = None
    bn: Optional[MPEducationBN] = None
    summary: Optional[Dict] = None

state = AppState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load data and model on startup."""
    logger.info("Loading MP education dataset…")
    state.df = load_or_build_dataset()
    state.df_discrete = discretize_for_bn(state.df)
    state.summary = get_summary_stats(state.df)

    logger.info("Loading Bayesian Network…")
    state.bn = MPEducationBN()
    model_path = Path(__file__).parent.parent / "models" / "bn_model.pkl"

    if not state.bn.load(model_path):
        logger.info("No saved model found — training new model…")
        state.bn.build_model(state.df_discrete, method="bayes")
        state.bn.save(model_path)

    logger.info("✓ System ready")
    yield
    logger.info("Shutting down…")


# ─────────────────────────────────────────────────────────────────────
# App Initialization
# ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MP Education Policy Modeling API",
    description="AI-powered education policy simulation for Madhya Pradesh",
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


# ─────────────────────────────────────────────────────────────────────
# Pydantic Models
# ─────────────────────────────────────────────────────────────────────

class PolicyInput(BaseModel):
    per_student_exp:       float = Field(9000,  ge=1000,  le=50000, description="Annual per-student expenditure (INR)")
    teacher_student_ratio: float = Field(28,    ge=10,    le=80,    description="Students per teacher (lower is better)")
    infra_index:           float = Field(58,    ge=0,     le=100,   description="Infrastructure quality index (0-100)")
    digital_access:        float = Field(35,    ge=0,     le=100,   description="% schools with digital access")
    mid_day_meal:          float = Field(86,    ge=0,     le=100,   description="% students with mid-day meal")
    female_teacher_ratio:  float = Field(38,    ge=0,     le=100,   description="% female teachers")
    rural_urban:           str   = Field("rural", description="rural or urban")
    district:              Optional[str] = Field(None, description="Filter by specific district")

    @validator("rural_urban")
    def validate_rural_urban(cls, v):
        if v not in ("rural", "urban"):
            raise ValueError("Must be 'rural' or 'urban'")
        return v


class SimulateRequest(BaseModel):
    inputs: PolicyInput


class ExplainRequest(BaseModel):
    query:     str
    inputs:    PolicyInput
    results:   Optional[Dict[str, Any]] = None


class NLQueryRequest(BaseModel):
    query: str
    district: Optional[str] = None


class CompareRequest(BaseModel):
    scenario_a:       PolicyInput
    scenario_b:       PolicyInput
    scenario_a_label: str = "Scenario A"
    scenario_b_label: str = "Scenario B"


class SensitivityRequest(BaseModel):
    target_var: str = "literacy_rate_bin"
    base_inputs: Optional[PolicyInput] = None


# ─────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────

def policy_input_to_evidence(inputs: PolicyInput) -> Dict[str, str]:
    """Convert PolicyInput → discrete evidence dict for BN."""
    input_dict = inputs.dict(exclude={"district"})
    return build_evidence(input_dict, state.df)


def format_simulation_output(
    evidence: Dict[str, str],
    query_results: Dict[str, Dict[str, float]],
) -> Dict[str, Any]:
    """Format BN query results for API response."""
    output_nodes = {
        "literacy_rate_bin":       {"label": "Literacy Rate",        "unit": "%",     "high_is_good": True},
        "dropout_rate_bin":        {"label": "Dropout Rate",          "unit": "%",     "high_is_good": False},
        "enrollment_rate_bin":     {"label": "Enrollment Rate",       "unit": "%",     "high_is_good": True},
        "gender_parity_index_bin": {"label": "Gender Parity Index",   "unit": "index", "high_is_good": True},
        "learning_outcome_bin":    {"label": "Learning Outcome Score","unit": "score", "high_is_good": True},
    }

    formatted = {}
    for var, meta in output_nodes.items():
        if var not in query_results:
            continue
        dist = query_results[var]
        # Expected value on 0-100 scale
        ev = (dist.get("Low", 0) * 20 +
              dist.get("Medium", 0) * 55 +
              dist.get("High", 0) * 85)

        # For dropout: remap to actual % range
        if var == "dropout_rate_bin":
            ev = (dist.get("Low", 0) * 7 +
                  dist.get("Medium", 0) * 18 +
                  dist.get("High", 0) * 35)
        # For GPI: remap to 0.8–1.1 range
        elif var == "gender_parity_index_bin":
            ev = (dist.get("Low", 0) * 0.85 +
                  dist.get("Medium", 0) * 0.95 +
                  dist.get("High", 0) * 1.05)

        formatted[var] = {
            **meta,
            "distribution": dist,
            "expected_value": round(ev, 3),
            "dominant_state": max(dist, key=dist.get),
            "confidence": round(max(dist.values()), 3),
        }

    return formatted


# ─────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": state.bn is not None,
        "dataset_size": len(state.df) if state.df is not None else 0,
        "districts": len(MP_DISTRICTS),
    }


@app.get("/summary")
def get_summary():
    """Return dataset summary statistics."""
    if state.summary is None:
        raise HTTPException(503, "Data not loaded")
    return state.summary


@app.post("/simulate")
async def simulate(request: SimulateRequest):
    """
    Run Bayesian Network simulation for given policy inputs.

    Returns probability distributions and expected values for:
    - Literacy Rate
    - Dropout Rate
    - Enrollment Rate
    - Gender Parity Index
    - Learning Outcome
    """
    if state.bn is None:
        raise HTTPException(503, "Model not ready")

    try:
        evidence = policy_input_to_evidence(request.inputs)
        results  = state.bn.query(evidence)
        formatted = format_simulation_output(evidence, results)

        return {
            "status":   "success",
            "evidence": evidence,
            "inputs":   request.inputs.dict(),
            "results":  formatted,
        }
    except Exception as e:
        logger.exception("Simulation error")
        raise HTTPException(500, f"Simulation failed: {str(e)}")


@app.post("/explain")
async def explain(request: ExplainRequest):
    """
    Generate LLM-powered explanation of simulation results.
    If results not provided, runs simulation first.
    """
    if state.bn is None:
        raise HTTPException(503, "Model not ready")

    try:
        evidence = policy_input_to_evidence(request.inputs)

        if request.results is None:
            raw_results = state.bn.query(evidence)
        else:
            raw_results = {k: v.get("distribution", v)
                           for k, v in request.results.items()}

        sensitivity = state.bn.sensitivity_analysis("literacy_rate_bin")

        explanation = await explain_results(
            query=request.query,
            evidence=evidence,
            results=raw_results,
            sensitivity=sensitivity,
        )

        return {
            "status":      "success",
            "query":       request.query,
            "explanation": explanation,
            "evidence":    evidence,
        }
    except Exception as e:
        logger.exception("Explanation error")
        raise HTTPException(500, f"Explanation failed: {str(e)}")


@app.post("/nl-query")
async def nl_query(request: NLQueryRequest):
    """
    End-to-end natural language query:
    NL Text → Parse Inputs → Simulate → Explain
    """
    if state.bn is None:
        raise HTTPException(503, "Model not ready")

    try:
        # 1. Parse NL → structured inputs
        parsed_inputs, raw_parse = await parse_policy_query(request.query)

        # Merge with defaults
        defaults = PolicyInput()
        merged = defaults.dict()
        merged.update(parsed_inputs)
        if request.district:
            merged["district"] = request.district
        inputs = PolicyInput(**{k: v for k, v in merged.items()
                                if k in PolicyInput.__fields__})

        # 2. Build evidence & simulate
        evidence = policy_input_to_evidence(inputs)
        raw_results = state.bn.query(evidence)
        formatted = format_simulation_output(evidence, raw_results)

        # 3. Generate explanation
        explanation = await explain_results(
            query=request.query,
            evidence=evidence,
            results=raw_results,
        )

        return {
            "status":       "success",
            "query":        request.query,
            "parsed_inputs": parsed_inputs,
            "final_inputs": inputs.dict(),
            "evidence":     evidence,
            "results":      formatted,
            "explanation":  explanation,
        }
    except Exception as e:
        logger.exception("NL query error")
        raise HTTPException(500, f"NL query failed: {str(e)}")


@app.post("/compare")
async def compare(request: CompareRequest):
    """
    Compare two policy scenarios side by side.
    Returns delta outcomes + LLM comparison narrative.
    """
    if state.bn is None:
        raise HTTPException(503, "Model not ready")

    try:
        ev_a = policy_input_to_evidence(request.scenario_a)
        ev_b = policy_input_to_evidence(request.scenario_b)

        comparison = state.bn.compare_scenarios(ev_a, ev_b)

        # Format for response
        formatted_comp = {}
        for var, data in comparison.items():
            formatted_comp[var] = {
                "label":      data["label"],
                "scenario_a": {"distribution": data["scenario_a"], "expected_value": data["ev_a"]},
                "scenario_b": {"distribution": data["scenario_b"], "expected_value": data["ev_b"]},
                "delta":      data["delta"],
                "winner":     "B" if data["delta"] > 0 else ("A" if data["delta"] < 0 else "tie"),
            }

        # LLM narrative
        narrative = await explain_comparison(
            scenario_a_desc=f"{request.scenario_a_label}: {ev_a}",
            scenario_b_desc=f"{request.scenario_b_label}: {ev_b}",
            comparison=comparison,
        )

        return {
            "status":       "success",
            "scenario_a":   {"label": request.scenario_a_label, "inputs": request.scenario_a.dict(), "evidence": ev_a},
            "scenario_b":   {"label": request.scenario_b_label, "inputs": request.scenario_b.dict(), "evidence": ev_b},
            "comparison":   formatted_comp,
            "narrative":    narrative,
        }
    except Exception as e:
        logger.exception("Comparison error")
        raise HTTPException(500, f"Comparison failed: {str(e)}")


@app.get("/sensitivity")
async def sensitivity(target: str = "literacy_rate_bin"):
    """
    Compute sensitivity analysis: which input variable most affects the target outcome.
    """
    valid_targets = [n for n, m in NODE_METADATA.items() if m["type"] == "output"]
    if target not in valid_targets:
        raise HTTPException(400, f"target must be one of: {valid_targets}")

    if state.bn is None:
        raise HTTPException(503, "Model not ready")

    try:
        results = state.bn.sensitivity_analysis(target)
        recommendations = await generate_recommendations(results)

        return {
            "status":          "success",
            "target":          target,
            "target_label":    NODE_METADATA[target]["label"],
            "sensitivity":     results,
            "recommendations": recommendations,
        }
    except Exception as e:
        logger.exception("Sensitivity error")
        raise HTTPException(500, f"Sensitivity analysis failed: {str(e)}")


@app.get("/districts")
def list_districts():
    """List all MP districts with their latest statistics."""
    if state.df is None:
        raise HTTPException(503, "Data not loaded")

    latest_year = state.df["year"].max()
    latest = state.df[state.df["year"] == latest_year].copy()

    districts_data = []
    for _, row in latest.iterrows():
        districts_data.append({
            "district":              row["district"],
            "rural_urban":           row.get("rural_urban", "rural"),
            "tribal_share":          round(float(row.get("tribal_share", 0)), 2),
            "literacy_rate":         round(float(row["literacy_rate"]), 1),
            "dropout_rate":          round(float(row["dropout_rate"]), 1),
            "enrollment_rate":       round(float(row["enrollment_rate"]), 1),
            "gender_parity_index":   round(float(row["gender_parity_index"]), 3),
            "per_student_exp":       round(float(row["per_student_exp"]), 0),
            "teacher_student_ratio": round(float(row["teacher_student_ratio"]), 1),
            "infra_index":           round(float(row["infra_index"]), 1),
            "digital_access":        round(float(row["digital_access"]), 1),
            "mid_day_meal":          round(float(row["mid_day_meal"]), 1),
            "female_teacher_ratio":  round(float(row["female_teacher_ratio"]), 1),
        })

    return {
        "status":    "success",
        "year":      int(latest_year),
        "count":     len(districts_data),
        "districts": districts_data,
        "state_avg": {
            "literacy_rate":   round(latest["literacy_rate"].mean(), 1),
            "dropout_rate":    round(latest["dropout_rate"].mean(), 1),
            "enrollment_rate": round(latest["enrollment_rate"].mean(), 1),
            "gpi":             round(latest["gender_parity_index"].mean(), 3),
        }
    }


@app.get("/district/{district_name}")
async def get_district(district_name: str):
    """Get detailed data and analysis for a specific district."""
    if state.df is None:
        raise HTTPException(503, "Data not loaded")

    # Find district (case-insensitive)
    matches = state.df[state.df["district"].str.lower() == district_name.lower()]
    if matches.empty:
        raise HTTPException(404, f"District '{district_name}' not found")

    latest = matches[matches["year"] == matches["year"].max()].iloc[0]
    historical = matches.sort_values("year")

    dist_data = latest.to_dict()
    dist_data = {k: (round(float(v), 3) if isinstance(v, (np.floating, float)) else v)
                 for k, v in dist_data.items()}

    # Trend data
    trend = historical[["year", "literacy_rate", "dropout_rate",
                         "enrollment_rate", "gender_parity_index"]].to_dict("records")

    # Simulate with actual district values
    evidence = build_evidence(dist_data, state.df)
    results = state.bn.query(evidence)
    formatted = format_simulation_output(evidence, results)

    # LLM analysis
    analysis = await district_analysis(
        district=district_name,
        district_data=dist_data,
        simulation_results=results,
    )

    return {
        "status":           "success",
        "district":         district_name,
        "latest_data":      dist_data,
        "historical_trend": trend,
        "simulation":       formatted,
        "analysis":         analysis,
    }


@app.get("/dag")
def get_dag():
    """Return Bayesian Network DAG structure for visualization."""
    if state.bn is None:
        raise HTTPException(503, "Model not ready")
    return {"status": "success", "dag": state.bn.get_dag_json()}


@app.get("/trends")
def get_trends():
    """Return MP-wide historical trends."""
    if state.df is None:
        raise HTTPException(503, "Data not loaded")

    trends = (state.df.groupby("year")[[
        "literacy_rate", "dropout_rate", "enrollment_rate",
        "gender_parity_index", "digital_access", "infra_index"
    ]].mean().round(2).reset_index().to_dict("records"))

    return {"status": "success", "trends": trends}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
