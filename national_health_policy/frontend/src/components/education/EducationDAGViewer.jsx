import React, { useState } from "react";
import { Layers, Info, CheckCircle2 } from "lucide-react";

export default function EducationDAGViewer() {
  const [selectedNode, setSelectedNode] = useState("literacy_rate");

  // 15 Educational Nodes in the DAG
  const nodes = [
    { id: "per_student_exp", label: "Per-Student Spend", type: "input", x: 60, y: 50, color: "#f59e0b" },
    { id: "teacher_student_ratio", label: "PTR (1:X)", type: "input", x: 60, y: 130, color: "#6366f1" },
    { id: "infra_index", label: "School Infra", type: "input", x: 60, y: 210, color: "#10b981" },
    { id: "digital_access", label: "Digital Access", type: "input", x: 60, y: 290, color: "#38bdf8" },
    { id: "mid_day_meal", label: "Mid-Day Meal", type: "input", x: 60, y: 370, color: "#ec4899" },
    { id: "female_teacher_ratio", label: "Female Teachers", type: "input", x: 60, y: 450, color: "#8b5cf6" },

    // Mediating Intermediate Nodes
    { id: "classroom_instruction", label: "Instruction Quality", type: "mediator", x: 250, y: 90, color: "#0284c7" },
    { id: "school_environment", label: "Safe Learning Env", type: "mediator", x: 250, y: 250, color: "#0284c7" },
    { id: "student_retention", label: "Student Attendance", type: "mediator", x: 250, y: 410, color: "#0284c7" },

    // Terminal Policy Outcomes
    { id: "enrollment_rate", label: "Gross Enrollment", type: "outcome", x: 440, y: 70, color: "#38bdf8" },
    { id: "dropout_rate", label: "Dropout Rate", type: "outcome", x: 440, y: 170, color: "#ef4444" },
    { id: "learning_outcome", label: "Learning Score", type: "outcome", x: 440, y: 270, color: "#10b981" },
    { id: "literacy_rate", label: "Literacy Rate", type: "outcome", x: 440, y: 370, color: "#10b981" },
    { id: "gender_parity_index", label: "Gender Parity", type: "outcome", x: 440, y: 450, color: "#8b5cf6" }
  ];

  // Causal Edges
  const edges = [
    { from: "per_student_exp", to: "infra_index" },
    { from: "per_student_exp", to: "digital_access" },
    { from: "teacher_student_ratio", to: "classroom_instruction" },
    { from: "infra_index", to: "school_environment" },
    { from: "digital_access", to: "classroom_instruction" },
    { from: "mid_day_meal", to: "student_retention" },
    { from: "female_teacher_ratio", to: "school_environment" },
    { from: "female_teacher_ratio", to: "gender_parity_index" },
    { from: "classroom_instruction", to: "learning_outcome" },
    { from: "classroom_instruction", to: "literacy_rate" },
    { from: "school_environment", to: "dropout_rate" },
    { from: "student_retention", to: "enrollment_rate" },
    { from: "student_retention", to: "dropout_rate" },
    { from: "learning_outcome", to: "literacy_rate" }
  ];

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>State Education Causal DAG Architecture (Pearl's Structural Model)</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Directed Acyclic Graph mapping policy inputs, mediating classroom environments, and long-term educational outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Policy Inputs (6)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Mediators (3)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Terminal Outcomes (5)</span>
          </span>
        </div>
      </div>

      {/* SVG Graph View */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm overflow-x-auto">
        <svg viewBox="0 0 540 500" className="w-full h-[450px] min-w-[500px]">
          <defs>
            <marker
              id="edu-arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148, 163, 184, 0.4)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, idx) => {
            const src = nodeMap[e.from];
            const dst = nodeMap[e.to];
            if (!src || !dst) return null;
            return (
              <line
                key={idx}
                x1={src.x + 40}
                y1={src.y}
                x2={dst.x - 40}
                y2={dst.y}
                stroke="currentColor"
                strokeOpacity="0.22"
                strokeWidth="1.5"
                markerEnd="url(#edu-arrow)"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const isSelected = selectedNode === n.id;
            return (
              <g
                key={n.id}
                onClick={() => setSelectedNode(n.id)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <rect
                  x={n.x - 50}
                  y={n.y - 16}
                  width="100"
                  height="32"
                  rx="6"
                  fill="var(--bg-surface-elevated, #182035)"
                  stroke={isSelected ? "#38bdf8" : n.color}
                  strokeWidth={isSelected ? "2" : "1.2"}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  className="text-[9.5px] font-sans fill-text-primary select-none font-medium"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
