# National Healthcare Policy Prediction and Decision Intelligence System (NHP-DIS)
## Document 02: Literature Review & Theoretical Foundations

---

### Abstract

This document reviews the methodological, statistical, and epidemiological foundations underpinning the National Healthcare Policy Decision Intelligence System (NHP-DIS). We examine the limitations of classical econometric regressions, explore Pearl's Structural Causal Models (SCMs), evaluate Dynamic Bayesian Networks (DBNs) in public health, analyze Manski's bounds for partial identification under unobserved confounding, and synthesize the recent work on Bayesian Causal Discovery for Policy Decision Making under model uncertainty (*Moreira, Carmo, Ramos, and Diniz, Cambridge University Press / Data & Policy, 2025*).

---

### 1. The Challenge of Observational Policy Analysis

Public health policy formulation in lower- and middle-income countries (LMICs) has historically relied on cross-sectional regressions (OLS, multi-level logistic regression) and fixed-effects econometric panel models. While useful for descriptive summaries, these classical methods suffer from fatal shortcomings when used for prospective intervention planning:
1. **Confounding & Spurious Correlations:** High institutional delivery rates frequently correlate with higher recorded maternal mortality in facility reports because high-risk, complicated pregnancies self-select into tertiary hospitals (Berkson's bias). Ordinary conditioning ($P(Y | X)$) misinterprets this as institutional care causing adverse outcomes.
2. **Failure to Model Interventions ($P(Y|X) \neq P(Y|do(X))$):** Econometric models estimate statistical associations rather than the distribution of an outcome under external policy manipulation.
3. **Inability to Trace Intermediate Mechanisms:** Single-equation models fail to disentangle how upstream infrastructure investments propagate through clinical service quality to impact maternal survival.

---

### 2. Pearl's Structural Causal Models & the $do$-Calculus

Judea Pearl's Structural Causal Model (SCM) framework provides the mathematical bedrock of NHP-DIS. A causal model is defined as a 4-tuple:

$$M = \langle U, V, F, P(u) \rangle$$

Where:
- $U$ is a set of background / exogenous variables determined outside the model.
- $V = \{V_1, V_2, \dots, V_n\}$ is a set of endogenous variables observed within the health system.
- $F = \{f_1, f_2, \dots, f_n\}$ is a set of structural deterministic equations such that $v_i = f_i(\text{pa}_i, u_i)$.
- $P(u)$ is a joint probability distribution over exogenous variables.

#### 2.1 The $do$-Operator and Graph Mutilation
When an intervention is applied—such as mandating that all primary health centers maintain adequate clinical specialists ($do(\text{specialist\_availability} = \text{High})$)—the structural equation governing that node is replaced by a constant:

$$f_{\text{specialist\_availability}} \leftarrow \text{High}$$

Graphically, this severs all incoming arrows to the intervened node ($\text{pa}_i \rightarrow X_i$), eliminating confounding paths while allowing the intervention's influence to propagate downstream through child nodes.

---

### 3. Dynamic Bayesian Networks (DBNs) in Epidemiological Forecasting

While static Bayesian Networks model equilibrium joint distributions, public health policy unfolds across time horizons. An intervention enacted in 2025 (such as constructing community water purification plants under the Jal Jeevan Mission) requires a multi-year latency period before yielding measurable drops in infant diarrhea and under-five mortality.

NHP-DIS adopts a **2-Time-Slice Dynamic Bayesian Network (2TBN)**. A 2TBN is defined over variables $\mathbf{Z}_t = (\mathbf{X}_t, \mathbf{Y}_t)$ across time steps $t \in \{0, 1, \dots, T\}$ by specifying:
1. **Prior Distribution:** $P(\mathbf{Z}_0)$, representing baseline health status (calibrated from NFHS-4/5).
2. **Transition Model:** $P(\mathbf{Z}_t | \mathbf{Z}_{t-1})$:

$$P(\mathbf{Z}_t | \mathbf{Z}_{t-1}) = \prod_{i=1}^N P(Z_{i,t} | \text{Pa}(Z_{i,t}))$$

Where parents $\text{Pa}(Z_{i,t})$ can reside in the same time slice (intra-slice causal edges) or in the preceding time slice $t-1$ (inter-slice temporal transitions).

---

### 4. Bayesian Causal Discovery Under Model Uncertainty (*Moreira et al., 2025*)

In their landmark paper *Bayesian Causal Discovery for Policy Decision Making*, Moreira, Carmo, Ramos, and Diniz (2025) demonstrate that relying on a single selected DAG for policy decisions introduces severe model selection bias. Public health data exhibits high collinearity, unobserved spatial heterogeneity, and measurement noise.

Moreira et al. advocate for **Bayesian Model Averaging (BMA)** over the Markov Equivalence Class of DAGs:

$$P(Y | do(X), \mathcal{D}) = \sum_{G \in \mathcal{G}} P(Y | do(X), G, \mathcal{D}) P(G | \mathcal{D})$$

Where $P(G | \mathcal{D})$ is the posterior probability of graph structure $G$ given official health survey data $\mathcal{D}$:

$$P(G | \mathcal{D}) \propto P(G) \int P(\mathcal{D} | \boldsymbol{\theta}_G, G) P(\boldsymbol{\theta}_G | G) d\boldsymbol{\theta}_G$$

Using score-equivalent metrics like the Bayesian Information Criterion (BIC) and BDeu (Bayesian Dirichlet equivalent uniform prior), NHP-DIS evaluates edge stability across bootstrap resamples, ensuring that only causal dependencies that persist across $\ge 85\%$ of graph topologies are retained in the production model.

---

### 5. Manski's Nonparametric Bounds & Partial Identification

In observational government health statistics, complete unconfoundedness cannot be dogmatically assumed. Charles Manski's partial identification framework establishes worst-case and monotone instrumental bounds for average treatment effects (ATE):

$$\text{ATE} = \mathbb{E}[Y(1)] - \mathbb{E}[Y(0)]$$

Under monotone treatment response (MTR) assumptions—where increasing healthcare workforce or clean water access can never biologically worsen survival outcomes—the identification region contracts substantially without requiring arbitrary parametric functional form assumptions.

---

### 6. Synthesis and Comparative Advantage of NHP-DIS

| Feature | Econometric OLS / GLM | Deep Neural Networks | NHP-DIS Causal Engine |
| :--- | :--- | :--- | :--- |
| **Foundational Theory** | Correlation / Linear Conditioning | Statistical Pattern Recognition | Pearl's Structural Causal Models ($do$-calculus) |
| **Confounding Control** | Control variables (prone to collider bias) | None (black box correlations) | Explicit d-separation & Backdoor Criterion |
| **Uncertainty Quantification**| Standard errors (parametric) | Dropout / Ensemble heuristics | Exact Dirichlet Dirichlet-Multinomial Posteriors |
| **Interventional Simulation**| Biased ($P(Y \mid X)$) | Biased ($P(Y \mid X)$) | Unbiased ($P(Y \mid do(X))$) via Graph Mutilation |
| **Explainability** | Coefficient signs | Post-hoc SHAP / LIME | Direct causal pathways + Grounded LLM briefs |
| **Data Requirements** | Large sample, linear assumptions | $10^5+$ samples | Robust under small/moderate sample sizes |

---

### References
1. Pearl, J. (2009). *Causality: Models, Reasoning, and Inference* (2nd ed.). Cambridge University Press.
2. Moreira, C., Carmo, R., Ramos, S., & Diniz, M. (2025). *Bayesian Causal Discovery for Policy Decision Making*. Cambridge University Press / Data & Policy.
3. Manski, C. F. (2003). *Partial Identification of Probability Distributions*. Springer.
4. Murphy, K. P. (2002). *Dynamic Bayesian Networks: Representation, Inference and Learning*. UC Berkeley.
5. International Institute for Population Sciences (IIPS) and ICF. (2021). *National Family Health Survey (NFHS-5), India, 2019-21*. Mumbai: IIPS.
6. Ministry of Health and Family Welfare (MoHFW). (2021). *Rural Health Statistics in India 2020-21*. New Delhi: Government of India.
