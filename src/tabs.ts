/** WAI-ARIA tabs pattern: arrow keys move between tabs, selection follows
 *  focus, tabbed panel swaps. */
export function initTabs(container: HTMLElement) {
  const tabs = Array.from(
    container.querySelectorAll<HTMLElement>('[role="tab"]'));
  const panels = tabs.map(
    (t) => document.getElementById(t.getAttribute("aria-controls")!)!);

  function activate(i: number, focus = true) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (focus) tabs[i].focus();
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => activate(i, false));
    t.addEventListener("keydown", (e) => {
      let next: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        activate(next);
      }
    });
  });

  const start = tabs.findIndex(
    (t) => t.getAttribute("aria-selected") === "true");
  activate(start >= 0 ? start : 0, false);
}
