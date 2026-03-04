// ——— Slider display listeners ———
nSlider.addEventListener('input', () => nVal.textContent = nSlider.value);
pSlider.addEventListener('input', () => pVal.textContent = (pSlider.value / 100).toFixed(2));
kSlider.addEventListener('input', () => kVal.textContent = kSlider.value);
clusterSlider.addEventListener('input', () => clusterVal.textContent = clusterSlider.value + '×');
clusterToggle.addEventListener('change', () => {
  clusterControls.classList.toggle('hidden', !clusterToggle.checked);
});

// ——— View helpers ———
function resetView() {
  viewX = 0; viewY = 0; viewScale = 1;
}

function resize() {
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
  if (nodes.length) draw();
}

function worldToCanvas(wx, wy) {
  return [(wx - viewX) / viewScale, (wy - viewY) / viewScale];
}

// ——— Canvas interaction ———
canvas.addEventListener('mousedown', e => {
  const [wx, wy] = worldToCanvas(e.offsetX, e.offsetY);
  const nr = Math.max(6, Math.min(15, 250 / Math.sqrt(nodes.length)));
  for (let i = nodes.length - 1; i >= 0; i--) {
    const dx = nodes[i].x - wx, dy = nodes[i].y - wy;
    if (Math.sqrt(dx*dx + dy*dy) < nr * 1.5) {
      if (i === bfsSource) resetBFS();
      else startBFS(i);
      return;
    }
  }
  dragging = true;
  dragStart = [e.offsetX, e.offsetY];
  viewStart = [viewX, viewY];
});

canvas.addEventListener('mousemove', e => {
  if (!dragging) return;
  viewX = viewStart[0] + e.offsetX - dragStart[0];
  viewY = viewStart[1] + e.offsetY - dragStart[1];
  draw();
});

canvas.addEventListener('mouseup', () => dragging = false);
canvas.addEventListener('mouseleave', () => dragging = false);

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const mx = e.offsetX, my = e.offsetY;
  viewX = mx - (mx - viewX) * factor;
  viewY = my - (my - viewY) * factor;
  viewScale *= factor;
  draw();
}, { passive: false });

// ——— Button listeners ———
genBtn.addEventListener('click', generateGraph);
stepBtn.addEventListener('click', stepBFS);
resetBfsBtn.addEventListener('click', () => { resetBFS(); draw(); });

// ——— Init ———
window.addEventListener('resize', resize);
resize();
generateGraph();
