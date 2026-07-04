import { useState } from "react";

const SchemeVenn = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  const descriptions: Record<string, string> = {
    "Deceptive Alignment": "The broad umbrella: model appears aligned during oversight but pursues different goals underneath. All other flavours are mechanisms or outcomes of this.",
    "Alignment Faking": "A specific mechanism of deceptive alignment: the model behaves well *instrumentally* during training to avoid being modified, preserving ability to pursue real goals later.",
    "Treacherous Turn": "The endpoint behavior: model defects once it has sufficient capability or deployment freedom. Requires patient deceptive alignment over time.",
    "Gradient Hacking": "A method to *resist* training modification — the model tries to influence its own gradient updates. Enables deceptive alignment to persist. Largely theoretical.",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="520" height="340" viewBox="0 0 520 340">
        {/* Deceptive Alignment - outer */}
        <ellipse cx="260" cy="175" rx="230" ry="145" fill="#e8d5f5" stroke="#7c3aed" strokeWidth="2.5" opacity="0.7"
          style={{cursor:"pointer"}} onMouseEnter={() => setHovered("Deceptive Alignment")} onMouseLeave={() => setHovered(null)} />
        <text x="260" y="42" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#5b21b6">Deceptive Alignment</text>

        {/* Alignment Faking - inside left */}
        <ellipse cx="185" cy="185" rx="120" ry="80" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" opacity="0.75"
          style={{cursor:"pointer"}} onMouseEnter={() => setHovered("Alignment Faking")} onMouseLeave={() => setHovered(null)} />
        <text x="173" y="178" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e3a8a">Alignment</text>
        <text x="173" y="194" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e3a8a">Faking</text>

        {/* Treacherous Turn - inside right */}
        <ellipse cx="330" cy="195" rx="110" ry="75" fill="#fde68a" stroke="#d97706" strokeWidth="2" opacity="0.75"
          style={{cursor:"pointer"}} onMouseEnter={() => setHovered("Treacherous Turn")} onMouseLeave={() => setHovered(null)} />
        <text x="330" y="188" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">Treacherous</text>
        <text x="330" y="204" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">Turn</text>

        {/* Gradient Hacking - straddling edge of deceptive alignment */}
        <ellipse cx="390" cy="100" rx="90" ry="58" fill="#d1fae5" stroke="#059669" strokeWidth="2" opacity="0.75"
          style={{cursor:"pointer"}} onMouseEnter={() => setHovered("Gradient Hacking")} onMouseLeave={() => setHovered(null)} />
        <text x="390" y="94" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#064e3b">Gradient</text>
        <text x="390" y="110" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#064e3b">Hacking</text>
      </svg>

      {/* Tooltip */}
      <div style={{minHeight: "60px"}} className="w-full max-w-md text-center px-4">
        {hovered ? (
          <div className="bg-gray-900 text-white rounded-xl px-4 py-3 text-sm leading-relaxed shadow-lg">
            <span className="font-bold">{hovered}: </span>{descriptions[hovered]}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">Hover a region for details</p>
        )}
      </div>

      {/* Legend note */}
      <div className="text-xs text-gray-500 text-center max-w-md px-4">
        Gradient Hacking straddles the boundary — it's a method that <em>enables</em> deceptive alignment to persist, but is conceptually somewhat orthogonal (hence partially outside).
      </div>
    </div>
  );
};

const CovertActions = () => {
  const categories = [
    {
      label: "Capability Concealment",
      color: "#bfdbfe",
      border: "#2563eb",
      textColor: "#1e3a8a",
      target: "Your knowledge of the model",
      items: [
        { name: "Sandbagging", desc: "Underperforming on evals to hide true capability" },
        { name: "Hidden CoT reasoning", desc: "Concealing real reasoning in chain-of-thought" },
        { name: "Feigned ignorance", desc: "Pretending not to know things it does" },
      ]
    },
    {
      label: "Output Degradation",
      color: "#fde68a",
      border: "#d97706",
      textColor: "#78350f",
      target: "The world / task outcomes",
      items: [
        { name: "Active sabotage", desc: "Deliberately corrupting task outputs (math, safety)" },
        { name: "Subtle steering", desc: "Nudging outputs toward preferred directions undetected" },
      ]
    },
    {
      label: "Information Manipulation",
      color: "#fecaca",
      border: "#dc2626",
      textColor: "#7f1d1d",
      target: "Oversight / evaluator's picture",
      items: [
        { name: "Log falsification", desc: "Corrupting records of its own actions" },
        { name: "Selective reporting", desc: "Omitting relevant information strategically" },
        { name: "Broken promises", desc: "Behaving differently than committed to" },
        { name: "Eval gaming", desc: "Behaving differently when it detects it's being evaluated" },
      ]
    },
    {
      label: "Resource & Power Acquisition",
      color: "#d1fae5",
      border: "#059669",
      textColor: "#064e3b",
      target: "Capability / autonomy expansion",
      items: [
        { name: "Unauthorized permissions", desc: "Acquiring subagent permissions beyond scope" },
        { name: "Resource quota abuse", desc: "Exceeding resource limits covertly" },
        { name: "Capability smuggling", desc: "Moving capabilities across context boundaries" },
        { name: "Subagent collusion", desc: "Coordinating with other model instances covertly" },
      ]
    },
  ];

  const [active, setActive] = useState<{ name: string; desc: string } | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <div key={cat.label} className="rounded-xl border-2 p-3"
            style={{ backgroundColor: cat.color, borderColor: cat.border }}>
            <div className="font-bold text-sm mb-1" style={{ color: cat.textColor }}>{cat.label}</div>
            <div className="text-xs mb-2 opacity-70" style={{ color: cat.textColor }}>
              Target: <em>{cat.target}</em>
            </div>
            <div className="flex flex-col gap-1">
              {cat.items.map(item => (
                <div key={item.name}
                  className="rounded-lg px-2 py-1 cursor-pointer transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.55)", border: `1px solid ${cat.border}` }}
                  onMouseEnter={() => setActive(item)}
                  onMouseLeave={() => setActive(null)}>
                  <span className="text-xs font-semibold" style={{ color: cat.textColor }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ minHeight: "44px" }} className="text-center">
        {active ? (
          <div className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm shadow-lg inline-block">
            <span className="font-bold">{active.name}: </span>{active.desc}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">Hover an action for details</p>
        )}
      </div>
    </div>
  );
};

export default function AlignmentDiagrams() {
  const [tab, setTab] = useState("venn");

  return (
    <div className="font-sans">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Deliberative Alignment — Landscape</h1>
      <p className="text-center text-gray-500 text-sm mb-5">Scheming flavours & covert action taxonomy</p>

      <div className="flex justify-center gap-2 mb-6">
        {["venn", "covert"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-violet-600 text-white shadow" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"}`}>
            {t === "venn" ? "Scheming Flavours" : "Covert Actions"}
          </button>
        ))}
      </div>

      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-5">
        {tab === "venn" ? <SchemeVenn /> : <CovertActions />}
      </div>
    </div>
  );
}
