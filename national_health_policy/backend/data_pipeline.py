"""
National Healthcare Data Engineering Pipeline & Ingestion Engine.
Loads, normalizes, and discretizes the official 698-district Indian health panel dataset
grounded directly in published government datasets:
  - MoHFW / IIPS National Family Health Survey (NFHS-4 2015-16 & NFHS-5 2019-21)
  - MoHFW Rural Health Statistics (RHS) & HMIS
  - NITI Aayog Multidimensional Poverty Index (MPI)
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HealthDataPipeline")

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
OFFICIAL_CSV = DATA_DIR / "official_district_health_data.csv"
DICT_JSON = DATA_DIR / "data_dictionary.json"

INVERTED_VARS = {
    "communicable_disease_rate",
    "non_communicable_disease_rate",
    "poverty_rate",
    "population_health_risk",
    "maternal_mortality_rate",
    "infant_mortality_rate",
    "disease_burden_index"
}


def load_or_build_national_dataset(force_rebuild: bool = False) -> pd.DataFrame:
    """Loads the authentic government district dataset."""
    if not force_rebuild and OFFICIAL_CSV.exists():
        logger.info(f"✓ Loading official government dataset from {OFFICIAL_CSV}")
        return pd.read_csv(OFFICIAL_CSV)

    logger.info("Official dataset not found on disk — downloading and building from official sources...")
    from scripts.download_official_data import download_raw_files, build_official_dataset
    download_raw_files()
    return build_official_dataset()


def discretize_for_bn(df: pd.DataFrame) -> pd.DataFrame:
    """
    Quantile discretization into 3 states: Low, Medium, High.
    Takes into account variables where lower numerical values indicate higher quality/performance
    (e.g., mortality rates, poverty, disease burden).
    """
    df_d = df.copy()

    # Core 30 variables to discretize for BN
    core_variables = [
        "per_capita_health_expenditure", "public_health_budget_share", "insurance_coverage",
        "hospital_density", "phc_density", "bed_availability",
        "doctor_ratio", "nurse_ratio", "specialist_availability", "asha_worker_density",
        "immunization_rate", "screening_coverage", "institutional_delivery_rate",
        "literacy_rate", "female_literacy", "sanitation_access", "clean_water_access",
        "telemedicine_access", "digital_health_records",
        "communicable_disease_rate", "non_communicable_disease_rate",
        "poverty_rate", "income_level",
        "healthcare_accessibility", "service_quality", "preventive_health_adoption",
        "maternal_health_status", "child_health_status", "disease_prevention_effectiveness",
        "population_health_risk",
        "maternal_mortality_rate", "infant_mortality_rate", "life_expectancy",
        "health_equity_index", "disease_burden_index", "universal_health_coverage_score",
        "overall_health_index"
    ]

    for col in core_variables:
        if col not in df_d.columns:
            continue

        is_inverted = col in INVERTED_VARS
        # For inverted variables: lower numeric value = High quality state
        labels = ["High", "Medium", "Low"] if is_inverted else ["Low", "Medium", "High"]

        try:
            df_d[col + "_bin"] = pd.qcut(df_d[col], q=3, labels=labels, duplicates="drop").astype(str)
        except Exception:
            df_d[col + "_bin"] = pd.cut(df_d[col], bins=3, labels=labels).astype(str)

    return df_d


def get_dataset_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Computes summary statistics across official Indian districts for dashboard display."""
    latest_yr = int(df["year"].max())
    latest = df[df["year"] == latest_yr]

    return {
        "latest_year": latest_yr,
        "total_records": len(df),
        "total_districts": int(df["district_name"].nunique()),
        "total_states": int(df["state_name"].nunique()),
        "data_source_verification": "Authentic Government Data: MoHFW NFHS-5, RHS, HMIS & NITI Aayog",
        "national_averages": {
            "maternal_mortality_rate": round(float(latest["maternal_mortality_rate"].mean()), 1),
            "infant_mortality_rate": round(float(latest["infant_mortality_rate"].mean()), 1),
            "life_expectancy": round(float(latest["life_expectancy"].mean()), 1),
            "institutional_delivery_rate": round(float(latest["institutional_delivery_rate"].mean()), 1),
            "immunization_rate": round(float(latest["immunization_rate"].mean()), 1),
            "doctor_ratio": round(float(latest["doctor_ratio"].mean()), 2),
            "sanitation_access": round(float(latest["sanitation_access"].mean()), 1),
            "clean_water_access": round(float(latest["clean_water_access"].mean()), 1),
            "insurance_coverage": round(float(latest["insurance_coverage"].mean()), 1),
            "overall_health_index": round(float(latest["overall_health_index"].mean()), 1),
        }
    }


if __name__ == "__main__":
    df = load_or_build_national_dataset()
    df_d = discretize_for_bn(df)
    summary = get_dataset_summary(df)
    print("Official dataset loaded & discretized successfully!")
    print(json.dumps(summary, indent=2))
