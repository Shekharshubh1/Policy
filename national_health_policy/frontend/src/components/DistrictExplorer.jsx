import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Droplets, Building2, Search, Filter, Sliders, Activity, ChevronRight, ArrowUpDown } from "lucide-react";
import { apiClient } from "../api/client";

const ALPHABETS = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export function DistrictExplorer({ onSelectDistrictForSimulation }) {
  const [allDistricts, setAllDistricts] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [sortBy, setSortBy] = useState("alpha"); // alpha, score_desc, score_asc, imr_desc
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
        setAllDistricts(districtsList);

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

  // Instant client-side filtering and sorting across all 698 official districts
  const filteredDistricts = useMemo(() => {
    let list = allDistricts.filter((d) => {
      const matchState = !selectedState || d.state_name?.toLowerCase() === selectedState.toLowerCase();
      const matchQuery = !searchQuery || d.district_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLetter = selectedLetter === "All" || (d.district_name && d.district_name.toUpperCase().startsWith(selectedLetter));
      return matchState && matchQuery && matchLetter;
    });

    return list.sort((a, b) => {
      if (sortBy === "alpha") {
        return (a.district_name || "").localeCompare(b.district_name || "");
      }
      if (sortBy === "score_desc") {
        return (b.overall_health_index ?? 0) - (a.overall_health_index ?? 0);
      }
      if (sortBy === "score_asc") {
        return (a.overall_health_index ?? 100) - (b.overall_health_index ?? 100);
      }
      if (sortBy === "imr_desc") {
        return (b.infant_mortality_rate ?? 0) - (a.infant_mortality_rate ?? 0);
      }
      return 0;
    });
  }, [allDistricts, selectedState, searchQuery, selectedLetter, sortBy]);

  // Robust extraction of district latest and historical waves from backend response
  const latest = districtDetails?.latest || districtDetails?.latest_data || districtDetails?.latest_record || {};
  const history = districtDetails?.historical_waves || districtDetails?.historical_trend || districtDetails?.history || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-400" />
            District Health Observatory
          </h2>
          <p className="text-xs text-text-secondary">
            Granular profiling of all {allDistricts.length || 698} official districts across {states.length || 34} States/UTs from NFHS-5, RHS, and NITI Aayog open data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1 bg-surface-elevated rounded-full border border-border text-primary-400 font-semibold">
            {filteredDistricts.length} / {allDistricts.length || 698} Districts Displayed
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-surface p-3.5 rounded-xl border border-border space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by district name (e.g. Varanasi, Wayanad, Indore, Patna)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-elevated border border-border text-text-primary pl-9 pr-3 py-2 rounded-lg text-xs focus:border-primary-500 placeholder-text-tertiary"
            />
          </div>

          {/* State Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-surface-elevated border border-border text-text-primary px-3 py-2 rounded-lg text-xs focus:border-primary-500"
            >
              <option value="">All States & UTs ({states.length || 34})</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface-elevated border border-border text-text-primary px-3 py-2 rounded-lg text-xs focus:border-primary-500 font-mono"
            >
              <option value="alpha">Sort: A to Z</option>
              <option value="score_desc">Sort: Health Score (High → Low)</option>
              <option value="score_asc">Sort: Health Score (Priority Need)</option>
              <option value="imr_desc">Sort: Infant Mortality (High → Low)</option>
            </select>
          </div>
        </div>

        {/* Alphabet Quick Jump Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 border-t border-border/40 text-[11px] font-mono">
          <span className="text-[10px] text-text-tertiary uppercase font-semibold mr-1 shrink-0">A-Z Jump:</span>
          {ALPHABETS.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer shrink-0 ${
                selectedLetter === letter
                  ? "bg-primary-600 text-white font-bold"
                  : "bg-surface-elevated hover:bg-surface-elevated/70 text-text-secondary hover:text-text-primary"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Directory List + Right Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* District Selector List (4 Cols) */}
        <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3 flex flex-col max-h-[calc(100vh-230px)] min-h-[580px]">
          <div className="flex justify-between items-center text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-2 py-1 mb-1 border-b border-border/50 pb-2">
            <span>District Directory ({filteredDistricts.length})</span>
            <span className="font-mono text-[10px]">All Official</span>
          </div>

          {/* Smooth Scrollable District List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 pt-1">
            {filteredDistricts.map((d) => {
              const isSelected = selectedDistrict === d.district_name;
              return (
                <button
                  key={`${d.state_name}-${d.district_name}`}
                  onClick={() => selectDistrict(d.district_name)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex justify-between items-center cursor-pointer select-none ${
                    isSelected
                      ? "bg-primary-950/80 border-primary-500 text-text-primary shadow-sm"
                      : "bg-surface-elevated/40 border-transparent hover:border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-text-primary">{d.district_name}</div>
                    <div className="text-[10px] text-text-tertiary font-mono">{d.state_name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-primary-400 font-semibold">
                      {d.overall_health_index != null ? `${d.overall_health_index} pts` : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredDistricts.length === 0 && !loading && (
              <div className="p-8 text-center text-text-tertiary text-xs">
                No districts match your filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* District Detail View (8 Cols) */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border p-5 max-h-[calc(100vh-230px)] min-h-[580px] overflow-y-auto">
          {loadingDetails ? (
            <div className="h-full flex items-center justify-center text-text-secondary gap-3 text-xs">
              <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
              <span>Loading district telemetry from official datasets...</span>
            </div>
          ) : districtDetails ? (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-elevated p-4 rounded-xl border border-border">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-mono">
                    Official Administrative Profile • NFHS-5 Panel
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mt-0.5">{districtDetails.district_name}</h3>
                  <div className="text-xs text-primary-400 font-mono font-medium">{districtDetails.state_name}</div>
                </div>
                {onSelectDistrictForSimulation && (
                  <button
                    onClick={() => onSelectDistrictForSimulation(latest.district_name ? latest : { ...latest, district_name: districtDetails.district_name, state_name: districtDetails.state_name })}
                    className="px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Simulate Policy for {districtDetails.district_name}</span>
                  </button>
                )}
              </div>

              {/* Core Indicators Quad */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Infant Mortality Rate (IMR)</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                    {latest.infant_mortality_rate != null ? `${latest.infant_mortality_rate}` : "—"}
                  </div>
                  <div className="text-[10px] text-text-tertiary font-mono">Per 1,000 live births</div>
                </div>

                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Institutional Deliveries</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {latest.institutional_delivery_rate != null ? `${latest.institutional_delivery_rate}%` : "—"}
                  </div>
                  <div className="text-[10px] text-text-tertiary font-mono">NFHS-5 Factsheet</div>
                </div>

                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Full Immunization</div>
                  <div className="text-lg font-bold font-mono text-primary-400 mt-0.5">
                    {latest.immunization_rate != null ? `${latest.immunization_rate}%` : "—"}
                  </div>
                  <div className="text-[10px] text-text-tertiary font-mono">Children 12-23m</div>
                </div>

                <div className="bg-surface-elevated/60 p-3 rounded-lg border border-border">
                  <div className="text-[10px] text-text-tertiary font-medium">Overall Health Score</div>
                  <div className="text-lg font-bold font-mono text-primary-300 mt-0.5">
                    {latest.overall_health_index != null ? `${latest.overall_health_index}` : "—"}
                  </div>
                  <div className="text-[10px] text-text-tertiary font-mono">Composite Index (0-100)</div>
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
                      <span className="text-text-secondary">Clean Cooking Fuel Access</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.clean_cooking_fuel != null ? `${latest.clean_cooking_fuel}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Health Infrastructure & Human Resources */}
                <div className="bg-surface-elevated/40 rounded-xl border border-border p-4 space-y-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-secondary" /> Health Infrastructure & HRH
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">CHC Specialist Availability</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.specialist_availability != null ? `${latest.specialist_availability}%` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Doctor-Population Ratio</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.doctor_ratio != null ? `${latest.doctor_ratio} / 10k` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/50">
                      <span className="text-text-secondary">Nurse-to-Population Ratio</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.nurse_ratio != null ? `${latest.nurse_ratio} / 10k` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-text-secondary">Health Insurance (PM-JAY)</span>
                      <span className="font-mono text-text-primary font-medium">
                        {latest.insurance_coverage != null ? `${latest.insurance_coverage}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Waves Panel */}
              {history && history.length > 0 && (
                <div className="bg-surface-elevated/40 rounded-xl border border-border p-4 space-y-3">
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Empirical Survey Wave Progress (NFHS-4 vs NFHS-5)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border text-text-tertiary font-mono">
                          <th className="py-2 px-3">Wave / Year</th>
                          <th className="py-2 px-3">Inst. Delivery</th>
                          <th className="py-2 px-3">Immunization</th>
                          <th className="py-2 px-3">IMR</th>
                          <th className="py-2 px-3">MMR</th>
                          <th className="py-2 px-3">Overall Health Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono">
                        {history.map((h) => (
                          <tr key={h.year} className="hover:bg-surface-elevated/30">
                            <td className="py-2 px-3 font-semibold text-primary-400">{h.year}</td>
                            <td className="py-2 px-3 text-text-primary">{h.institutional_delivery_rate != null ? `${h.institutional_delivery_rate}%` : "—"}</td>
                            <td className="py-2 px-3 text-text-primary">{h.immunization_rate != null ? `${h.immunization_rate}%` : "—"}</td>
                            <td className="py-2 px-3 text-text-primary">{h.infant_mortality_rate != null ? Number(h.infant_mortality_rate).toFixed(1) : "—"}</td>
                            <td className="py-2 px-3 text-text-primary">{h.maternal_mortality_rate != null ? Number(h.maternal_mortality_rate).toFixed(1) : "—"}</td>
                            <td className="py-2 px-3 text-text-primary font-bold">{h.overall_health_index != null ? Number(h.overall_health_index).toFixed(1) : "—"}</td>
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
