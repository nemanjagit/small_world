// ——— BFS logic ———
function startBFS(nodeId) {
  resetBFS();
  bfsSource = nodeId;
  bfsFrontier.add(nodeId);
  bfsVisited.add(nodeId);
  bfsDegree = 0;
  stepBtn.disabled = false;
  resetBfsBtn.disabled = false;
  updateBfsStats();
  animNodes = [nodeId];
  animateNewNodes();
  stepInfo.innerHTML = `Source: <span>node ${nodeId}</span>. Press "Next Degree" to expand.`;
  draw();
}

function stepBFS() {
  if (bfsFrontier.size === 0) {
    stepInfo.innerHTML = `BFS complete at degree <span>${bfsDegree}</span>. All reachable nodes found.`;
    stepBtn.disabled = true;
    return;
  }
  const newFrontier = new Set();
  for (const u of bfsFrontier) {
    for (const v of adj[u]) {
      if (!bfsVisited.has(v)) {
        bfsVisited.add(v);
        newFrontier.add(v);
      }
    }
  }
  bfsDegree++;
  bfsFrontier = newFrontier;

  if (newFrontier.size === 0) {
    stepInfo.innerHTML = `Degree <span>${bfsDegree}</span>: no new nodes. Component exhausted.`;
    stepBtn.disabled = true;
  } else {
    stepInfo.innerHTML = `Degree <span>${bfsDegree}</span>: reached <span>${newFrontier.size}</span> new node${newFrontier.size > 1 ? 's' : ''}.`;
  }
  updateBfsStats();
  animNodes = [...newFrontier];
  animateNewNodes();
  draw();
}

function updateBfsStats() {
  stBfsDeg.textContent = bfsDegree;
  stReached.textContent = bfsSource !== null ? `${bfsVisited.size} / ${nodes.length}` : '—';
}

function resetBFS() {
  bfsSource = null;
  bfsVisited = new Set();
  bfsFrontier = new Set();
  bfsDegree = 0;
  stepBtn.disabled = true;
  resetBfsBtn.disabled = true;
  stepInfo.textContent = 'Click a node to start BFS traversal.';
  stBfsDeg.textContent = '—';
  stReached.textContent = '—';
}
