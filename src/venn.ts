import { gsap } from "gsap";

export type Region =
  | "ip" | "market" | "biz"
  | "ip-market" | "ip-biz" | "market-biz" | "all";

const SVG_NS = "http://www.w3.org/2000/svg";

/** Circle ids used inside the shared defs (hero + walkthrough share geometry). */
export const VENN_SIZE = 480;
export type VennDomain = "ip" | "market" | "biz";
export const VENN: Record<VennDomain,
    { id: string; cx: number; cy: number; r: number }> = {
  ip: { id: "vc-ip", cx: 240, cy: 160, r: 118 },
  market: { id: "vc-mkt", cx: 155, cy: 310, r: 118 },
  biz: { id: "vc-biz", cx: 325, cy: 310, r: 118 },
};

export const REGIONS: { id: Region; label: string; caption: string;
                        path: ("ip" | "market" | "biz")[] }[] = [
  { id: "ip", label: "IP intelligence",
    caption: "Patent signals: filings, claims, citations and portfolio data.",
    path: ["ip"] },
  { id: "market", label: "Market intelligence",
    caption: "Market signals: news, filings, publications and recalls.",
    path: ["market"] },
  { id: "biz", label: "Business intelligence",
    caption: "The company's strategic business priorities and topics.",
    path: ["biz"] },
  { id: "ip-market", label: "IP × Market",
    caption: "Technology momentum: patent activity meets market movement.",
    path: ["ip", "market"] },
  { id: "ip-biz", label: "IP × Business",
    caption: "Patent position measured against strategic priorities.",
    path: ["ip", "biz"] },
  { id: "market-biz", label: "Market × Business",
    caption: "Market shifts checked against strategic priorities.",
    path: ["market", "biz"] },
  { id: "all", label: "All three",
    caption: "The strategic recommendation: IP, market and business read together.",
    path: ["ip", "market", "biz"] },
];

const REGION_FILL: Record<Region, string> = {
  "ip": "var(--ip)",
  "market": "var(--market)",
  "biz": "var(--biz)",
  "ip-market": "var(--blend-ip-market)",
  "ip-biz": "var(--blend-ip-biz)",
  "market-biz": "var(--blend-market-biz)",
  "all": "var(--blend-all)",
};

function el(name: string, attrs: Record<string, string>): SVGElement {
  const e = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

/** Build the <defs> (circles, clipPaths, masks) shared by hero + walkthrough. */
export function vennDefs(): SVGDefsElement {
  const defs = el("defs", {}) as SVGDefsElement;
  for (const c of Object.values(VENN)) {
    defs.appendChild(el("circle", {
      id: c.id, cx: String(c.cx), cy: String(c.cy), r: String(c.r),
      class: "venn-circle",
    }));
  }
  for (const [k, c] of Object.entries(VENN)) {
    const clip = el("clipPath", { id: `clip-${k}` });
    clip.appendChild(el("use", { href: `#${c.id}` }));
    defs.appendChild(clip);
  }
  // mask: area inside circle `inc` but outside each circle in `exc`
  const mask = (id: string, inc: string, exc: string[]) => {
    const m = el("mask", { id, maskUnits: "userSpaceOnUse",
                           x: "0", y: "0",
                           width: String(VENN_SIZE), height: String(VENN_SIZE) });
    m.appendChild(el("rect", { width: String(VENN_SIZE),
                               height: String(VENN_SIZE), fill: "#000" }));
    m.appendChild(el("use", { href: `#${VENN[inc as VennDomain].id}`,
                              fill: "#fff" }));
    for (const e of exc) {
      m.appendChild(el("use", {
        href: `#${VENN[e as VennDomain].id}`, fill: "#000" }));
    }
    defs.appendChild(m);
  };
  // mask: full minus circle `exc`
  const maskNot = (id: string, exc: string) => {
    const m = el("mask", { id, maskUnits: "userSpaceOnUse",
                           x: "0", y: "0",
                           width: String(VENN_SIZE), height: String(VENN_SIZE) });
    m.appendChild(el("rect", { width: String(VENN_SIZE),
                               height: String(VENN_SIZE), fill: "#fff" }));
    m.appendChild(el("use", {
      href: `#${VENN[exc as VennDomain].id}`, fill: "#000" }));
    defs.appendChild(m);
  };
  mask("m-only-ip", "ip", ["market", "biz"]);
  mask("m-only-market", "market", ["ip", "biz"]);
  mask("m-only-biz", "biz", ["ip", "market"]);
  maskNot("m-not-biz", "biz");
  maskNot("m-not-market", "market");
  maskNot("m-not-ip", "ip");
  return defs;
}

/** Wrap content so it renders only inside the intersection of `ins`
 *  and (if `maskId`) minus the masked-out circles. */
function clipWrap(ins: string[], maskId: string | null): SVGElement {
  const inner = el("rect", {
    width: String(VENN_SIZE), height: String(VENN_SIZE),
    class: "venn-region",
  }) as SVGElement & { tabIndex: number };
  if (maskId) inner.setAttribute("mask", `url(#${maskId})`);
  let node: SVGElement = inner;
  for (let i = ins.length - 1; i >= 0; i--) {
    const g = el("g", { "clip-path": `url(#clip-${ins[i]})` });
    g.appendChild(node);
    node = g;
  }
  return node;
}

interface VennInit {
  svg: SVGSVGElement;
  caption: HTMLElement;
  chips?: HTMLElement;
}

export function initVenn({ svg, caption, chips }: VennInit) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  svg.querySelector(".venn-static")?.remove();
  svg.appendChild(vennDefs());

  const domains = el("g", { "aria-hidden": "true" });
  for (const [k, v] of Object.entries({ ip: "--ip", market: "--market", biz: "--biz" })) {
    const u = el("use", {
      href: `#${VENN[k as VennDomain].id}`,
      class: "venn-domain",
      fill: `var(${v})`,
      "fill-opacity": "var(--venn-fill-opacity)",
      stroke: `var(${v})`,
      "stroke-width": "1.5",
    });
    u.dataset.domain = k;
    domains.appendChild(u);
  }
  svg.appendChild(domains);

  const regionsG = el("g", {});
  svg.appendChild(regionsG);

  const regionEls = new Map<Region, SVGElement>();
  const spec: [Region, string[], string | null][] = [
    ["ip", ["ip"], "m-only-ip"],
    ["market", ["market"], "m-only-market"],
    ["biz", ["biz"], "m-only-biz"],
    ["ip-market", ["ip", "market"], "m-not-biz"],
    ["ip-biz", ["ip", "biz"], "m-not-market"],
    ["market-biz", ["market", "biz"], "m-not-ip"],
    ["all", ["ip", "market", "biz"], null],
  ];
  for (const [id, ins, maskId] of spec) {
    const wrapNode = clipWrap(ins, maskId);
    const rect = wrapNode.querySelector(".venn-region") as SVGElement;
    rect.setAttribute("tabindex", "0");
    rect.setAttribute("role", "button");
    rect.dataset.region = id;
    const meta = REGIONS.find((r) => r.id === id)!;
    rect.setAttribute("aria-label", `${meta.label}. ${meta.caption}`);
    rect.setAttribute("aria-pressed", "false");
    regionsG.appendChild(wrapNode);
    regionEls.set(id, rect);

    rect.addEventListener("click", () => select(id));
    rect.addEventListener("keydown", (ev) => {
      const e = ev as KeyboardEvent;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(id);
      }
    });
  }

  // static domain labels
  const labels = el("g", { "aria-hidden": "true" });
  const labelAt = (x: number, y: number, text: string, anchor = "middle") => {
    const t = el("text", { x: String(x), y: String(y),
                           class: "venn-domain-label", "text-anchor": anchor });
    t.textContent = text;
    labels.appendChild(t);
  };
  labelAt(240, 62, "IP");
  labelAt(72, 420, "Market");
  labelAt(408, 420, "Business");
  svg.appendChild(labels);

  // chips
  const chipEls = new Map<Region, HTMLButtonElement>();
  if (chips) {
    for (const meta of REGIONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.region = meta.id;
      b.textContent = meta.label;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => select(meta.id));
      chips.appendChild(b);
      chipEls.set(meta.id, b);
    }
  }

  let selected: Region | null = null;
  function select(id: Region | null) {
    selected = selected === id ? null : id;
    svg.classList.toggle("dim", selected !== null);
    for (const [rid, r] of regionEls) {
      const on = rid === selected;
      r.classList.toggle("selected", on);
      r.setAttribute("aria-pressed", String(on));
      r.setAttribute("fill", on ? REGION_FILL[rid] : "transparent");
      r.setAttribute("fill-opacity", on ? "0.55" : "0");
    }
    for (const [rid, c] of chipEls) c.setAttribute("aria-pressed", String(rid === selected));
    caption.textContent = selected
      ? `${REGIONS.find((r) => r.id === selected)!.label} — ${REGIONS.find((r) => r.id === selected)!.caption}`
      : "Select a region to see what lives there.";
    if (selected && !reduced) signalFlow(selected);
  }

  // particles: small dots travelling between the involved circle centres
  function signalFlow(id: Region) {
    const meta = REGIONS.find((r) => r.id === id)!;
    const pts = meta.path.map((k) => VENN[k as VennDomain]);
    const g = el("g", { "aria-hidden": "true", "pointer-events": "none" });
    svg.appendChild(g);
    for (let i = 0; i < 3; i++) {
      const dot = el("circle", {
        r: "4", fill: REGION_FILL[id], opacity: "0.9",
        cx: String(pts[0].cx), cy: String(pts[0].cy) });
      g.appendChild(dot);
      const tl = gsap.timeline({ delay: i * 0.22, onComplete: () => dot.remove() });
      for (let s = 1; s < pts.length; s++) {
        tl.to(dot, { attr: { cx: pts[s].cx, cy: pts[s].cy },
                     duration: 0.55, ease: "power1.inOut" }, ">");
      }
      tl.to(dot, { attr: { r: 1.5 }, opacity: 0, duration: 0.35 }, ">-0.1");
      if (pts.length === 1) {
        tl.to(dot, { attr: { r: 22 }, opacity: 0,
                     duration: 0.8, ease: "power1.out" }, 0);
      }
    }
    setTimeout(() => { if (!g.hasChildNodes()) g.remove(); }, 2600);
  }

  // gentle drift (skipped under reduced motion); animating the def
  // circles propagates to every <use> clone — visuals, clips and masks.
  if (!reduced) {
    const defCircles = ["vc-ip", "vc-mkt", "vc-biz"].map(
      (i) => svg.querySelector<SVGCircleElement>(`#${i}`)!);
    const drift2 = [
      { x: 9, y: 7, d: 7.5 }, { x: -8, y: 6, d: 9 }, { x: 7, y: -8, d: 8.2 },
    ];
    defCircles.forEach((c, i) => {
      gsap.to(c, { x: drift2[i].x, y: drift2[i].y, duration: drift2[i].d,
                   delay: i * 1.3, yoyo: true, repeat: -1,
                   ease: "sine.inOut" });
    });
  }

  return { select };
}
