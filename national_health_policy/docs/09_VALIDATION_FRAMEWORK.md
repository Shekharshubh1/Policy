# NHP-DIS Document 09: Validation Framework

---

## 1. Scope

This document specifies the multi-layer validation framework that ensures the NHP-DIS causal engine produces trustworthy, calibrated, and reproducible policy intelligence. The framework operationalizes the evaluation methodology (Doc 08) into concrete automated tests, acceptance gates, and continuous monitoring checks.

---

## 2. Validation Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 5: DEPLOYMENT                       │
│        Health endpoint, latency SLAs, memory guards          │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 4: DOMAIN                           │
│        Expert panel review, epidemiological plausibility      │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 3: TEMPORAL                          │
│        NFHS-4 → NFHS-5 holdout, forecast error bounds        │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 2: STATISTICAL                       │
│        JSD calibration, Brier score, bootstrap stability      │
├─────────────────────────────────────────────────────────────┤
│                    LAYER 1: STRUCTURAL                        │
│        Acyclicity, CPD stochasticity, d-separation tests      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1: Structural Validation Gates

| Test ID | Test Description | Acceptance Criterion | Automated |
|---------|------------------|---------------------|-----------|
| S-01 | CPD column sums equal 1.0 | $\|\sum_k P(X_i=k \mid \mathbf{j}) - 1.0\| < 10^{-10}$ | ✅ Yes |
| S-02 | DAG contains no cycles | `networkx.is_directed_acyclic_graph(G) == True` | ✅ Yes |
| S-03 | All 37 nodes have fitted CPDs | `len(model.cpds) == 37` | ✅ Yes |
| S-04 | All 52 edges present in model | `len(model.edges()) == 52` | ✅ Yes |
| S-05 | Node cardinality is 3 (Low/Med/High) | `all(cpd.cardinality[0] == 3 for cpd in cpds)` | ✅ Yes |

---

## 4. Layer 2: Statistical Calibration Gates

| Test ID | Test Description | Metric | Threshold |
|---------|------------------|--------|-----------|
| C-01 | Marginal calibration: model vs empirical | Jensen–Shannon Divergence | JSD < 0.01 |
| C-02 | Conditional calibration under evidence | Mean Absolute Error of posterior probabilities | MAE < 0.08 |
| C-03 | Bootstrap sensitivity stability | Top lever consistency across 500 resamples | ≥ 85% |
| C-04 | Brier score for outcome predictions | Brier Score across test districts | BS < 0.20 |

---

## 5. Layer 3: Temporal Holdout Validation

### Protocol
1. **Split:** Train on NFHS-4 wave (year ≤ 2016), test on NFHS-5 wave (year ≥ 2019).
2. **Predict:** For each NFHS-5 district, feed its observed policy lever bins as evidence, compute posterior over outcome bins.
3. **Score:** Compare predicted MAP bin against observed bin.

### Acceptance Criteria
- **Bin Accuracy:** ≥ 55% (3-class discrete, random baseline = 33%)
- **Within-1-Bin Accuracy:** ≥ 85% (predicted bin is within ±1 ordinal level of truth)
- **2TBN Forecast RMSE:** Year-over-year IMR prediction RMSE < 4.0 deaths per 1,000 live births

---

## 6. Layer 4: Domain Expert Panel Review

### Panel Composition
- Minimum 3 reviewers with public health, health economics, or epidemiology expertise.
- Reviewers are provided: (a) the 52-edge DAG diagram, (b) top-10 sensitivity rankings for MMR and IMR, (c) sample simulation outputs for 5 representative districts (1 high-performing, 1 low-performing, 1 tribal, 1 urban, 1 northeast).

### Scoring Protocol
- Each causal edge rated on a 1–5 plausibility scale (1 = clinically implausible, 5 = strongly supported by evidence).
- Any edge averaging < 3.0 is flagged for structural revision.
- Any missing pathway identified by ≥ 2 reviewers is investigated for inclusion.

---

## 7. Layer 5: Deployment Health Validation

| Check | Frequency | Threshold |
|-------|-----------|-----------|
| `/health` endpoint responds 200 OK | Every 30s | < 500ms |
| `/simulate` latency P95 | Per-request | < 250ms |
| `/forecast` latency P95 | Per-request | < 150ms |
| Memory consumption | Continuous | < 2 GB resident |
| Model file integrity (SHA-256 hash) | On boot | Matches training hash |

---

## 8. Continuous Validation Pipeline

When new NFHS-6 or annual HMIS data becomes available:
1. Re-run the data ingestion pipeline with new raw files.
2. Re-estimate CPDs on the expanded dataset.
3. Re-execute all Layer 1–3 automated tests.
4. If any gate fails, hold the existing production model and flag for human review.
5. If all gates pass, promote the new model to production and archive the previous version.
