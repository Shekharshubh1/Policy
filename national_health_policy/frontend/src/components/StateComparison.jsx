import React, { useState, useEffect } from "react";
import { Download, Search } from "lucide-react";
import { apiClient } from "../api/client";

export default function StateComparison() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("overall_health_index");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    apiClient.states()
      .then((res) => {
        setStates(res.states || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load states:", err);
        setLoading(false);
      });
  }, []);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const filteredStates = states
    .filter((s) => (s.state_name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      return sortAsc ? valA - valB : valB - valA;
    });

  const handleExportCSV = () => {
    const headers = ["State/UT", "IMR", "MMR", "Institutional Delivery %", "Immunization %", "Sanitation %", "Clean Water %", "Health Index Score"];
    const rows = filteredStates.map(s => [
      `"${s.state_name}"`,
      s.infant_mortality_rate ?? "",
      s.maternal_mortality_rate ?? "",
      s.institutional_delivery_rate ?? "",
      s.immunization_rate ?? "",
      s.sanitation_access ?? "",
      s.clean_water_access ?? "",
      s.overall_health_index ?? ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `State_Health_Matrix_NFHS5_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary text-xs gap-3">
        <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
        <span>Loading state comparisons...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            State & Union Territory Performance Matrix ({states.length} Jurisdictions)
          </h2>
          <p className="text-xs text-text-secondary">
            Benchmark health indicators from NFHS-5 and Rural Health Statistics. Click column headers to sort.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter state or UT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface border border-border text-text-primary px-3 py-1.5 rounded text-xs focus:border-primary-500 placeholder-text-tertiary w-64"
          />
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated/70 border border-border text-text-secondary hover:text-text-primary rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Export State Matrix to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-surface border-b border-border z-10">
            <tr className="border-b border-border text-text-tertiary select-none">
              <th className="py-2.5 px-3">#</th>
              <th onClick={() => handleSort("state_name")} className="py-2.5 px-3 cursor-pointer hover:text-text-primary">
                State / UT {sortBy === "state_name" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("infant_mortality_rate")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                IMR (per 1k) {sortBy === "infant_mortality_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("maternal_mortality_rate")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                MMR (per 100k) {sortBy === "maternal_mortality_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("institutional_delivery_rate")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                Inst. Del % {sortBy === "institutional_delivery_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("immunization_rate")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                Immunization % {sortBy === "immunization_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("sanitation_access")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                Sanitation % {sortBy === "sanitation_access" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("clean_water_access")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                Water Access % {sortBy === "clean_water_access" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("overall_health_index")} className="py-2.5 px-3 text-right cursor-pointer hover:text-text-primary">
                Health Score {sortBy === "overall_health_index" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {filteredStates.map((s, idx) => (
              <tr key={s.state_name} className="hover:bg-surface-elevated/40">
                <td className="py-2.5 px-3 text-text-tertiary">{idx + 1}</td>
                <td className="py-2.5 px-3 font-sans font-medium text-text-primary">{s.state_name}</td>
                <td className="py-2.5 px-3 text-right text-text-secondary">{s.infant_mortality_rate}</td>
                <td className="py-2.5 px-3 text-right text-text-secondary">{s.maternal_mortality_rate}</td>
                <td className="py-2.5 px-3 text-right text-text-secondary">{s.institutional_delivery_rate}%</td>
                <td className="py-2.5 px-3 text-right text-text-secondary">{s.immunization_rate}%</td>
                <td className="py-2.5 px-3 text-right text-text-secondary">{s.sanitation_access}%</td>
                <td className="py-2.5 px-3 text-right text-text-secondary">{s.clean_water_access}%</td>
                <td className="py-2.5 px-3 text-right text-primary-400 font-bold">{s.overall_health_index}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
