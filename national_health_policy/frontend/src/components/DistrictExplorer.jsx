import React, { useState, useEffect } from "react";
import { MapPin, Droplets, Building2 } from "lucide-react";
import { apiClient } from "../api/client";

export function DistrictExplorer({ onSelectDistrictForSimulation }) {
  const [districts, setDistricts] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtDetails, setDistrictDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [statesRes, districtsRes] = await Promise.all([
          apiClient.states(),
          apiClient.districts()
        ]);

        const statesList = Array.isArray(statesRes)
          ? statesRes
          : statesRes?.states || [];
        const stateNames = statesList.map((s) => (typeof s === "string" ? s : s.state_name)).filter(Boolean);
        setStates(stateNames);

        const districtsList = Array.isArray(districtsRes)
          ? districtsRes
          : districtsRes?.districts || [];
        setDistricts(districtsList);

        if (districtsList.length > 0) {
          selectDistrict(districtsList[0].district_name);
        }
      } catch (err) {
        setError(err.message || "Failed to load districts from server");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFilter = async (stateFilter, search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.districts(stateFilter || null, search || null);
      const list = Array.isArray(res) ? res : res?.districts || [];
      setDistricts(list);
      if (list.length > 0 && (!selectedDistrict || !list.some(d => d.district_name === selectedDistrict))) {
        selectDistrict(list[0].district_name);
      }
    } catch (err) {
      setError(err.message || "Filter request failed");
    } finally {
      setLoading(false);
    }
  };

  const selectDistrict = async (name) => {
    if (!name) return;
    setSelectedDistrict(name);
    setLoadingDetails(true);
    try {
      const details = await apiClient.district(name);
      setDistrictDetails(details);
    } catch (err) {
      console.error("Failed to load district detail:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const safeDistricts = Array.isArray(districts) ? districts : [];
  const filteredDistricts = safeDistricts.filter(d => {
    const matchState = !selectedState || d.state_name === selectedState;
    const matchQuery = !searchQuery || d.district_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchState && matchQuery;
  });

  const latest = districtDetails?.latest_data || districtDetails?.latest_record || {};
  const history = districtDetails?.historical_trend || districtDetails?.history || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-text-secondary" /> District Health Observatory
          </h2>
          <p className="text-xs text-text-secondary">
            Granular profiling of 698 official districts across 34 States/UTs from NFHS-5, RHS, and NITI Aayog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1 bg-surface-elevated rounded-full border border-border text-primary-400">
            {filteredDistricts.length} Districts Available
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3.5 rounded-lg text-xs flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-surface p-4 rounded-xl border border-border">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search district by name (e.g. Varanasi, Wayanad, Patna, Pune)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFilter(selectedState, searchQuery);
            }}
            className="w-full bg-surface-elevated border border-border text-text-primary px-3.5 py-2 rounded-lg text-xs focus:border-primary-500 placeholder-text-tertiary"
          />
        </div>
        <div>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              handleFilter(e.target.value, searchQuery);
            }}
            className="w-full bg-surface-elevated border border-border text-text-primary px-3 py-2 rounded-lg text-xs focus:border-primary-500"
          >
            <option value="">All States & UTs (34)</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left List + Right Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* District Selector List */}
        <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3 flex flex-col max-h-[calc(100vh-220px)] min-h-[580px]">
          <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-2 py-1 mb-2">
            Directory ({filteredDistricts.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredDistricts.map(d => {
              const isSelected = selectedDistrict === d.district_name;
              return (
                <button
                  key={`${d.state_name}-${d.district_name}`}
                  onClick={() => selectDistrict(d.district_name)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex justify-between items-center ${
                    isSelected
                      ? "bg-primary-950/80 border-primary-500 text-text-primary"
                      : "bg-surface-elevated/40 border-transparent hover:border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-text-primary">{d.district_name}</div>
                    <div className="text-[10px] text-text-tertiary">{d.state_name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-border text-primary-300">
                      Score: {d.overall_health_index ?? "—"}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredDistricts.length === 0 && !loading && (
              <div className="p-8 text-center text-text-tertiary text-xs">
                No districts match your criteria.
              </div>
            )}
          </div>
        </div>

        {/* District Detail View */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border p-5 max-h-[calc(100vh-220px)] min-h-[580px] overflow-y-auto">
          {loadingDetails ? (
            <div className="h-full flex items-center justify-center text-text-secondary gap-3 text-xs">
              <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
              <span>Loading district telemetry...</span>
            </div>
          ) : districtDetails ? (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-elevated p-4 rounded-xl border border-border">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">Official Administrative Profile</div>
                  <h3 className="text-xl font-bold text-text-primary mt-0.5">{districtDetails.district_name}</h3>
                  <div className="text-xs text-primary-400 font-medium">{districtDetails.state_name}</div>
                </div>
                {onSelectDistrictForSimulation && (
                  <button
                    onClick={() => onSelectDistrictForSimulation(districtDetails.latest || districtDetails)}
                    className="px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <span>Simulate Policy for {districtDetails.district_name}</span>
                  </button>
                )}
              </div>

              {/* Core Indicators Quad */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Infant Mortality Rate</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                    {latest.infant_mortality_rate ?? "N/A"}
                  </div>
                  <div className="text-[10px] text-text-tertiary">per 1k live births</div>
                </div>

                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Institutional Deliveries</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {latest.institutional_delivery_rate ? `${latest.institutional_delivery_rate}%` : "N/A"}
                  </div>
                  <div className="text-[10px] text-text-tertiary">NFHS-5 Factsheet</div>
                </div>

                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Full Immunization</div>
                  <div className="text-lg font-bold font-mono text-primary-400 mt-0.5">
                    {latest.immunization_rate ? `${latest.immunization_rate}%` : "N/A"}
                  </div>
                  <div className="text-[10px] text-text-tertiary">Children 12-23m</div>
                </div>

                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Multidimensional Poverty</div>
                  <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                    {latest.poverty_rate ? `${latest.poverty_rate}%` : "N/A"}
                  </div>
                  <div className="text-[10px] text-text-tertiary">NITI Aayog MPI Headcount</div>
                </div>
              </div>

              {/* Detailed Breakdown Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Social Determinants */}
                <div className="bg-surface-elevated/40 rounded-xl border border-border p-4 space-y-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-text-secondary" /> Social Determinants
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Clean Drinking Water (JJM)</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.clean_water_access != null ? `${latest.clean_water_access}%` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Improved Sanitation (IHHL)</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.sanitation_access != null ? `${latest.sanitation_access}%` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Female Literacy Rate</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.female_literacy != null ? `${latest.female_literacy}%` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-secondary">Clean Cooking Fuel</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.clean_cooking_fuel != null ? `${latest.clean_cooking_fuel}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health Infrastructure & Human Resources */}
                <div className="bg-surface-elevated/40 rounded-xl border border-border p-4 space-y-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-secondary" /> Health Infrastructure
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">CHC Specialist Availability</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.specialist_availability != null ? `${latest.specialist_availability}%` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Doctor Ratio (per 10k)</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.doctor_ratio != null ? latest.doctor_ratio : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Public Bed Density</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.bed_availability != null ? `${latest.bed_availability} / 10k` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-secondary">ASHA Worker Density</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.asha_worker_density != null ? `${latest.asha_worker_density} / 1k` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Wave Data Comparison */}
              {history.length > 0 && (
                <div className="bg-surface-elevated/40 rounded-xl border border-border p-4">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
                    Historical Survey Wave Trends (NFHS-4 vs NFHS-5)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-elevated text-text-tertiary border-b border-border">
                        <tr>
                          <th className="py-2 px-3">Year / Wave</th>
                          <th className="py-2 px-3">Inst. Delivery</th>
                          <th className="py-2 px-3">Immunization</th>
                          <th className="py-2 px-3">IMR</th>
                          <th className="py-2 px-3">MMR</th>
                          <th className="py-2 px-3">Overall Index</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {history.map((h) => (
                          <tr key={h.year} className="hover:bg-surface-elevated/30">
                            <td className="py-2 px-3 font-semibold text-primary-400">{h.year}</td>
                            <td className="py-2 px-3 text-text-primary">{h.institutional_delivery_rate != null ? `${h.institutional_delivery_rate}%` : "—"}</td>
                            <td className="py-2 px-3 text-text-primary">{h.immunization_rate != null ? `${h.immunization_rate}%` : "—"}</td>
                            <td className="py-2 px-3 text-text-primary">{h.infant_mortality_rate ?? "—"}</td>
                            <td className="py-2 px-3 text-text-primary">{h.maternal_mortality_rate ?? "—"}</td>
                            <td className="py-2 px-3 text-text-primary font-bold">{h.overall_health_index ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-tertiary text-xs">
              Select a district from the left panel to inspect its health telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DistrictExplorer;
