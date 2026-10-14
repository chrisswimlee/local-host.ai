/* ---- story tabs + small-decisions chain ---- */

(() => {
  const tabs = Array.from(document.querySelectorAll(".story-tab"));
  if (!tabs.length) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let onHowFirstOpen = null;

  function select(tab, focus) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    }
    if (focus) tab.focus();
    if (tab.id === "tab-how" && onHowFirstOpen) {
      onHowFirstOpen();
      onHowFirstOpen = null;
    }
    if (window.localHostRipple) {
      const rect = tab.getBoundingClientRect();
      window.localHostRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (event) => {
      let next = null;
      if (event.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (event.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (event.key === "Home") next = tabs[0];
      else if (event.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      select(next, true);
    });
  });

  const chain = document.querySelector("[data-chain]");
  if (!chain) return;
  const steps = Array.from(chain.querySelectorAll(".chain-step"));
  const count = chain.querySelector("[data-chain-count]");
  const run = chain.querySelector("[data-chain-run]");
  let timer = null;

  function reset() {
    for (const s of steps) s.classList.remove("is-active", "is-done");
    count.textContent = "0";
  }

  function play() {
    clearTimeout(timer);
    reset();
    run.textContent = "Running";
    run.disabled = true;
    const pause = reduceMotion ? 0 : 520;
    let i = 0;
    const next = () => {
      if (i > 0) steps[i - 1].classList.replace("is-active", "is-done");
      count.textContent = String(i);
      if (i === steps.length) {
        run.textContent = "Run again";
        run.disabled = false;
        return;
      }
      steps[i].classList.add("is-active");
      i += 1;
      timer = setTimeout(next, pause);
    };
    next();
  }

  run.addEventListener("click", play);

  // play once the first time the How tab opens
  onHowFirstOpen = play;
})();
