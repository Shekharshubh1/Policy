import React, { useState, useEffect } from "react";
import { Sun, Moon, ArrowRightLeft, HeartPulse, GraduationCap, Sparkles } from "lucide-react";
import { apiClient } from "./api/client";
import ErrorBoundary from "./components/ErrorBoundary";

// Healthcare Policy Components
import NationalOverview from "./components/NationalOverview";
import StateComparison from "./components/StateComparison";
import DistrictExplorer from "./components/DistrictExplorer";
import PolicySimulator from "./components/PolicySimulator";
import SensitivityAnalysis from "./components/SensitivityAnalysis";
import LongitudinalForecast from "./components/LongitudinalForecast";
import CausalDAGViewer from "./components/CausalDAGViewer";
import HealthEquityDashboard from "./components/HealthEquityDashboard";
import NLQueryCopilot from "./components/NLQueryCopilot";
import PolicyOptimizer from "./components/PolicyOptimizer";

// Education Policy Components
import EducationOverview from "./components/education/EducationOverview";
import EducationDistrictExplorer from "./components/education/EducationDistrictExplorer";
import EducationSimulator from "./components/education/EducationSimulator";
import EducationComparison from "./components/education/EducationComparison";
import EducationSensitivity from "./components/education/EducationSensitivity";
import EducationCopilot from "./components/education/EducationCopilot";
import EducationDAGViewer from "./components/education/EducationDAGViewer";

// First-time access & domain switcher modal
import PolicyDomainModal from "./components/PolicyDomainModal";

// Healthcare Navigation Tabs
const HEALTH_TABS = [
  { id: "overview", label: "National Overview" },
  { id: "states", label: "State Comparison" },
  { id: "districts", label: "District Explorer" },
  { id: "simulator", label: "Policy Simulator" },
  { id: "sensitivity", label: "Sensitivity Analysis" },
  { id: "forecast", label: "Longitudinal Forecast" },
  { id: "dag", label: "Causal DAG Explorer" },
  { id: "equity", label: "Health Equity" },
  { id: "copilot", label: "Policy Copilot" },
  { id: "optimizer", label: "Intervention Optimizer" },
];

// Education Navigation Tabs
const EDUCATION_TABS = [
  { id: "overview", label: "Education Overview" },
  { id: "districts", label: "District Explorer (52)" },
  { id: "simulator", label: "Policy Simulator" },
  { id: "comparison", label: "Scenario Comparison" },
  { id: "sensitivity", label: "Sensitivity Analysis" },
  { id: "copilot", label: "Education Copilot" },
  { id: "dag", label: "Causal DAG Explorer" },
];

export function App() {
  // Domain selection state: "health" or "education"
  const [policyDomain, setPolicyDomain] = useState(() => {
    return localStorage.getItem("nhp_dis_selected_domain") || "health";
  });

  // Modal open on first access if no preference was stored
  const [showDomainModal, setShowDomainModal] = useState(() => {
    return !localStorage.getItem("nhp_dis_selected_domain");
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthError, setHealthError] = useState(null);
  const [selectedDistrictForSim, setSelectedDistrictForSim] = useState(null);

  // Dual Theme: Light Mode (Paper/Ink) & Dark Mode (Graphite/Ink)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("nhp_dis_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nhp_dis_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Toggle Policy Domain directly
  const handleToggleDomain = () => {
    const nextDomain = policyDomain === "health" ? "education" : "health";
    setPolicyDomain(nextDomain);
    localStorage.setItem("nhp_dis_selected_domain", nextDomain);
    setActiveTab("overview");
  };

  // Select domain from modal
  const handleSelectDomain = (domain) => {
    setPolicyDomain(domain);
    setShowDomainModal(false);
    setActiveTab("overview");
  };

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await apiClient.health();
        setSystemHealth(res);
        setHealthError(null);
      } catch (err) {
        setHealthError("Backend server offline (run start_nhp_dis.bat)");
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDistrictForSimulation = (districtDetails) => {
    setSelectedDistrictForSim(districtDetails);
    setActiveTab("simulator");
  };

  const currentTabs = policyDomain === "health" ? HEALTH_TABS : EDUCATION_TABS;

  return (
    <div className="min-h-screen bg-surface-darkest text-text-primary flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          FIRST-TIME ACCESS / DOMAIN SELECTOR MODAL
         ───────────────────────────────────────────────────────────────────────────── */}
      <PolicyDomainModal
        isOpen={showDomainModal}
        currentDomain={policyDomain}
        onSelectDomain={handleSelectDomain}
        onClose={() => setShowDomainModal(false)}
        canDismiss={!!localStorage.getItem("nhp_dis_selected_domain")}
      />

      {/* Institutional Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Domain Details */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setShowDomainModal(true)}
              className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-white font-mono text-sm font-semibold select-none cursor-pointer hover:bg-primary-500 transition-colors"
              title="Click to Switch Policy Domain"
            >
              {policyDomain === "health" ? "Ψ" : "🎓"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold tracking-tight text-text-primary">
                  {policyDomain === "health"
                    ? "National Healthcare Policy Decision Intelligence System"
                    : "State Education Policy Decision Intelligence System (EDIS)"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border">
                  {policyDomain === "health" ? "MoHFW / NITI Aayog" : "School Education / NITI Aayog"}
                </span>
              </div>
              <div className="text-xs text-text-tertiary">
                {policyDomain === "health"
                  ? "Bayesian Causal Simulation • 698 Districts • NFHS-5, RHS & MPI Open Data"
                  : "Bayesian Causal Simulation • 52 MP Districts • UDISE+, Census & ASER Panel Data"}
              </div>
            </div>
          </div>

          {/* Controls: Domain Switcher, Theme Switcher & Telemetry Status */}
          <div className="flex items-center gap-2.5 text-xs flex-wrap">
            {/* Domain Switcher Pill / Button */}
            <div className="flex items-center bg-surface-elevated rounded-full p-0.5 border border-border">
              <button
                onClick={() => {
                  setPolicyDomain("health");
                  localStorage.setItem("nhp_dis_selected_domain", "health");
                  setActiveTab("overview");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  policyDomain === "health"
                    ? "bg-sky-600 text-white font-semibold shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                title="Switch to Healthcare Policy"
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Healthcare</span>
              </button>

              <button
                onClick={() => {
                  setPolicyDomain("education");
                  localStorage.setItem("nhp_dis_selected_domain", "education");
                  setActiveTab("overview");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  policyDomain === "education"
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                title="Switch to Education Policy"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education</span>
              </button>
            </div>

            {/* Quick Switch Modal Trigger */}
            <button
              onClick={() => setShowDomainModal(true)}
              className="p-1.5 rounded-full bg-surface-elevated hover:bg-surface border border-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Open Domain Selection Portal"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated hover:bg-surface-elevated/70 border border-border text-text-secondary hover:text-text-primary text-xs transition-colors cursor-pointer select-none"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[11px]">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-mono text-[11px]">Dark Mode</span>
                </>
              )}
            </button>

            {/* Telemetry Status Badge */}
            {policyDomain === "health" ? (
              systemHealth ? (
                <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1 rounded-full border border-border">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-text-secondary text-xs font-mono">
                    Engine Ready • 1,278 records • 698 districts
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-950/50 px-3 py-1 rounded-full border border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs">
                    {healthError || "Connecting to Health Engine..."}
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1 rounded-full border border-border">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-text-secondary text-xs font-mono">
                  Education Active • 260 panel records • 52 districts
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-2.5 overflow-x-auto flex gap-1 border-t border-border/40 pt-2">
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const activeColor = policyDomain === "health" ? "bg-primary-600" : "bg-indigo-600";
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? `${activeColor} text-white font-semibold shadow-xs`
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {policyDomain === "health" ? (
          <>
            {activeTab === "overview" && (
              <ErrorBoundary title="National Overview Error">
                <NationalOverview />
              </ErrorBoundary>
            )}
            {activeTab === "states" && (
              <ErrorBoundary title="State Comparison Error">
                <StateComparison />
              </ErrorBoundary>
            )}
            {activeTab === "districts" && (
              <ErrorBoundary title="District Explorer Error">
                <DistrictExplorer onSelectDistrictForSimulation={handleSelectDistrictForSimulation} />
              </ErrorBoundary>
            )}
            {activeTab === "simulator" && (
              <ErrorBoundary title="Policy Simulator Error">
                <PolicySimulator
                  districtContext={selectedDistrictForSim}
                  onClearDistrictContext={() => setSelectedDistrictForSim(null)}
                />
              </ErrorBoundary>
            )}
            {activeTab === "sensitivity" && (
              <ErrorBoundary title="Sensitivity Analysis Error">
                <SensitivityAnalysis />
              </ErrorBoundary>
            )}
            {activeTab === "forecast" && (
              <ErrorBoundary title="Longitudinal Forecast Error">
                <LongitudinalForecast />
              </ErrorBoundary>
            )}
            {activeTab === "dag" && (
              <ErrorBoundary title="Causal DAG Explorer Error">
                <CausalDAGViewer />
              </ErrorBoundary>
            )}
            {activeTab === "equity" && (
              <ErrorBoundary title="Health Equity Dashboard Error">
                <HealthEquityDashboard />
              </ErrorBoundary>
            )}
            {activeTab === "copilot" && (
              <ErrorBoundary title="Policy Copilot Error">
                <NLQueryCopilot />
              </ErrorBoundary>
            )}
            {activeTab === "optimizer" && (
              <ErrorBoundary title="Intervention Optimizer Error">
                <PolicyOptimizer />
              </ErrorBoundary>
            )}
          </>
        ) : (
          <>
            {activeTab === "overview" && (
              <ErrorBoundary title="Education Overview Error">
                <EducationOverview />
              </ErrorBoundary>
            )}
            {activeTab === "districts" && (
              <ErrorBoundary title="Education District Explorer Error">
                <EducationDistrictExplorer />
              </ErrorBoundary>
            )}
            {activeTab === "simulator" && (
              <ErrorBoundary title="Education Policy Simulator Error">
                <EducationSimulator />
              </ErrorBoundary>
            )}
            {activeTab === "comparison" && (
              <ErrorBoundary title="Education Scenario Comparison Error">
                <EducationComparison />
              </ErrorBoundary>
            )}
            {activeTab === "sensitivity" && (
              <ErrorBoundary title="Education Sensitivity Analysis Error">
                <EducationSensitivity />
              </ErrorBoundary>
            )}
            {activeTab === "copilot" && (
              <ErrorBoundary title="Education Policy Copilot Error">
                <EducationCopilot />
              </ErrorBoundary>
            )}
            {activeTab === "dag" && (
              <ErrorBoundary title="Education Causal DAG Error">
                <EducationDAGViewer />
              </ErrorBoundary>
            )}
          </>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-surface border-t border-border py-3 px-6 text-xs text-text-tertiary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div>
            {policyDomain === "health"
              ? "National Healthcare Policy Prediction & Decision Intelligence System (NHP-DIS)"
              : "State Education Policy Decision Intelligence System (EDIS / NEP 2020)"}
          </div>
          <div className="font-mono text-xs text-text-tertiary">
            {policyDomain === "health"
              ? "DiscreteBayesianNetwork (37 nodes, 52 edges) • 2TBN Forecasting (2015–2035)"
              : "DiscreteBayesianNetwork (15 nodes, 14 edges) • 52 MP Districts Panel (2017–2021)"}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
