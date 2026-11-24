export function initTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const root = document.documentElement;
  const sync = () =>
    btn.setAttribute("aria-pressed",
      String(root.dataset.theme === "dark"));
  sync();
  btn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
    sync();
  });
}
