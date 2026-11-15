import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { apiClient } from "./api/client";
import ErrorBoundary from "./components/ErrorBoundary";
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

const TABS = [
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

export function App() {
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

  return (
    <div className="min-h-screen bg-surface-darkest text-text-primary flex flex-col font-sans">
      {/* Institutional Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center text-white font-mono text-sm font-semibold select-none">
              Ψ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-text-primary">
                  National Healthcare Policy Decision Intelligence System
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border">
                  MoHFW / NITI Aayog
                </span>
              </div>
              <div className="text-xs text-text-tertiary">
                Bayesian Causal Simulation • 698 Districts • NFHS-5, RHS & MPI Open Data
              </div>
            </div>
          </div>

          {/* Calm Telemetry Status Badge & Theme Switcher */}
          <div className="flex items-center gap-3 text-xs">
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

            {systemHealth ? (
              <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1 rounded-full border border-border">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-text-secondary text-xs font-mono">
                  Engine Ready • 1,278 records • 698 districts
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-950/50 px-3 py-1 rounded-full border border-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-300 text-xs">
                  {healthError || "Connecting to Bayesian Engine..."}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="max-w-7xl mx-auto mt-2.5 overflow-x-auto flex gap-1 border-t border-border/40 pt-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white font-semibold"
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
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="bg-surface border-t border-border py-3 px-6 text-xs text-text-tertiary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div>
            National Healthcare Policy Prediction & Decision Intelligence System (NHP-DIS)
          </div>
          <div className="font-mono text-xs text-text-tertiary">
            DiscreteBayesianNetwork (37 nodes, 52 edges) • 2TBN Forecasting (2015–2035)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
