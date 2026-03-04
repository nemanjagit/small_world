// ——— Canvas & DOM references ———
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('canvas-wrap');
const loadingEl = document.getElementById('loading');

// UI controls
const nSlider = document.getElementById('n-slider');
const pSlider = document.getElementById('p-slider');
const nVal = document.getElementById('n-val');
const pVal = document.getElementById('p-val');
const genBtn = document.getElementById('gen-btn');
const stepBtn = document.getElementById('step-btn');
const resetBfsBtn = document.getElementById('reset-bfs-btn');
const stepInfo = document.getElementById('step-info');
const rngSrc = document.getElementById('rng-src');
const layoutSelect = document.getElementById('layout-select');
const kSlider = document.getElementById('k-slider');
const kVal = document.getElementById('k-val');
const clusterSlider = document.getElementById('cluster-slider');
const clusterVal = document.getElementById('cluster-val');
const clusterToggle = document.getElementById('cluster-toggle');
const clusterControls = document.getElementById('cluster-controls');
const rngToggle = document.getElementById('rng-toggle');

// Stats UI
const stN = document.getElementById('st-n');
const stE = document.getElementById('st-e');
const stDeg = document.getElementById('st-deg');
const stComp = document.getElementById('st-comp');
const stGc = document.getElementById('st-gc');
const stBfsDeg = document.getElementById('st-bfsdeg');
const stReached = document.getElementById('st-reached');

// ——— Graph state ———
let nodes = [];
let edges = [];
let adj = [];
let communities = [];

// ——— BFS state ———
let bfsSource = null;
let bfsVisited = new Set();
let bfsFrontier = new Set();
let bfsDegree = 0;

// ——— View state ———
let viewX = 0, viewY = 0, viewScale = 1;
let dragging = false, dragStart = null, viewStart = null;

// ——— Animation state ———
let animNodes = [];
let animProgress = 1;
let animFrame = null;
