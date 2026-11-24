import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/inter/index.css";
import "./styles/site.css";

import { initTheme } from "./theme";
import { initNav } from "./nav";
import { initTabs } from "./tabs";
import { initVenn } from "./venn";
import { initWalkthrough } from "./walkthrough";
import { initContactForm } from "./form";

initTheme();
initNav();

const heroVenn = document.getElementById("hero-venn") as SVGSVGElement | null;
const caption = document.getElementById("venn-caption");
const chips = document.getElementById("venn-chips");
if (heroVenn && caption) {
  initVenn({ svg: heroVenn, caption, chips: chips || undefined });
}

initWalkthrough();

for (const id of ["agents-tabs", "audience-tabs"]) {
  const c = document.getElementById(id);
  if (c) initTabs(c);
}

initContactForm();
