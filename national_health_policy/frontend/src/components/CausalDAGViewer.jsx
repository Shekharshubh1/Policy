import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "../api/client";

// ─── Domain colour map ───────────────────────────────────────────────────────
const DOMAIN_COLORS = {
  "Spending": "#10b981",
  "Infrastructure": "#f97316",
  "Human Resources": "#ec4899",
  "Preventive Care": "#3b82f6",
  "Social Determinants": "#8b5cf6",
  "Digital Health": "#06b6d4",
  "Disease Burden": "#e11d48",
  "Economic": "#eab308",
  "Latent Structural": "#f59e0b",
  "Primary Health Outcome": "#ef4444",
  "Input - Spending": "#10b981",
  "Intermediate": "#f59e0b",
  "Output": "#ef4444",
};

const getDomainColor = (domain) =>
  DOMAIN_COLORS[domain] ?? "#94a3b8";

const FIXED_POSITIONS = {};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 44;
const BASE_VIEWBOX = { x: 0, y: 0, w: 1260, h: 1280 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Compute the position of a node (fixed lookup or auto-assign). */
function buildLayout(nodes) {
  const inputDomains = [
    "Spending",
    "Infrastructure",
    "Human Resources",
    "Preventive Care",
    "Social Determinants",
    "Digital Health",
    "Disease Burden",
    "Economic",
  ];

  const autoCounters = { input: 0, intermediate: 0, output: 0 };

  return nodes.map((node) => {
    const isInput = node.type === "input" || inputDomains.includes(node.domain);
    const isOutput = node.type === "output" || node.domain === "Primary Health Outcome" || node.domain === "Output";
    const isInter = node.type === "intermediate" || node.domain === "Latent Structural" || node.domain === "Intermediate";

    let x, y;
    if (isInput) {
      x = 120;
      y = 50 + autoCounters.input * 60;
      autoCounters.input++;
    } else if (isInter) {
      x = 600;
      y = 100 + autoCounters.intermediate * 110;
      autoCounters.intermediate++;
    } else if (isOutput) {
      x = 1080;
      y = 150 + autoCounters.output * 140;
      autoCounters.output++;
    } else {
      x = 120;
      y = 50 + autoCounters.input * 60;
      autoCounters.input++;
    }
    return { ...node, x, y };
  });
}

/** Build a map id→position for edge routing. */
function posMap(layoutNodes) {
  return Object.fromEntries(layoutNodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

/** SVG cubic bezier path between two nodes (source exits right, target enters left). */
function edgePath(sx, sy, tx, ty) {
  const cp1x = sx + (tx - sx) * 0.5;
  const cp2x = tx - (tx - sx) * 0.5;
  return `M ${sx} ${sy} C ${cp1x} ${sy}, ${cp2x} ${ty}, ${tx} ${ty}`;
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {Object.entries(DOMAIN_COLORS).map(([domain, color]) => (
        <div key={domain} className="flex items-center gap-1.5 text-xs text-slate-300">
          <span
            className="inline-block rounded-full"
            style={{ width: 10, height: 10, background: color, flexShrink: 0 }}
          />
          {domain}
        </div>
      ))}
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function StatsBar({ nodes, edges }) {
  const inputDomains = [
    "Input - Spending",
    "Input - Infrastructure",
    "Input - Human Resources",
    "Input - Preventive Care",
    "Input - Social Determinants",
    "Input - Digital Health",
  ];
  const inputCount = nodes.filter((n) => inputDomains.includes(n.domain)).length;
  const outputCount = nodes.filter((n) => n.domain === "Output").length;

  const stats = [
    { label: "Total Nodes", value: nodes.length, color: "#94a3b8" },
    { label: "Total Edges", value: edges.length, color: "#64748b" },
    { label: "Input Variables", value: inputCount, color: "#3b82f6" },
    { label: "Output Variables", value: outputCount, color: "#ef4444" },
  ];

  return (
    <div className="flex gap-4 px-4 py-2 border-b border-slate-700">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center px-4 py-2 rounded-lg bg-slate-800/60"
        >
          <span className="text-2xl font-bold" style={{ color: s.color }}>
            {s.value}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Selected node panel ──────────────────────────────────────────────────────
function NodePanel({ node, edges, nodesById, onClose }) {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm px-4">
        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Click a node to explore its connections
      </div>
    );
  }

  const color = getDomainColor(node.domain);
  const incoming = edges
    .filter((e) => e.target === node.id)
    .map((e) => nodesById[e.source])
    .filter(Boolean);
  const outgoing = edges
    .filter((e) => e.source === node.id)
    .map((e) => nodesById[e.target])
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: color }}
          />
          <h3 className="text-sm font-semibold text-white leading-tight">{node.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors ml-2 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Domain badge */}
      <span
        className="inline-block self-start text-xs font-medium px-2 py-0.5 rounded-full mb-3"
        style={{ background: color + "33", color }}
      >
        {node.domain}
      </span>

      {/* Description */}
      {node.description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{node.description}</p>
      )}

      {/* Connections */}
      {incoming.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            ← Causes ({incoming.length})
          </p>
          <ul className="space-y-1">
            {incoming.map((n) => (
              <li
                key={n.id}
                className="flex items-center gap-1.5 text-xs text-slate-300"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: getDomainColor(n.domain) }}
                />
                {n.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            → Effects ({outgoing.length})
          </p>
          <ul className="space-y-1">
            {outgoing.map((n) => (
              <li
                key={n.id}
                className="flex items-center gap-1.5 text-xs text-slate-300"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: getDomainColor(n.domain) }}
                />
                {n.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CausalDAGViewer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layoutNodes, setLayoutNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodesById, setNodesById] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1); // 1 = default, >1 = zoomed out (wider vb)
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Derived viewBox
  const viewBox = {
    x: BASE_VIEWBOX.x,
    y: BASE_VIEWBOX.y,
    w: BASE_VIEWBOX.w * zoom,
    h: BASE_VIEWBOX.h * zoom,
  };

  // ── Fetch data
  useEffect(() => {
    setLoading(true);
    apiClient
      .dag()
      .then((data) => {
        const rawNodes = data?.dag?.nodes ?? [];
        const rawEdges = data?.dag?.edges ?? [];
        const laid = buildLayout(rawNodes);
        setLayoutNodes(laid);
        setEdges(rawEdges);
        setNodesById(Object.fromEntries(rawNodes.map((n) => [n.id, n])));
      })
      .catch((err) => setError(err?.message ?? "Failed to load DAG"))
      .finally(() => setLoading(false));
  }, []);

  const handleZoomIn = useCallback(
    () => setZoom((z) => clamp(z / 1.25, 0.4, 3)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoom((z) => clamp(z * 1.25, 0.4, 3)),
    []
  );
  const handleReset = useCallback(() => setZoom(1), []);

  const pmap = posMap(layoutNodes);

  // ── Loading / error states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4" />
        Loading Causal DAG…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-400">
        <p className="text-lg font-semibold mb-2">Error loading DAG</p>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#0f172a", color: "#e2e8f0", fontFamily: "inherit" }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#1e293b" }}
      >
        <h2 className="text-base font-semibold text-white tracking-wide">
          Causal DAG — Madhya Pradesh Health Policy
        </h2>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-lg font-bold transition-colors"
          >
            +
          </button>
          <button
            onClick={handleReset}
            title="Reset Zoom"
            className="px-2 h-8 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            {Math.round((1 / zoom) * 100)}%
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-lg font-bold transition-colors"
          >
            −
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <StatsBar nodes={layoutNodes} edges={edges} />

      {/* ── Legend ── */}
      <div
        className="border-b"
        style={{ borderColor: "#1e293b", background: "#0f1e35" }}
      >
        <Legend />
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* SVG canvas */}
        <div className="flex-1 overflow-auto relative" style={{ background: "#0b1526" }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ minHeight: 500, display: "block" }}
          >
            {/* ── Arrow marker definition ── */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#475569" />
              </marker>
              <marker
                id="arrowhead-hover"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
              </marker>

              {/* subtle radial gradient for nodes */}
              {layoutNodes.map((n) => {
                const color = getDomainColor(n.domain);
                return (
                  <radialGradient
                    key={`grad-${n.id}`}
                    id={`grad-${n.id}`}
                    cx="35%"
                    cy="35%"
                    r="65%"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                  </radialGradient>
                );
              })}
            </defs>

            {/* ── Background column labels ── */}
            {[
              { x: 120, label: "Input Variables" },
              { x: 600, label: "Intermediate" },
              { x: 1080, label: "Output" },
            ].map(({ x, label }) => (
              <text
                key={label}
                x={x}
                y={24}
                textAnchor="middle"
                fontSize={13}
                fill="#334155"
                fontWeight="600"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                {label.toUpperCase()}
              </text>
            ))}

            {/* ── Edges ── */}
            {edges.map((e, i) => {
              const src = pmap[e.source];
              const tgt = pmap[e.target];
              if (!src || !tgt) return null;

              const isHighlighted =
                selectedNode &&
                (e.source === selectedNode.id || e.target === selectedNode.id);

              const srcX = src.x + NODE_WIDTH / 2;
              const srcY = src.y;
              const tgtX = tgt.x - NODE_WIDTH / 2;
              const tgtY = tgt.y;

              return (
                <path
                  key={i}
                  d={edgePath(srcX, srcY, tgtX, tgtY)}
                  fill="none"
                  stroke={isHighlighted ? "#94a3b8" : "#1e3a5f"}
                  strokeWidth={isHighlighted ? 1.8 : 1}
                  opacity={
                    selectedNode
                      ? isHighlighted
                        ? 0.95
                        : 0.15
                      : 0.5
                  }
                  markerEnd={
                    isHighlighted
                      ? "url(#arrowhead-hover)"
                      : "url(#arrowhead)"
                  }
                  style={{ transition: "opacity 0.2s, stroke 0.2s" }}
                />
              );
            })}

            {/* ── Nodes ── */}
            {layoutNodes.map((node) => {
              const color = getDomainColor(node.domain);
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isFaded =
                selectedNode &&
                !isSelected &&
                !edges.some(
                  (e) =>
                    (e.source === selectedNode.id && e.target === node.id) ||
                    (e.target === selectedNode.id && e.source === node.id)
                );

              const nx = node.x - NODE_WIDTH / 2;
              const ny = node.y - NODE_HEIGHT / 2;
              const rx = 8;

              // Label splitting
              const words = node.label.split(" ");
              let lines = [];
              let cur = "";
              for (const w of words) {
                if ((cur + " " + w).trim().length > 20 && cur) {
                  lines.push(cur.trim());
                  cur = w;
                } else {
                  cur = (cur + " " + w).trim();
                }
              }
              if (cur) lines.push(cur);

              return (
                <g
                  key={node.id}
                  transform={`translate(${nx}, ${ny})`}
                  style={{
                    cursor: "pointer",
                    opacity: isFaded ? 0.2 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onClick={() =>
                    setSelectedNode(isSelected ? null : node)
                  }
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Glow ring for selected */}
                  {isSelected && (
                    <rect
                      x={-4}
                      y={-4}
                      width={NODE_WIDTH + 8}
                      height={NODE_HEIGHT + 8}
                      rx={rx + 3}
                      fill="none"
                      stroke={color}
                      strokeWidth={2.5}
                      opacity={0.6}
                      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                    />
                  )}

                  {/* Node body */}
                  <rect
                    x={0}
                    y={0}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={rx}
                    fill={`url(#grad-${node.id})`}
                    stroke={isSelected || isHovered ? color : color + "88"}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{
                      filter:
                        isHovered
                          ? `drop-shadow(0 0 8px ${color}99)`
                          : "none",
                      transition: "filter 0.15s",
                    }}
                  />

                  {/* Node label */}
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={NODE_WIDTH / 2}
                      y={
                        NODE_HEIGHT / 2 +
                        (li - (lines.length - 1) / 2) * 13 +
                        1
                      }
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="#ffffff"
                      fontWeight={isSelected ? "700" : "500"}
                      style={{ userSelect: "none" }}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Right panel ── */}
        <div
          className="flex flex-col border-l"
          style={{
            width: 260,
            minWidth: 220,
            borderColor: "#1e293b",
            background: "#0d1d31",
          }}
        >
          <div
            className="px-4 py-2 border-b text-xs font-semibold text-slate-400 uppercase tracking-widest"
            style={{ borderColor: "#1e293b" }}
          >
            Selected Node
          </div>
          <div className="flex-1 overflow-hidden">
            <NodePanel
              node={selectedNode}
              edges={edges}
              nodesById={nodesById}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CausalDAGViewer;
