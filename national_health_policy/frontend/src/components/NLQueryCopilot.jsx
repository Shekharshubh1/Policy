import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "../api/client";

const PROMPT_CHIPS = [
  "What intervention most reduces maternal mortality in rural districts?",
  "If vaccination coverage increases from 70% to 90%, what changes occur?",
  "Which states need immediate healthcare infrastructure investment?",
  "What is the impact of female literacy on child health outcomes?",
  "Compare institutional delivery rates between best and worst performing states",
];

const METRIC_LABELS = {
  maternal_mortality_rate: "MMR",
  infant_mortality_rate: "IMR",
  life_expectancy: "Life Exp",
  health_equity_index: "Health Equity",
  universal_health_coverage_score: "UHC Score",
  overall_health_index: "Health Index",
};

function formatMetricChips(expected_values) {
  if (!expected_values || typeof expected_values !== "object") return null;
  return Object.entries(expected_values)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, val]) => {
      const label = METRIC_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const formatted = typeof val === "number" ? val.toFixed(1) : val;
      return { label, value: formatted };
    });
}

function CausalChain({ pathways }) {
  const [open, setOpen] = useState(false);
  if (!pathways || pathways.length === 0) return null;

  return (
    <div className="mt-2.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2.5 py-1 bg-surface border border-border rounded text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
      >
        <span>{open ? "▼" : "▶"}</span>
        <span>Causal Pathway Chain ({pathways.length})</span>
      </button>
      {open && (
        <div className="mt-2 p-3 bg-surface border border-border/80 rounded-lg space-y-2">
          {pathways.map((pw, i) => {
            const nodes = Array.isArray(pw.path) ? pw.path : [];
            return (
              <div key={i} className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
                {nodes.map((node, ni) => (
                  <span key={ni} className="flex items-center gap-1">
                    <span className="bg-surface-elevated border border-border/60 rounded px-1.5 py-0.5 text-primary-300">
                      {node.replace(/_bin$/, "")}
                    </span>
                    {ni < nodes.length - 1 && <span className="text-text-tertiary">→</span>}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NLQueryCopilot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to the NHP-DIS Policy Copilot. You can ask natural-language questions regarding public health interventions, causal impact pathways, and district resource allocations.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [districtContext, setDistrictContext] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const text = (queryText || inputValue).trim();
    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await apiClient.nlQuery(text, districtContext.trim() || null);
      const assistantMessage = {
        role: "assistant",
        content: res.policy_brief || "Analysis complete.",
        metadata: {
          expected_values: res.expected_values,
          causal_pathways: res.causal_pathways,
          interventions: res.interventions_applied,
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Query failed: ${err.message || "Could not retrieve causal policy explanation"}`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Neuro-Symbolic Policy Copilot
          </h2>
          <p className="text-xs text-text-secondary">
            Causal policy explanation grounded in Bayesian graph pathways and official government open data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="District filter (optional)..."
            value={districtContext}
            onChange={(e) => setDistrictContext(e.target.value)}
            className="bg-surface border border-border text-text-primary px-3 py-1.5 rounded text-xs focus:border-primary-500 placeholder-text-tertiary w-56"
          />
          <button
            onClick={() => setMessages([messages[0]])}
            className="px-2.5 py-1.5 bg-surface border border-border text-text-tertiary hover:text-text-primary rounded text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Prompt Chips */}
      <div className="flex flex-wrap gap-1.5">
        {PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 bg-surface hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary rounded text-[11px] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="bg-surface border border-border rounded-xl p-4 h-[520px] overflow-y-auto space-y-4 flex flex-col">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          const chips = m.metadata ? formatMetricChips(m.metadata.expected_values) : null;

          return (
            <div key={idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}>
              <div
                className={`max-w-2xl rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-primary-600 text-white font-medium"
                    : m.isError
                    ? "bg-rose-950/40 border border-rose-800 text-rose-300"
                    : "bg-surface-elevated border border-border/80 text-text-primary"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Quantitative Metric Chips */}
                {chips && chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2.5 mt-2.5 border-t border-border/50">
                    {chips.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-surface rounded text-[10px] font-mono border border-border/60 text-primary-300">
                        {c.label}: <strong className="text-text-primary">{c.value}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Causal Chain Collapsible */}
                {m.metadata?.causal_pathways && (
                  <CausalChain pathways={m.metadata.causal_pathways} />
                )}
              </div>
              <span className="text-[10px] font-mono text-text-tertiary px-1">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary py-2">
            <span className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
            <span>Synthesizing causal pathways and posterior beliefs...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask a policy question (e.g. 'What if institutional deliveries increase by 10% in high-risk districts?')..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-surface border border-border text-text-primary px-3.5 py-2.5 rounded-lg text-xs focus:border-primary-500 placeholder-text-tertiary"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
