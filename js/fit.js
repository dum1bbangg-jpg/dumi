(() => {
  const html = document.documentElement;
  if (!html.classList.contains('fit')) return;
  function fitCanvas() {
    const width = html.clientWidth;
    const scale = Math.min(1, Math.max(0, width / 940));
    html.style.setProperty('--fit-scale', scale);
    html.style.setProperty('--fit-height', (1400 * scale) + 'px');
    html.style.setProperty('--fit-left', Math.max(0, (width - 940 * scale) / 2) + 'px');
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  new ResizeObserver(fitCanvas).observe(html);
})();
