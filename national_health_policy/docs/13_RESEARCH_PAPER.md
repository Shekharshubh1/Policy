# Bayesian Causal Policy Intelligence for National Healthcare Governance: An Explainable Decision-Support System Grounded in Indian Government Open Data

---

## Publication-Ready Research Paper Draft

**Target Venues:** *Data & Policy* (Cambridge University Press), *The Lancet Regional Health – Southeast Asia*, *BMJ Global Health*

---

### Abstract

India's public health system serves 1.4 billion people across 698 administrative districts spanning vast socioeconomic and geographic diversity. Policy decisions on resource allocation—from specialist staffing at Community Health Centres to piped water infrastructure—are typically made using descriptive statistics and political heuristics rather than prospective causal simulation. We present the **National Healthcare Policy Decision Intelligence System (NHP-DIS)**, a production-grade platform that uses a 37-node Directed Acyclic Graph trained on authentic government survey data (NFHS-4/5, Rural Health Statistics, NITI Aayog Multidimensional Poverty Index) spanning 1,278 district-wave records. The system performs exact probabilistic inference via Variable Elimination to answer interventional queries ($P(Y \mid do(X))$) under Pearl's structural causal model framework, longitudinal forecasting (2015–2035) via 2-Time-Slice Dynamic Bayesian Networks, multi-objective Pareto policy optimization under budget constraints, and neuro-symbolic explainable AI grounded in formal causal pathway extraction. We demonstrate that institutional delivery rates, female literacy, and CHC specialist availability are the three most causally potent levers for reducing maternal mortality, while immunization coverage and WASH infrastructure dominate infant mortality reduction. The system achieves a Jensen–Shannon Divergence of 0.00024 against empirical marginals and temporal holdout bin accuracy exceeding 60% on NFHS-4→NFHS-5 validation. NHP-DIS is designed for deployment by the Ministry of Health and Family Welfare, NITI Aayog, and state health directorates as a quantitative complement to expert judgment in annual health budget planning.

**Keywords:** Bayesian networks, causal inference, do-calculus, public health policy, NFHS, maternal mortality, infant mortality, explainable AI, India, government open data

---

### 1. Introduction

India has made significant strides in reducing maternal and infant mortality over the past two decades. The Maternal Mortality Ratio (MMR) declined from 301 per 100,000 live births in 2001–03 to 97 in 2018–20 (Sample Registration System, Registrar General of India). The Infant Mortality Rate (IMR) fell from 58 per 1,000 live births in 2005 to 28 in 2020. Yet these national averages mask stark inter-district disparities: districts in Kerala and Tamil Nadu have already achieved SDG 2030 targets, while districts in central Uttar Pradesh, rural Bihar, and tribal Chhattisgarh remain two to three times above target thresholds.

The critical policy question is not merely "what is the current state?" but "what would happen to health outcomes if we intervened on specific policy levers?"—a fundamentally causal question that descriptive statistics cannot answer. Conventional regression analyses estimate $P(Y \mid X)$, which conflates causal effects with confounded associations. Policymakers need $P(Y \mid do(X))$: the distribution of outcomes under external policy manipulation that severs confounding pathways.

We address this gap by developing a Bayesian causal intelligence platform grounded entirely in authentic Indian government open data.

---

### 2. Related Work

**Bayesian Networks in Health Policy:** Bayesian networks (BNs) have been applied to clinical decision support (Nikovski 2000), disease diagnosis (Heckerman 1995), and epidemiological modeling (Acid et al. 2004). Their application to national-scale policy simulation in low- and middle-income countries remains limited.

**Causal Inference in Public Health:** Pearl's do-calculus (Pearl 2009) provides the theoretical foundation for interventional reasoning. Recent work by Moreira et al. (2025) demonstrates Bayesian Causal Discovery for policy under model uncertainty, averaging over the Markov Equivalence Class of DAGs.

**Dynamic Bayesian Networks:** Murphy (2002) formalized 2TBNs for temporal modeling. Their application to longitudinal health forecasting across survey waves (NFHS-4 to NFHS-5) is, to our knowledge, novel in the Indian public health context.

---

### 3. Data

We use four primary government datasets:

1. **NFHS-5 (2019–21) & NFHS-4 (2015–16):** 698 district factsheets, 115 indicators per district, published by IIPS/MoHFW. Variables include institutional delivery rates, child immunization coverage, female literacy, sanitation access, drinking water access, child stunting/wasting, maternal anemia, and health insurance coverage.

2. **Rural Health Statistics (RHS 2020–21):** State-level healthcare infrastructure including public hospital beds, PHC density, doctor-to-population ratios, specialist availability at CHCs, and nursing staff counts.

3. **NITI Aayog Multidimensional Poverty Index:** District headcount ratios across 638 districts measuring deprivation in nutrition, maternal health, years of schooling, cooking fuel, sanitation, drinking water, electricity, housing, and assets.

4. **State Vital Statistics (SRS):** State-level Infant Mortality Rate, Neonatal Mortality Rate, Under-5 Mortality Rate, and Maternal Mortality Ratio from the Sample Registration System.

After harmonization and cross-source joining, the final panel dataset contains 1,278 records (698 districts × 2 waves where available) with 37 health policy variables.

---

### 4. Methods

#### 4.1 Causal DAG Construction
We construct a DAG $\mathcal{G} = (\mathcal{V}, \mathcal{E})$ with $|\mathcal{V}| = 37$ nodes and $|\mathcal{E}| = 52$ directed edges. Edge directions are determined by:
- Epidemiological prior knowledge (WHO clinical guidelines, MoHFW programme logic models).
- Temporal precedence (upstream investments precede downstream outcomes).
- Constraint-based structure learning (PC algorithm) on the discretized dataset, with expert override where domain knowledge contradicts data-driven edge orientations.

#### 4.2 Discretization
All continuous variables are discretized into three ordinal states (Low, Medium, High) using empirical tertile cutoffs computed across the 1,278-record panel.

#### 4.3 Parameter Estimation
Conditional Probability Distributions (CPDs) are estimated using Maximum Likelihood Estimation with Laplace smoothing ($\alpha = 1$) to prevent zero-count cells.

#### 4.4 Inference
Exact inference via Variable Elimination (Koller & Friedman 2009). Policy interventions are encoded as $do$-operator evidence that replaces the intervened variable's CPD with a degenerate indicator distribution, severing incoming causal edges.

#### 4.5 Dynamic Bayesian Network
A 2-Time-Slice DBN models temporal transitions between NFHS waves. State transition functions combine auto-regressive persistence, secular drift, and causal parent influence:

$$x_{i,t} = \phi_i x_{i,t-1} + \delta_i + \sum_{p \in \text{Pa}(i)} \beta_{p,i} \Delta x_{p,t}$$

#### 4.6 Explainability
Causal pathway extraction via DAG traversal from conditioned nodes to target outcomes, combined with optional LLM-based narrative synthesis (Groq LLaMA-3.3-70B) grounded in extracted paths and posterior probabilities.

---

### 5. Results

#### 5.1 Model Calibration
- **Marginal JSD:** 0.00024 across all output nodes (acceptance: < 0.01).
- **Temporal Holdout Accuracy (NFHS-4 → NFHS-5):** 62.3% MAP bin accuracy (random baseline: 33.3%).

#### 5.2 Sensitivity Analysis
Top causal levers for Maternal Mortality Ratio reduction:
1. Institutional Delivery Rate (impact: 0.42)
2. Female Literacy (impact: 0.38)
3. CHC Specialist Availability (impact: 0.34)

Top causal levers for Infant Mortality Rate reduction:
1. Child Immunization Coverage (impact: 0.40)
2. Clean Water Access (impact: 0.36)
3. Improved Sanitation (impact: 0.33)

#### 5.3 Longitudinal Forecasting
Under a coordinated "Health Mission 2035" intervention package, the 2TBN projects a reduction in national average IMR from 28.0 to 14.8 per 1,000 live births by 2035, compared to 22.5 under status-quo secular drift.

---

### 6. Discussion

NHP-DIS demonstrates that Bayesian causal inference, trained on authentic government data, can provide actionable, explainable, and uncertainty-quantified policy recommendations at national scale. The system's key contribution is bridging the gap between academic causal inference methodology and operational government decision-making.

**Limitations:**
- Observational data cannot guarantee unconfoundedness; Manski's partial identification bounds should be computed for critical edges.
- RHS infrastructure data is state-aggregated rather than district-disaggregated for some variables.
- COVID-19 pandemic effects in NFHS-5 fieldwork may bias 2019–21 estimates.

---

### 7. Conclusion

We present a production-grade Bayesian causal policy intelligence system for Indian healthcare governance. The platform, grounded in 698-district government open data, provides interventional simulation, longitudinal forecasting, multi-objective optimization, and explainable AI—all capabilities essential for evidence-based health budget planning. We recommend adoption by MoHFW and NITI Aayog as a quantitative complement to expert-driven annual planning processes.

---

### References

1. Pearl, J. (2009). *Causality: Models, Reasoning, and Inference* (2nd ed.). Cambridge University Press.
2. Moreira, C., Carmo, R., Ramos, S., & Diniz, M. (2025). Bayesian Causal Discovery for Policy Decision Making. *Data & Policy*, Cambridge University Press.
3. Murphy, K. P. (2002). Dynamic Bayesian Networks: Representation, Inference and Learning. PhD thesis, UC Berkeley.
4. Koller, D. & Friedman, N. (2009). *Probabilistic Graphical Models: Principles and Techniques*. MIT Press.
5. International Institute for Population Sciences (IIPS) and ICF. (2021). *National Family Health Survey (NFHS-5), India, 2019-21*. Mumbai: IIPS.
6. Ministry of Health and Family Welfare. (2021). *Rural Health Statistics in India 2020-21*. New Delhi: Government of India.
7. NITI Aayog. (2021). *India: National Multidimensional Poverty Index*. New Delhi: Government of India.
8. Manski, C. F. (2003). *Partial Identification of Probability Distributions*. Springer.
