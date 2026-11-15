import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  User,
  Sparkles,
  Send,
  Trash2,
  GitBranch,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingDown,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import { apiClient } from "../api/client";

const PROMPT_CHIPS = [
  "What intervention most reduces maternal mortality in rural districts?",
  "If vaccination coverage increases from 70% to 90%, what changes occur?",
  "Which health investments have the highest causal leverage on life expectancy?",
  "What is the impact of female literacy on institutional deliveries and IMR?",
  "Compare upstream water/sanitation investments versus hospital bed expansion",
];

const METRIC_LABELS = {
  maternal_mortality_rate: { label: "MMR", unit: "/100k", lowerIsGood: true },
  infant_mortality_rate: { label: "IMR", unit: "/1k", lowerIsGood: true },
  life_expectancy: { label: "Life Exp.", unit: "yrs", lowerIsGood: false },
  health_equity_index: { label: "Health Equity", unit: "/100", lowerIsGood: false },
  universal_health_coverage_score: { label: "UHC Score", unit: "/100", lowerIsGood: false },
  overall_health_index: { label: "Health Index", unit: "/100", lowerIsGood: false },
  healthcare_accessibility: { label: "Accessibility", unit: "/100", lowerIsGood: false },
  service_quality: { label: "Service Quality", unit: "/100", lowerIsGood: false },
  preventive_health_adoption: { label: "Preventive Care", unit: "/100", lowerIsGood: false },
};

// Clean Markdown Renderer for Headings, Bold, Bullet Points, and Paragraphs
function FormattedPolicyBrief({ content }) {
  if (!content) return null;

  // Split on triple hashtags or major section breaks
  const sections = content
    .replace(/###\s+/g, "\n\n### ")
    .replace(/##\s+/g, "\n\n## ")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 leading-relaxed text-[12px] text-text-primary">
      {sections.map((sec, idx) => {
        // H3 Header
        if (sec.startsWith("### ")) {
          const title = sec.replace(/^###\s+/, "");
          return (
            <h4
              key={idx}
              className="text-xs font-bold text-primary-400 uppercase tracking-wider pt-2 border-t border-border/40 first:border-0 first:pt-0"
            >
              {title}
            </h4>
          );
        }

        // H2 Header
        if (sec.startsWith("## ")) {
          const title = sec.replace(/^##\s+/, "");
          return (
            <h3 key={idx} className="text-sm font-bold text-text-primary pt-2 border-t border-border/60">
              {title}
            </h3>
          );
        }

        // Bullet lists or numbered points
        const lines = sec.split("\n");
        const isList = lines.some((l) => l.trim().startsWith("* ") || l.trim().startsWith("- ") || /^\d+\.\s+/.test(l.trim()));

        if (isList) {
          return (
            <ul key={idx} className="space-y-1.5 pl-3 border-l-2 border-primary-500/40 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\*\-]\s+/, "").replace(/^\d+\.\s+/, "");
                return (
                  <li key={lIdx} className="text-text-secondary leading-normal flex items-start gap-1.5">
                    <span className="text-primary-400 font-bold text-[11px] mt-0.5">•</span>
                    <span dangerouslySetInnerHTML={{ __html: renderInlineFormatting(cleanLine) }} />
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph with bold text parsing
        return (
          <p
            key={idx}
            className="text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInlineFormatting(sec) }}
          />
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-text-primary">$1</em>')
    .replace(/ΔE\[Y\s*\|\s*do\(X\)\]/g, '<span class="font-mono text-primary-300 font-semibold">ΔE[Y|do(X)]</span>');
}

function MetricPillGrid({ expectedValues }) {
  if (!expectedValues) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-border/50">
      {Object.entries(expectedValues).slice(0, 6).map(([key, val]) => {
        const meta = METRIC_LABELS[key] || {
          label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          unit: "",
        };
        const formatted = typeof val === "number" ? val.toFixed(1) : val;

        return (
          <div key={key} className="bg-surface/80 border border-border/70 rounded-lg p-2 text-center font-mono">
            <div className="text-[9px] text-text-tertiary truncate">{meta.label}</div>
            <div className="text-xs font-bold text-text-primary my-0.5">
              {formatted} <span className="text-[8px] font-normal text-text-tertiary">{meta.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CausalChainCollapsible({ pathways }) {
  const [open, setOpen] = useState(false);
  if (!pathways || pathways.length === 0) return null;

  return (
    <div className="pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-[11px] text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer select-none"
      >
        <GitBranch className="w-3 h-3 text-primary-400" />
        <span>Causal Pathways ({pathways.length} transmission routes)</span>
        {open ? <ChevronUp className="w-3 h-3 text-text-tertiary ml-1" /> : <ChevronDown className="w-3 h-3 text-text-tertiary ml-1" />}
      </button>

      {open && (
        <div className="mt-2 p-2.5 bg-surface/90 border border-border rounded-lg space-y-1.5 max-h-48 overflow-y-auto">
          {pathways.map((pw, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1 text-[10px] font-mono bg-surface-elevated/40 p-1.5 rounded border border-border/50">
              {pw.path.map((node, ni) => (
                <span key={ni} className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-primary">
                    {node.replace(/_bin$/, "").replace(/_/g, " ")}
                  </span>
                  {ni < pw.path.length - 1 && <span className="text-primary-400 font-bold">→</span>}
                </span>
              ))}
            </div>
          ))}
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
        "Welcome to the NHP-DIS Policy Copilot. Grounded in Pearl's structural causal do-calculus and calibrated on 698 official districts (NFHS-5, RHS, HMIS), I can diagnose structural bottlenecks, trace transmission chains, and predict quantitative counterfactual outcomes.",
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
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-400" />
            Neuro-Symbolic Policy Copilot
          </h2>
          <p className="text-[11px] text-text-secondary">
            Natural language do-calculus simulation backed by 37-Node Bayesian Network & Groq LLaMA-3.3-70B.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="w-3 h-3 text-text-tertiary absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="District filter (optional)..."
              value={districtContext}
              onChange={(e) => setDistrictContext(e.target.value)}
              className="bg-surface border border-border text-text-primary pl-7 pr-2.5 py-1 rounded text-xs focus:border-primary-500 placeholder-text-tertiary w-52"
            />
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="px-2.5 py-1 bg-surface border border-border text-text-tertiary hover:text-text-primary rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* ── Prompt Starter Chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 bg-surface hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary rounded text-[11px] transition-colors cursor-pointer text-left"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ── Main Chat Area ── */}
      <div className="bg-surface border border-border rounded-xl p-3.5 h-[500px] overflow-y-auto space-y-3.5 flex flex-col">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";

          return (
            <div key={idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}>
              <div
                className={`max-w-3xl rounded-xl p-3.5 text-xs ${
                  isUser
                    ? "bg-primary-600 text-white font-medium shadow-sm ml-8"
                    : m.isError
                    ? "bg-rose-950/40 border border-rose-800 text-rose-300 w-full"
                    : "bg-surface-elevated border border-border/80 text-text-primary w-full shadow-sm"
                }`}
              >
                {/* Assistant or User Header */}
                <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-border/40 text-[11px] font-semibold text-text-tertiary">
                  {isUser ? (
                    <>
                      <User className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-white/90">Policy Inquiry</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-text-primary">Executive Policy Intelligence Advisory</span>
                    </>
                  )}
                </div>

                {/* Content with rich formatting */}
                {isUser ? (
                  <div className="text-white text-xs">{m.content}</div>
                ) : (
                  <FormattedPolicyBrief content={m.content} />
                )}

                {/* Quantitative Simulated Health Outcome Metrics */}
                {m.metadata?.expected_values && (
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-wider font-mono text-text-tertiary mb-1">
                      Simulated Causal Outcomes (Posterior Expectations)
                    </div>
                    <MetricPillGrid expectedValues={m.metadata.expected_values} />
                  </div>
                )}

                {/* Causal Transmission Chain */}
                {m.metadata?.causal_pathways && (
                  <CausalChainCollapsible pathways={m.metadata.causal_pathways} />
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[9px] font-mono text-text-tertiary px-1">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary py-2 bg-surface-elevated/40 rounded-lg p-3 border border-border/50">
            <span className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0"></span>
            <span>Synthesizing structural causal pathways and Bayesian posteriors via LLaMA-3.3-70B on Groq LPUs...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask a policy query (e.g., 'What if institutional deliveries increase by 15% in high-risk districts?')..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-surface border border-border text-text-primary px-3 py-2 rounded-lg text-xs focus:border-primary-500 placeholder-text-tertiary"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
