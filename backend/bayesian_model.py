"""
Bayesian Network for MP Education Policy Modeling.

DAG Structure (based on education policy literature):
────────────────────────────────────────────────────
Spending ──────→ Infrastructure ──→ EnrollmentRate ──→ LiteracyRate
     │                │                                      ↑
     └──→ TSR         └──→ DigitalAccess ──→ LearningOutcome─┘
               │                 │                 ↑
               └──→ LearningOut──┘       FemaleTeacherRatio
                         │                       ↓
                         └──→ DropoutRate ──→ LiteracyRate
                                                  ↑
MidDayMeal ──→ EnrollmentRate                GenderParity
RuralUrban ──→ Infrastructure
FemaleTeacherRatio ──→ GenderParity

References:
  - Hanushek & Woessmann (2007) Education Production Functions
  - Pratham ASER India Reports 2017–2022
  - MP RTE Forum Annual Reports
  - World Bank Education for All Fast-Track Initiative Guidelines
"""

import os
import pickle
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

try:
    from pgmpy.models import BayesianNetwork
    from pgmpy.estimators import (
        BayesianEstimator, MaximumLikelihoodEstimator,
        HillClimbSearch, BicScore, K2Score
    )
    from pgmpy.inference import VariableElimination, BeliefPropagation
    from pgmpy.factors.discrete import TabularCPD
    PGMPY_AVAILABLE = True
except ImportError:
    PGMPY_AVAILABLE = False
    BayesianNetwork = None
    VariableElimination = None
    logging.warning("pgmpy not installed. Run: pip install pgmpy")

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

MODEL_PATH = MODELS_DIR / "bn_model.pkl"

# ─────────────────────────────────────────────────────────────────────
# DAG DEFINITION
# ─────────────────────────────────────────────────────────────────────

EDGES = [
    # Expenditure drives resources
    ("per_student_exp_bin",       "infra_index_bin"),
    ("per_student_exp_bin",       "teacher_student_ratio_bin"),
    ("per_student_exp_bin",       "digital_access_bin"),

    # Infrastructure drives access
    ("infra_index_bin",           "enrollment_rate_bin"),
    ("infra_index_bin",           "digital_access_bin"),

    # Teacher quality drives outcomes
    ("teacher_student_ratio_bin", "learning_outcome_bin"),
    ("teacher_student_ratio_bin", "dropout_rate_bin"),

    # Digital access drives learning
    ("digital_access_bin",        "learning_outcome_bin"),

    # Rural/urban context
    ("rural_urban",               "infra_index_bin"),
    ("rural_urban",               "digital_access_bin"),
    ("rural_urban",               "enrollment_rate_bin"),
    ("rural_urban",               "dropout_rate_bin"),
    ("rural_urban",               "learning_outcome_bin"),

    # Mid-day meal drives enrollment & retention
    ("mid_day_meal_bin",          "enrollment_rate_bin"),
    ("mid_day_meal_bin",          "dropout_rate_bin"),

    # Female teachers drive gender parity
    ("female_teacher_ratio_bin",  "gender_parity_index_bin"),

    # Enrollment and learning drive literacy
    ("enrollment_rate_bin",       "literacy_rate_bin"),
    ("learning_outcome_bin",      "literacy_rate_bin"),
    ("dropout_rate_bin",          "literacy_rate_bin"),

    # GPI influenced by enrollment too
    ("enrollment_rate_bin",       "gender_parity_index_bin"),
]

# Node display metadata
NODE_METADATA = {
    "per_student_exp_bin":       {"label": "Per Student Expenditure",    "type": "input",  "unit": "Rs/year"},
    "teacher_student_ratio_bin": {"label": "Teacher-Student Ratio",      "type": "input",  "unit": "ratio"},
    "infra_index_bin":           {"label": "Infrastructure Index",       "type": "input",  "unit": "score"},
    "digital_access_bin":        {"label": "Digital Access",             "type": "input",  "unit": "%"},
    "mid_day_meal_bin":          {"label": "Mid-Day Meal Coverage",      "type": "input",  "unit": "%"},
    "female_teacher_ratio_bin":  {"label": "Female Teacher Ratio",       "type": "input",  "unit": "%"},
    "rural_urban":               {"label": "Rural/Urban",                "type": "context","unit": ""},
    "learning_outcome_bin":      {"label": "Learning Outcome",           "type": "intermediate","unit": "score"},
    "enrollment_rate_bin":       {"label": "Enrollment Rate",            "type": "output", "unit": "%"},
    "dropout_rate_bin":          {"label": "Dropout Rate",               "type": "output", "unit": "%"},
    "literacy_rate_bin":         {"label": "Literacy Rate",              "type": "output", "unit": "%"},
    "gender_parity_index_bin":   {"label": "Gender Parity Index",        "type": "output", "unit": "index"},
}

BN_NODES = list(NODE_METADATA.keys())


class MPEducationBN:
    """Bayesian Network for MP Education Policy Simulation."""

    def __init__(self):
        self.model: Optional[BayesianNetwork] = None
        self.inference: Optional[VariableElimination] = None
        self._data_states: Dict[str, List[str]] = {}

    # ─────────────────────────────────────────────────────────────────
    # Model Building
    # ─────────────────────────────────────────────────────────────────

    def build_model(self, df_discrete: pd.DataFrame, method: str = "bayes") -> Any:
        """
        Build and fit Bayesian Network from discretized data.

        Args:
            df_discrete: DataFrame with _bin suffix columns + rural_urban
            method: 'bayes' (BayesianEstimator) or 'mle' (MaximumLikelihood)
        """
        if not PGMPY_AVAILABLE:
            raise ImportError("pgmpy required: pip install pgmpy")

        bn_cols = [c for c in BN_NODES if c in df_discrete.columns]
        data = df_discrete[bn_cols].copy()

        # Record valid states for each node
        for col in bn_cols:
            self._data_states[col] = sorted(data[col].dropna().unique().tolist())

        # Build network with expert-defined DAG
        self.model = BayesianNetwork(
            [(e0, e1) for e0, e1 in EDGES
             if e0 in bn_cols and e1 in bn_cols]
        )

        # Fit parameters
        if method == "bayes":
            self.model.fit(
                data,
                estimator=BayesianEstimator,
                prior_type="BDeu",
                equivalent_sample_size=5,
            )
        else:
            self.model.fit(data, estimator=MaximumLikelihoodEstimator)

        # Validate
        assert self.model.check_model(), "BN model validation failed"
        logger.info(f"✓ BN model fitted | nodes={len(self.model.nodes())} "
                    f"edges={len(self.model.edges())}")

        # Build inference engine
        self.inference = VariableElimination(self.model)
        return self.model

    def save(self, path: Path = MODEL_PATH):
        """Persist model to disk."""
        with open(path, "wb") as f:
            pickle.dump({"model": self.model,
                         "states": self._data_states}, f)
        logger.info(f"✓ Model saved → {path}")

    def load(self, path: Path = MODEL_PATH) -> bool:
        """Load model from disk."""
        if not path.exists():
            return False
        with open(path, "rb") as f:
            obj = pickle.load(f)
        self.model = obj["model"]
        self._data_states = obj["states"]
        self.inference = VariableElimination(self.model)
        logger.info(f"✓ Model loaded from {path}")
        return True

    # ─────────────────────────────────────────────────────────────────
    # Inference
    # ─────────────────────────────────────────────────────────────────

    def query(
        self,
        evidence: Dict[str, str],
        query_vars: Optional[List[str]] = None,
    ) -> Dict[str, Dict[str, float]]:
        """
        Run Variable Elimination inference.

        Args:
            evidence: {node_name: state_value} e.g. {"digital_access_bin": "High"}
            query_vars: list of output nodes to query (defaults to all output nodes)

        Returns:
            {node: {state: probability, ...}, ...}
        """
        if self.inference is None:
            raise RuntimeError("Model not loaded. Call build_model() or load() first.")

        if query_vars is None:
            query_vars = [n for n, m in NODE_METADATA.items()
                          if m["type"] in ("output", "intermediate")]
            query_vars = [q for q in query_vars if q in self.model.nodes()
                          and q not in evidence]

        results = {}
        for var in query_vars:
            if var in evidence:
                # Fixed evidence — return certainty distribution
                results[var] = {s: (1.0 if s == evidence[var] else 0.0)
                                for s in self._data_states.get(var, ["Low","Medium","High"])}
                continue
            try:
                phi = self.inference.query([var], evidence=evidence, show_progress=False)
                states = phi.state_names[var]
                results[var] = {s: round(float(p), 4)
                                for s, p in zip(states, phi.values)}
            except Exception as e:
                logger.warning(f"Query failed for {var}: {e}")
                results[var] = {s: 1/3 for s in ["Low", "Medium", "High"]}

        return results

    def query_expected_value(
        self,
        evidence: Dict[str, str],
        query_vars: Optional[List[str]] = None,
    ) -> Dict[str, float]:
        """
        Return expected value (0–100 scale) for each output variable.
        Maps: Low→25, Medium→55, High→85 (midpoints of tercile ranges).
        """
        MIDPOINTS = {"Low": 25.0, "Medium": 55.0, "High": 85.0}
        probs = self.query(evidence, query_vars)

        ev = {}
        for var, dist in probs.items():
            ev[var] = sum(MIDPOINTS.get(s, 50.0) * p for s, p in dist.items())

        # Special handling for dropout (invert: higher bin = worse)
        if "dropout_rate_bin" in ev:
            # Dropout Low = good (e.g. 5–10%), High = bad (e.g. 25–40%)
            dp = probs["dropout_rate_bin"]
            ev["dropout_rate_bin"] = (
                dp.get("Low", 0) * 8 +
                dp.get("Medium", 0) * 20 +
                dp.get("High", 0) * 35
            )
        # GPI: Low≈0.85, Medium≈0.95, High≈1.05
        if "gender_parity_index_bin" in ev:
            gp = probs["gender_parity_index_bin"]
            ev["gender_parity_index_bin"] = (
                gp.get("Low", 0) * 0.85 +
                gp.get("Medium", 0) * 0.95 +
                gp.get("High", 0) * 1.05
            )
        return ev

    # ─────────────────────────────────────────────────────────────────
    # Sensitivity Analysis
    # ─────────────────────────────────────────────────────────────────

    def sensitivity_analysis(
        self,
        target_var: str = "literacy_rate_bin",
        base_evidence: Optional[Dict[str, str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Compute sensitivity of target variable to each input variable.
        Measures probability shift when input moves from Low to High.

        Returns list of {variable, impact_score, direction} sorted by impact.
        """
        if base_evidence is None:
            base_evidence = {}

        input_nodes = [n for n, m in NODE_METADATA.items()
                       if m["type"] == "input" and n in self.model.nodes()]

        results = []
        for node in input_nodes:
            if node in base_evidence:
                continue

            ev_low  = {**base_evidence, node: "Low"}
            ev_high = {**base_evidence, node: "High"}

            try:
                q_low  = self.query(ev_low,  [target_var])
                q_high = self.query(ev_high, [target_var])

                p_high_low  = q_low[target_var].get("High", 0)
                p_high_high = q_high[target_var].get("High", 0)
                impact = p_high_high - p_high_low

                results.append({
                    "variable":     node,
                    "label":        NODE_METADATA[node]["label"],
                    "impact_score": round(abs(impact), 4),
                    "direction":    "positive" if impact > 0 else "negative",
                    "prob_high_when_low":  round(p_high_low, 4),
                    "prob_high_when_high": round(p_high_high, 4),
                })
            except Exception as e:
                logger.warning(f"Sensitivity failed for {node}: {e}")

        results.sort(key=lambda x: x["impact_score"], reverse=True)
        return results

    def compare_scenarios(
        self,
        scenario_a: Dict[str, str],
        scenario_b: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        Compare two policy scenarios side by side.
        Returns delta probabilities for each output variable.
        """
        output_nodes = [n for n, m in NODE_METADATA.items()
                        if m["type"] == "output" and n in self.model.nodes()]

        qa = self.query(scenario_a, output_nodes)
        qb = self.query(scenario_b, output_nodes)

        comparison = {}
        for var in output_nodes:
            # Expected value proxy: P(High)*100
            eva = sum({"Low": 20, "Medium": 55, "High": 85}.get(s, 55) * p
                      for s, p in qa[var].items())
            evb = sum({"Low": 20, "Medium": 55, "High": 85}.get(s, 55) * p
                      for s, p in qb[var].items())
            comparison[var] = {
                "scenario_a":    qa[var],
                "scenario_b":    qb[var],
                "ev_a":          round(eva, 2),
                "ev_b":          round(evb, 2),
                "delta":         round(evb - eva, 2),
                "label":         NODE_METADATA[var]["label"],
            }
        return comparison

    def get_dag_json(self) -> Dict[str, Any]:
        """Return DAG structure as JSON for frontend visualization."""
        nodes = [{"id": n, **NODE_METADATA.get(n, {"label": n, "type": "unknown", "unit": ""})}
                 for n in self.model.nodes()]
        edges = [{"source": u, "target": v}
                 for u, v in self.model.edges()]
        return {"nodes": nodes, "edges": edges}


# ─────────────────────────────────────────────────────────────────────
# Convenience: value → bin mapping for inference
# ─────────────────────────────────────────────────────────────────────

def value_to_bin(variable: str, value: float, df_ref: pd.DataFrame) -> str:
    """
    Map a continuous value to Low/Medium/High bin
    using the reference dataset's quantile thresholds.

    teacher_student_ratio uses INVERTED labels in the training data:
      - Low TSR value  → "High" bin (good, fewer students per teacher)
      - High TSR value → "Low" bin  (bad, overcrowded classes)
    This matches the data_pipeline discretization convention.
    """
    # Variables where lower numeric value = "High" (good) bin
    INVERTED_VARS = {"teacher_student_ratio"}

    col = variable  # without _bin suffix
    is_inverted = col in INVERTED_VARS

    if col not in df_ref.columns:
        # fallback: fixed thresholds
        FIXED = {
            "per_student_exp":       (7000, 12000),
            "teacher_student_ratio": (20, 32),
            "infra_index":           (40, 70),
            "digital_access":        (20, 55),
            "mid_day_meal":          (70, 90),
            "female_teacher_ratio":  (30, 50),
        }
        if col in FIXED:
            lo, hi = FIXED[col]
            if is_inverted:
                # Lower value = better = "High" bin
                if value <= lo: return "High"
                if value <= hi: return "Medium"
                return "Low"
            if value < lo: return "Low"
            if value < hi: return "Medium"
            return "High"
        return "Medium"

    q33 = df_ref[col].quantile(0.33)
    q67 = df_ref[col].quantile(0.67)

    if is_inverted:
        # Lower value = "High" (good), Higher value = "Low" (bad)
        if value <= q33:    return "High"
        elif value <= q67:  return "Medium"
        else:               return "Low"
    else:
        if value <= q33:    return "Low"
        elif value <= q67:  return "Medium"
        else:               return "High"


def build_evidence(inputs: Dict[str, float], df_ref: pd.DataFrame) -> Dict[str, str]:
    """Convert float input dict → discrete evidence dict for BN inference."""
    evidence = {}
    for var, val in inputs.items():
        bin_key = var + "_bin" if not var.endswith("_bin") else var
        if bin_key in BN_NODES:
            evidence[bin_key] = value_to_bin(var, val, df_ref)
        elif var in BN_NODES:
            evidence[var] = str(val)
    return evidence


# ─────────────────────────────────────────────────────────────────────
# Quick test
# ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from data_pipeline import load_or_build_dataset, discretize_for_bn

    df = load_or_build_dataset()
    df_d = discretize_for_bn(df)

    bn = MPEducationBN()
    bn.build_model(df_d, method="bayes")
    bn.save()

    # Test queries
    print("\n=== Query: High Digital Access ===")
    result = bn.query({"digital_access_bin": "High"})
    for var, dist in result.items():
        print(f"  {NODE_METADATA[var]['label']}: {dist}")

    print("\n=== Sensitivity Analysis → Literacy ===")
    sens = bn.sensitivity_analysis("literacy_rate_bin")
    for s in sens:
        print(f"  {s['label']:30s}: impact={s['impact_score']:.4f} ({s['direction']})")

    print("\n=== Scenario Comparison ===")
    comp = bn.compare_scenarios(
        {"digital_access_bin": "Low",  "teacher_student_ratio_bin": "High"},
        {"digital_access_bin": "High", "teacher_student_ratio_bin": "Low"},
    )
    for var, res in comp.items():
        print(f"  {res['label']:30s}: δ={res['delta']:+.1f}")
