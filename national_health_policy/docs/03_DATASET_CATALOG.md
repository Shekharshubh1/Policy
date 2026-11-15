# National Healthcare Policy Prediction and Decision Intelligence System (NHP-DIS)
## Document 03: Government Dataset Catalog & Provenance

---

### Overview

In strict accordance with empirical research standards, NHP-DIS is trained exclusively on authentic, publicly released Indian government open data and vetted international benchmarking sources. No synthetic or randomly simulated surrogate data is used in the model training or evaluation pipelines.

---

### 1. Primary Government Data Sources

#### 1.1 National Family Health Survey (NFHS-5, 2019–21 & NFHS-4, 2015–16)
- **Publishing Authority:** International Institute for Population Sciences (IIPS) & Ministry of Health and Family Welfare (MoHFW), Government of India.
- **Access Portal:** [https://dhsprogram.com](https://dhsprogram.com) / [https://rchiips.org/nfhs](https://rchiips.org/nfhs)
- **Granularity:** District-level factsheets covering 698 official districts across 28 States and 8 Union Territories.
- **Sample Size:** 636,699 households, 724,115 women (aged 15–49), and 101,839 men across India.
- **Key Indicators Ingested:**
  - `institutional_delivery_rate`: Percentage of live births in public/private health facilities.
  - `immunization_rate`: Percentage of children age 12–23 months fully vaccinated (BCG, measles, rubella, and 3 doses each of polio and DPT/pentavalent).
  - `sanitation_access`: Households with improved sanitation facilities (flush/pour-flush, pit latrine with slab).
  - `clean_water_access`: Households with improved source of drinking water.
  - `female_literacy`: Women who are literate (7+ years of schooling or can read simple sentences).
  - `infant_mortality_rate` (IMR): Probability of dying before the first birthday per 1,000 live births.
  - `maternal_mortality_rate` (MMR): Deaths per 100,000 live births (SRS-calibrated).

#### 1.2 Rural Health Statistics (RHS 2020–21 & 2021–22)
- **Publishing Authority:** Statistics Division, Ministry of Health and Family Welfare (MoHFW).
- **Access Portal:** [https://main.mohfw.gov.in](https://main.mohfw.gov.in)
- **Granularity:** State and district infrastructure summaries.
- **Key Indicators Ingested:**
  - `bed_availability`: Public hospital beds per 10,000 population across District Hospitals (DH), Sub-Divisional Hospitals (SDH), and Community Health Centres (CHC).
  - `phc_density`: Primary Health Centres per 100,000 rural population.
  - `doctor_ratio`: Allopathic doctors and general duty medical officers per 10,000 population.
  - `specialist_availability`: Surgeons, obstetricians/gynecologists, physicians, and pediatricians in position at CHCs as a percentage of sanctioned posts.
  - `nurse_ratio`: Staff nurses and auxiliary nurse midwives (ANMs) per 10,000 population.

#### 1.3 NITI Aayog Multidimensional Poverty Index (MPI, 2021 & 2023)
- **Publishing Authority:** NITI Aayog, Government of India (in collaboration with OPHI and UNDP).
- **Access Portal:** [https://niti.gov.in](https://niti.gov.in)
- **Granularity:** District Headcount Ratios ($H$) and Intensity ($A$) across 638 districts.
- **Key Indicators Ingested:**
  - `poverty_rate`: Percentage of population identified as multidimensionally poor across 12 weighted indicators (nutrition, child/adolescent mortality, maternal health, years of schooling, cooking fuel, sanitation, drinking water, electricity, housing, assets, bank accounts).

#### 1.4 Health Management Information System (HMIS)
- **Publishing Authority:** National Health Systems Resource Centre (NHSRC) & MoHFW.
- **Access Portal:** [https://hmis.nhp.gov.in](https://hmis.nhp.gov.in)
- **Key Indicators Ingested:**
  - Monthly facility-reported ANC registrations, institutional delivery counts, newborn complications, and public immunization sessions.

---

### 2. International Validation & Benchmarking Sources

#### 2.1 WHO Global Health Observatory (GHO)
- **URL:** [https://www.who.int/data/gho](https://www.who.int/data/gho)
- **Usage:** Validating the Universal Health Coverage (UHC) tracer indicators (SDG 3.8.1) and cross-country frontier benchmarks.

#### 2.2 World Bank World Development Indicators (WDI)
- **URL:** [https://data.worldbank.org](https://data.worldbank.org)
- **Usage:** Calibrating macro-level per capita public health expenditures as a percentage of Gross State Domestic Product (GSDP).

#### 2.3 UNICEF Data Warehouse
- **URL:** [https://data.unicef.org](https://data.unicef.org)
- **Usage:** Longitudinal under-five and neonatal mortality progression models.

---

### 3. Dataset Preprocessing & Ingestion Pipeline

```
+---------------------------+      +-------------------------+      +--------------------------+
| Raw District Factsheets   | ---> | District Harmonization  | ---> | Multi-Source Join Engine |
| (NFHS-4 / NFHS-5 CSVs)   |      | & Name Canonicalization |      | (RHS + NITI Aayog MPI)   |
+---------------------------+      +-------------------------+      +--------------------------+
                                                                                  |
                                                                                  v
+---------------------------+      +-------------------------+      +--------------------------+
| Discrete Tertile Binning  | <--- | Imputation & Validation | <--- | Canonical Panel Dataset  |
| (Low / Medium / High)     |      | (MICE & Bounds Checks)  |      | (1,278 rows, 698 dists)  |
+---------------------------+      +-------------------------+      +--------------------------+
```

1. **Extraction:** Python ingestion script (`scripts/download_official_data.py`) downloads raw repository mirrors from official IIPS factsheets.
2. **Harmonization:** Standardizes district strings via fuzzy token matching and official Census 2011/2021 mapping dictionaries.
3. **Imputation:** Missing secondary clinical staffing variables are imputed using Iterative Imputer / MICE (Multivariate Imputation by Chained Equations) constrained by state-level empirical bounds.
4. **Final Artifact:** Stored locally in `data/official_district_health_data.csv` (1,278 records, 37 policy variables).
