import React, { useState, useMemo } from "react";
import {
  Search,
  School,
  Award,
  AlertTriangle,
  Download,
  Filter,
  CheckCircle2,
  Users
} from "lucide-react";
import educationData from "../../data/education_data.json";

export default function EducationDistrictExplorer() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("literacy_rate");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedDistrictName, setSelectedDistrictName] = useState("Alirajpur");
  const [tribalOnly, setTribalOnly] = useState(false);

  const districts = educationData.districts;

  // Filter and sort
  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const matchesSearch = d.district.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (tribalOnly && d.tribal_share < 30) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [districts, search, sortBy, sortAsc, tribalOnly]);

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.district === selectedDistrictName) || districts[0],
    [districts, selectedDistrictName]
  );

  const handleSort = (key) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-400" />
            <span>MP 52-District Education Performance Matrix</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Granular educational indicators across all 52 districts of Madhya Pradesh (UDISE+ and ASER validated panel).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tribal filter toggle */}
          <button
            onClick={() => setTribalOnly(!tribalOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              tribalOnly
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            Tribal Focus (&gt;30%)
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-surface border border-border text-text-primary pl-8 pr-3 py-1.5 rounded-lg text-xs focus:border-indigo-500 placeholder-text-tertiary w-48"
            />
          </div>
        </div>
      </div>

      {/* Selected District Deep-Dive Card */}
      {selectedDistrict && (
        <div className="bg-surface rounded-xl border border-indigo-800/40 p-4 space-y-3 shadow-sm bg-gradient-to-r from-indigo-950/20 via-surface to-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary">{selectedDistrict.district}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-border text-indigo-300">
                {selectedDistrict.rural_urban === "rural" ? "Rural Block" : "Urban Block"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
                {selectedDistrict.tribal_share}% Tribal Share
              </span>
            </div>
            <div className="text-xs font-mono text-text-tertiary">
              Literacy: <strong className="text-emerald-400">{selectedDistrict.literacy_rate}%</strong> • Dropout: <strong className="text-rose-400">{selectedDistrict.dropout_rate}%</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">PTR Norm</span>
              <span className="font-bold text-text-primary">1:{selectedDistrict.teacher_student_ratio}</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Digital Access</span>
              <span className="font-bold text-sky-400">{selectedDistrict.digital_access}%</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Infrastructure</span>
              <span className="font-bold text-indigo-400">{selectedDistrict.infra_index}/100</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Female Teachers</span>
              <span className="font-bold text-text-primary">{selectedDistrict.female_teacher_ratio}%</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Mid-Day Meal</span>
              <span className="font-bold text-emerald-400">{selectedDistrict.mid_day_meal}%</span>
            </div>
            <div className="bg-surface-elevated/40 border border-border/60 rounded p-2">
              <span className="text-[9px] text-text-tertiary block font-sans">Learning Score</span>
              <span className="font-bold text-primary-300">{selectedDistrict.learning_outcome}</span>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Table */}
      <div className="bg-surface border border-border rounded-xl overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto shadow-sm">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="sticky top-0 bg-surface-elevated/95 backdrop-blur-xs border-b border-border z-10">
            <tr className="border-b border-border text-text-tertiary select-none">
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th onClick={() => handleSort("district")} className="py-2.5 px-3 cursor-pointer hover:text-text-primary">
                District {sortBy === "district" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("literacy_rate")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                Literacy % {sortBy === "literacy_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("dropout_rate")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                Dropout % {sortBy === "dropout_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("enrollment_rate")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                Enrollment % {sortBy === "enrollment_rate" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("learning_outcome")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                Learning Score {sortBy === "learning_outcome" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("teacher_student_ratio")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                PTR (1:X) {sortBy === "teacher_student_ratio" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("digital_access")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                Digital % {sortBy === "digital_access" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
              <th onClick={() => handleSort("tribal_share")} className="py-2.5 px-3 text-center cursor-pointer hover:text-text-primary">
                Tribal % {sortBy === "tribal_share" ? (sortAsc ? "↑" : "↓") : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {filteredDistricts.map((d, i) => {
              const isSelected = selectedDistrictName === d.district;
              return (
                <tr
                  key={d.district}
                  onClick={() => setSelectedDistrictName(d.district)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-indigo-500/15 ring-1 ring-inset ring-indigo-500/40" : "hover:bg-surface-elevated/40"
                  }`}
                >
                  <td className="py-2 px-3 text-center text-text-tertiary">{i + 1}</td>
                  <td className="py-2 px-3 font-sans font-medium text-text-primary">{d.district}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${d.literacy_rate >= 75 ? "bg-emerald-500/20 text-emerald-300 font-bold" : d.literacy_rate >= 65 ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/20 text-rose-300 font-bold"}`}>
                      {d.literacy_rate}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${d.dropout_rate <= 12 ? "bg-emerald-500/20 text-emerald-300 font-bold" : d.dropout_rate <= 20 ? "bg-amber-500/15 text-amber-300" : "bg-rose-500/20 text-rose-300 font-bold"}`}>
                      {d.dropout_rate}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-text-primary">{d.enrollment_rate}%</td>
                  <td className="py-2 px-3 text-center text-primary-300 font-bold">{d.learning_outcome}</td>
                  <td className="py-2 px-3 text-center text-text-secondary">1:{d.teacher_student_ratio}</td>
                  <td className="py-2 px-3 text-center text-sky-400">{d.digital_access}%</td>
                  <td className="py-2 px-3 text-center text-amber-400">{d.tribal_share}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
