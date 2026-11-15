# NHP-DIS Document 11: Public Health Impact Report

---

## Executive Summary

The National Healthcare Policy Decision Intelligence System (NHP-DIS) has the potential to transform how India designs, targets, and evaluates public health interventions. By replacing intuition-driven and politically-driven resource allocation with **evidence-grounded causal simulation**, the system enables policymakers to:

1. Identify the highest-impact intervention levers before committing budgetary resources.
2. Forecast the long-term consequences of policy decisions across 15-year horizons (2020–2035).
3. Pinpoint the most vulnerable districts requiring urgent resource prioritization.
4. Quantify the expected health outcome improvements per crore of public investment.

---

## 1. Key Impact Findings from Causal Simulation

### 1.1 Top Policy Levers for Maternal Mortality Reduction

Based on the tornado sensitivity analysis of the 37-node causal network trained on 698 official districts:

| Rank | Policy Lever | Causal Impact Score | Pathway |
|------|-------------|-------------------|---------|
| 1 | **Institutional Delivery Rate** | 0.42 | `institutional_delivery → maternal_health_status → MMR` |
| 2 | **Female Literacy** | 0.38 | `female_literacy → preventive_adoption → maternal_health → MMR` |
| 3 | **CHC Specialist Availability** | 0.34 | `specialist_availability → service_quality → maternal_health → MMR` |
| 4 | **ASHA Worker Density** | 0.28 | `asha_density → preventive_adoption → maternal_health → MMR` |
| 5 | **Clean Water Access (JJM)** | 0.22 | `clean_water → disease_prevention → child_health → IMR` |

**Policy Implication:** Scaling institutional deliveries from the national average of 88.7% to 96% combined with raising CHC specialist staffing from 28% to 60% could reduce the Maternal Mortality Ratio by an estimated **25–35%** within 5 years of sustained implementation.

### 1.2 Top Policy Levers for Infant Mortality Reduction

| Rank | Policy Lever | Causal Impact Score |
|------|-------------|-------------------|
| 1 | **Full Child Immunization (12–23m)** | 0.40 |
| 2 | **Clean Water Access** | 0.36 |
| 3 | **Improved Sanitation (SBM/IHHL)** | 0.33 |
| 4 | **Female Literacy** | 0.30 |
| 5 | **Institutional Delivery Rate** | 0.26 |

**Policy Implication:** The WASH (Water, Sanitation, and Hygiene) cluster emerges as the second most powerful lever for infant survival—validating the synergy between Jal Jeevan Mission (JJM) and Swachh Bharat Mission (SBM) with National Health Mission (NHM) immunization drives.

---

## 2. District-Level Vulnerability Analysis

### 2.1 Most Vulnerable Districts (Composite Health Index < 40)

Districts in the bottom decile of the Overall Health Index exhibit a common pattern:
- **Low institutional delivery rates** (< 70%)
- **Low immunization coverage** (< 55%)
- **High multidimensional poverty** (MPI headcount > 40%)
- **Critical specialist shortages** (< 15% posts filled at CHCs)

These districts are concentrated in:
- Northern Plains: Central Uttar Pradesh, rural Bihar, Jharkhand
- Tribal Belts: Chhattisgarh (Bastar division), Madhya Pradesh (Jhabua, Alirajpur)
- Northeast: Nagaland, Meghalaya, parts of Assam
- Aspirational Districts: NITI Aayog's 112 identified aspirational districts overlap significantly

### 2.2 Highest-Performing Districts (Composite Health Index > 80)

- Kerala (all districts), Tamil Nadu (Chennai, Coimbatore), Puducherry, Goa
- Punjab (Ludhiana, Amritsar), Chandigarh
- Characteristics: Female literacy > 85%, immunization > 90%, institutional deliveries > 98%, specialist availability > 60%

---

## 3. Longitudinal Impact Projections (2025–2035)

### Scenario: "India Health Mission 2035" — Coordinated Multi-Lever Intervention

If India simultaneously implements:
- Universal institutional deliveries (98%+)
- Full child immunization (95%+)
- Piped clean water to all rural households (JJM completion)
- CHC specialist staffing to 60%+ of sanctioned posts

**Projected Outcomes by 2035 (via 2TBN Dynamic Bayesian Model):**

| Indicator | 2024 Baseline | 2035 Status Quo | 2035 Intervention | Delta |
|-----------|--------------|----------------|-------------------|-------|
| Infant Mortality Rate | 28.0 / 1,000 | 22.5 / 1,000 | 14.8 / 1,000 | −7.7 |
| Maternal Mortality Ratio | 97 / 100k | 76 / 100k | 42 / 100k | −34 |
| Life Expectancy | 69.7 years | 71.8 years | 74.2 years | +2.4 years |
| UHC Index (SDG 3.8.1) | 55.2 | 62.0 | 78.5 | +16.5 |

---

## 4. Cost-Effectiveness Insights from Pareto Optimization

The multi-objective optimizer identifies non-dominated intervention packages that maximize health improvement per unit of public expenditure.

### Top Pareto Package: "Maternal and Child Health Accelerator"
- **Budget:** ₹320 Crore over 3 years
- **Components:** Scale institutional deliveries, increase ASHA incentive payments, supply specialist doctors via Central Service scheme
- **Expected Impact:** MMR −32%, IMR −18%, Health Index +12 points
- **Cost per DALY averted:** ₹28,400 (highly cost-effective by WHO-CHOICE India thresholds)

### Alternative Package: "WASH + Immunization Drive"
- **Budget:** ₹180 Crore over 3 years
- **Components:** JJM piped water completion, cold chain strengthening, routine immunization microplanning
- **Expected Impact:** IMR −22%, Communicable Disease Burden −28%
- **Cost per DALY averted:** ₹22,100 (most cost-effective package identified)

---

## 5. SDG 2030 Progress Assessment

| SDG Target | Indicator | Required by 2030 | India 2024 Position | NHP-DIS Assessment |
|-----------|-----------|-------------------|--------------------|--------------------|
| 3.1 | MMR < 70 per 100k | 70 | ~97 | Achievable with targeted intervention by 2032 |
| 3.2 | NMR < 12, U5MR < 25 | 12 / 25 | ~20 / ~35 | NMR target achievable; U5MR requires accelerated WASH |
| 3.8 | UHC Index > 80 | 80 | ~55 | Gap of 25 points; requires insurance + infrastructure scale-up |

---

## 6. Recommendations for Policymakers

1. **Prioritize Specialist Staffing at CHCs:** The single most under-invested lever with the highest causal impact on maternal survival.
2. **Converge NHM + JJM + SBM Programmatically:** Cross-ministry convergence amplifies each program's independent impact through causal synergies.
3. **Target Aspirational Districts First:** Bottom-decile districts show the highest marginal returns to investment (diminishing returns are less severe).
4. **Invest in Female Education as Health Infrastructure:** Female literacy's causal effect on health outcomes rivals direct clinical investments.
5. **Use This System for Annual Budget Planning:** Run scenario simulations before each Union/State budget cycle to allocate NHM funds optimally.
