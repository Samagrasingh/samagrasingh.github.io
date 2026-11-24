import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VENN, VENN_SIZE, vennDefs, type Region, type VennDomain } from "./venn";

gsap.registerPlugin(ScrollTrigger);

const SVG_NS = "http://www.w3.org/2000/svg";
const el = (n: string, a: Record<string, string>) => {
  const e = document.createElementNS(SVG_NS, n);
  for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
  return e;
};

const REGION_ORDER: { id: Region; ins: string[]; mask: string | null;
                      fill: string }[] = [
  { id: "ip", ins: ["ip"], mask: "m-only-ip", fill: "var(--ip)" },
  { id: "market", ins: ["market"], mask: "m-only-market", fill: "var(--market)" },
  { id: "biz", ins: ["biz"], mask: "m-only-biz", fill: "var(--biz)" },
  { id: "ip-market", ins: ["ip", "market"], mask: "m-not-biz",
    fill: "var(--blend-ip-market)" },
  { id: "ip-biz", ins: ["ip", "biz"], mask: "m-not-market",
    fill: "var(--blend-ip-biz)" },
  { id: "market-biz", ins: ["market", "biz"], mask: "m-not-ip",
    fill: "var(--blend-market-biz)" },
  { id: "all", ins: ["ip", "market", "biz"], mask: null,
    fill: "var(--blend-all)" },
];

export function initWalkthrough() {
  const svg = document.getElementById("walk-venn") as SVGSVGElement | null;
  const steps = Array.from(
    document.querySelectorAll<HTMLElement>("#walk-steps .walk-step"));
  if (!svg || !steps.length) return;

  const reduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  svg.appendChild(vennDefs());

  // domain outlines always visible
  const domains = document.createElementNS(SVG_NS, "g");
  for (const [k, v] of Object.entries({ ip: "--ip", market: "--market",
                                        biz: "--biz" })) {
    const u = el("use", {
      href: `#${VENN[k as VennDomain].id}`,
      fill: `var(${v})`,
      "fill-opacity": reduced ? "var(--venn-fill-opacity)" : "0.1",
      stroke: `var(${v})`, "stroke-width": "1.5",
      class: "venn-domain",
    });
    domains.appendChild(u);
  }
  svg.appendChild(domains);

  // one clipped region per stage
  const stages = new Map<Region, SVGElement>();
  for (const s of REGION_ORDER) {
    const rect = el("rect", {
      width: String(VENN_SIZE), height: String(VENN_SIZE),
      fill: s.fill, "fill-opacity": "0.5",
    });
    if (s.mask) rect.setAttribute("mask", `url(#${s.mask})`);
    let node: SVGElement = rect;
    for (let i = s.ins.length - 1; i >= 0; i--) {
      const g = el("g", { "clip-path": `url(#clip-${s.ins[i]})` });
      g.appendChild(node);
      node = g;
    }
    const stage = el("g", { class: "stage" });
    stage.appendChild(node);
    svg.appendChild(stage);
    stages.set(s.id, stage);
  }

  const setActive = (i: number) => {
    steps.forEach((st, j) => st.classList.toggle("active", i === j));
    const region = steps[i].dataset.region as Region;
    stages.forEach((stage, id) => stage.classList.toggle("on", id === region));
  };

  if (reduced) {
    // show everything statically
    stages.forEach((s) => s.classList.add("on"));
    steps.forEach((st) => st.classList.add("active"));
    return;
  }

  steps.forEach((st, i) => {
    ScrollTrigger.create({
      trigger: st,
      start: "top 62%",
      end: "bottom 62%",
      onEnter: () => setActive(i),
      onEnterBack: () => setActive(i),
    });
  });
  setActive(0);
}
