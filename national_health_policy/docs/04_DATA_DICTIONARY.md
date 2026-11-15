# National Healthcare Policy Prediction and Decision Intelligence System (NHP-DIS)
## Document 04: Public Health Data Dictionary & Variable Ontology

---

### Variable Schema Overview

The NHP-DIS causal topology contains **37 random variables** classified into three hierarchical structural categories:
1. **Input Policy Variables (Levers):** Direct instruments of public intervention (Spending, Infrastructure, Human Resources, Preventive Care, Social Determinants, Digital Health).
2. **Intermediate Latent / Mediating Nodes:** System-level capabilities, clinical service quality, and adoption pathways.
3. **Primary Health Outcomes:** Morbidity, mortality, equity, and composite wellness indices.

All continuous indicators are discretized into 3-tier ordinal states:
- **Low:** $[0, T_{33\%})$
- **Medium:** $[T_{33\%}, T_{66\%})$
- **High:** $[T_{66\%}, 100\%]$

---

### 1. Input Policy Variables (18 Levers)

| Variable Identifier | Display Name | Domain | Official Source | Units | Tertile Cutoffs (L / M / H) | Direction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `per_capita_health_expenditure` | Per Capita Health Outlay | Spending | NHA / State Budgets | ₹ / person | $\le 2800$ / $2801-4500$ / $> 4500$ | High = Good |
| `public_health_budget_share` | Public Health Budget | Spending | RBI State Finances | % of GSDP | $\le 1.8\%$ / $1.9-3.2\%$ / $> 3.2\%$ | High = Good |
| `insurance_coverage` | Health Insurance Coverage | Spending | NFHS-5 Factsheet | % households | $\le 30.5\%$ / $30.6-55.0\%$ / $> 55.0\%$ | High = Good |
| `hospital_density` | Hospital Density | Infrastructure | RHS / MoHFW | facilities / 100k | $\le 1.8$ / $1.9-3.4$ / $> 3.4$ | High = Good |
| `phc_density` | PHC Density | Infrastructure | RHS / MoHFW | PHCs / 100k rural | $\le 4.2$ / $4.3-7.5$ / $> 7.5$ | High = Good |
| `bed_availability` | Public Bed Density | Infrastructure | RHS / MoHFW | beds / 10k pop | $\le 8.5$ / $8.6-18.0$ / $> 18.0$ | High = Good |
| `doctor_ratio` | Doctor-to-Population Ratio | Human Resources | RHS / NMC | doctors / 10k pop | $\le 5.2$ / $5.3-9.8$ / $> 9.8$ | High = Good |
| `nurse_ratio` | Nurse-to-Population Ratio | Human Resources | RHS / INC | nurses / 10k pop | $\le 11.0$ / $11.1-22.0$ / $> 22.0$ | High = Good |
| `specialist_availability` | CHC Specialist Availability | Human Resources | RHS Table 9 | % posts filled | $\le 18.0\%$ / $18.1-42.0\%$ / $> 42.0\%$ | High = Good |
| `asha_worker_density` | ASHA Worker Density | Human Resources | NHM MIS | ASHAs / 1k rural | $\le 8.0$ / $8.1-14.5$ / $> 14.5$ | High = Good |
| `immunization_rate` | Child Full Immunization | Preventive Care | NFHS-5 Indicator 18 | % children 12-23m | $\le 70.0\%$ / $70.1-84.0\%$ / $> 84.0\%$ | High = Good |
| `screening_coverage` | NCD Screening Coverage | Preventive Care | CPHC-AB-HWC Portal | % adults 30+ | $\le 22.0\%$ / $22.1-48.0\%$ / $> 48.0\%$ | High = Good |
| `institutional_delivery_rate` | Institutional Deliveries | Preventive Care | NFHS-5 Indicator 15 | % live births | $\le 82.0\%$ / $82.1-94.0\%$ / $> 94.0\%$ | High = Good |
| `female_literacy` | Female Literacy Rate | Social Determinants| NFHS-5 Indicator 3 | % females age 7+ | $\le 62.0\%$ / $62.1-78.0\%$ / $> 78.0\%$ | High = Good |
| `sanitation_access` | Improved Sanitation (IHHL) | Social Determinants| NFHS-5 Indicator 7 | % households | $\le 61.5\%$ / $61.6-81.0\%$ / $> 81.0\%$ | High = Good |
| `clean_water_access` | Piped Drinking Water | Social Determinants| NFHS-5 / JJM Portal | % households | $\le 78.0\%$ / $78.1-92.0\%$ / $> 92.0\%$ | High = Good |
| `telemedicine_access` | eSanjeevani Access | Digital Health | eSanjeevani Dashboard| % HWCs connected | $\le 30.0\%$ / $30.1-65.0\%$ / $> 65.0\%$ | High = Good |
| `digital_health_records` | ABHA / ABDM Adoption | Digital Health | NHA ABDM Dashboard | % linked records | $\le 20.0\%$ / $20.1-50.0\%$ / $> 50.0\%$ | High = Good |

---

### 2. Intermediate Nodes (10 Variables)

| Variable Identifier | Display Name | Causal Interpretation | Primary Upstream Determinants |
| :--- | :--- | :--- | :--- |
| `healthcare_accessibility` | Physical Healthcare Accessibility | Travel time & facility radius | `hospital_density`, `phc_density`, `bed_availability` |
| `service_quality` | Clinical Service & Care Quality | Adherence to treatment protocols | `doctor_ratio`, `specialist_availability`, `nurse_ratio` |
| `preventive_health_adoption` | Community Preventive Adoption | Health-seeking behavior & literacy | `female_literacy`, `asha_worker_density`, `telemedicine_access` |
| `maternal_health_status` | Comprehensive Maternal Health | Nutritional status, ANC, facility care | `institutional_delivery_rate`, `service_quality`, `sanitation_access` |
| `child_health_status` | Early Childhood Health & Vigor | Stunting, wasting, vaccine prophylaxis | `immunization_rate`, `clean_water_access`, `sanitation_access` |
| `disease_prevention_effectiveness` | Public Prevention Effectiveness | Vector control & prophylaxis | `clean_water_access`, `sanitation_access`, `screening_coverage` |
| `population_health_risk` | Population Vulnerability Risk | Burden of chronic & environmental risk | `poverty_rate`, `communicable_disease_rate`, `ncd_rate` |
| `communicable_disease_rate` | Communicable Disease Incidence | Malaria, TB, dengue, diarrheal rates | `sanitation_access`, `clean_water_access`, `poverty_rate` |
| `non_communicable_disease_rate` | NCD Morbidity Prevalence | Hypertension, diabetes, CVD burden | `screening_coverage`, `female_literacy`, `poverty_rate` |
| `poverty_rate` | Multidimensional Poverty Headcount| Alkire-Foster Headcount Ratio ($H$) | NITI Aayog Multidimensional Poverty Index |

---

### 3. Primary Health Outcomes (7 Variables)

| Variable Identifier | Display Name | Unit of Measure | Target Benchmark (SDG 2030 / National) | High State Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| `maternal_mortality_rate` | Maternal Mortality Ratio (MMR) | Deaths per 100k births | $< 70$ (SDG 3.1) | Adverse (High Mortality) |
| `infant_mortality_rate` | Infant Mortality Rate (IMR) | Deaths per 1,000 births | $< 23$ (SDG 3.2) | Adverse (High Mortality) |
| `life_expectancy` | Life Expectancy at Birth | Years | $> 75.0\text{ years}$ | Favorable (High Longevity) |
| `health_equity_index` | Health Equity Index | Score (0–100) | $> 80.0\text{ points}$ | Favorable (Low Disparity) |
| `disease_burden_index` | DALY Disease Burden Index | Score (0–100) | $< 30.0\text{ points}$ | Adverse (High DALYs) |
| `universal_health_coverage_score` | UHC Index (SDG 3.8.1) | Score (0–100) | $> 80.0\text{ points}$ | Favorable (High Coverage) |
| `overall_health_index` | Composite Health Index | Score (0–100) | $> 75.0\text{ points}$ | Favorable (Top Performance) |
