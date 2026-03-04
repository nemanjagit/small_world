import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

RESULTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results')

df = pd.read_csv(os.path.join(RESULTS, 'test_cases_results.csv'))
n_values = sorted(df['n'].unique())
colors = {10: '#e74c3c', 20: '#f39c12', 50: '#2ecc71', 100: '#3498db'}

# --- Graph 1: Largest component % vs p ---
fig1, ax1 = plt.subplots(figsize=(7, 5))
for n in n_values:
    data = df[df['n'] == n].sort_values('p')
    ax1.plot(data['p'], data['largestPct'], marker='o', label=f'n = {n}',
             color=colors[n], linewidth=2, markersize=5)
    ax1.axvline(1/n, color=colors[n], linestyle=':', linewidth=1, alpha=0.5)
    ax1.axvline(np.log(n)/n, color=colors[n], linestyle='--', linewidth=1, alpha=0.5)

ax1.set_xlabel('p (edge probability)', fontsize=11)
ax1.set_ylabel('Largest component (%)', fontsize=11)
ax1.set_title('Largest connected component size', fontsize=12)
ax1.set_ylim(0, 105)
ax1.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, _: f'{int(x)}%'))
ax1.plot([], [], linestyle=':', color='gray', alpha=0.7, label='threshold 1/n')
ax1.plot([], [], linestyle='--', color='gray', alpha=0.7, label='threshold ln(n)/n')
ax1.legend(fontsize=9)
ax1.grid(True, alpha=0.3)
fig1.tight_layout()
fig1.savefig(os.path.join(RESULTS, 'graph1_largest_component.png'), dpi=150, bbox_inches='tight')
print('Saved: results/graph1_largest_component.png')

# --- Graph 2: Average path length vs p ---
fig2, ax2 = plt.subplots(figsize=(7, 5))
for n in n_values:
    data = df[(df['n'] == n) & (df['avgPath'] > 0)].sort_values('p')
    ax2.plot(data['p'], data['avgPath'], marker='o', label=f'n = {n}',
             color=colors[n], linewidth=2, markersize=5)

ax2.set_xlabel('p (edge probability)', fontsize=11)
ax2.set_ylabel('Average shortest path length', fontsize=11)
ax2.set_title('Average path length (small-world effect)', fontsize=12)
ax2.legend(title='Node count', fontsize=9)
ax2.grid(True, alpha=0.3)
fig2.tight_layout()
fig2.savefig(os.path.join(RESULTS, 'graph2_avg_path.png'), dpi=150, bbox_inches='tight')
print('Saved: results/graph2_avg_path.png')

# --- Graph 3: Graph diameter vs p ---
# Triangles mark p values where <90% of trials produced a fully connected graph (diameter = inf)
INF_Y = 8
fig3, ax3 = plt.subplots(figsize=(7, 5))
for n in n_values:
    data = df[df['n'] == n].sort_values('p')
    connected    = data[data['fullyConnectedPct'] >= 90.0]
    disconnected = data[(data['fullyConnectedPct'] < 90.0) & (data['p'] > 0)]

    if not connected.empty:
        ax3.plot(connected['p'], connected['diameter'], marker='o',
                 color=colors[n], linewidth=2, markersize=5, label=f'n = {n}')
    for _, row in disconnected.iterrows():
        ax3.plot(row['p'], INF_Y, marker='^', color=colors[n], markersize=8, alpha=0.7, linestyle='none')
    if not disconnected.empty and not connected.empty:
        last_disc = disconnected.iloc[-1]
        first_conn = connected.iloc[0]
        ax3.plot([last_disc['p'], first_conn['p']], [INF_Y, first_conn['diameter']],
                 color=colors[n], linewidth=1.5, linestyle='--', alpha=0.5)

ax3.axhline(INF_Y, color='gray', linestyle=':', linewidth=1, alpha=0.5)
ax3.text(0.51, INF_Y + 0.1, '∞', fontsize=13, color='gray', va='bottom', ha='right')
ax3.plot([], [], marker='^', color='gray', linestyle='none',
         markersize=8, alpha=0.7, label='not fully\nconnected (∞)')
ax3.set_xlabel('p (edge probability)', fontsize=11)
ax3.set_ylabel('Graph diameter (hops)', fontsize=11)
ax3.set_title('Graph diameter\n(hops to traverse the entire graph)', fontsize=12)
ax3.set_ylim(0, INF_Y + 1)
ax3.legend(fontsize=9)
ax3.grid(True, alpha=0.3)
fig3.tight_layout()
fig3.savefig(os.path.join(RESULTS, 'graph3_diameter.png'), dpi=150, bbox_inches='tight')
print('Saved: results/graph3_diameter.png')

# --- Graph 4: SBM — effect of k and clusterStrength on avgPath and diameter (n=50, p=0.10) ---
sbm = pd.read_csv(os.path.join(RESULTS, 'test_cases_sbm_results.csv'))
k_values = sorted(sbm['k'].unique())
cs_values = sorted(sbm['clusterStrength'].unique())
cs_colors = {1: '#95a5a6', 2: '#3498db', 5: '#f39c12', 10: '#e74c3c'}

fig4, (ax4a, ax4b) = plt.subplots(1, 2, figsize=(13, 5))
fig4.suptitle('SBM — effect of clustering (n=50, p=0.10)', fontsize=13, fontweight='bold')

for cs in cs_values:
    data = sbm[sbm['clusterStrength'] == cs].sort_values('k')
    label = f'strength = {cs}' + (' (= G(n,p))' if cs == 1 else '')
    ax4a.plot(data['k'], data['avgPath'], marker='o', label=label,
              color=cs_colors[cs], linewidth=2, markersize=6)
    ax4b.plot(data['k'], data['diameter'], marker='o', label=label,
              color=cs_colors[cs], linewidth=2, markersize=6)

ax4a.set_xlabel('k (number of communities)', fontsize=11)
ax4a.set_ylabel('Average path length', fontsize=11)
ax4a.set_title('Average path length', fontsize=12)
ax4a.set_xticks(k_values)
ax4a.legend(fontsize=9)
ax4a.grid(True, alpha=0.3)

ax4b.set_xlabel('k (number of communities)', fontsize=11)
ax4b.set_ylabel('Graph diameter (hops)', fontsize=11)
ax4b.set_title('Graph diameter', fontsize=12)
ax4b.set_xticks(k_values)
ax4b.legend(fontsize=9)
ax4b.grid(True, alpha=0.3)

fig4.tight_layout()
fig4.savefig(os.path.join(RESULTS, 'graph4_sbm.png'), dpi=150, bbox_inches='tight')
print('Saved: results/graph4_sbm.png')
