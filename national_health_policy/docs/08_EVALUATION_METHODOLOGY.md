# NHP-DIS Document 08: Evaluation Methodology

---

## 1. Evaluation Philosophy

The NHP-DIS causal engine is not a conventional supervised classifier where ground-truth labels exist for every input. It is a **generative causal model** that produces probability distributions over health outcomes under hypothetical policy interventions ($do$-calculus). Evaluation therefore requires a multi-pronged strategy combining:

1. **Internal Structural Validation** — Does the DAG factorization satisfy probabilistic axioms?
2. **Predictive Calibration** — Do posterior marginals align with observed empirical frequencies?
3. **Temporal Validation** — Can NFHS-4 (2015–16) state predict NFHS-5 (2019–21) observed changes?
4. **Sensitivity Robustness** — Are top policy levers stable across bootstrap resamples?
5. **Domain Expert Validation** — Do causal pathways accord with clinical and epidemiological knowledge?

---

## 2. Internal Structural Validation

### 2.1 CPD Stochasticity Check
Every Conditional Probability Distribution must satisfy:

$$\forall \mathbf{j}: \quad \sum_{k \in \{L, M, H\}} P(X_i = k \mid \text{Pa}(X_i) = \mathbf{j}) = 1.0$$

**Test:** Iterate over all 37 CPDs and verify each conditional column sums to 1.0 within floating-point tolerance ($\epsilon < 10^{-10}$).

### 2.2 Acyclicity Verification
Confirm the adjacency matrix $A$ of the 52-edge DAG satisfies:

$$\text{tr}(e^{A}) - n = 0$$

using the NOTEARS continuous acyclicity constraint, where $n = |\mathcal{V}| = 37$.

### 2.3 D-Separation Audit
For every declared conditional independence implied by the DAG (via d-separation), verify that the empirical mutual information:

$$I(X; Y \mid Z) \approx 0$$

on the discretized dataset using $\chi^2$ conditional independence tests at $\alpha = 0.05$.

---

## 3. Predictive Calibration

### 3.1 Marginal Calibration
For each output variable $Y \in \{$`maternal_mortality_rate_bin`, `infant_mortality_rate_bin`, ...$\}$, compare:
- **Model Marginal:** $P_{\text{model}}(Y = k)$ (computed via Variable Elimination with no evidence).
- **Empirical Marginal:** $P_{\text{data}}(Y = k)$ (observed frequency in discretized dataset).

**Metric:** Jensen–Shannon Divergence (JSD):

$$\text{JSD}(P_{\text{model}} \| P_{\text{data}}) = \frac{1}{2} D_{\text{KL}}(P \| M) + \frac{1}{2} D_{\text{KL}}(Q \| M), \quad M = \frac{P + Q}{2}$$

**Acceptance Criterion:** $\text{JSD} < 0.01$ for all output variables.

**Achieved:** JSD = 0.00024 across primary output nodes (verified in `scripts/evaluate_models.py`).

### 3.2 Conditional Calibration
For each policy lever $X_i$, condition on $X_i = \text{High}$ and compare posterior $P(Y \mid X_i = H)$ against the observed sub-population frequency in districts where $X_i$ falls in the top tertile.

---

## 4. Temporal Out-of-Sample Validation

### 4.1 Holdout Protocol
- **Training Set:** NFHS-4 (2015–16) district records only ($n \approx 640$).
- **Test Set:** NFHS-5 (2019–21) district records only ($n \approx 638$).

### 4.2 Protocol
1. Train the BN on the NFHS-4 subset.
2. For each district in NFHS-5, compute posterior predictions given that district's NFHS-5 policy lever values.
3. Compare predicted outcome bin distributions against observed NFHS-5 outcome bins.

### 4.3 Metrics
- **Accuracy:** Fraction of districts where the predicted MAP outcome bin matches the observed bin.
- **Expected Calibration Error (ECE):** Average absolute gap between predicted confidence and observed frequency across 10 confidence bins.
- **Brier Score:** $\text{BS} = \frac{1}{N} \sum_{i=1}^{N} \sum_{k=1}^{3} (p_{ik} - o_{ik})^2$

---

## 5. Sensitivity Stability Analysis

Bootstrap resample the district dataset 500 times. For each resample:
1. Re-estimate CPDs.
2. Re-run tornado sensitivity for `maternal_mortality_rate_bin`.
3. Record the top-3 ranked policy levers.

**Stability Metric:** Fraction of bootstrap resamples where the same variable appears in the top-3. Acceptance threshold: $\geq 85\%$ for the top lever.

---

## 6. Domain Expert Validation Protocol

Present the 52-edge DAG and the top-10 sensitivity rankings to a panel of:
- 2 public health physicians (MoHFW / AIIMS cadre)
- 1 health economist (NITI Aayog / WHO)
- 1 epidemiologist (ICMR / NCDC)

Each reviewer scores edge plausibility (1–5 Likert) and flags any paradoxical or missing causal pathways. Edges scoring $< 3.0$ average are reviewed for removal or reversal.
