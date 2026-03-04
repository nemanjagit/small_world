// test_cases.js — Standalone Node.js script for Small World graph analysis
// Run: node test_cases.js
// Outputs a table to the console and writes results to test_cases_results.csv

const fs   = require('fs');
const path = require('path');
const RESULTS_DIR = path.join(__dirname, 'results');

// ——— G(n, p) Graph Generation ———
function generateGraph(n, p) {
  const adj = Array.from({ length: n }, () => []);
  let edgeCount = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < p) {
        adj[i].push(j);
        adj[j].push(i);
        edgeCount++;
      }
    }
  }

  return { adj, edgeCount };
}

// ——— Stochastic Block Model (SBM) Graph Generation ———
// k communities, p_in = p * clusterStrength (within), p_out = p (between)
function generateSBMGraph(n, p, k, clusterStrength) {
  const adj = Array.from({ length: n }, () => []);
  let edgeCount = 0;

  // Assign communities evenly and shuffle
  const communities = Array.from({ length: n }, (_, i) => i % k);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [communities[i], communities[j]] = [communities[j], communities[i]];
  }

  const pIn  = Math.min(1, p * clusterStrength);
  const pOut = p;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const threshold = communities[i] === communities[j] ? pIn : pOut;
      if (Math.random() < threshold) {
        adj[i].push(j);
        adj[j].push(i);
        edgeCount++;
      }
    }
  }

  return { adj, edgeCount, communities };
}

// ——— Find all connected components, return array of component node lists ———
function findComponents(n, adj) {
  const visited = new Array(n).fill(false);
  const components = [];

  for (let i = 0; i < n; i++) {
    if (!visited[i]) {
      const component = [];
      const queue = [i];
      visited[i] = true;
      while (queue.length) {
        const u = queue.shift();
        component.push(u);
        for (const v of adj[u]) {
          if (!visited[v]) {
            visited[v] = true;
            queue.push(v);
          }
        }
      }
      components.push(component);
    }
  }

  return components;
}

// ——— BFS from a single source, returns distances to all reachable nodes ———
function bfsFrom(source, adj) {
  const dist = new Map();
  dist.set(source, 0);
  const queue = [source];
  while (queue.length) {
    const u = queue.shift();
    for (const v of adj[u]) {
      if (!dist.has(v)) {
        dist.set(v, dist.get(u) + 1);
        queue.push(v);
      }
    }
  }
  return dist;
}

// ——— Compute avg shortest path and diameter within a component ———
// For large components, samples up to maxSamples source nodes to keep it fast
function computePathStats(componentNodes, adj, maxSamples = 30) {
  const size = componentNodes.length;
  if (size <= 1) return { avgPath: 0, diameter: 0 };

  let sources = componentNodes;
  if (size > maxSamples) {
    const shuffled = [...componentNodes].sort(() => Math.random() - 0.5);
    sources = shuffled.slice(0, maxSamples);
  }

  let totalDist = 0;
  let totalPairs = 0;
  let diameter = 0;

  for (const src of sources) {
    const dist = bfsFrom(src, adj);
    for (const [node, d] of dist) {
      if (node !== src) {
        totalDist += d;
        totalPairs++;
        if (d > diameter) diameter = d;
      }
    }
  }

  const avgPath = totalPairs > 0 ? totalDist / totalPairs : 0;
  return { avgPath, diameter };
}

// ——— Single SBM run ———
function analyzeSBMGraph(n, p, k, clusterStrength) {
  const { adj, edgeCount } = generateSBMGraph(n, p, k, clusterStrength);
  const components = findComponents(n, adj);

  const numComponents = components.length;
  const largestComponent = components.reduce(
    (max, c) => (c.length > max.length ? c : max), []
  );
  const largestPct = (largestComponent.length / n) * 100;
  const avgDegree = (2 * edgeCount) / n;
  const { avgPath, diameter } = computePathStats(largestComponent, adj);

  return { edges: edgeCount, avgDegree, components: numComponents, largestPct, avgPath, diameter };
}

// ——— Run multiple SBM trials and average ———
function runSBMTrials(n, p, k, clusterStrength, trials = 20) {
  const totals = { edges: 0, avgDegree: 0, components: 0, largestPct: 0, avgPath: 0, diameter: 0 };
  let fullyConnectedCount = 0;

  for (let t = 0; t < trials; t++) {
    const r = analyzeSBMGraph(n, p, k, clusterStrength);
    totals.edges      += r.edges;
    totals.avgDegree  += r.avgDegree;
    totals.components += r.components;
    totals.largestPct += r.largestPct;
    totals.avgPath    += r.avgPath;
    totals.diameter   += r.diameter;
    if (r.largestPct === 100) fullyConnectedCount++;
  }

  return {
    n, p, k, clusterStrength,
    edges:             +(totals.edges      / trials).toFixed(1),
    avgDegree:         +(totals.avgDegree  / trials).toFixed(2),
    components:        +(totals.components / trials).toFixed(1),
    largestPct:        +(totals.largestPct / trials).toFixed(1),
    avgPath:           +(totals.avgPath    / trials).toFixed(2),
    diameter:          +(totals.diameter   / trials).toFixed(1),
    fullyConnectedPct: +((fullyConnectedCount / trials) * 100).toFixed(1),
  };
}

// ——— Single run: generate graph and compute all metrics ———
function analyzeGraph(n, p) {
  const { adj, edgeCount } = generateGraph(n, p);
  const components = findComponents(n, adj);

  const numComponents = components.length;
  const largestComponent = components.reduce(
    (max, c) => (c.length > max.length ? c : max),
    []
  );
  const largestPct = (largestComponent.length / n) * 100;
  const avgDegree = (2 * edgeCount) / n;
  const { avgPath, diameter } = computePathStats(largestComponent, adj);

  return { edges: edgeCount, avgDegree, components: numComponents, largestPct, avgPath, diameter };
}

// ——— Run multiple trials and average the results ———
function runTrials(n, p, trials = 20) {
  const totals = { edges: 0, avgDegree: 0, components: 0, largestPct: 0, avgPath: 0, diameter: 0 };
  let fullyConnectedCount = 0;

  for (let t = 0; t < trials; t++) {
    const r = analyzeGraph(n, p);
    totals.edges      += r.edges;
    totals.avgDegree  += r.avgDegree;
    totals.components += r.components;
    totals.largestPct += r.largestPct;
    totals.avgPath    += r.avgPath;
    totals.diameter   += r.diameter;
    if (r.largestPct === 100) fullyConnectedCount++;
  }

  return {
    n, p,
    edges:              +(totals.edges      / trials).toFixed(1),
    avgDegree:          +(totals.avgDegree  / trials).toFixed(2),
    components:         +(totals.components / trials).toFixed(1),
    largestPct:         +(totals.largestPct / trials).toFixed(1),
    avgPath:            +(totals.avgPath    / trials).toFixed(2),
    diameter:           +(totals.diameter   / trials).toFixed(1),
    fullyConnectedPct:  +((fullyConnectedCount / trials) * 100).toFixed(1),
  };
}

// ——— Main ———
function main() {
  const nValues = [10, 20, 50, 100];
  const pValues = [0.00, 0.01, 0.02, 0.05, 0.10, 0.15, 0.20, 0.30, 0.35, 0.40, 0.45, 0.50];
  const TRIALS  = 100;

  console.log('\nSmall World Graph Analysis');
  console.log('==========================');
  console.log(`Trials per combination: ${TRIALS}\n`);

  console.log('Theoretical thresholds:');
  console.log('  Giant component emerges at p ≈ 1/n');
  console.log('  Full connectivity likely at p ≈ ln(n)/n\n');

  for (const n of nValues) {
    console.log(`  n=${n}: 1/n=${(1/n).toFixed(3)}, ln(n)/n=${(Math.log(n)/n).toFixed(3)}`);
  }
  console.log('');

  const results = [];
  for (const n of nValues) {
    for (const p of pValues) {
      process.stdout.write(`  Running n=${n}, p=${p}...`);
      results.push(runTrials(n, p, TRIALS));
      process.stdout.write(' done\n');
    }
  }

  // Print console table
  const COL = { n: 5, p: 6, edges: 8, deg: 7, comps: 7, lc: 10, path: 8, diam: 8 };
  const hr = '-'.repeat(Object.values(COL).reduce((a, b) => a + b + 3, 0));
  const pad = (s, w) => String(s).padStart(w);

  console.log('\n' + hr);
  console.log(
    pad('n', COL.n) + ' | ' + pad('p', COL.p) + ' | ' +
    pad('edges', COL.edges) + ' | ' + pad('avgDeg', COL.deg) + ' | ' +
    pad('comps', COL.comps) + ' | ' + pad('largest%', COL.lc) + ' | ' +
    pad('avgPath', COL.path) + ' | ' + pad('diameter', COL.diam)
  );
  console.log(hr);

  let lastN = null;
  for (const r of results) {
    if (lastN !== null && r.n !== lastN) console.log(hr);
    lastN = r.n;
    console.log(
      pad(r.n,                COL.n)  + ' | ' +
      pad(r.p.toFixed(2),     COL.p)  + ' | ' +
      pad(r.edges,            COL.edges) + ' | ' +
      pad(r.avgDegree,        COL.deg) + ' | ' +
      pad(r.components,       COL.comps) + ' | ' +
      pad(r.largestPct.toFixed(1) + '%', COL.lc) + ' | ' +
      pad(r.avgPath  > 0 ? r.avgPath.toFixed(2)  : '—', COL.path) + ' | ' +
      pad(r.diameter > 0 ? r.diameter.toFixed(1) : '—', COL.diam)
    );
  }
  console.log(hr + '\n');

  // Write CSV
  const csvHeader = 'n,p,edges,avgDegree,components,largestPct,avgPath,diameter,fullyConnectedPct';
  const csvRows = results.map(r =>
    [r.n, r.p, r.edges, r.avgDegree, r.components, r.largestPct, r.avgPath, r.diameter, r.fullyConnectedPct].join(',')
  );
  fs.writeFileSync(path.join(RESULTS_DIR, 'test_cases_results.csv'), [csvHeader, ...csvRows].join('\n'));
  console.log('Results saved to results/test_cases_results.csv\n');

  // ——— SBM Experiments ———
  // Fixed: n=50, p=0.10. Vary k (communities) and clusterStrength (multiplier).
  const SBM_N  = 50;
  const SBM_P  = 0.10;
  const kValues             = [1, 2, 3, 5, 10];
  const clusterStrengths    = [1, 2, 5, 10];

  console.log(`SBM Analysis (n=${SBM_N}, p=${SBM_P})`);
  console.log('========================================');
  console.log('  k=1 / strength=1 is equivalent to plain G(n,p)\n');

  const sbmResults = [];
  for (const k of kValues) {
    for (const cs of clusterStrengths) {
      if (k === 1 && cs > 1) continue; // k=1 means no communities — strength irrelevant
      process.stdout.write(`  k=${k}, strength=${cs}...`);
      sbmResults.push(runSBMTrials(SBM_N, SBM_P, k, cs, TRIALS));
      process.stdout.write(' done\n');
    }
  }

  const COL2 = { k: 4, cs: 8, edges: 8, deg: 7, comps: 7, lc: 10, path: 8, diam: 8 };
  const hr2 = '-'.repeat(Object.values(COL2).reduce((a, b) => a + b + 3, 0));

  console.log('\n' + hr2);
  console.log(
    pad('k', COL2.k) + ' | ' + pad('strength', COL2.cs) + ' | ' +
    pad('edges', COL2.edges) + ' | ' + pad('avgDeg', COL2.deg) + ' | ' +
    pad('comps', COL2.comps) + ' | ' + pad('largest%', COL2.lc) + ' | ' +
    pad('avgPath', COL2.path) + ' | ' + pad('diameter', COL2.diam)
  );
  console.log(hr2);

  let lastK = null;
  for (const r of sbmResults) {
    if (lastK !== null && r.k !== lastK) console.log(hr2);
    lastK = r.k;
    console.log(
      pad(r.k,              COL2.k)  + ' | ' +
      pad(r.clusterStrength, COL2.cs) + ' | ' +
      pad(r.edges,           COL2.edges) + ' | ' +
      pad(r.avgDegree,       COL2.deg) + ' | ' +
      pad(r.components,      COL2.comps) + ' | ' +
      pad(r.largestPct.toFixed(1) + '%', COL2.lc) + ' | ' +
      pad(r.avgPath  > 0 ? r.avgPath.toFixed(2)  : '—', COL2.path) + ' | ' +
      pad(r.diameter > 0 ? r.diameter.toFixed(1) : '—', COL2.diam)
    );
  }
  console.log(hr2 + '\n');

  const sbmCsvHeader = 'n,p,k,clusterStrength,edges,avgDegree,components,largestPct,avgPath,diameter,fullyConnectedPct';
  const sbmCsvRows = sbmResults.map(r =>
    [r.n, r.p, r.k, r.clusterStrength, r.edges, r.avgDegree, r.components, r.largestPct, r.avgPath, r.diameter, r.fullyConnectedPct].join(',')
  );
  fs.writeFileSync(path.join(RESULTS_DIR, 'test_cases_sbm_results.csv'), [sbmCsvHeader, ...sbmCsvRows].join('\n'));
  console.log('SBM results saved to results/test_cases_sbm_results.csv\n');
}

main();
