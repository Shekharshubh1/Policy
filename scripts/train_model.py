#!/usr/bin/env python3
"""
scripts/train_model.py
─────────────────────────────────────────────────
Full pipeline: download/load data → preprocess → train Bayesian Network → save.

Run from project root:
    python scripts/train_model.py [--rebuild] [--method bayes|mle]

Args:
  --rebuild   Force re-download/rebuild of dataset
  --method    Parameter learning method: 'bayes' (default) or 'mle'
  --evaluate  Run evaluation metrics after training
"""

import sys
import logging
import argparse
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from data_pipeline import (
    load_or_build_dataset, discretize_for_bn, get_summary_stats
)
from bayesian_model import MPEducationBN, EDGES, BN_NODES
import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("train_model")


def evaluate_model(bn: MPEducationBN, df_test: pd.DataFrame):
    """
    Evaluate model predictive accuracy on held-out test set.
    Uses MAP (Maximum a Posteriori) prediction.
    """
    from bayesian_model import BN_NODES, build_evidence

    output_vars = ["literacy_rate_bin", "dropout_rate_bin",
                   "enrollment_rate_bin", "gender_parity_index_bin"]
    input_vars  = [n for n in BN_NODES if n not in output_vars and n in df_test.columns]

    correct = {v: 0 for v in output_vars}
    total = 0

    for _, row in df_test.iterrows():
        evidence = {v: row[v] for v in input_vars if v in row and pd.notna(row[v])}
        try:
            results = bn.query(evidence, output_vars)
            for var in output_vars:
                if var in row and pd.notna(row[var]):
                    pred = max(results[var], key=results[var].get)
                    if pred == row[var]:
                        correct[var] += 1
            total += 1
        except Exception:
            pass

    if total == 0:
        logger.warning("No valid test samples found")
        return

    logger.info("\n=== Evaluation Results ===")
    for var in output_vars:
        acc = correct[var] / total * 100
        logger.info(f"  {var:35s}: {acc:.1f}% accuracy ({correct[var]}/{total})")


def print_cpd_summary(bn: MPEducationBN):
    """Print a summary of learned CPDs."""
    logger.info("\n=== CPD Summary ===")
    for cpd in bn.model.cpds:
        logger.info(f"  Node: {cpd.variable}, States: {cpd.state_names[cpd.variable]}, "
                    f"Evidence: {list(cpd.variables[1:])}")


def main():
    parser = argparse.ArgumentParser(description="Train MP Education Bayesian Network")
    parser.add_argument("--rebuild",  action="store_true", help="Force dataset rebuild")
    parser.add_argument("--method",   default="bayes", choices=["bayes", "mle"],
                        help="Parameter learning method")
    parser.add_argument("--evaluate", action="store_true", help="Run evaluation after training")
    args = parser.parse_args()

    # ── 1. Load Data ──────────────────────────────────────────────────
    logger.info("Step 1: Loading dataset…")
    df = load_or_build_dataset(force_rebuild=args.rebuild)
    logger.info(f"  Dataset shape: {df.shape}")
    logger.info(f"  Districts: {df['district'].nunique()}")
    logger.info(f"  Years: {sorted(df['year'].unique())}")

    stats = get_summary_stats(df)
    logger.info(f"\n  State Averages (latest year):")
    logger.info(f"    Literacy Rate:   {stats['state_avg_literacy']}%")
    logger.info(f"    Dropout Rate:    {stats['state_avg_dropout']}%")
    logger.info(f"    GPI:             {stats['state_avg_gpi']}")

    # ── 2. Discretize ─────────────────────────────────────────────────
    logger.info("\nStep 2: Discretizing variables…")
    df_discrete = discretize_for_bn(df)

    # Check distribution
    for col in ["literacy_rate_bin", "dropout_rate_bin", "enrollment_rate_bin"]:
        if col in df_discrete.columns:
            counts = df_discrete[col].value_counts()
            logger.info(f"  {col}: {dict(counts)}")

    # ── 3. Split train/test ───────────────────────────────────────────
    test_year = df["year"].max()
    train_mask = df_discrete["year"] < test_year
    df_train = df_discrete[train_mask].copy()
    df_test  = df_discrete[~train_mask].copy()
    logger.info(f"\nStep 3: Train={len(df_train)}, Test={len(df_test)}")

    # ── 4. Train Bayesian Network ─────────────────────────────────────
    logger.info(f"\nStep 4: Training Bayesian Network (method={args.method})…")
    bn = MPEducationBN()
    model = bn.build_model(df_train, method=args.method)

    logger.info(f"  Nodes: {len(model.nodes())}")
    logger.info(f"  Edges: {len(model.edges())}")

    # ── 5. Evaluate ───────────────────────────────────────────────────
    if args.evaluate:
        logger.info("\nStep 5: Evaluating model…")
        evaluate_model(bn, df_test)

    print_cpd_summary(bn)

    # ── 6. Sample Queries ─────────────────────────────────────────────
    logger.info("\n=== Sample Queries ===")

    test_cases = [
        {
            "name": "High digital access",
            "evidence": {"digital_access_bin": "High"}
        },
        {
            "name": "Low teacher-student ratio (good) + High infrastructure",
            "evidence": {"teacher_student_ratio_bin": "Low", "infra_index_bin": "High"}
        },
        {
            "name": "Tribal district profile (Low infra, Low digital)",
            "evidence": {"infra_index_bin": "Low", "digital_access_bin": "Low",
                         "rural_urban": "rural"}
        },
        {
            "name": "Fully resourced district",
            "evidence": {
                "per_student_exp_bin": "High", "infra_index_bin": "High",
                "digital_access_bin":  "High", "teacher_student_ratio_bin": "Low",
                "mid_day_meal_bin":    "High", "female_teacher_ratio_bin": "High",
            }
        },
    ]

    for tc in test_cases:
        logger.info(f"\n  [{tc['name']}]")
        results = bn.query(tc["evidence"])
        for var in ["literacy_rate_bin", "dropout_rate_bin",
                    "enrollment_rate_bin", "gender_parity_index_bin"]:
            if var in results:
                dist = results[var]
                dominant = max(dist, key=dist.get)
                prob = dist[dominant]
                logger.info(f"    {var:35s}: {dominant} ({prob:.2f})")

    # ── 7. Sensitivity Analysis ────────────────────────────────────────
    logger.info("\n=== Sensitivity Analysis → Literacy Rate ===")
    sens = bn.sensitivity_analysis("literacy_rate_bin")
    for s in sens:
        bar = "█" * int(s["impact_score"] * 100)
        logger.info(f"  {s['label']:30s} [{s['direction']:8s}] {bar} {s['impact_score']:.4f}")

    # ── 8. Save ───────────────────────────────────────────────────────
    logger.info("\nStep 6: Saving model…")
    bn.save()
    logger.info("✓ Training complete!")


if __name__ == "__main__":
    main()
