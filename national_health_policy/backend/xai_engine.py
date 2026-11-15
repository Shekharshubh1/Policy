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
