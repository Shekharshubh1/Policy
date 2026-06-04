import { useState, useEffect, createContext } from "react";
import Dashboard from "./components/Dashboard";
import PolicySimulator from "./components/PolicySimulator";
import PolicyComparison from "./components/PolicyComparison";
import SensitivityAnalysis from "./components/SensitivityAnalysis";
import DistrictExplorer, { NLQueryPanel, DAGViewer } from "./components/DistrictExplorer";
import { apiClient } from "./api/client";
import "./index.css";

export const AppContext = createContext(null);

const NAV_ITEMS = [
  { id: "dashboard",    icon: "⬡",  label: "Dashboard" },
  { id: "simulate",     icon: "◈",  label: "Simulate" },
  { id: "compare",      icon: "⇌",  label: "Compare" },
  { id: "sensitivity",  icon: "◎",  label: "Sensitivity" },
  { id: "districts",    icon: "◉",  label: "Districts" },
  { id: "nlquery",      icon: "◆",  label: "AI Query" },
  { id: "dag",          icon: "⬡",  label: "Network" },
];

export default function App() {
  const [activeTab, setActiveTab]         = useState("dashboard");
  const [systemStatus, setSystemStatus]   = useState(null);
  const [lastSimResult, setLastSimResult] = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    apiClient.health()
      .then(d => { setSystemStatus(d); setLoading(false); })
      .catch(() => { setSystemStatus({ status: "offline" }); setLoading(false); });
  }, []);

  return (
    <AppContext.Provider value={{ lastSimResult, setLastSimResult, systemStatus }}>
      <div className="app-root">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-icon">◈</span>
            <div>
              <div className="brand-title">PolicySim</div>
              <div className="brand-sub">Madhya Pradesh Education</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <button key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-status">
            <div className={`status-dot ${systemStatus?.status === "healthy" ? "online" : "offline"}`} />
            <span>{systemStatus?.status === "healthy"
              ? `${systemStatus.districts} districts`
              : loading ? "Connecting…" : "Offline"}</span>
          </div>
        </aside>
        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h1>
            <div className="page-meta">MP Education Policy Modeling · Bayesian AI + LLaMA 70B</div>
          </div>
          <div className="page-body">
            {activeTab === "dashboard"   && <Dashboard />}
            {activeTab === "simulate"    && <PolicySimulator />}
            {activeTab === "compare"     && <PolicyComparison />}
            {activeTab === "sensitivity" && <SensitivityAnalysis />}
            {activeTab === "districts"   && <DistrictExplorer />}
            {activeTab === "nlquery"     && <NLQueryPanel />}
            {activeTab === "dag"         && <DAGViewer />}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}
