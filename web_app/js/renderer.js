// ——— Animation ———
function animateNewNodes() {
  animProgress = 0;
  if (animFrame) cancelAnimationFrame(animFrame);
  function step() {
    animProgress = Math.min(1, animProgress + 0.06);
    draw();
    if (animProgress < 1) animFrame = requestAnimationFrame(step);
  }
  animFrame = requestAnimationFrame(step);
}

// ——— Canvas draw ———
function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(viewX, viewY);
  ctx.scale(viewScale, viewScale);

  // Edges — drawn from node boundary to node boundary, not center to center
  const nr = Math.max(6, Math.min(15, 250 / Math.sqrt(nodes.length)));
  for (const [a, b] of edges) {
    const na = nodes[a], nb = nodes[b];
    const dx = nb.x - na.x, dy = nb.y - na.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d <= nr * 2) continue; // nodes overlapping — skip edge
    const ux = dx / d, uy = dy / d;

    const aVisited = bfsVisited.has(a);
    const bVisited = bfsVisited.has(b);
    const highlight = aVisited && bVisited;
    const isFrontierEdge = (bfsFrontier.has(a) || bfsFrontier.has(b)) && highlight;

    ctx.beginPath();
    ctx.moveTo(na.x + ux * nr, na.y + uy * nr);
    ctx.lineTo(nb.x - ux * nr, nb.y - uy * nr);
    ctx.strokeStyle = isFrontierEdge
      ? 'rgba(125,249,192,0.35)'
      : highlight
        ? 'rgba(125,184,249,0.2)'
        : 'rgba(58,58,94,0.5)';
    ctx.lineWidth = isFrontierEdge ? 1.5 / viewScale : 1 / viewScale;
    ctx.stroke();
  }

  // Nodes
  const k = clusterToggle.checked ? parseInt(kSlider.value) : 1;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    let color, glow = false, scale = 1;

    if (bfsSource === null) {
      color = k > 1 ? communityColor(communities[i], k) : '#3a3a5e';
    } else if (i === bfsSource) {
      color = '#f9c87d'; glow = true;
    } else if (bfsFrontier.has(i)) {
      const t = animNodes.includes(i) ? animProgress : 1;
      color = `rgba(125,249,192,${t})`; glow = t > 0.5; scale = 0.8 + 0.4 * t;
    } else if (bfsVisited.has(i)) {
      color = '#7db8f9';
    } else {
      color = '#2a2a3e';
    }

    if (glow) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, nr * 2.5 * scale, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nr * 2.5 * scale);
      grad.addColorStop(0, i === bfsSource ? 'rgba(249,200,125,0.25)' : 'rgba(125,249,192,0.25)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, nr * scale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = bfsSource !== null && (i === bfsSource || bfsFrontier.has(i) || bfsVisited.has(i))
      ? 'transparent'
      : 'rgba(58,58,94,0.8)';
    ctx.lineWidth = 1 / viewScale;
    ctx.stroke();

    // Label
    if (nodes.length <= 40 || nr > 8) {
      const lightBg = i === bfsSource || bfsFrontier.has(i) || bfsVisited.has(i) || (bfsSource === null && k > 1);
      ctx.fillStyle = lightBg ? 'rgba(0,0,0,0.82)' : 'rgba(210,210,240,0.92)';
      ctx.font = `500 ${Math.max(8, nr * 0.9) / viewScale}px DM Mono`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i, n.x, n.y);
    }
  }

  ctx.restore();
}
