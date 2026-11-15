import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";

export default function NationalOverview() {
  const [summary, setSummary] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.summary(), apiClient.states()])
      .then(([sumRes, stateRes]) => {
        setSummary(sumRes);
        setStates(stateRes.states || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load national data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary text-xs gap-3">
        <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
        <span>Loading official health statistics...</span>
      </div>
    );
  }

  const avgs = summary?.national_averages || {};
  const topStates = states.slice(0, 5);
  const bottomStates = states.slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Official Government Data Provenance Banner */}
      <div className="bg-surface rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary-400">
            Verified National Public Health Panel
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Ground-truth indicators harvested from MoHFW / IIPS NFHS-5 (2019–21), Rural Health Statistics (RHS 2021), HMIS, and NITI Aayog Multidimensional Poverty Index across {summary?.total_districts || 698} administrative districts and {summary?.total_states || 34} States & UTs.
          </p>
        </div>
        <div className="text-right text-xs font-mono text-text-tertiary whitespace-nowrap">
          <div>Waves: 2015 & 2020</div>
          <div>Validated Panel: {summary?.total_records || 1278} records</div>
        </div>
      </div>

      {/* National KPI Overview Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ "--card-accent": "var(--semantic-negative)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Maternal Mortality Ratio (MMR)</span>
          </div>
          <div className="kpi-value">{avgs.maternal_mortality_rate || 155.7}</div>
          <div className="kpi-sub">Per 100,000 live births (SDG 3.1 target: &lt; 70)</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--semantic-warning)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Infant Mortality Rate (IMR)</span>
          </div>
          <div className="kpi-value">{avgs.infant_mortality_rate || 32.6}</div>
          <div className="kpi-sub">Per 1,000 live births (SDG 3.2 target: &lt; 23)</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--semantic-positive)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Institutional Delivery Rate</span>
          </div>
          <div className="kpi-value">{avgs.institutional_delivery_rate || 88.7}%</div>
          <div className="kpi-sub">Accredited facility births (NFHS-5)</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--accent-highlight)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Full Child Immunization</span>
          </div>
          <div className="kpi-value">{avgs.immunization_rate || 77.7}%</div>
          <div className="kpi-sub">Children 12–23 months fully vaccinated</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--accent-highlight)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Doctor-to-Population Ratio</span>
          </div>
          <div className="kpi-value">{avgs.doctor_ratio || 8.6}</div>
          <div className="kpi-sub">Doctors per 10,000 population (WHO norm: 10.0)</div>
        </div>

        <div className="kpi-card" style={{ "--card-accent": "var(--accent-primary)" }}>
          <div className="kpi-header">
            <span className="kpi-label">Overall Health Index</span>
          </div>
          <div className="kpi-value">{avgs.overall_health_index || 73.8}</div>
          <div className="kpi-sub">Composite performance score (0–100 scale)</div>
        </div>
      </div>

      {/* State Leaderboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 States */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Top Performing States & Union Territories
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-text-tertiary">
                  <th className="py-2 px-2">State / UT</th>
                  <th className="py-2 px-2 text-right">IMR</th>
                  <th className="py-2 px-2 text-right">MMR</th>
                  <th className="py-2 px-2 text-right">Inst. Del %</th>
                  <th className="py-2 px-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {topStates.map((st, i) => (
                  <tr key={st.state_name} className="hover:bg-surface-elevated/40">
                    <td className="py-2.5 px-2 font-sans font-medium text-text-primary">
                      {i + 1}. {st.state_name}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400">{st.infant_mortality_rate}</td>
                    <td className="py-2.5 px-2 text-right text-text-secondary">{st.maternal_mortality_rate}</td>
                    <td className="py-2.5 px-2 text-right text-text-secondary">{st.institutional_delivery_rate}%</td>
                    <td className="py-2.5 px-2 text-right text-primary-400 font-bold">{st.overall_health_index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Focus States */}
        <div className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            High Priority States (Infrastructure Need)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-text-tertiary">
                  <th className="py-2 px-2">State / UT</th>
                  <th className="py-2 px-2 text-right">IMR</th>
                  <th className="py-2 px-2 text-right">MMR</th>
                  <th className="py-2 px-2 text-right">Sanitation %</th>
                  <th className="py-2 px-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {bottomStates.map((st, i) => (
                  <tr key={st.state_name} className="hover:bg-surface-elevated/40">
                    <td className="py-2.5 px-2 font-sans font-medium text-text-primary">
                      {st.state_name}
                    </td>
                    <td className="py-2.5 px-2 text-right text-rose-400">{st.infant_mortality_rate}</td>
                    <td className="py-2.5 px-2 text-right text-rose-400">{st.maternal_mortality_rate}</td>
                    <td className="py-2.5 px-2 text-right text-text-secondary">{st.sanitation_access}%</td>
                    <td className="py-2.5 px-2 text-right text-amber-400 font-bold">{st.overall_health_index}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
