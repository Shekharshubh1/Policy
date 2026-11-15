# National Healthcare Policy Prediction and Decision Intelligence System (NHP-DIS)
## Document 05: Bayesian DAG Specification & Topological Properties

---

### 1. Formal Graph Definition

Let $\mathcal{G} = (\mathcal{V}, \mathcal{E})$ denote the Directed Acyclic Graph (DAG) of the national public health system:
- **Vertices $\mathcal{V}$:** $|\mathcal{V}| = 37$ discrete random variables.
- **Edges $\mathcal{E}$:** $|\mathcal{E}| = 52$ directed causal edges.

The joint probability distribution factorizes according to the local Markov property:

$$P(X_1, X_2, \dots, X_{37}) = \prod_{i=1}^{37} P(X_i \mid \text{Pa}_{\mathcal{G}}(X_i))$$

Where $\text{Pa}_{\mathcal{G}}(X_i)$ denotes the set of parents of node $X_i$ in graph $\mathcal{G}$.

---

### 2. Complete Causal Edge Inventory (52 Directed Edges)

```
1.  per_capita_health_expenditure_bin  -> hospital_density_bin
2.  per_capita_health_expenditure_bin  -> bed_availability_bin
3.  public_health_budget_share_bin     -> phc_density_bin
4.  public_health_budget_share_bin     -> specialist_availability_bin
5.  public_health_budget_share_bin     -> doctor_ratio_bin
6.  insurance_coverage_bin             -> healthcare_accessibility_bin
7.  insurance_coverage_bin             -> universal_health_coverage_score_bin
8.  hospital_density_bin               -> healthcare_accessibility_bin
9.  phc_density_bin                    -> healthcare_accessibility_bin
10. bed_availability_bin               -> healthcare_accessibility_bin
11. doctor_ratio_bin                   -> service_quality_bin
12. nurse_ratio_bin                    -> service_quality_bin
13. specialist_availability_bin        -> service_quality_bin
14. asha_worker_density_bin            -> preventive_health_adoption_bin
15. asha_worker_density_bin            -> institutional_delivery_rate_bin
16. asha_worker_density_bin            -> immunization_rate_bin
17. female_literacy_bin                -> preventive_health_adoption_bin
18. female_literacy_bin                -> maternal_health_status_bin
19. female_literacy_bin                -> child_health_status_bin
20. sanitation_access_bin              -> disease_prevention_effectiveness_bin
21. sanitation_access_bin              -> communicable_disease_rate_bin
22. sanitation_access_bin              -> child_health_status_bin
23. clean_water_access_bin             -> disease_prevention_effectiveness_bin
24. clean_water_access_bin             -> communicable_disease_rate_bin
25. clean_water_access_bin             -> child_health_status_bin
26. telemedicine_access_bin            -> healthcare_accessibility_bin
27. telemedicine_access_bin            -> service_quality_bin
28. digital_health_records_bin         -> service_quality_bin
29. digital_health_records_bin         -> universal_health_coverage_score_bin
30. immunization_rate_bin              -> child_health_status_bin
31. immunization_rate_bin              -> communicable_disease_rate_bin
32. screening_coverage_bin             -> non_communicable_disease_rate_bin
33. institutional_delivery_rate_bin    -> maternal_health_status_bin
34. institutional_delivery_rate_bin    -> child_health_status_bin
35. poverty_rate_bin                   -> health_equity_index_bin
36. poverty_rate_bin                   -> population_health_risk_bin
37. poverty_rate_bin                   -> communicable_disease_rate_bin
38. healthcare_accessibility_bin       -> maternal_health_status_bin
39. healthcare_accessibility_bin       -> child_health_status_bin
40. healthcare_accessibility_bin       -> universal_health_coverage_score_bin
41. service_quality_bin                -> maternal_health_status_bin
42. service_quality_bin                -> child_health_status_bin
43. preventive_health_adoption_bin     -> maternal_health_status_bin
44. preventive_health_adoption_bin     -> child_health_status_bin
45. maternal_health_status_bin         -> maternal_mortality_rate_bin
46. child_health_status_bin            -> infant_mortality_rate_bin
47. communicable_disease_rate_bin      -> disease_burden_index_bin
48. non_communicable_disease_rate_bin  -> disease_burden_index_bin
49. disease_burden_index_bin           -> life_expectancy_bin
50. maternal_mortality_rate_bin        -> overall_health_index_bin
51. infant_mortality_rate_bin          -> overall_health_index_bin
52. universal_health_coverage_score_bin-> overall_health_index_bin
```

---

### 3. Topological Ordering

Because $\mathcal{G}$ contains no cycles, there exists an acyclic topological ordering:

$$\text{Topological Sort: } [\text{Spending, Infrastructure, HR, Social Determinants}] \prec [\text{Intermediate Capabilities}] \prec [\text{Specific Health Status}] \prec [\text{Mortality \& Morbidity}] \prec [\text{Composite Indices}]$$

This ensures that recursive factor substitution terminates in finite steps during Variable Elimination.

---

### 4. Markov Blankets & D-Separation

The Markov Blanket of any node $X \in \mathcal{V}$, denoted $\text{MB}(X)$, shields $X$ from the rest of the network:

$$\text{MB}(X) = \text{Pa}(X) \cup \text{Ch}(X) \cup \text{Pa}(\text{Ch}(X))$$

Conditioned on its Markov Blanket, $X$ is conditionally independent of all other nodes:

$$(X \perp\!\!\!\perp \mathcal{V} \setminus \{X \cup \text{MB}(X)\} \mid \text{MB}(X))$$

#### Example: Markov Blanket of `maternal_health_status_bin`
- **Parents $\text{Pa}(X)$:** `female_literacy_bin`, `institutional_delivery_rate_bin`, `healthcare_accessibility_bin`, `service_quality_bin`, `preventive_health_adoption_bin`.
- **Children $\text{Ch}(X)$:** `maternal_mortality_rate_bin`.
- **Co-parents $\text{Pa}(\text{Ch}(X))$:** None (maternal mortality has a single direct parent in the clinical pathway).

---

### 5. Parameter Estimation & Smoothing

Conditional Probability Distributions (CPDs) are parameterized as categorical Dirichlet distributions. To prevent zero-cell counts for rare cross-district configurations, we employ Bayesian Maximum Likelihood with symmetric Dirichlet priors ($\alpha = 1.0$, Laplace smoothing):

$$P(X_i = k \mid \text{Pa}(X_i) = \mathbf{j}) = \frac{N_{i,k,\mathbf{j}} + 1}{\sum_{k'=1}^{K_i} (N_{i,k',\mathbf{j}} + 1)} = \frac{N_{i,k,\mathbf{j}} + 1}{N_{i,\mathbf{j}} + K_i}$$

Where $K_i = 3$ (cardinality of states: `Low`, `Medium`, `High`). All fitted CPDs are empirically validated to satisfy the law of total probability: $\sum_k P(X_i = k \mid \mathbf{j}) = 1.0$.
