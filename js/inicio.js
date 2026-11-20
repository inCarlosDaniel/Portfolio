/* Roda antes da primeira pintura: aplica as preferências salvas e decide se a introdução aparece. */
(function () {
  var d = document.documentElement, p = {};
  try { history.scrollRestoration = "manual"; } catch (e) {}
  // preferências de acessibilidade salvas
  try { p = JSON.parse(localStorage.getItem("cd-portfolio-prefs-v1") || "{}"); } catch (e) {}
  if (p.contrast === "high") d.classList.add("a11y-contrast");
  if (p.motion === "reduce") d.classList.add("a11y-reduce-motion");
  if (p.reduceEffects) d.classList.add("a11y-reduce-effects");
  if (p.strongFocus) d.classList.add("a11y-focus");
  if (p.bigTargets) d.classList.add("a11y-targets");
  if (p.textScale && p.textScale !== 100) { d.classList.add("a11y-zoomed"); d.style.setProperty("--a11y-zoom", p.textScale / 100); }
  if (p.lang && p.lang !== "pt-PT") { d.lang = p.lang; if (p.lang === "ar") d.dir = "rtl"; }
  var h = location.hash.slice(1);
  if (/[?&]projeto=/.test(location.search) || (h && h !== "inicio") || p.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  d.classList.add("is-intro");
  setTimeout(function () { d.classList.remove("is-intro"); }, 20000); // trava de segurança
})();
