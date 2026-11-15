import React, { useState, useMemo } from "react";
import { MapPin, Info, BarChart2, TrendingUp, TrendingDown, Layers, CheckCircle2, AlertTriangle } from "lucide-react";

// Official geographic boundaries and center anchors for all 34 Indian States & UTs in the dataset
const INDIA_STATES_GEOMETRY = {
  "Ladakh": { code: "LA", cx: 240, cy: 65, pts: "210,30 260,25 295,60 275,105 235,100 215,70" },
  "Jammu Kashmir": { code: "JK", cx: 180, cy: 85, pts: "165,55 210,30 215,70 200,110 160,110 150,75" },
  "Himachal Pradesh": { code: "HP", cx: 225, cy: 130, pts: "200,110 235,100 255,120 240,155 210,150 195,130" },
  "Punjab": { code: "PB", cx: 175, cy: 150, pts: "155,125 195,125 195,165 160,175 145,145" },
  "Uttarakhand": { code: "UK", cx: 268, cy: 160, pts: "240,140 278,135 298,165 272,185 245,170" },
  "Haryana": { code: "HR", cx: 195, cy: 185, pts: "175,165 215,160 220,205 185,215 170,190" },
  "NCT Delhi": { code: "DL", cx: 212, cy: 195, pts: "206,190 218,190 218,202 206,202" },
  "Rajasthan": { code: "RJ", cx: 140, cy: 240, pts: "120,175 175,180 205,225 180,290 120,295 85,245 100,200" },
  "Uttar Pradesh": { code: "UP", cx: 280, cy: 235, pts: "220,195 272,185 348,215 352,265 290,285 240,265 220,225" },
  "Bihar": { code: "BR", cx: 385, cy: 255, pts: "348,225 425,230 425,280 355,285 348,250" },
  "Sikkim": { code: "SK", cx: 445, cy: 210, pts: "435,200 455,200 455,220 435,220" },
  "West Bengal": { code: "WB", cx: 425, cy: 320, pts: "425,230 440,230 440,280 460,335 435,370 410,340 420,285" },
  "Jharkhand": { code: "JH", cx: 375, cy: 315, pts: "348,285 410,285 410,340 360,350 340,310" },
  "Odisha": { code: "OD", cx: 380, cy: 395, pts: "355,350 415,345 435,385 385,445 340,430 345,380" },
  "Chhattisgarh": { code: "CG", cx: 320, cy: 365, pts: "295,305 348,300 350,380 330,450 300,430 290,360" },
  "Madhya Pradesh": { code: "MP", cx: 240, cy: 320, pts: "180,285 285,275 320,315 295,370 215,375 185,340" },
  "Gujarat": { code: "GJ", cx: 95, cy: 335, pts: "75,285 145,290 160,350 120,385 65,375 50,330" },
  "Maharashtra": { code: "MH", cx: 200, cy: 430, pts: "135,375 240,365 290,400 270,475 190,495 155,445 130,400" },
  "Goa": { code: "GA", cx: 155, cy: 515, pts: "148,505 162,505 162,525 148,525" },
  "Karnataka": { code: "KA", cx: 200, cy: 550, pts: "165,490 225,485 240,560 210,615 175,595 160,530" },
  "Telangana": { code: "TS", cx: 275, cy: 465, pts: "240,425 295,420 310,480 265,510 240,480" },
  "Andhra Pradesh": { code: "AP", cx: 285, cy: 540, pts: "265,505 320,460 365,445 305,580 250,580 240,535" },
  "Tamil Nadu": { code: "TN", cx: 235, cy: 645, pts: "215,585 265,580 260,670 210,685 195,640 210,600" },
  "Kerala": { code: "KL", cx: 190, cy: 640, pts: "175,590 205,595 205,670 180,680 170,630" },
  "Puducherry": { code: "PY", cx: 265, cy: 615, pts: "258,608 272,608 272,622 258,622" },
  "Assam": { code: "AS", cx: 500, cy: 250, pts: "460,240 520,230 545,260 480,275 455,260" },
  "Arunachal Pradesh": { code: "AR", cx: 550, cy: 205, pts: "505,185 570,185 585,225 530,235 505,215" },
  "Nagaland": { code: "NL", cx: 560, cy: 260, pts: "545,245 570,250 565,280 545,275" },
  "Manipur": { code: "MN", cx: 550, cy: 295, pts: "540,280 565,285 560,315 535,310" },
  "Mizoram": { code: "MZ", cx: 530, cy: 335, pts: "520,315 545,315 540,355 520,355" },
  "Tripura": { code: "TR", cx: 495, cy: 315, pts: "485,305 508,305 505,330 485,325" },
  "Meghalaya": { code: "ML", cx: 475, cy: 270, pts: "455,260 500,260 495,280 455,280" },
  "Dadra Nagar Haveli Daman Diu": { code: "DN", cx: 125, cy: 380, pts: "120,375 132,375 132,387 120,387" },
  "Andaman Nicobar Islands": { code: "AN", cx: 530, cy: 580, pts: "520,540 540,540 540,620 520,620" }
};

const METRIC_CONFIGS = {
  overall_health_index: {
    label: "Overall Health Score",
    unit: "/ 100",
    lowerIsGood: false,
    format: (v) => Number(v).toFixed(1),
    goodThreshold: 75,
    warnThreshold: 62,
    legend: { high: "> 75 High", mid: "62 – 75 Moderate", low: "< 62 Critical" }
  },
  maternal_mortality_rate: {
    label: "Maternal Mortality (MMR)",
    unit: "/ 100k",
    lowerIsGood: true,
    format: (v) => Number(v).toFixed(1),
    goodThreshold: 70,
    warnThreshold: 130,
    legend: { high: "< 70 (SDG Met)", mid: "70 – 130 Moderate", low: "> 130 Priority Need" }
  },
  infant_mortality_rate: {
    label: "Infant Mortality (IMR)",
    unit: "/ 1k",
    lowerIsGood: true,
    format: (v) => Number(v).toFixed(1),
    goodThreshold: 23,
    warnThreshold: 35,
    legend: { high: "< 23 (SDG Met)", mid: "23 – 35 Moderate", low: "> 35 High Burden" }
  },
  immunization_rate: {
    label: "Full Immunization",
    unit: "%",
    lowerIsGood: false,
    format: (v) => `${Number(v).toFixed(1)}%`,
    goodThreshold: 80,
    warnThreshold: 70,
    legend: { high: "> 80% High", mid: "70% – 80% Moderate", low: "< 70% Lagging" }
  },
  sanitation_access: {
    label: "Improved Sanitation",
    unit: "%",
    lowerIsGood: false,
    format: (v) => `${Number(v).toFixed(1)}%`,
    goodThreshold: 80,
    warnThreshold: 65,
    legend: { high: "> 80% Saturated", mid: "65% – 80% Expanding", low: "< 65% Priority" }
  }
};

export default function IndiaChoroplethMap({ states = [], onSelectState }) {
  const [activeMetric, setActiveMetric] = useState("overall_health_index");
  const [hoveredState, setHoveredState] = useState(null);
  const [selectedStateName, setSelectedStateName] = useState("Goa");

  // Create state lookup map
  const stateDataMap = useMemo(() => {
    const map = {};
    states.forEach((s) => {
      map[s.state_name] = s;
    });
    return map;
  }, [states]);

  const metricCfg = METRIC_CONFIGS[activeMetric];

  // Helper to compute state color based on metric
  const getStateColor = (stateName) => {
    const sData = stateDataMap[stateName];
    if (!sData || sData[activeMetric] == null) return "rgba(100, 116, 139, 0.35)";

    const val = Number(sData[activeMetric]);
    if (metricCfg.lowerIsGood) {
      if (val <= metricCfg.goodThreshold) return "#10b981"; // Emerald
      if (val <= metricCfg.warnThreshold) return "#f59e0b"; // Amber
      return "#ef4444"; // Red / Critical
    } else {
      if (val >= metricCfg.goodThreshold) return "#10b981"; // Emerald
      if (val >= metricCfg.warnThreshold) return "#f59e0b"; // Amber
      return "#ef4444"; // Red / Critical
    }
  };

  // Selected State Details
  const selectedStateData = stateDataMap[selectedStateName] || states[0] || null;

  return (
    <div className="bg-surface rounded-xl border border-border p-4 space-y-4 shadow-sm">
      {/* ── Top Bar: Title & Metric Toggles ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>Interactive National Health Map (Choropleth)</span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Explore state-level epidemiological indicators across 34 States and Union Territories.
          </p>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {Object.entries(METRIC_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeMetric === key
                  ? "bg-primary-600 text-white font-semibold shadow-sm"
                  : "bg-surface-elevated text-text-secondary hover:text-text-primary border border-border/50"
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Map Canvas & State Inspection Split View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SVG Choropleth Map (7 cols) */}
        <div className="lg:col-span-7 relative bg-surface-elevated/20 rounded-xl p-3 border border-border/60 flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 620 710"
            className="w-full max-h-[480px] drop-shadow-sm select-none"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
          >
            {/* Background Grid Lines for Technical Geographic Feel */}
            <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
              <line x1="50" y1="200" x2="570" y2="200" strokeDasharray="3 3" />
              <line x1="50" y1="400" x2="570" y2="400" strokeDasharray="3 3" />
              <line x1="50" y1="600" x2="570" y2="600" strokeDasharray="3 3" />
              <line x1="200" y1="50" x2="200" y2="680" strokeDasharray="3 3" />
              <line x1="400" y1="50" x2="400" y2="680" strokeDasharray="3 3" />
            </g>

            {/* Render Each State Polygon */}
            {Object.entries(INDIA_STATES_GEOMETRY).map(([stateName, geo]) => {
              const fillColor = getStateColor(stateName);
              const isSelected = selectedStateName === stateName;
              const isHovered = hoveredState === stateName;
              const sData = stateDataMap[stateName];

              return (
                <g key={stateName} className="cursor-pointer transition-transform">
                  <polygon
                    points={geo.pts}
                    fill={fillColor}
                    fillOpacity={isSelected ? 1.0 : isHovered ? 0.9 : 0.72}
                    stroke={isSelected ? "#38bdf8" : isHovered ? "#ffffff" : "var(--border-hairline)"}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 0.8}
                    strokeLinejoin="round"
                    onMouseEnter={() => setHoveredState(stateName)}
                    onMouseLeave={() => setHoveredState(null)}
                    onClick={() => {
                      setSelectedStateName(stateName);
                      if (onSelectState && sData) onSelectState(sData);
                    }}
                    className="transition-all duration-200"
                  />
                  {/* State Abbreviation Code Label */}
                  <text
                    x={geo.cx}
                    y={geo.cy}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={isSelected || isHovered ? "#ffffff" : "#f1f5f9"}
                    fontSize={geo.code === "DL" || geo.code === "PY" || geo.code === "GA" ? "8" : "9.5"}
                    fontWeight="700"
                    fontFamily="var(--font-mono)"
                    pointerEvents="none"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {geo.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredState && stateDataMap[hoveredState] && (
            <div className="absolute top-4 left-4 bg-surface/95 backdrop-blur-md border border-border p-2.5 rounded-lg shadow-xl text-xs z-20 pointer-events-none space-y-1">
              <div className="font-bold text-text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStateColor(hoveredState) }} />
                <span>{hoveredState}</span>
              </div>
              <div className="text-[11px] font-mono text-text-secondary">
                {metricCfg.label}: <strong className="text-text-primary">{metricCfg.format(stateDataMap[hoveredState][activeMetric])}</strong>
              </div>
              <div className="text-[9px] font-mono text-text-tertiary">
                IMR: {stateDataMap[hoveredState].infant_mortality_rate} • MMR: {stateDataMap[hoveredState].maternal_mortality_rate}
              </div>
            </div>
          )}

          {/* Bottom-Corner Legend */}
          <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm border border-border/80 px-3 py-2 rounded-lg text-[10px] font-mono space-y-1 shadow-md">
            <div className="font-semibold text-text-primary text-[10px]">
              {metricCfg.label} Scale
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                {metricCfg.legend.high}
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                {metricCfg.legend.mid}
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                {metricCfg.legend.low}
              </span>
            </div>
          </div>
        </div>

        {/* Selected State Detailed Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 bg-surface-elevated/40 rounded-xl border border-border p-4 flex flex-col justify-between space-y-3.5 h-[480px] overflow-y-auto">
          {selectedStateData ? (
            <>
              <div>
                {/* State Header */}
                <div className="flex items-start justify-between pb-2.5 border-b border-border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary-400">
                      State Public Health Profile
                    </span>
                    <h3 className="text-base font-bold text-text-primary">
                      {selectedStateData.state_name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-text-tertiary">Health Score</span>
                    <div className="text-xl font-bold font-mono text-primary-400">
                      {selectedStateData.overall_health_index != null ? selectedStateData.overall_health_index.toFixed(1) : "—"}
                    </div>
                  </div>
                </div>

                {/* State Indicator Matrix */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-surface border border-border/60 rounded-lg p-2 text-xs">
                    <div className="text-[10px] text-text-tertiary">Maternal Mortality (MMR)</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {selectedStateData.maternal_mortality_rate} <span className="text-[9px] font-normal text-text-tertiary">/100k</span>
                    </div>
                  </div>
                  <div className="bg-surface border border-border/60 rounded-lg p-2 text-xs">
                    <div className="text-[10px] text-text-tertiary">Infant Mortality (IMR)</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {selectedStateData.infant_mortality_rate} <span className="text-[9px] font-normal text-text-tertiary">/1k</span>
                    </div>
                  </div>
                  <div className="bg-surface border border-border/60 rounded-lg p-2 text-xs">
                    <div className="text-[10px] text-text-tertiary">Institutional Deliveries</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {selectedStateData.institutional_delivery_rate}%
                    </div>
                  </div>
                  <div className="bg-surface border border-border/60 rounded-lg p-2 text-xs">
                    <div className="text-[10px] text-text-tertiary">Full Immunization</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {selectedStateData.immunization_rate}%
                    </div>
                  </div>
                  <div className="bg-surface border border-border/60 rounded-lg p-2 text-xs">
                    <div className="text-[10px] text-text-tertiary">Sanitation Access</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {selectedStateData.sanitation_access}%
                    </div>
                  </div>
                  <div className="bg-surface border border-border/60 rounded-lg p-2 text-xs">
                    <div className="text-[10px] text-text-tertiary">Piped Clean Water</div>
                    <div className="text-sm font-bold font-mono text-text-primary mt-0.5">
                      {selectedStateData.clean_water_access}%
                    </div>
                  </div>
                </div>

                {/* Strategic Assessment & Strengths/Weaknesses */}
                <div className="mt-3.5 space-y-2">
                  <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Policy Assessment
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-2.5 text-xs space-y-1.5 leading-relaxed">
                    {selectedStateData.overall_health_index >= 75 ? (
                      <p className="text-emerald-400 font-medium">
                        ✅ Exemplary Benchmark: Robust clinical delivery and primary healthcare infrastructure. Focus on sustainability and digital record integration.
                      </p>
                    ) : selectedStateData.overall_health_index >= 62 ? (
                      <p className="text-amber-400 font-medium">
                        ⚠ Moderate Performance: Disparities exist between rural primary health centres and district hospitals. Needs targeted specialist staffing.
                      </p>
                    ) : (
                      <p className="text-rose-400 font-medium">
                        🚨 Critical Policy Need: High maternal and infant mortality compounded by environmental determinants. Immediate primary care funding surge required.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Directives */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono text-text-tertiary">
                <span>NFHS-5 Ground Truth</span>
                <span className="text-primary-400 font-semibold cursor-pointer hover:underline">
                  Click any state on map to inspect
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-xs text-text-tertiary">
              Click any state on the map to inspect its full epidemiological profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
