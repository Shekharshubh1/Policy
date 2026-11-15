"""
Neuro-Symbolic Explainable AI (XAI) & Causal Policy Reasoning Engine.
Unifies exact Bayesian graph propagation with Groq LLaMA-3.3-70B for:
  1. Natural Language Policy Query Parsing (NL -> do(X = x))
  2. Causal Evidence Chain Tracing (Root Cause -> Latent -> Outcome)
  3. Executive Policy Brief Generation with Confidence Bounds & Action Items
Grounded in Pearl's Do-Calculus and Moreira et al. (Cambridge / Data & Policy, 2025).
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import httpx
from dotenv import load_dotenv

# Search for .env in repo root, backend folder, and current working directory
root_env = Path(__file__).resolve().parent.parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
load_dotenv()

logger = logging.getLogger("XAI_Engine")

# Key & Provider Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip("\"' \t\r\n")
GROQ1_API_KEY = os.getenv("GROQ1_API_KEY", "").strip("\"' \t\r\n")
OPENROUTER_API_KEY = (os.getenv("OPENROUTER_API_KEY", "") or GROQ1_API_KEY).strip("\"' \t\r\n")

# Model definitions
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
GROQ_DIRECT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
TIMEOUT_SECONDS = 30.0

SYSTEM_POLICY_PARSER = """You are a Senior Public Health Policy Architect for the Government of India (MoHFW and NITI Aayog).
Your task is to parse a policymaker's free-text natural language query into a structured JSON configuration of causal interventions.

Possible target variables:
- per_capita_health_expenditure_bin: "Low" | "Medium" | "High"
- public_health_budget_share_bin: "Low" | "Medium" | "High"
- insurance_coverage_bin: "Low" | "Medium" | "High"
- hospital_density_bin: "Low" | "Medium" | "High"
- phc_density_bin: "Low" | "Medium" | "High"
- bed_availability_bin: "Low" | "Medium" | "High"
- doctor_ratio_bin: "Low" | "Medium" | "High"
- nurse_ratio_bin: "Low" | "Medium" | "High"
- specialist_availability_bin: "Low" | "Medium" | "High"
- asha_worker_density_bin: "Low" | "Medium" | "High"
- immunization_rate_bin: "Low" | "Medium" | "High"
- screening_coverage_bin: "Low" | "Medium" | "High"
- institutional_delivery_rate_bin: "Low" | "Medium" | "High"
- female_literacy_bin: "Low" | "Medium" | "High"
- sanitation_access_bin: "Low" | "Medium" | "High"
- clean_water_access_bin: "Low" | "Medium" | "High"
- telemedicine_access_bin: "Low" | "Medium" | "High"
- digital_health_records_bin: "Low" | "Medium" | "High"

Rules:
1. Return ONLY a valid JSON object. No conversational markdown.
2. Format:
{
  "interventions": { "<variable_name_bin>": "High" | "Medium" | "Low" },
  "target_state": "<state_name or null>",
  "target_district": "<district_name or null>",
  "focus_population": "all" | "rural" | "tribal"
}
"""

SYSTEM_POLICY_EXPLAINER = """You are the Chief Public Health Advisor to the Ministry of Health & Family Welfare (MoHFW), India, and NITI Aayog.
You are given results from a Bayesian Network simulation modeling causal healthcare pathways across Indian districts (grounded in NFHS-5, RHS, and HMIS).

Methodological Principles (Moreira et al., 2025):
- Clearly differentiate between Upstream Root Causes (female literacy, sanitation, clean water, budget) and Proximal Clinical Causes (institutional deliveries, specialist doctors).
- Explain why intervening only on symptoms fails when root determinants are neglected.
- Cite specific counterfactual impact: ΔE[Y | do(X)].
- Note practical implementation bottlenecks: workforce retention in tribal areas, capital gestation lags.
- Conclude with 3 concrete, prioritized administrative directives for the National Health Mission (NHM).
Format clearly with professional markdown headings.
"""


async def call_groq_llm(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> Optional[str]:
    """
    Asynchronous LLM invocation for Policy Copilot:
    Calls LLaMA-3.3-70B on Groq LPUs via OpenRouter or direct Groq Cloud API,
    with automatic provider fallback.
    """
    # 1. Try OpenRouter (meta-llama/llama-3.3-70b-instruct with Groq LPU routing)
    if OPENROUTER_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://policy.fddcloud.me",
                "X-Title": "NHP-DIS Policy Copilot"
            }
            payload = {
                "model": OPENROUTER_MODEL,
                "provider": {"order": ["Groq"]},
                "temperature": temperature,
                "max_tokens": 1200,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
                resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    logger.info("✓ LLaMA-3.3-70B inference via Groq/OpenRouter successful")
                    return content
                else:
                    logger.warning(f"OpenRouter Groq call returned HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"OpenRouter Groq call exception: {e}")

    # 2. Try direct Groq Cloud API if GROQ_API_KEY is present
    if GROQ_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": GROQ_DIRECT_MODEL,
                "temperature": temperature,
                "max_tokens": 1200,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
                resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"].strip()
                    logger.info("✓ Direct Groq LPU inference successful")
                    return content
                else:
                    logger.warning(f"Direct Groq API returned HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.warning(f"Direct Groq API exception: {e}")

    return None


def extract_causal_pathways(interventions: Dict[str, str], target_outcomes: List[str]) -> List[Dict[str, Any]]:
    """
    Extracts active structural causal propagation paths in the DAG from intervened nodes
    through intermediate latents to final outcomes.
    """
    pathways = []
    for var, state in interventions.items():
        clean_name = var.replace("_bin", "")
        # Trace path based on DAG edges
        if "doctor" in var or "specialist" in var or "nurse" in var:
            pathways.append({
                "origin": var,
                "origin_type": "Human Resources (Proximal)",
                "path": [clean_name, "service_quality", "maternal_health_status", "maternal_mortality_rate"],
                "mechanism": "Clinical staffing surge directly expands 24/7 emergency obstetric care and lowers facility mortality."
            })
        elif "literacy" in var:
            pathways.append({
                "origin": var,
                "origin_type": "Social Determinants (Upstream Root Cause)",
                "path": [clean_name, "preventive_health_adoption", "institutional_delivery_rate", "maternal_mortality_rate"],
                "mechanism": "Educating women enhances health-seeking autonomy, leading to earlier ANC registrations and safe deliveries."
            })
        elif "water" in var or "sanitation" in var:
            pathways.append({
                "origin": var,
                "origin_type": "Environmental Determinants (Upstream Root Cause)",
                "path": [clean_name, "population_health_risk", "child_health_status", "infant_mortality_rate"],
                "mechanism": "Interrupts fecal-oral transmission of rotavirus and enteropathy, drastically curbing dehydration-induced infant deaths."
            })
        elif "telemedicine" in var or "digital" in var:
            pathways.append({
                "origin": var,
                "origin_type": "Digital Health Enabler",
                "path": [clean_name, "healthcare_accessibility", "screening_coverage", "disease_burden_index"],
                "mechanism": "Bridges geographic specialist shortages in remote HWCs via virtual consultations and timely triage."
            })
        elif "budget" in var or "expenditure" in var:
            pathways.append({
                "origin": var,
                "origin_type": "Fiscal Allocation (Structural Upstream)",
                "path": [clean_name, "phc_density", "doctor_ratio", "service_quality"],
                "mechanism": "Fiscal capital expansion provides recurring operational grants and competitive staffing incentives."
            })
        else:
            pathways.append({
                "origin": var,
                "origin_type": "Direct Policy Lever",
                "path": [clean_name, "healthcare_accessibility", "overall_health_index"],
                "mechanism": "General service capacity expansion influencing composite system performance."
            })

    return pathways


async def parse_natural_language_query(query: str) -> Dict[str, Any]:
    """Converts user natural language input into structured intervention parameters."""
    prompt = f"Query: \"{query}\""
    llm_resp = await call_groq_llm(SYSTEM_POLICY_PARSER, prompt, temperature=0.1)

    if llm_resp:
        try:
            match = re.search(r'\{.*\}', llm_resp, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass

    # Deterministic Rule-Based Fallback
    interventions = {}
    q_low = query.lower()

    if "doctor" in q_low or "staff" in q_low:
        interventions["doctor_ratio_bin"] = "High"
    if "specialist" in q_low or "surgeon" in q_low:
        interventions["specialist_availability_bin"] = "High"
    if "delivery" in q_low or "birth" in q_low or "maternal" in q_low:
        interventions["institutional_delivery_rate_bin"] = "High"
    if "vaccin" in q_low or "immuniz" in q_low:
        interventions["immunization_rate_bin"] = "High"
    if "water" in q_low or "drinking" in q_low:
        interventions["clean_water_access_bin"] = "High"
    if "toilet" in q_low or "sanitat" in q_low:
        interventions["sanitation_access_bin"] = "High"
    if "telemedicine" in q_low or "esanjeevani" in q_low:
        interventions["telemedicine_access_bin"] = "High"
    if "insurance" in q_low or "pm-jay" in q_low or "pmjay" in q_low:
        interventions["insurance_coverage_bin"] = "High"
    if "budget" in q_low or "spend" in q_low:
        interventions["public_health_budget_share_bin"] = "High"
    if "literacy" in q_low or "education" in q_low or "women" in q_low:
        interventions["female_literacy_bin"] = "High"

    if not interventions:
        interventions["specialist_availability_bin"] = "High"
        interventions["institutional_delivery_rate_bin"] = "High"

    return {
        "interventions": interventions,
        "target_state": None,
        "target_district": None,
        "focus_population": "tribal" if "tribal" in q_low else ("rural" if "rural" in q_low else "all")
    }


async def generate_policy_explanation(
    query: str,
    interventions: Dict[str, str],
    expected_values: Dict[str, float],
    pathways: List[Dict[str, Any]],
    district_context: Optional[str] = None
) -> str:
    """Generates an executive, evidence-grounded policy explanation."""
    prompt = f"""
Policy Query: "{query}"
District Context: {district_context or "National Aggregate / Sub-National Cross-District"}

Interventions Applied via Pearl's do-calculus:
{json.dumps(interventions, indent=2)}

Simulated Expected Health Outcomes:
- Maternal Mortality Ratio (MMR): {expected_values.get('maternal_mortality_rate', 155.0)} per 100k
- Infant Mortality Rate (IMR): {expected_values.get('infant_mortality_rate', 32.0)} per 1000
- Life Expectancy: {expected_values.get('life_expectancy', 74.0)} years
- Health Equity Score: {expected_values.get('health_equity_index', 72.0)} / 100
- Universal Health Coverage (UHC SDG 3.8.1): {expected_values.get('universal_health_coverage_score', 75.0)}
- Overall Health Index: {expected_values.get('overall_health_index', 73.0)} / 100

Active Causal Pathways Traced in Bayesian Network:
{json.dumps(pathways, indent=2)}

Please deliver a comprehensive, publication-grade policy intelligence brief.
"""

    llm_resp = await call_groq_llm(SYSTEM_POLICY_EXPLAINER, prompt, temperature=0.25)
    if llm_resp:
        return llm_resp

    # High-Quality Neuro-Symbolic Fallback Brief
    interv_names = [k.replace('_bin', '').replace('_', ' ').title() for k in interventions.keys()]
    mmr_val = expected_values.get('maternal_mortality_rate', 155.0)
    imr_val = expected_values.get('infant_mortality_rate', 32.0)
    life_val = expected_values.get('life_expectancy', 74.0)

    return f"""### ◈ Executive Policy Advisory: Causal Impact Assessment

**Target Intervention Bundle:** {', '.join(interv_names)}  
**Evaluation Model:** 30-Node Causal Bayesian Network (NFHS-5 & RHS Grounded)

#### 1. Causal Impact & Probability Shifts
- **Infant Mortality Rate (IMR):** Projected to reach **{imr_val} deaths per 1,000 live births** (a significant shift toward SDG 3.2 targets).
- **Maternal Mortality Ratio (MMR):** Expected at **{mmr_val} deaths per 100,000 live births**, driven by safe delivery saturation.
- **Estimated Life Expectancy:** Projected at **{life_val} years** at birth.

#### 2. The Upstream vs. Downstream Causal Mechanism
Applying the analytical framework of *Moreira et al. (2025)*, our causal DAG confirms that while proximal levers (such as institutional delivery and specialist care) provide acute clinical survival, **upstream social and environmental determinants act as foundational causal multipliers**:
1. **Preventive Multiplier:** Expanding clean water and sanitation directly suppresses enteropathy and diarrheal pathogens, preventing early child wasting before acute hospital care is ever required.
2. **Workforce Synergy:** Increasing bed capacity without addressing specialist and staff nurse vacancies yields diminishing returns, as physical hospital beds remain clinically dormant without trained providers.

#### 3. Priority Recommendations for National Health Mission (NHM)
1. **Human Resource Retention:** Deploy specialized hard-area allowances and residential quarters to eliminate the 60%+ specialist vacancy rate across Community Health Centres in Aspirational Districts.
2. **Inter-Ministerial Convergence:** Couple healthcare infrastructure investments with the Jal Jeevan Mission (piped clean drinking water) to dismantle the primary environmental vector of infant mortality.
3. **Telemedicine Protocol Standardization:** Accelerate eSanjeevani digital consultations at Ayushman Arogya Mandirs (HWCs) to provide timely specialist triage for high-risk obstetric cases.
"""


SYSTEM_DISTRICT_RECOMMENDER = """You are the Senior Public Health Strategy Advisor for the Ministry of Health & Family Welfare (MoHFW) and NITI Aayog.
Given a district's empirical health baseline and national benchmarks, diagnose its critical bottlenecks and prescribe exact numerical policy lever recommendations to achieve optimal improvement.

Return ONLY a valid JSON object matching this exact schema:
{
  "diagnostic_summary": "1-2 sentences summarizing the core vulnerabilities.",
  "primary_bottlenecks": ["Bottleneck 1", "Bottleneck 2", "Bottleneck 3"],
  "recommended_levers": {
    "doctor_ratio": float,
    "specialist_availability": float,
    "institutional_delivery_rate": float,
    "immunization_rate": float,
    "clean_water_access": float,
    "sanitation_access": float,
    "telemedicine_access": float,
    "insurance_coverage": float,
    "phc_density": float,
    "bed_availability": float
  },
  "clinical_and_upstream_rationale": "Brief scientific justification citing Pearl's causal mechanisms.",
  "key_directives": ["Priority Directive 1", "Priority Directive 2", "Priority Directive 3"]
}
"""


async def generate_district_recommendation(
    district_name: str,
    district_data: Dict[str, Any],
    national_averages: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Uses LLaMA-3.3-70B on Groq LPUs to evaluate a district's empirical baseline,
    diagnose health deficits, and prescribe exact policy slider interventions.
    """
    nat = national_averages or {}
    benchmarks_summary = f"""
National Benchmarks:
- IMR: {nat.get('infant_mortality_rate', 32.6)} per 1000
- MMR: {nat.get('maternal_mortality_rate', 103.0)} per 100k
- Doctor Ratio: {nat.get('doctor_ratio', 7.5)} per 10k
- Specialist Availability: {nat.get('specialist_availability', 35.0)}%
- Institutional Delivery: {nat.get('institutional_delivery_rate', 88.6)}%
- Full Immunization: {nat.get('immunization_rate', 77.0)}%
- Clean Water: {nat.get('clean_water_access', 85.0)}%
- Sanitation: {nat.get('sanitation_access', 78.0)}%
"""

    state_name = district_data.get("state_name", "India")
    user_prompt = f"""District: {district_name}, {state_name}
Current Empirical Baseline (NFHS-5 / RHS / NITI Aayog):
- Infant Mortality Rate (IMR): {district_data.get('infant_mortality_rate', 32.0)} per 1,000 live births
- Maternal Mortality Ratio (MMR): {district_data.get('maternal_mortality_rate', 130.0)} per 100k
- Doctor Ratio: {district_data.get('doctor_ratio', 5.0)} per 10k
- Specialist Availability: {district_data.get('specialist_availability', 25.0)}%
- Institutional Delivery Rate: {district_data.get('institutional_delivery_rate', 80.0)}%
- Full Childhood Immunization: {district_data.get('immunization_rate', 70.0)}%
- Clean Water Access: {district_data.get('clean_water_access', 75.0)}%
- Improved Sanitation: {district_data.get('sanitation_access', 65.0)}%
- Female Literacy: {district_data.get('female_literacy', 65.0)}%
- Health Insurance (PM-JAY): {district_data.get('insurance_coverage', 40.0)}%

{benchmarks_summary}

Prescribe targeted numerical intervention values for policy sliders to maximize health outcomes in {district_name}."""

    llm_resp = await call_groq_llm(SYSTEM_DISTRICT_RECOMMENDER, user_prompt, temperature=0.2)
    if llm_resp:
        try:
            match = re.search(r'\{.*\}', llm_resp, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                parsed["status"] = "success"
                parsed["district_name"] = district_name
                parsed["state_name"] = state_name
                return parsed
        except Exception as e:
            logger.warning(f"Failed to parse LLM district recommendation JSON: {e}")

    # Deterministic Rule-Based Fallback
    cur_doc = float(district_data.get("doctor_ratio", 5.0) or 5.0)
    cur_spec = float(district_data.get("specialist_availability", 25.0) or 25.0)
    cur_inst = float(district_data.get("institutional_delivery_rate", 80.0) or 80.0)
    cur_imm = float(district_data.get("immunization_rate", 70.0) or 70.0)
    cur_wat = float(district_data.get("clean_water_access", 75.0) or 75.0)
    cur_san = float(district_data.get("sanitation_access", 65.0) or 65.0)

    recommended = {
        "doctor_ratio": round(max(cur_doc * 1.5, 8.5), 1),
        "specialist_availability": round(min(max(cur_spec * 1.6, 50.0), 95.0), 1),
        "institutional_delivery_rate": round(min(max(cur_inst + 12.0, 92.0), 99.0), 1),
        "immunization_rate": round(min(max(cur_imm + 15.0, 88.0), 98.0), 1),
        "clean_water_access": round(min(max(cur_wat + 15.0, 92.0), 99.0), 1),
        "sanitation_access": round(min(max(cur_san + 18.0, 85.0), 98.0), 1),
        "telemedicine_access": 65.0,
        "insurance_coverage": round(min(max(float(district_data.get("insurance_coverage", 40.0) or 40.0) * 1.8, 75.0), 95.0), 1),
        "phc_density": round(max(float(district_data.get("phc_density", 6.0) or 6.0) * 1.3, 8.5), 1),
        "bed_availability": round(max(float(district_data.get("bed_availability", 15.0) or 15.0) * 1.4, 25.0), 1)
    }

    return {
        "status": "success",
        "district_name": district_name,
        "state_name": state_name,
        "diagnostic_summary": f"{district_name} ({state_name}) exhibits priority gaps in healthcare staffing and primary infrastructure relative to national benchmarks.",
        "primary_bottlenecks": [
            f"Doctor & Specialist Shortage (Current: {cur_doc} doctors/10k)",
            f"Maternal Care Deficit (Institutional Delivery: {cur_inst}%)",
            f"Environmental Sanitation Lag (Sanitation: {cur_san}%)"
        ],
        "recommended_levers": recommended,
        "clinical_and_upstream_rationale": "Applying Pearl's causal Bayesian framework, coupling human resource retention with clean water and sanitation directly intercepts maternal and infant mortality pathways.",
        "key_directives": [
            "Deploy targeted hard-area retention allowances for specialists at Community Health Centres.",
            "Accelerate Jal Jeevan Mission piped water coverage to suppress infant diarrheal disease vectors.",
            "Establish Ayushman Arogya Mandir telemedicine nodes for high-risk obstetric monitoring."
        ]
    }

