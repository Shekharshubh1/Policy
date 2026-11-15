"""
Offline Training Script for National Healthcare Policy Bayesian Networks.
Trains both Static Causal BN and 2-Time-Slice Dynamic BN (2TBN)
on authentic official government panel data (698 districts).
"""

import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from data_pipeline import load_or_build_national_dataset, discretize_for_bn, get_dataset_summary
from bayesian_network import NationalHealthBN
from dynamic_bayesian_network import DynamicHealthBN

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TrainModels")


def main():
    logger.info("=================================================================")
    logger.info("Training National Healthcare Policy Bayesian Network Pipeline")
    logger.info("=================================================================")

    # 1. Load authentic government data
    logger.info("Step 1: Loading official government dataset...")
    df = load_or_build_national_dataset()
    logger.info(f"Loaded: {len(df)} rows across {df['district_name'].nunique()} districts in {df['state_name'].nunique()} states.")

    # 2. Quantile discretization
    logger.info("Step 2: Discretizing continuous variables into empirical terciles...")
    df_d = discretize_for_bn(df)

    # 3. Fit Static Causal Bayesian Network
    logger.info("Step 3: Fitting Static Causal Bayesian Network (BDeu / MLE)...")
    bn = NationalHealthBN()
    bn.build_and_train(df_d, method="bayes")
    model_save_path = Path(__file__).parent.parent / "models" / "static_bn_model.pkl"
    bn.save(model_save_path)
    logger.info(f"✓ Static Causal BN successfully trained and saved to {model_save_path}")

    # 4. Calibrate Dynamic Bayesian Network (2TBN)
    logger.info("Step 4: Calibrating 2-Time-Slice Dynamic Bayesian Network (2015-2035)...")
    dbn = DynamicHealthBN()
    dbn.calibrate_transitions(df)
    dbn_save_path = Path(__file__).parent.parent / "models" / "dbn_model.pkl"
    dbn.save(dbn_save_path)
    logger.info(f"✓ Dynamic BN successfully calibrated and saved to {dbn_save_path}")

    logger.info("\n=================================================================")
    logger.info("Training Complete! Models ready for production deployment.")
    logger.info("=================================================================")


if __name__ == "__main__":
    main()
