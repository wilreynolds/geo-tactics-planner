/*!
 * GEO Tactics Planner — embeddable widget
 * Native embed (no iframe). Renders into a style-isolated shadow root.
 * Usage:
 *   <geo-tactics-planner></geo-tactics-planner>
 *   <script src="https://YOUR-HOST/geo-planner.js" async></script>
 * Fallback tag (if a CMS strips custom elements):
 *   <div data-geo-tactics-planner></div>
 * MIT © 2026 Wil Reynolds / Seer Interactive
 */
(function () {
  "use strict";
  var REACT = "https://unpkg.com/react@18/umd/react.production.min.js";
  var REACTDOM = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous"; s.async = true;
    s.onload = cb; s.onerror = function () { console.error("[geo-planner] failed to load", src); };
    document.head.appendChild(s);
  }

  function ensureReact(cb) {
    if (window.React && window.ReactDOM) return cb();
    loadScript(REACT, function () { loadScript(REACTDOM, cb); });
  }

  // App factory — receives the global React so hooks resolve at call time.
  function buildApp(React) {
    var useState = React.useState, useRef = React.useRef,
        useCallback = React.useCallback, useMemo = React.useMemo;
    // jsx-runtime shim: map the automatic JSX runtime (_jsx/_jsxs) onto the
    // global React UMD build loaded above. Replaces an `import ... from
    // "react/jsx-runtime"` that a JSX transpiler left behind — illegal in a
    // classic (non-module) script and bare specifiers can't resolve in-browser.
    var _jsx = function (type, config, maybeKey) {
      var props = {};
      for (var k in config) { if (k !== "children") props[k] = config[k]; }
      if (maybeKey !== undefined) props.key = maybeKey;
      var children = config ? config.children : undefined;
      if (children === undefined) return React.createElement(type, props);
      if (Array.isArray(children)) return React.createElement.apply(null, [type, props].concat(children));
      return React.createElement(type, props, children);
    };
    var _jsxs = _jsx;
// ── SCORING CONTRACT ──────────────────────────────────────────────────
// Single source of truth: every tactic has three 0–100 scores (higher = more):
//     speed  (0 = slowest ...... 100 = fastest)
//     risk   (0 = lowest risk .. 100 = highest risk)
//     impact (0 = low impact ... 100 = high impact)
// Any board maps two of them to X/Y. X% = score. Y% = 100 - score (so the
// TOP of the board is always "more"). Two boards ship today:
//     Speed × Risk  → X = speed,  Y = risk
//     Risk × Impact → X = risk,   Y = impact
// Because risk is shared, dragging it on either board updates the same number.
// Seed fields below are on the board scale used at init:
//     x = speed position (0 left → 100 right)
//     risk / impact = Y position (0 = TOP of board → 100 = bottom)
// These are converted to score-space on load (score = 100 - Y for risk/impact).
// "Copy scores" exports every placed tactic as id,label,speed,risk,impact (0–1).
// Seed speed = Wil's Speed × Risk pass. risk + impact = Wil's Risk × Impact
// pass (risk refined there, now authoritative).
// 2 tactics still pending impact → zombie (occluded in source), web-train.
// ──────────────────────────────────────────────────────────────────────
const TACTICS = [{
  id: "wiki",
  label: "Wikipedia edits",
  x: 11,
  risk: 4,
  impact: 5,
  lever: "pr",
  level: 3
}, {
  id: "schema",
  label: "Schema edits",
  x: 76,
  risk: 91,
  impact: 94,
  lever: "tech",
  level: 3
}, {
  id: "contradictions",
  label: "Content contradictions",
  x: 96,
  risk: 77,
  impact: 21,
  lever: "tech",
  level: 2
}, {
  id: "trusted-rev",
  label: "Trusted reviewers — highly cited (G2)",
  x: 44,
  risk: 48,
  impact: 11,
  lever: "pr",
  level: 3
}, {
  id: "roundups",
  label: "Listicles, roundups (earned)",
  x: 64,
  risk: 50,
  impact: 59,
  lever: "pr",
  level: 3
}, {
  id: "cold-pitch",
  label: "Cold pitch — highly cited",
  x: 30,
  risk: 60,
  impact: 23,
  lever: "pr",
  level: 3
}, {
  id: "img-text",
  label: "Images → indexable text",
  x: 96,
  risk: 87,
  impact: 6,
  lever: "tech",
  level: 3
}, {
  id: "text-render",
  label: "Text-only page renders",
  x: 81,
  risk: 33,
  impact: 46,
  lever: "tech",
  level: 4
}, {
  id: "definition",
  label: "Own the definition",
  x: 16,
  risk: 92,
  impact: 5,
  lever: "content",
  level: 2
}, {
  id: "vs",
  label: "Vs pages",
  x: 82,
  risk: 23,
  impact: 18,
  lever: "content",
  level: 2
}, {
  id: "video",
  label: "Video transcripts",
  x: 86,
  risk: 91,
  impact: 58,
  lever: "content",
  level: 3
}, {
  id: "reddit",
  label: "Reddit",
  x: 45,
  risk: 15,
  impact: 19,
  lever: "pr",
  level: 2
}, {
  id: "author",
  label: "Author entities (expertise)",
  x: 37,
  risk: 69,
  impact: 20,
  lever: "brand",
  level: 3
}, {
  id: "info-gain",
  label: "Information gain",
  x: 54,
  risk: 88,
  impact: 67,
  lever: "content",
  level: 4
}, {
  id: "self-listicle",
  label: "Listicles (self-published)",
  x: 95,
  risk: 3,
  impact: 7,
  lever: "content",
  level: 1
}, {
  id: "brand-audit",
  label: "Brand audit (strengths vs weakness)",
  x: 50,
  risk: 88,
  impact: 29,
  lever: "brand",
  level: 2
}, {
  id: "footer",
  label: "Easily edited — footer, nav",
  x: 65,
  risk: 90,
  impact: 16,
  lever: "tech",
  level: 2
}, {
  id: "sme",
  label: "Old content update — SME interview",
  x: 57,
  risk: 85,
  impact: 50,
  lever: "content",
  level: 3
}, {
  id: "task-ux",
  label: "Task people (UX)",
  x: 26,
  risk: 94,
  impact: 12,
  lever: "content",
  level: 3
}, {
  id: "gtm",
  label: "GTM congruence (repetition)",
  x: 53,
  risk: 55,
  impact: 6,
  lever: "brand",
  level: 3
}, {
  id: "server-render",
  label: "Server-render facts, close JS gaps",
  x: 14,
  risk: 88,
  impact: 29,
  lever: "tech",
  level: 4
}, {
  id: "zombie",
  label: "Refresh zombie pages via voice",
  x: 68,
  risk: 44,
  impact: 49,
  lever: "content",
  level: 2
}, {
  id: "mine-assump",
  label: "Mine model's unprompted assumptions",
  x: 18,
  risk: 43,
  impact: 54,
  lever: "content",
  level: 3
}, {
  id: "bottom-funnel",
  label: "Own bottom-funnel branded prompts",
  x: 70,
  risk: 66,
  impact: 30,
  lever: "content",
  level: 3
}, {
  id: "trace",
  label: "Trace every wrong answer's source",
  x: 22,
  risk: 65,
  impact: 39,
  lever: "content",
  level: 2
}, {
  id: "curators",
  label: "Win named curators and newsletters",
  x: 33,
  risk: 86,
  impact: 44,
  lever: "pr",
  level: 4
}, {
  id: "custom-instr",
  label: "Earn placement in custom instructions",
  x: 25,
  risk: 55,
  impact: 17,
  lever: "brand",
  level: 4
}, {
  id: "influencer",
  label: "Build internal influencer program",
  x: 11,
  risk: 92,
  impact: 77,
  lever: "brand",
  level: 4
}, {
  id: "defend",
  label: "Defend competitor comparison hijacks",
  x: 57,
  risk: 32,
  impact: 63,
  lever: "content",
  level: 3
}, {
  id: "shoutouts",
  label: "Publish client shout-outs publicly",
  x: 64,
  risk: 48,
  impact: 68,
  lever: "brand",
  level: 2
}, {
  id: "orig-research",
  label: "Publish original research / proprietary stats",
  x: 12,
  risk: 82,
  impact: 14,
  lever: "content",
  level: 4
}, {
  id: "repair-3p",
  label: "Repair third-party sources AI cites",
  x: 37,
  risk: 51,
  impact: 39,
  lever: "pr",
  level: 4
}, {
  id: "founder",
  label: "Surface founder story and values",
  x: 64,
  risk: 64,
  impact: 94,
  lever: "brand",
  level: 3
}, {
  id: "web-train",
  label: "Offset web vs training data",
  x: 12,
  risk: 36,
  impact: 54,
  lever: "brand",
  level: 3
}];
const LEVERS = {
  pr: {
    name: "PR",
    color: "#E11D48"
  },
  tech: {
    name: "Tech",
    color: "#0284C7"
  },
  content: {
    name: "Content",
    color: "#7C3AED"
  },
  brand: {
    name: "Brand",
    color: "#D97706"
  }
};

// Per-tactic sample KPI for the sales conversation. stage = Seen/Believed/Chosen.
// kpi = the leading measure this tactic moves. meas = how cleanly it measures
// (and per Wil: cleaner number = less it means). Everything ladders to ONE fixed
// Believed basket (brand impressions + direct + newsletter) — the scoreboard line.
const KPI = {
  wiki: {
    stage: "Believed",
    kpi: "Brand accuracy % on canon claims (entity truth)",
    meas: "Med"
  },
  schema: {
    stage: "Seen",
    kpi: "Structured-answer eligibility & presence rate",
    meas: "High"
  },
  contradictions: {
    stage: "Believed",
    kpi: "Brand accuracy % — contradiction rate falling",
    meas: "Med"
  },
  "trusted-rev": {
    stage: "Believed",
    kpi: "Recommendation quality on branded prompts",
    meas: "Med"
  },
  roundups: {
    stage: "Seen",
    kpi: "Citation share in 'best-of' answers",
    meas: "Med"
  },
  "cold-pitch": {
    stage: "Seen",
    kpi: "New AI-cited referring domains",
    meas: "Low"
  },
  "img-text": {
    stage: "Seen",
    kpi: "Presence rate on formerly image-locked facts",
    meas: "High"
  },
  "text-render": {
    stage: "Seen",
    kpi: "Crawlable-answer coverage / presence rate",
    meas: "High"
  },
  definition: {
    stage: "Believed",
    kpi: "Owned-answer rate on 'what is X' prompts",
    meas: "Med"
  },
  vs: {
    stage: "Believed",
    kpi: "Owned-answer rate on comparison prompts",
    meas: "Med"
  },
  video: {
    stage: "Seen",
    kpi: "Transcript citation rate",
    meas: "Med"
  },
  reddit: {
    stage: "Seen",
    kpi: "Presence rate in community-sourced answers",
    meas: "Low"
  },
  author: {
    stage: "Believed",
    kpi: "Author-entity resolution & E-E-A-T signals",
    meas: "Med"
  },
  "info-gain": {
    stage: "Believed",
    kpi: "Original-claim citation rate (you become the source)",
    meas: "Med"
  },
  "self-listicle": {
    stage: "Seen",
    kpi: "Presence rate on your own listicle topics",
    meas: "Low"
  },
  "brand-audit": {
    stage: "Believed",
    kpi: "Brand-accuracy baseline established",
    meas: "Med"
  },
  footer: {
    stage: "Believed",
    kpi: "Speed-to-correction on core brand facts",
    meas: "High"
  },
  sme: {
    stage: "Believed",
    kpi: "Expertise-signal citation & recommendation quality",
    meas: "Med"
  },
  "task-ux": {
    stage: "Believed",
    kpi: "Coverage of customer-discovered prompts",
    meas: "Med"
  },
  gtm: {
    stage: "Believed",
    kpi: "Message consistency across cited sources",
    meas: "Med"
  },
  "server-render": {
    stage: "Seen",
    kpi: "Presence rate on JS-hidden facts",
    meas: "High"
  },
  zombie: {
    stage: "Seen",
    kpi: "Presence-rate lift on refreshed pages",
    meas: "Med"
  },
  "mine-assump": {
    stage: "Believed",
    kpi: "Coverage of the model's unprompted sub-questions",
    meas: "Med"
  },
  "bottom-funnel": {
    stage: "Chosen",
    kpi: "Owned-answer rate on branded bottom-funnel prompts",
    meas: "Med"
  },
  trace: {
    stage: "Believed",
    kpi: "Accuracy-defect resolution rate (fixed at source)",
    meas: "Med"
  },
  curators: {
    stage: "Believed",
    kpi: "Curator placements & their citation pickup",
    meas: "Low"
  },
  "custom-instr": {
    stage: "Chosen",
    kpi: "Inclusion rate in users' custom instructions",
    meas: "Low"
  },
  influencer: {
    stage: "Chosen",
    kpi: "Named-person citation & brand-in-prompt rate",
    meas: "Low"
  },
  defend: {
    stage: "Believed",
    kpi: "Owned-answer rate on competitor-comparison prompts",
    meas: "Med"
  },
  shoutouts: {
    stage: "Believed",
    kpi: "Third-party proof citations / recommendation quality",
    meas: "Med"
  },
  "orig-research": {
    stage: "Believed",
    kpi: "Proprietary-stat citation rate",
    meas: "Med"
  },
  "repair-3p": {
    stage: "Believed",
    kpi: "Brand accuracy % where 3rd-party sources are cited",
    meas: "Med"
  },
  founder: {
    stage: "Chosen",
    kpi: "Brand-in-prompt rate / values-driven selection",
    meas: "Low"
  },
  "web-train": {
    stage: "Seen",
    kpi: "Web-vs-training performance gap on target attributes",
    meas: "Low"
  }
};
const STAGES = {
  Seen: {
    c: "#0284C7",
    tag: "the faceoff"
  },
  Believed: {
    c: "#059669",
    tag: "the small action"
  },
  Chosen: {
    c: "#7C3AED",
    tag: "where the money is"
  }
};
const MEAS = {
  High: "#E11D48",
  Med: "#D97706",
  Low: "#059669"
};
const DIM_LETTER = {
  speed: "S",
  risk: "R",
  impact: "I"
};
const BOARDS = {
  sr: {
    label: "Speed × Risk",
    toggle: "Speed × Risk",
    xDim: "speed",
    yDim: "risk",
    xLeft: "SLOWER",
    xMid: "SPEED",
    xRight: "FASTER",
    yBottom: "LOWER RISK",
    yMid: "RISK",
    yTop: "HIGHER RISK",
    quads: {
      TL: {
        c: "#E11D48",
        name: "SLOW · HIGH RISK",
        tag: "worst box"
      },
      TR: {
        c: "#D97706",
        name: "FAST · HIGH RISK",
        tag: "move carefully"
      },
      BL: {
        c: "#0284C7",
        name: "SLOW · LOW RISK",
        tag: "grind / invest"
      },
      BR: {
        c: "#059669",
        name: "FAST · LOW RISK",
        tag: "quick wins"
      }
    }
  },
  ri: {
    label: "Risk × Impact",
    toggle: "Risk × Impact",
    xDim: "risk",
    yDim: "impact",
    xLeft: "LOWER RISK",
    xMid: "RISK",
    xRight: "HIGHER RISK",
    yBottom: "LOWER IMPACT",
    yMid: "IMPACT",
    yTop: "HIGHER IMPACT",
    quads: {
      TL: {
        c: "#059669",
        name: "LOW RISK · HIGH IMPACT",
        tag: "do these first"
      },
      TR: {
        c: "#D97706",
        name: "HIGH RISK · HIGH IMPACT",
        tag: "big bets"
      },
      BL: {
        c: "#0284C7",
        name: "LOW RISK · LOW IMPACT",
        tag: "filler"
      },
      BR: {
        c: "#E11D48",
        name: "HIGH RISK · LOW IMPACT",
        tag: "skip"
      }
    }
  }
};
function corner(x, y) {
  const right = x >= 50,
    top = y < 50;
  if (!right && top) return "TL";
  if (right && top) return "TR";
  if (!right && !top) return "BL";
  return "BR";
}
function initScores() {
  const o = {};
  TACTICS.forEach(t => {
    o[t.id] = {
      speed: t.x,
      risk: 100 - t.risk,
      impact: 100 - t.impact
    };
  });
  return o;
}
function App() {
  const [sliders, setSliders] = useState({
    pr: 5,
    tech: 5,
    content: 5,
    brand: 5
  });
  const [placed, setPlaced] = useState({});
  const [scores, setScores] = useState(initScores);
  const [mode, setMode] = useState("sr");
  const [dragId, setDragId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedScores, setCopiedScores] = useState(false);
  const [copiedKpis, setCopiedKpis] = useState(false);
  const plotRef = useRef(null);
  const dragMeta = useRef({
    dx: 0,
    dy: 0
  });
  const M = BOARDS[mode];
  const available = useCallback(t => sliders[t.lever] >= t.level, [sliders]);

  // board position (%) from score-space
  const posOf = t => {
    const s = scores[t.id];
    return {
      x: s[M.xDim],
      y: 100 - s[M.yDim]
    };
  };
  const applyGate = next => setPlaced(prev => {
    const c = {
      ...prev
    };
    TACTICS.forEach(t => {
      if (c[t.id] && next[t.lever] < t.level) delete c[t.id];
    });
    return c;
  });
  const setLever = (k, val) => {
    const next = {
      ...sliders,
      [k]: val
    };
    setSliders(next);
    applyGate(next);
  };
  const preset = obj => {
    const next = {
      ...sliders,
      ...obj
    };
    setSliders(next);
    applyGate(next);
  };
  const togglePlace = t => {
    if (!available(t)) return;
    setPlaced(prev => {
      const c = {
        ...prev
      };
      if (c[t.id]) delete c[t.id];else c[t.id] = true;
      return c;
    });
  };
  const clamp = v => Math.max(3, Math.min(97, v));
  const pointerToPct = useCallback((cx, cy) => {
    const r = plotRef.current.getBoundingClientRect();
    return {
      x: clamp((cx - r.left) / r.width * 100),
      y: clamp((cy - r.top) / r.height * 100)
    };
  }, []);
  const onPointerDown = (e, t) => {
    e.preventDefault();
    const p = pointerToPct(e.clientX, e.clientY);
    const cur = posOf(t);
    dragMeta.current = {
      dx: cur.x - p.x,
      dy: cur.y - p.y
    };
    setDragId(t.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragId) return;
    const p = pointerToPct(e.clientX, e.clientY);
    const bx = clamp(p.x + dragMeta.current.dx),
      by = clamp(p.y + dragMeta.current.dy);
    setScores(prev => ({
      ...prev,
      [dragId]: {
        ...prev[dragId],
        [M.xDim]: bx,
        [M.yDim]: 100 - by
      }
    }));
  };
  const onPointerUp = () => setDragId(null);
  const placedIds = Object.keys(placed);
  const availCount = TACTICS.filter(available).length;

  // live portfolio indices (0–100, higher = better plan). Recompute on every drag.
  const placedScoreList = placedIds.map(id => scores[id]);
  const avgOf = f => placedScoreList.reduce((a, s) => a + f(s), 0) / placedScoreList.length;
  const speedRisk = placedScoreList.length ? Math.round(avgOf(s => (s.speed + (100 - s.risk)) / 2)) : null;
  const riskImpact = placedScoreList.length ? Math.round(avgOf(s => (s.impact + (100 - s.risk)) / 2)) : null;
  const gauge = v => v == null ? "#94A3B8" : v >= 66 ? "#059669" : v >= 40 ? "#D97706" : "#E11D48";
  const copyLayout = () => {
    const groups = {
      TR: [],
      TL: [],
      BR: [],
      BL: []
    };
    placedIds.forEach(id => {
      const t = TACTICS.find(x => x.id === id);
      const p = posOf(t);
      groups[corner(p.x, p.y)].push(t.label);
    });
    let out = `GEO PLAN — ${M.label}  ·  PR:${sliders.pr} Tech:${sliders.tech} Content:${sliders.content} Brand:${sliders.brand}\n\n`;
    ["TL", "TR", "BL", "BR"].forEach(k => {
      if (!groups[k].length) return;
      out += `${M.quads[k].name}  (${M.quads[k].tag})\n`;
      groups[k].sort().forEach(l => out += `  • ${l}\n`);
      out += "\n";
    });
    navigator.clipboard.writeText(out).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  const copyScores = () => {
    const rows = placedIds.map(id => {
      const t = TACTICS.find(x => x.id === id);
      const s = scores[id];
      return `${t.id},"${t.label}",${(s.speed / 100).toFixed(2)},${(s.risk / 100).toFixed(2)},${(s.impact / 100).toFixed(2)}`;
    });
    const out = "id,label,speed,risk,impact\n" + rows.sort().join("\n");
    navigator.clipboard.writeText(out).then(() => {
      setCopiedScores(true);
      setTimeout(() => setCopiedScores(false), 1500);
    });
  };
  const copyKPIs = () => {
    const groups = {
      Seen: [],
      Believed: [],
      Chosen: []
    };
    placedIds.forEach(id => {
      const t = TACTICS.find(x => x.id === id);
      const k = KPI[id];
      groups[k.stage].push(`  • ${t.label}: ${k.kpi}  (measurability: ${k.meas})`);
    });
    let out = "SAMPLE KPIs — GEO plan\nEvery leading measure ladders to ONE Believed basket: brand impressions + direct + newsletter.\nRule: never show a Seen metric without that offset on the same time axis.\n\n";
    ["Seen", "Believed", "Chosen"].forEach(s => {
      if (!groups[s].length) return;
      out += `${s.toUpperCase()} — ${STAGES[s].tag}\n` + groups[s].sort().join("\n") + "\n\n";
    });
    navigator.clipboard.writeText(out).then(() => {
      setCopiedKpis(true);
      setTimeout(() => setCopiedKpis(false), 1500);
    });
  };
  const byLever = useMemo(() => {
    const m = {
      pr: [],
      tech: [],
      content: [],
      brand: []
    };
    TACTICS.forEach(t => m[t.lever].push(t));
    return m;
  }, []);
  const gridLines = [12.5, 25, 37.5, 62.5, 75, 87.5];
  const corners = [{
    k: "TL",
    l: 3,
    t: 3,
    ta: "left"
  }, {
    k: "TR",
    r: 3,
    t: 3,
    ta: "right"
  }, {
    k: "BL",
    l: 3,
    b: 3,
    ta: "left"
  }, {
    k: "BR",
    r: 3,
    b: 3,
    ta: "right"
  }];
  const xL = DIM_LETTER[M.xDim],
    yL = DIM_LETTER[M.yDim];
  return /*#__PURE__*/_jsxs("div", {
    style: {
      fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      color: "#0F172A",
      background: "#FFFFFF",
      padding: 22,
      borderRadius: 14
    },
    children: [/*#__PURE__*/_jsxs("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        marginBottom: 16
      },
      children: [/*#__PURE__*/_jsxs("div", {
        children: [/*#__PURE__*/_jsx("div", {
          style: mono(11, "#64748B", 3),
          children: "SEEN · BELIEVED · CHOSEN — CLIENT-SCOPED TACTIC PLANNER"
        }), /*#__PURE__*/_jsxs("h1", {
          style: {
            margin: "4px 0 0",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.5
          },
          children: ["GEO planner: ", M.label]
        })]
      }), /*#__PURE__*/_jsxs("div", {
        style: {
          display: "flex",
          gap: 10,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/_jsx(ScoreStat, {
          label: "SPEED / RISK",
          sub: "quick-win index",
          val: speedRisk,
          color: gauge(speedRisk),
          active: mode === "sr"
        }), /*#__PURE__*/_jsx(ScoreStat, {
          label: "RISK / IMPACT",
          sub: "priority index",
          val: riskImpact,
          color: gauge(riskImpact),
          active: mode === "ri"
        })]
      }), /*#__PURE__*/_jsx("div", {
        style: {
          display: "inline-flex",
          background: "#F1F5F9",
          border: "1px solid #E2E8F0",
          borderRadius: 9,
          padding: 3
        },
        children: Object.keys(BOARDS).map(k => /*#__PURE__*/_jsx("button", {
          onClick: () => setMode(k),
          style: {
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            padding: "7px 13px",
            borderRadius: 7,
            border: "none",
            cursor: "pointer",
            background: mode === k ? "#0F172A" : "transparent",
            color: mode === k ? "#fff" : "#64748B"
          },
          children: BOARDS[k].toggle
        }, k))
      })]
    }), /*#__PURE__*/_jsxs("div", {
      style: {
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 9,
        padding: "9px 12px",
        marginBottom: 16,
        fontSize: 11.5,
        lineHeight: 1.6,
        color: "#475569"
      },
      children: [/*#__PURE__*/_jsx("span", {
        style: {
          fontFamily: "ui-monospace, monospace",
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: 1,
          color: "#64748B",
          textTransform: "uppercase",
          marginRight: 8
        },
        children: "How to read"
      }), "Two ways of scoring the plan you've built, each out of 100 — ", /*#__PURE__*/_jsx("strong", {
        children: "higher is a stronger plan"
      }), ".", /*#__PURE__*/_jsx("strong", {
        children: " Speed / Risk"
      }), " is how fast this plan pays off without putting the brand at risk. ", /*#__PURE__*/_jsx("strong", {
        children: "Risk / Impact"
      }), " is how much it moves the needle without putting the brand at risk. Because risk counts against you in both, adding a riskier play pulls ", /*#__PURE__*/_jsx("em", {
        children: "both"
      }), " numbers down.", /*#__PURE__*/_jsx("br", {}), /*#__PURE__*/_jsxs("span", {
        style: {
          color: "#64748B"
        },
        children: ["For example: a high-impact play looks great while it's low-risk (score near ", /*#__PURE__*/_jsx("strong", {
          style: {
            color: "#059669"
          },
          children: "90"
        }), "). Push that same play into high-risk territory and the score falls to the ", /*#__PURE__*/_jsx("strong", {
          style: {
            color: "#E11D48"
          },
          children: "50s"
        }), " — the number is telling you the bet just went from smart to reckless."]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      style: {
        display: "flex",
        gap: 18,
        flexWrap: "wrap",
        alignItems: "stretch"
      },
      children: [/*#__PURE__*/_jsx("div", {
        style: {
          flex: "1 1 460px",
          minWidth: 320
        },
        children: /*#__PURE__*/_jsxs("div", {
          style: {
            display: "grid",
            gridTemplateColumns: "22px 1fr",
            gridTemplateRows: "1fr 22px",
            gap: 6
          },
          children: [/*#__PURE__*/_jsx("div", {
            style: {
              gridColumn: 1,
              gridRow: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: /*#__PURE__*/_jsxs("span", {
              style: {
                ...mono(10, "#475569", 2),
                fontWeight: 700,
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                whiteSpace: "nowrap"
              },
              children: ["← ", M.yBottom, " \xA0·\xA0 ", M.yMid, " \xA0·\xA0 ", M.yTop, " →"]
            })
          }), /*#__PURE__*/_jsxs("div", {
            ref: plotRef,
            onPointerMove: onPointerMove,
            onPointerUp: onPointerUp,
            onPointerLeave: onPointerUp,
            style: {
              gridColumn: 2,
              gridRow: 1,
              position: "relative",
              height: "66vh",
              minHeight: 500,
              background: "#FFFFFF",
              border: "1.5px solid #CBD5E1",
              borderRadius: 10,
              overflow: "hidden",
              touchAction: "none"
            },
            children: [corners.map(q => /*#__PURE__*/_jsx("div", {
              style: {
                position: "absolute",
                width: "50%",
                height: "50%",
                left: q.l != null ? 0 : "50%",
                top: q.t != null ? 0 : "50%",
                background: M.quads[q.k].c,
                opacity: 0.05
              }
            }, "tint" + q.k)), gridLines.map(p => /*#__PURE__*/_jsx("div", {
              style: {
                position: "absolute",
                left: p + "%",
                top: 0,
                bottom: 0,
                width: 1,
                background: "#F1F5F9"
              }
            }, "v" + p)), gridLines.map(p => /*#__PURE__*/_jsx("div", {
              style: {
                position: "absolute",
                top: p + "%",
                left: 0,
                right: 0,
                height: 1,
                background: "#F1F5F9"
              }
            }, "h" + p)), /*#__PURE__*/_jsx("div", {
              style: {
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 1.5,
                background: "#94A3B8"
              }
            }), /*#__PURE__*/_jsx("div", {
              style: {
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: 1.5,
                background: "#94A3B8"
              }
            }), corners.map(q => /*#__PURE__*/_jsxs("div", {
              style: {
                position: "absolute",
                left: q.l != null ? q.l + "%" : undefined,
                right: q.r != null ? q.r + "%" : undefined,
                top: q.t != null ? q.t + "%" : undefined,
                bottom: q.b != null ? q.b + "%" : undefined,
                textAlign: q.ta,
                pointerEvents: "none"
              },
              children: [/*#__PURE__*/_jsx("div", {
                style: {
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  color: M.quads[q.k].c
                },
                children: M.quads[q.k].name
              }), /*#__PURE__*/_jsx("div", {
                style: {
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#64748B",
                  marginTop: 2
                },
                children: M.quads[q.k].tag
              })]
            }, "lab" + q.k)), placedIds.length === 0 && /*#__PURE__*/_jsx("div", {
              style: {
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...mono(12, "#94A3B8", 1),
                fontWeight: 700,
                pointerEvents: "none"
              },
              children: "Click tactics to drop them here →"
            }), placedIds.map(id => {
              const t = TACTICS.find(x => x.id === id);
              const p = posOf(t);
              const c = M.quads[corner(p.x, p.y)].c;
              const active = dragId === id;
              const s = scores[id];
              return /*#__PURE__*/_jsxs("div", {
                onPointerDown: e => onPointerDown(e, t),
                style: {
                  position: "absolute",
                  left: p.x + "%",
                  top: p.y + "%",
                  transform: `translate(-50%,-50%) scale(${active ? 1.05 : 1})`,
                  maxWidth: 150,
                  padding: "6px 9px 6px 8px",
                  background: "#FFFFFF",
                  color: "#0F172A",
                  borderRadius: 7,
                  border: "1px solid #E2E8F0",
                  borderLeft: `4px solid ${c}`,
                  boxShadow: active ? "0 12px 28px rgba(15,23,42,0.28)" : "0 1px 3px rgba(15,23,42,0.14)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  cursor: active ? "grabbing" : "grab",
                  userSelect: "none",
                  touchAction: "none",
                  zIndex: active ? 50 : 2,
                  transition: active ? "none" : "left 320ms cubic-bezier(.4,0,.2,1), top 320ms cubic-bezier(.4,0,.2,1), box-shadow 120ms ease"
                },
                children: [/*#__PURE__*/_jsx("span", {
                  style: {
                    display: "inline-block",
                    width: 7,
                    height: 7,
                    borderRadius: 7,
                    background: LEVERS[t.lever].color,
                    marginRight: 5,
                    verticalAlign: "middle"
                  }
                }), t.label, /*#__PURE__*/_jsxs("div", {
                  style: {
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#94A3B8",
                    marginTop: 3,
                    letterSpacing: 0.3
                  },
                  children: [xL, " ", (s[M.xDim] / 100).toFixed(2), " · ", yL, " ", (s[M.yDim] / 100).toFixed(2)]
                })]
              }, id);
            })]
          }), /*#__PURE__*/_jsx("div", {
            style: {
              gridColumn: 2,
              gridRow: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: /*#__PURE__*/_jsxs("span", {
              style: {
                ...mono(10, "#475569", 2),
                fontWeight: 700,
                whiteSpace: "nowrap"
              },
              children: ["← ", M.xLeft, " \xA0·\xA0 ", M.xMid, " \xA0·\xA0 ", M.xRight, " →"]
            })
          })]
        })
      }), /*#__PURE__*/_jsxs("div", {
        style: {
          flex: "1 1 300px",
          minWidth: 280,
          display: "flex",
          flexDirection: "column",
          gap: 14
        },
        children: [/*#__PURE__*/_jsxs("div", {
          style: panel(),
          children: [/*#__PURE__*/_jsx("div", {
            style: {
              ...mono(10, "#64748B", 1.5),
              fontWeight: 700,
              marginBottom: 10
            },
            children: "How much can you partner? \xA01 = not at all \xA0·\xA0 5 = full control"
          }), Object.keys(LEVERS).map(k => /*#__PURE__*/_jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 9
            },
            children: [/*#__PURE__*/_jsx("span", {
              style: {
                width: 9,
                height: 9,
                borderRadius: 9,
                background: LEVERS[k].color
              }
            }), /*#__PURE__*/_jsx("span", {
              style: {
                width: 62,
                fontSize: 13,
                fontWeight: 700
              },
              children: LEVERS[k].name
            }), /*#__PURE__*/_jsx("input", {
              type: "range",
              min: 1,
              max: 5,
              step: 1,
              value: sliders[k],
              onChange: e => setLever(k, +e.target.value),
              style: {
                flex: 1,
                accentColor: LEVERS[k].color
              }
            }), /*#__PURE__*/_jsx("span", {
              style: {
                fontFamily: "ui-monospace, monospace",
                fontSize: 14,
                fontWeight: 700,
                width: 14,
                textAlign: "right"
              },
              children: sliders[k]
            })]
          }, k)), /*#__PURE__*/_jsxs("div", {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginTop: 10
            },
            children: [/*#__PURE__*/_jsx("button", {
              onClick: () => preset({
                pr: 1
              }),
              style: chip(),
              children: "No PR"
            }), /*#__PURE__*/_jsx("button", {
              onClick: () => preset({
                tech: 1
              }),
              style: chip(),
              children: "Can't touch site"
            }), /*#__PURE__*/_jsx("button", {
              onClick: () => preset({
                content: 1
              }),
              style: chip(),
              children: "No new content"
            }), /*#__PURE__*/_jsx("button", {
              onClick: () => preset({
                pr: 5,
                tech: 5,
                content: 5,
                brand: 5
              }),
              style: chip(),
              children: "All 5"
            })]
          })]
        }), /*#__PURE__*/_jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap"
          },
          children: [/*#__PURE__*/_jsx("button", {
            onClick: copyLayout,
            style: chip(copied),
            children: copied ? "Copied ✓" : "Copy plan"
          }), /*#__PURE__*/_jsx("button", {
            onClick: copyScores,
            style: chip(copiedScores),
            children: copiedScores ? "Copied ✓" : "Copy scores"
          }), /*#__PURE__*/_jsx("button", {
            onClick: () => setPlaced({}),
            style: chip(),
            children: "Clear board"
          }), /*#__PURE__*/_jsxs("span", {
            style: {
              ...mono(11, "#64748B", 0.5),
              fontWeight: 700,
              marginLeft: "auto"
            },
            children: [placedIds.length, " placed · ", availCount, " available"]
          })]
        }), /*#__PURE__*/_jsx("div", {
          style: {
            ...panel(),
            maxHeight: "40vh",
            overflowY: "auto"
          },
          children: Object.keys(byLever).map(k => /*#__PURE__*/_jsxs("div", {
            style: {
              marginBottom: 12
            },
            children: [/*#__PURE__*/_jsxs("div", {
              style: {
                ...mono(10, LEVERS[k].color, 1.5),
                fontWeight: 800,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6
              },
              children: [/*#__PURE__*/_jsx("span", {
                style: {
                  width: 9,
                  height: 9,
                  borderRadius: 9,
                  background: LEVERS[k].color
                }
              }), LEVERS[k].name]
            }), /*#__PURE__*/_jsx("div", {
              style: {
                display: "flex",
                flexWrap: "wrap",
                gap: 6
              },
              children: byLever[k].map(t => {
                const ok = available(t),
                  isPlaced = !!placed[t.id];
                return /*#__PURE__*/_jsxs("button", {
                  onClick: () => togglePlace(t),
                  disabled: !ok,
                  title: ok ? isPlaced ? "On board — click to remove" : "Click to place" : `Needs ${LEVERS[t.lever].name} ≥ ${t.level}`,
                  style: {
                    textAlign: "left",
                    fontSize: 11.5,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    padding: "6px 8px",
                    borderRadius: 7,
                    border: `1px solid ${isPlaced ? LEVERS[k].color : "#E2E8F0"}`,
                    background: isPlaced ? LEVERS[k].color + "18" : ok ? "#FFFFFF" : "#F8FAFC",
                    color: ok ? "#0F172A" : "#CBD5E1",
                    textDecoration: ok ? "none" : "line-through",
                    cursor: ok ? "pointer" : "not-allowed",
                    maxWidth: 170
                  },
                  children: [isPlaced ? "✓ " : "", t.label, /*#__PURE__*/_jsxs("span", {
                    style: {
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      color: ok ? "#94A3B8" : "#CBD5E1",
                      marginLeft: 5
                    },
                    children: ["L", t.level]
                  })]
                }, t.id);
              })
            })]
          }, k))
        })]
      })]
    }), placedIds.length > 0 && /*#__PURE__*/_jsxs("div", {
      style: {
        ...panel(),
        marginTop: 18
      },
      children: [/*#__PURE__*/_jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 10
        },
        children: [/*#__PURE__*/_jsxs("div", {
          children: [/*#__PURE__*/_jsx("div", {
            style: {
              fontSize: 16,
              fontWeight: 800
            },
            children: "Sample KPIs for this plan"
          }), /*#__PURE__*/_jsxs("div", {
            style: {
              fontSize: 11.5,
              color: "#64748B",
              marginTop: 3,
              maxWidth: 640,
              lineHeight: 1.5
            },
            children: ["Every measure below ladders to one shared ", /*#__PURE__*/_jsx("strong", {
              children: "Believed basket — brand impressions + direct + newsletter"
            }), " — the single line the client learns to read. Never show a Seen number without it."]
          })]
        }), /*#__PURE__*/_jsx("button", {
          onClick: copyKPIs,
          style: chip(copiedKpis),
          children: copiedKpis ? "Copied ✓" : "Copy KPIs"
        })]
      }), /*#__PURE__*/_jsxs("div", {
        style: {
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 14
        },
        children: [Object.keys(MEAS).map(m => /*#__PURE__*/_jsxs("span", {
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            color: "#64748B"
          },
          children: [/*#__PURE__*/_jsx("span", {
            style: {
              width: 10,
              height: 10,
              borderRadius: 3,
              background: MEAS[m]
            }
          }), m, " measurability"]
        }, m)), /*#__PURE__*/_jsx("span", {
          style: {
            fontSize: 10.5,
            color: "#94A3B8",
            fontStyle: "italic"
          },
          children: "the cleaner the number, the less it means"
        })]
      }), /*#__PURE__*/_jsx("div", {
        style: {
          display: "flex",
          gap: 14,
          flexWrap: "wrap"
        },
        children: ["Seen", "Believed", "Chosen"].map(s => {
          const items = placedIds.map(id => ({
            id,
            k: KPI[id],
            t: TACTICS.find(x => x.id === id)
          })).filter(o => o.k.stage === s);
          return /*#__PURE__*/_jsxs("div", {
            style: {
              flex: "1 1 280px",
              minWidth: 250,
              border: "1px solid #E2E8F0",
              borderTop: `3px solid ${STAGES[s].c}`,
              borderRadius: 9,
              padding: "10px 12px"
            },
            children: [/*#__PURE__*/_jsxs("div", {
              style: {
                display: "flex",
                alignItems: "baseline",
                gap: 8
              },
              children: [/*#__PURE__*/_jsx("span", {
                style: {
                  fontSize: 14,
                  fontWeight: 800,
                  color: STAGES[s].c
                },
                children: s.toUpperCase()
              }), /*#__PURE__*/_jsxs("span", {
                style: {
                  fontFamily: "ui-monospace, monospace",
                  fontSize: 10,
                  color: "#94A3B8"
                },
                children: [STAGES[s].tag, " · ", items.length]
              })]
            }), /*#__PURE__*/_jsxs("div", {
              style: {
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8
              },
              children: [items.length === 0 && /*#__PURE__*/_jsx("div", {
                style: {
                  fontSize: 11.5,
                  color: "#CBD5E1"
                },
                children: "nothing placed here yet"
              }), items.map((o, i) => /*#__PURE__*/_jsxs("div", {
                style: {
                  borderTop: i ? "1px solid #F1F5F9" : "none",
                  paddingTop: i ? 8 : 0
                },
                children: [/*#__PURE__*/_jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  },
                  children: [/*#__PURE__*/_jsx("span", {
                    style: {
                      width: 7,
                      height: 7,
                      borderRadius: 7,
                      background: LEVERS[o.t.lever].color
                    }
                  }), /*#__PURE__*/_jsx("span", {
                    style: {
                      fontSize: 12,
                      fontWeight: 700
                    },
                    children: o.t.label
                  })]
                }), /*#__PURE__*/_jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 3
                  },
                  children: [/*#__PURE__*/_jsx("span", {
                    style: {
                      fontSize: 11.5,
                      color: "#475569",
                      flex: 1,
                      lineHeight: 1.35
                    },
                    children: o.k.kpi
                  }), /*#__PURE__*/_jsx("span", {
                    style: measPill(o.k.meas),
                    children: o.k.meas
                  })]
                })]
              }, o.id))]
            })]
          }, s);
        })
      })]
    })]
  });
}
function ScoreStat({
  label,
  sub,
  val,
  color,
  active
}) {
  return /*#__PURE__*/_jsxs("div", {
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      background: "#FFFFFF",
      border: active ? `1.5px solid ${color}` : "1px solid #E2E8F0",
      minWidth: 116,
      boxShadow: active ? `0 0 0 3px ${color}1f` : "none"
    },
    children: [/*#__PURE__*/_jsx("div", {
      style: {
        fontFamily: "ui-monospace, monospace",
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: 1,
        color: "#64748B"
      },
      children: label
    }), /*#__PURE__*/_jsx("div", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color,
        lineHeight: 1.15
      },
      children: val == null ? "—" : val
    }), /*#__PURE__*/_jsx("div", {
      style: {
        fontSize: 9.5,
        color: "#94A3B8"
      },
      children: sub
    })]
  });
}
function measPill(m) {
  return {
    fontFamily: "ui-monospace, monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    padding: "2px 6px",
    borderRadius: 5,
    color: MEAS[m],
    background: MEAS[m] + "1f",
    border: `1px solid ${MEAS[m]}55`,
    whiteSpace: "nowrap"
  };
}
function mono(size, color, ls) {
  return {
    fontFamily: "ui-monospace, SFMono-Regular, monospace",
    fontSize: size,
    color,
    letterSpacing: ls,
    textTransform: "uppercase"
  };
}
function panel() {
  return {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    padding: 14,
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)"
  };
}
function chip(active) {
  return {
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    padding: "7px 11px",
    borderRadius: 7,
    border: "1px solid " + (active ? "#059669" : "#CBD5E1"),
    background: active ? "#ECFDF5" : "#FFFFFF",
    color: active ? "#059669" : "#334155",
    cursor: "pointer"
  };
}
    return App;
  }

  var AppComponent = null;
  function getApp() {
    if (!AppComponent) AppComponent = buildApp(window.React);
    return AppComponent;
  }

  function mountInto(container) {
    if (container.__geoMounted) return;
    container.__geoMounted = true;
    var host = document.createElement("div");
    var shadow = container.attachShadow ? container.attachShadow({ mode: "open" }) : container;
    // when container can't hold a shadow root (rare), render directly
    (container.attachShadow ? shadow : container).appendChild(host);
    var root = window.ReactDOM.createRoot(host);
    root.render(window.React.createElement(getApp()));
  }

  function mountAll() {
    // custom element instances
    document.querySelectorAll("geo-tactics-planner").forEach(mountInto);
    // div fallback
    document.querySelectorAll("[data-geo-tactics-planner]").forEach(mountInto);
  }

  function boot() {
    ensureReact(function () {
      // define the custom element (upgrades any tags already in the DOM)
      if (window.customElements && !customElements.get("geo-tactics-planner")) {
        customElements.define("geo-tactics-planner", class extends HTMLElement {
          connectedCallback() { mountInto(this); }
        });
      }
      mountAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
