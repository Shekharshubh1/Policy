"""
LLM Integration Module — Groq API + LLaMA 70B (or Llama-3.3-70B-Versatile)

Responsibilities:
  1. parse_policy_query  → NL text → structured policy input dict
  2. explain_results     → BN output dict → human-readable policy analysis
  3. generate_recommendations → insights + action items from scenario

Get your Groq API key: https://console.groq.com/
Set env var: GROQ_API_KEY=<your_key>
"""

import os
import re
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx
from dotenv import load_dotenv
import os

load_dotenv()

logger = logging.getLogger(__name__)

GROQ_API_URL   = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL     = "llama-3.3-70b-versatile"   # Groq's llama 70b endpoint
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
REQUEST_TIMEOUT = 30.0


# ─────────────────────────────────────────────────────────────────────
# PROMPTS
# ─────────────────────────────────────────────────────────────────────

SYSTEM_PARSER = """You are an education policy analyst for Madhya Pradesh, India.
Your task is to extract structured policy parameters from a user's natural language query.

Variables you can extract:
  - per_student_exp       : Annual per-student expenditure in INR (range 1000-50000)
  - teacher_student_ratio : Number of students per teacher (range 10-80; lower = better)
  - infra_index           : School infrastructure quality score (range 0-100)
  - digital_access        : % schools with internet/computers (range 0-100)
  - mid_day_meal          : % students covered by mid-day meal scheme (range 0-100)
  - female_teacher_ratio  : % of teachers who are female (range 0-100)
  - rural_urban           : "rural" or "urban"

Rules:
1. Only extract variables explicitly mentioned or strongly implied.
2. Convert qualitative terms: "double" → multiply by 2, "increase by 20%" → multiply by 1.2,
   "improve significantly" → set to 75 (if currently medium), etc.
3. Use realistic current MP averages as baseline when needed:
   per_student_exp=9000, teacher_student_ratio=28, infra_index=58,
   digital_access=35, mid_day_meal=86, female_teacher_ratio=38
4. Return ONLY a valid JSON object. No explanation text.

Example:
User: "What if we double digital access and hire more female teachers?"
Response: {"digital_access": 70, "female_teacher_ratio": 55}
"""

SYSTEM_EXPLAINER = """You are a senior education policy advisor for Madhya Pradesh, India.
You are given results from a Bayesian policy simulation and must explain them clearly.

Guidelines:
- Use plain English accessible to government officials and policymakers
- Reference specific MP context (tribal districts, RTE Act, Samagra Shiksha scheme)
- Quantify impacts clearly (e.g., "increases probability of high literacy by 23%")
- Mention implementation challenges and equity considerations
- Keep response to 3-5 paragraphs
- End with 2-3 concrete, actionable recommendations
"""

SYSTEM_COMPARE = """You are an education policy advisor for Madhya Pradesh, India.
Compare two policy scenarios and provide an evidence-based recommendation.
Be specific, cite relevant programs (SSA, RMSA, NEP 2020, Samagra Shiksha).
Focus on cost-effectiveness, equity, and feasibility.
Keep to 3-4 paragraphs + a clear recommendation.
"""

SYSTEM_RECOMMENDATIONS = """You are a senior education policy advisor for Madhya Pradesh.
Based on Bayesian sensitivity analysis results, provide strategic recommendations.
Prioritize high-impact, feasible interventions. Reference MP-specific challenges
(tribal areas, gender gap, dropout at secondary level). Give 5 numbered recommendations.
"""


# ─────────────────────────────────────────────────────────────────────
# Core API call
# ─────────────────────────────────────────────────────────────────────

async def _call_groq(
    system: str,
    user: str,
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> str:
    """Low-level async call to Groq API."""
    if not GROQ_API_KEY:
        return _fallback_response(user)

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":       GROQ_MODEL,
        "temperature": temperature,
        "max_tokens":  max_tokens,
        "messages": [
            {"role": "system",  "content": system},
            {"role": "user",    "content": user},
        ],
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def _call_groq_sync(
    system: str,
    user: str,
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> str:
    """Synchronous version for use outside async context."""
    if not GROQ_API_KEY:
        return _fallback_response(user)

    import httpx
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":       GROQ_MODEL,
        "temperature": temperature,
        "max_tokens":  max_tokens,
        "messages": [
            {"role": "system",  "content": system},
            {"role": "user",    "content": user},
        ],
    }
    with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
        resp = client.post(GROQ_API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def _fallback_response(user: str) -> str:
    return (
        "⚠️ GROQ_API_KEY not set. Please add your Groq API key to the environment.\n"
        "Get a free key at https://console.groq.com/\n\n"
        f"[Fallback] Query received: {user[:100]}"
    )


# ─────────────────────────────────────────────────────────────────────
# Public Functions
# ─────────────────────────────────────────────────────────────────────

async def parse_policy_query(query: str) -> Tuple[Dict[str, float], str]:
    """
    Convert natural language policy query to structured parameter dict.

    Returns:
        (parsed_dict, raw_llm_response)
    """
    raw = await _call_groq(
        system=SYSTEM_PARSER,
        user=query,
        temperature=0.1,
        max_tokens=256,
    )

    # Extract JSON from response
    parsed = _safe_parse_json(raw)
    if parsed is None:
        logger.warning(f"Could not parse LLM response as JSON: {raw}")
        parsed = {}

    return parsed, raw


async def explain_results(
    query: str,
    evidence: Dict[str, str],
    results: Dict[str, Any],
    sensitivity: Optional[List[Dict]] = None,
) -> str:
    """
    Generate plain-English policy explanation from BN results.

    Args:
        query:       Original user query
        evidence:    Discretized input evidence
        results:     BN inference output (probabilities)
        sensitivity: Optional sensitivity analysis results
    """
    sens_str = ""
    if sensitivity:
        top3 = sensitivity[:3]
        sens_str = "\nTop influential factors:\n" + "\n".join(
            f"  - {s['label']}: impact={s['impact_score']:.3f} ({s['direction']})"
            for s in top3
        )

    results_str = _format_results_for_llm(results)

    prompt = f"""Policy Query: "{query}"

Policy Inputs Applied:
{json.dumps(evidence, indent=2)}

Bayesian Simulation Results:
{results_str}
{sens_str}

Please explain these simulation results in policy language, what they mean for MP students,
and provide specific recommendations."""

    return await _call_groq(
        system=SYSTEM_EXPLAINER,
        user=prompt,
        temperature=0.4,
        max_tokens=800,
    )


async def explain_comparison(
    scenario_a_desc: str,
    scenario_b_desc: str,
    comparison: Dict[str, Any],
) -> str:
    """Generate comparison narrative for two policy scenarios."""
    comp_str = "\n".join(
        f"  {v['label']}: Scenario A={v['ev_a']:.1f}, Scenario B={v['ev_b']:.1f}, Δ={v['delta']:+.1f}"
        for v in comparison.values()
    )

    prompt = f"""Scenario A: {scenario_a_desc}
Scenario B: {scenario_b_desc}

Outcome Comparison (0-100 scale):
{comp_str}

Please compare these two education policy scenarios for Madhya Pradesh and recommend which
to implement, considering equity, cost-effectiveness, and feasibility."""

    return await _call_groq(
        system=SYSTEM_COMPARE,
        user=prompt,
        temperature=0.4,
        max_tokens=700,
    )


async def generate_recommendations(
    sensitivity_results: List[Dict],
    context: Optional[str] = None,
) -> str:
    """
    Generate strategic recommendations from sensitivity analysis.
    """
    sens_str = "\n".join(
        f"  {i+1}. {s['label']}: impact={s['impact_score']:.4f} ({s['direction']})"
        for i, s in enumerate(sensitivity_results)
    )

    ctx = f"\nAdditional context: {context}" if context else ""
    prompt = f"""Sensitivity Analysis Results for MP Education System:
(Impact on Literacy Rate when variable changes from Low to High)

{sens_str}{ctx}

Based on this analysis, what are the 5 highest-priority policy interventions
for Madhya Pradesh's education system?"""

    return await _call_groq(
        system=SYSTEM_RECOMMENDATIONS,
        user=prompt,
        temperature=0.5,
        max_tokens=800,
    )


async def district_analysis(
    district: str,
    district_data: Dict[str, float],
    simulation_results: Dict[str, Any],
) -> str:
    """Generate district-specific policy narrative."""
    prompt = f"""District: {district}, Madhya Pradesh

Current District Statistics:
{json.dumps(district_data, indent=2)}

Simulation Results:
{_format_results_for_llm(simulation_results)}

Provide a district-specific analysis considering:
1. Current performance gaps vs MP state average
2. Key interventions for this district
3. Tribal/rural considerations if applicable
4. Quick wins vs long-term investments"""

    return await _call_groq(
        system=SYSTEM_EXPLAINER,
        user=prompt,
        temperature=0.4,
        max_tokens=600,
    )


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

def _safe_parse_json(text: str) -> Optional[Dict]:
    """Extract and parse JSON from LLM response."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON block
    patterns = [
        r'```json\s*(.*?)\s*```',
        r'```\s*(.*?)\s*```',
        r'\{[^{}]*\}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1) if '```' in pattern else match.group(0))
            except json.JSONDecodeError:
                continue
    return None


def _format_results_for_llm(results: Dict[str, Any]) -> str:
    """Format BN results dict as readable string for LLM prompt."""
    lines = []
    label_map = {
        "literacy_rate_bin":       "Literacy Rate",
        "dropout_rate_bin":        "Dropout Rate",
        "enrollment_rate_bin":     "Enrollment Rate",
        "gender_parity_index_bin": "Gender Parity Index",
        "learning_outcome_bin":    "Learning Outcome",
    }
    for var, data in results.items():
        label = label_map.get(var, var)
        if isinstance(data, dict) and all(isinstance(v, float) for v in data.values()):
            probs = ", ".join(f"{k}={v:.2f}" for k, v in data.items())
            lines.append(f"  {label}: {probs}")
        else:
            lines.append(f"  {label}: {data}")
    return "\n".join(lines)


if __name__ == "__main__":
    import asyncio

    async def test():
        print("=== Parser Test ===")
        parsed, raw = await parse_policy_query(
            "Increase digital access in rural schools by 50% and improve infrastructure"
        )
        print(f"Parsed: {json.dumps(parsed, indent=2)}")

        print("\n=== Explainer Test ===")
        explanation = await explain_results(
            query="Improve teacher ratio and digital access",
            evidence={"teacher_student_ratio_bin": "Low", "digital_access_bin": "High"},
            results={
                "literacy_rate_bin":       {"Low": 0.12, "Medium": 0.34, "High": 0.54},
                "dropout_rate_bin":        {"Low": 0.55, "Medium": 0.30, "High": 0.15},
                "enrollment_rate_bin":     {"Low": 0.08, "Medium": 0.28, "High": 0.64},
                "gender_parity_index_bin": {"Low": 0.20, "Medium": 0.45, "High": 0.35},
            },
        )
        print(explanation)

    asyncio.run(test())
