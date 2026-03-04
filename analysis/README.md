# Analysis

Standalone scripts for running graph experiments and generating plots. Results are written to `results/` (gitignored).

## Scripts

**`test_cases.js`** — runs G(n,p) and SBM simulations across all parameter combinations and writes CSVs to `results/`.

```bash
node analysis/test_cases.js
```

**`plot_results.py`** — reads the CSVs and produces four PNG charts in `results/`.

```bash
py analysis/plot_results.py
```

## Results

| File | Description |
|------|-------------|
| `results/test_cases_results.csv` | G(n,p) simulation data (n, p, edges, components, path length, diameter, FC%) |
| `results/test_cases_sbm_results.csv` | SBM simulation data (k, clusterStrength, same metrics) |
| `results/graph1_largest_component.png` | Largest component size vs p |
| `results/graph2_avg_path.png` | Average path length vs p (small-world effect) |
| `results/graph3_diameter.png` | Graph diameter vs p |
| `results/graph4_sbm.png` | SBM: effect of k and clusterStrength on path length and diameter |
