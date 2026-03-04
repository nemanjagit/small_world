// ——— Community color ———
function communityColor(ci, k) {
  const hue = (ci / k) * 360;
  return `hsl(${hue}, 65%, 62%)`;
}

// ——— Graph generation ———
async function generateGraph() {
  const n = parseInt(nSlider.value);
  const p = parseInt(pSlider.value) / 100;
  const numPairs = n * (n - 1) / 2;

  genBtn.disabled = true;
  loadingEl.classList.remove('hidden');
  resetBFS();

  let randoms = null;
  if (rngToggle.checked) {
    try {
      randoms = await fetchRandomOrg(numPairs);
      rngSrc.textContent = 'random.org';
    } catch(e) {
      rngSrc.textContent = 'Math.random() (fallback)';
    }
  } else {
    rngSrc.textContent = 'Math.random()';
  }
  loadingEl.classList.add('hidden');

  nodes = [];
  edges = [];
  adj = Array.from({length: n}, () => []);

  const clustered = clusterToggle.checked;
  const k = clustered ? parseInt(kSlider.value) : 1;
  const clusterStrength = clustered ? parseInt(clusterSlider.value) : 1;
  const pOut = p;
  const pIn = Math.min(1, p * clusterStrength);

  // Assign communities (evenly distributed, then shuffled)
  communities = Array.from({length: n}, (_, i) => i % k);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [communities[i], communities[j]] = [communities[j], communities[i]];
  }

  // Node positions
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const layout = layoutSelect.value;

  for (let i = 0; i < n; i++) {
    let x, y;
    if (layout === 'circle') {
      const r = Math.min(W, H) * 0.38;
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      x = cx + r * Math.cos(angle);
      y = cy + r * Math.sin(angle);
    } else if (k > 1) {
      // Seed positions clustered by community for better force layout convergence
      const clusterR = Math.min(W, H) * 0.44;
      const spreadR = Math.min(W, H) * 0.07;
      const cAngle = (2 * Math.PI * communities[i]) / k - Math.PI / 2;
      const ccx = cx + clusterR * Math.cos(cAngle);
      const ccy = cy + clusterR * Math.sin(cAngle);
      const r2 = Math.random() * spreadR;
      const a2 = Math.random() * 2 * Math.PI;
      x = ccx + r2 * Math.cos(a2);
      y = ccy + r2 * Math.sin(a2);
    } else {
      x = 80 + Math.random() * (W - 160);
      y = 80 + Math.random() * (H - 160);
    }
    nodes.push({ id: i, x, y, vx: 0, vy: 0 });
  }

  // Edge generation (Stochastic Block Model)
  let ri = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const rand = randoms ? randoms[ri++] / 1000000 : Math.random();
      const threshold = communities[i] === communities[j] ? pIn : pOut;
      if (rand < threshold) {
        edges.push([i, j]);
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  if (layout === 'force') {
    runForceLayout(300);
  }

  updateStats();
  resetView();
  draw();
  genBtn.disabled = false;
}

// ——— Force-directed layout (Fruchterman-Reingold) ———
function runForceLayout(iters) {
  const n = nodes.length;
  const W = canvas.width, H = canvas.height;

  // Hoist constants — these don't change between iterations
  const k = Math.sqrt((W * H) / n) * 1.1;          // ideal spacing
  const nodeRadius = Math.max(6, Math.min(15, 250 / Math.sqrt(n)));
  const minD = nodeRadius * 0.5;                    // repulsion floor — prevents f=k²/≈0 explosions

  for (let iter = 0; iter < iters; iter++) {
    for (const node of nodes) { node.vx = 0; node.vy = 0; }

    // Node-node repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d = Math.max(Math.sqrt(dx*dx + dy*dy), minD);
        const f = (k * k) / d;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        nodes[i].vx -= fx; nodes[i].vy -= fy;
        nodes[j].vx += fx; nodes[j].vy += fy;
      }
    }

    // Edge attraction
    for (const [a, b] of edges) {
      const dx = nodes[b].x - nodes[a].x;
      const dy = nodes[b].y - nodes[a].y;
      const d = Math.max(Math.sqrt(dx*dx + dy*dy), minD);
      const f = (d * d) / k * 0.5;
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      nodes[a].vx += fx; nodes[a].vy += fy;
      nodes[b].vx -= fx; nodes[b].vy -= fy;
    }

    // Community centroid pull + inter-cluster repulsion
    const kComm = parseInt(kSlider.value);
    if (kComm > 1) {
      const strength = parseInt(clusterSlider.value);
      const pull = 0.04 + 0.008 * (strength - 1);
      const centroids = Array.from({length: kComm}, () => ({x: 0, y: 0, count: 0}));
      for (let i = 0; i < n; i++) {
        centroids[communities[i]].x += nodes[i].x;
        centroids[communities[i]].y += nodes[i].y;
        centroids[communities[i]].count++;
      }
      for (const c of centroids) { if (c.count > 0) { c.x /= c.count; c.y /= c.count; } }

      for (let i = 0; i < n; i++) {
        const c = centroids[communities[i]];
        nodes[i].vx += (c.x - nodes[i].x) * pull;
        nodes[i].vy += (c.y - nodes[i].y) * pull;
      }

      const clusterRep = k * k * 1.5;
      for (let ci = 0; ci < kComm; ci++) {
        for (let cj = ci + 1; cj < kComm; cj++) {
          const dx = centroids[cj].x - centroids[ci].x;
          const dy = centroids[cj].y - centroids[ci].y;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const f = clusterRep / (d * d);
          const fx = (dx / d) * f, fy = (dy / d) * f;
          for (let i = 0; i < n; i++) {
            if (communities[i] === ci) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
            if (communities[i] === cj) { nodes[i].vx += fx; nodes[i].vy += fy; }
          }
        }
      }
    }

    const temp = Math.max(0.8, W / 10 * (1 - iter / iters));
    for (const node of nodes) {
      const mag = Math.sqrt(node.vx*node.vx + node.vy*node.vy);
      if (mag > 0) {
        node.x += (node.vx / mag) * Math.min(mag, temp);
        node.y += (node.vy / mag) * Math.min(mag, temp);
      }
      node.x = Math.max(40, Math.min(W - 40, node.x));
      node.y = Math.max(40, Math.min(H - 40, node.y));
    }
  }

  // Resolve remaining overlaps — repeat until clean or 50 passes reached
  const minSep = nodeRadius * 2 + 2;
  const minSep2 = minSep * minSep;
  for (let pass = 0, dirty = true; pass < 50 && dirty; pass++) {
    dirty = false;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d2 = dx*dx + dy*dy;
        if (d2 > 0 && d2 < minSep2) {
          dirty = true;
          const d = Math.sqrt(d2);
          const push = (minSep - d) * 0.5;
          nodes[i].x -= (dx / d) * push; nodes[i].y -= (dy / d) * push;
          nodes[j].x += (dx / d) * push; nodes[j].y += (dy / d) * push;
        }
      }
    }
    for (const node of nodes) {
      node.x = Math.max(40, Math.min(W - 40, node.x));
      node.y = Math.max(40, Math.min(H - 40, node.y));
    }
  }
}

// ——— Graph stats ———
function updateStats() {
  const n = nodes.length;
  const e = edges.length;
  stN.textContent = n;
  stE.textContent = e;
  stDeg.textContent = n > 0 ? (2 * e / n).toFixed(2) : '—';

  // Connected components via BFS
  const visited = new Array(n).fill(false);
  let comps = 0, maxComp = 0;
  for (let i = 0; i < n; i++) {
    if (!visited[i]) {
      comps++;
      let size = 0;
      const q = [i];
      visited[i] = true;
      while (q.length) {
        const u = q.shift();
        size++;
        for (const v of adj[u]) {
          if (!visited[v]) { visited[v] = true; q.push(v); }
        }
      }
      maxComp = Math.max(maxComp, size);
    }
  }
  stComp.textContent = comps;
  stGc.textContent = n > 0 ? `${maxComp} (${(maxComp/n*100).toFixed(0)}%)` : '—';
}
