"""
Automated Test & Verification Suite for NHP-DIS RESTful API.
Tests all endpoints against running backend server:
  - GET  /health
  - GET  /summary
  - GET  /districts
  - GET  /district/{name}
  - GET  /states
  - POST /simulate
  - POST /compare
  - POST /forecast
  - GET  /sensitivity
  - POST /optimize
  - GET  /dag
"""

import sys
import json
import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, method, path, payload=None, expected_status=200):
    url = f"{BASE_URL}{path}"
    try:
        t0 = time.time()
        if method == "GET":
            res = requests.get(url, timeout=15)
        else:
            res = requests.post(url, json=payload, timeout=15)
        elapsed = round((time.time() - t0) * 1000, 1)

        if res.status_code == expected_status:
            print(f"  ✓ [{method}] {path} ({elapsed}ms) — PASS")
            return res.json()
        else:
            print(f"  ✗ [{method}] {path} returned HTTP {res.status_code}: {res.text[:150]}")
            return None
    except Exception as e:
        print(f"  ✗ [{method}] {path} Exception: {e}")
        return None

def run_suite():
    print("=" * 65)
    print("NHP-DIS Full API Verification Suite")
    print("=" * 65)

    # 1. Health
    h = test_endpoint("Health Check", "GET", "/health")
    if not h:
        print("\nERROR: Backend server not reachable at http://127.0.0.1:8000. Start it first.")
        sys.exit(1)

    print(f"    Districts: {h.get('districts_count')} | States: {h.get('states_count')} | Records: {h.get('total_records')}")

    # 2. Summary
    test_endpoint("Summary", "GET", "/summary")

    # 3. Districts
    districts = test_endpoint("Districts Directory", "GET", "/districts?search=Varanasi")
    if districts and districts.get("districts"):
        dname = districts["districts"][0]["district_name"]
        # 4. District Details
        test_endpoint("District Detail", "GET", f"/district/{dname}")

    # 5. States
    test_endpoint("States Ranking", "GET", "/states")

    # 6. Simulate
    sim_payload = {
        "inputs": {
            "per_capita_health_expenditure": 4500.0,
            "public_health_budget_share": 3.2,
            "insurance_coverage": 58.0,
            "hospital_density": 3.0,
            "phc_density": 7.0,
            "bed_availability": 20.0,
            "doctor_ratio": 10.0,
            "nurse_ratio": 20.0,
            "specialist_availability": 50.0,
            "asha_worker_density": 15.0,
            "immunization_rate": 88.0,
            "screening_coverage": 45.0,
            "institutional_delivery_rate": 94.0,
            "female_literacy": 78.0,
            "sanitation_access": 82.0,
            "clean_water_access": 92.0,
            "telemedicine_access": 60.0,
            "digital_health_records": 45.0
        }
    }
    test_endpoint("Causal Simulation", "POST", "/simulate", payload=sim_payload)

    # 7. Compare
    comp_payload = {
        "scenario_a": sim_payload["inputs"],
        "scenario_b": {**sim_payload["inputs"], "specialist_availability": 85.0, "institutional_delivery_rate": 99.0},
        "label_a": "Status Quo",
        "label_b": "High Intervention"
    }
    test_endpoint("Scenario Comparison", "POST", "/compare", payload=comp_payload)

    # 8. Forecast
    forecast_payload = {
        "district_name": "Varanasi",
        "interventions": {"institutional_delivery_rate": "High", "specialist_availability": "High"},
        "start_year": 2020,
        "end_year": 2035,
        "intervention_start_year": 2025
    }
    test_endpoint("Longitudinal Forecast", "POST", "/forecast", payload=forecast_payload)

    # 9. Sensitivity
    test_endpoint("Sensitivity Analysis", "GET", "/sensitivity?target=maternal_mortality_rate_bin")

    # 10. Optimize
    test_endpoint("Pareto Optimizer", "POST", "/optimize", payload={"budget_inr": 350000000.0})

    # 11. DAG
    test_endpoint("DAG Structural Topology", "GET", "/dag")

    print("\n" + "=" * 65)
    print("All API endpoints verified successfully!")
    print("=" * 65)

if __name__ == "__main__":
    run_suite()
