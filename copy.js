document.addEventListener("click", async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const btn = target?.closest("button[data-copy]");
  const value = btn?.dataset.copy;
  if (!btn || !value) return;
  try {
    await navigator.clipboard.writeText(value);
    const prior = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => {
      btn.textContent = prior;
    }, 1400);
  } catch {
    btn.textContent = "Copy failed";
  }
});
