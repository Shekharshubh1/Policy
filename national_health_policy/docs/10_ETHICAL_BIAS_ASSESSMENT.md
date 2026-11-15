# NHP-DIS Document 10: Ethical & Bias Assessment

---

## 1. Ethical Framework

The deployment of algorithmic decision intelligence in public health governance carries significant ethical responsibilities. NHP-DIS operates within the intersection of statistical modeling, causal inference, and policy advice that directly affects resource allocation to populations—including vulnerable tribal communities, women, children, and economically marginalized districts.

This assessment follows the principles of:
- **WHO Ethics & Governance of AI for Health (2021)**
- **NITI Aayog Responsible AI Framework (2021)**
- **OECD Principles on Artificial Intelligence (2019)**

---

## 2. Identified Bias Vectors

### 2.1 Sampling Bias in Source Surveys

**Risk:** The NFHS-5 sampling frame is designed for population representativeness at the district level, but districts with extreme geographic inaccessibility (Ladakh, Naga Hills, Nicobar Islands) may have lower response rates, biasing observed indicator values.

**Mitigation:**
- IIPS applies post-stratification weights to adjust for non-response; NHP-DIS uses weighted aggregates where available.
- Districts with fewer than 100 sampled households are flagged as "low-confidence" in the UI and excluded from top/bottom rankings.

### 2.2 Temporal Lag Bias

**Risk:** NFHS-5 fieldwork spans 2019–2021, overlapping with the COVID-19 pandemic. Health facility utilization, immunization drives, and institutional delivery rates may be artificially depressed in 2020–21 data collection phases.

**Mitigation:**
- The 2TBN forecasting model uses secular drift calibrated across both NFHS-4 and NFHS-5, dampening single-wave pandemic artifacts.
- Simulation outputs carry explicit uncertainty bands; users are warned that 2020–21 baseline values may understate post-pandemic recovery.

### 2.3 Infrastructure Reporting Bias

**Risk:** Rural Health Statistics (RHS) data reports sanctioned versus in-position clinical staff. States with chronic absenteeism or contractual staff may overstate specialist_availability.

**Mitigation:**
- RHS data is cross-validated against NFHS-5 facility-level indicators where available.
- The sensitivity analysis transparently shows how much each lever's uncertainty affects final outcomes.

### 2.4 Poverty Measurement Bias

**Risk:** The NITI Aayog MPI uses self-reported deprivation indicators that may undercount urban poverty and overcount certain rural deprivations.

**Mitigation:**
- MPI headcount ratios are used as one of 37 variables, not as a sole determinant. The Bayesian network integrates multiple partially correlated signals, reducing the impact of any single biased indicator.

---

## 3. Fairness Analysis

### 3.1 Geographic Equity
The model treats all 698 districts equally in parameter estimation—no district receives preferential weighting. However, states with more districts (Uttar Pradesh: 75 districts) contribute proportionally more data to CPD estimation than smaller states (Goa: 2 districts).

**Mitigation:** State-level random effects are not used (avoiding Simpson's paradox); instead, the flat district-level pooling preserves the causal structure learned from the national distribution.

### 3.2 Gender Equity
Multiple input variables explicitly encode gender-related health determinants: `female_literacy`, `institutional_delivery_rate`, `maternal_anemia_rate`, `maternal_mortality_rate`. The model's causal structure ensures that improvements in female literacy and maternal care propagate to better maternal and child health outcomes—aligning with SDG 5 (Gender Equality) objectives.

### 3.3 Urban-Rural Equity
The RHS and NFHS surveys oversample rural areas by design (India is ~65% rural). The model's recommendations therefore disproportionately reflect rural health system dynamics. For urban-specific interventions, users should filter by districts classified as "predominantly urban" in Census 2011 metadata.

---

## 4. Transparency & Explainability Commitments

| Principle | Implementation |
|-----------|---------------|
| **Model Transparency** | Complete DAG with 52 edges is visible in the Causal DAG Explorer. Every edge has an epidemiological justification. |
| **Decision Traceability** | Every simulation output includes the active causal pathway trace from policy lever to outcome. |
| **Data Provenance** | All 4 source datasets are government-published with stable URLs, documented in `data_sources.json`. |
| **Reproducibility** | Training pipeline is deterministic given the same input CSVs. Model serialization uses versioned pickle artifacts. |
| **Human Override** | The system produces recommendations, not directives. All outputs carry confidence scores and uncertainty bands. Final policy decisions rest with human decision-makers (MoHFW, NITI Aayog, state health directorates). |

---

## 5. Potential Harms & Safeguards

| Potential Harm | Scenario | Safeguard |
|---------------|----------|-----------|
| **Resource Misallocation** | A policymaker takes the optimizer's top package at face value without local context | Outputs include disclaimers: "Based on national causal patterns; local validation with ASHA workers and district health officers is essential." |
| **Stigmatization of Districts** | Bottom-10 district lists could politically stigmatize certain regions | UI presents vulnerability scores as opportunities for targeted support, not as blame metrics. |
| **Overconfidence in Forecasts** | 2035 projections treated as certainties rather than conditional simulations | All forecasts display "under stated intervention assumptions" labels and 90% credible intervals. |
| **Digital Divide** | Dashboard inaccessible to block-level health workers without broadband | Planned: PDF export of district profiles for offline distribution. |

---

## 6. Ongoing Governance Recommendations

1. **Annual Bias Audit:** Re-run fairness analysis when new survey data (NFHS-6, RHS updates) becomes available.
2. **Diverse Reviewer Panel:** Include tribal health specialists, women's health advocates, and northeast India representatives in expert validation panels.
3. **Community Feedback Loop:** Integrate feedback from ASHA workers and District Programme Management Units (DPMUs) to calibrate model assumptions against ground reality.
4. **Data Minimization:** The system stores only aggregate district-level indicators—no individual patient records, no personally identifiable information (PII).
