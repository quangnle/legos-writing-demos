// --- CONSTANTS & CONFIG ---
const ROWS = 3;
const COLS = 4;
const INPUT_DIM = ROWS * COLS; // 12
const CELL_SIZE = 70;
const ACTIONS = ['U', 'D', 'L', 'R'];
const GAMMA = 0.9;
const LR_ACTOR = 0.05;
const LR_CRITIC = 0.1;

const MAP_LAYOUT = [
    [1, 0, 0, 0], // S - - -
    [0, 0, 2, 0], // - - X -
    [0, 2, 0, 3]  // - X - G
];

const REWARDS = { 0: -1, 1: -1, 2: -5, 3: 10 };

const COLORS = {
    WALL: '#374151', START: '#a7f3d0', TRAP: '#fecaca', GOAL: '#fde047',
    EMPTY: '#f3f4f6', GRID_LINE: '#d1d5db',
    AGENT_GLOBAL: '#2563eb', AGENT_WORKER: '#059669', ARROW: 'rgba(0, 0, 0, 0.8)',
    SELECTED: '#ef4444' // Red for selection
};

// --- GLOBAL STATE FOR SELECTION ---
let selectedGlobalCell = { r: 0, c: 0 }; // Default selection
let focusedNeuronIndex = -1; // -1 means show all (or none specific), >=0 means show specific input
let isModalOpen = false;

// --- NEURAL NETWORK HELPERS ---
class DenseLayer {
    constructor(inputDim, outputDim) {
        this.inputDim = inputDim;
        this.outputDim = outputDim;
        this.weights = [];
        this.bias = [];
        this.initParams();
    }
    initParams() {
        for (let i = 0; i < this.inputDim; i++) {
            this.weights[i] = [];
            for (let j = 0; j < this.outputDim; j++) {
                this.weights[i][j] = (Math.random() - 0.5) * 0.1;
            }
        }
        for (let j = 0; j < this.outputDim; j++) { this.bias[j] = 0; }
    }
    copyFrom(otherLayer) {
        this.weights = JSON.parse(JSON.stringify(otherLayer.weights));
        this.bias = JSON.parse(JSON.stringify(otherLayer.bias));
    }
    forward(inputVec) {
        const output = new Array(this.outputDim).fill(0);
        for (let j = 0; j < this.outputDim; j++) {
            let sum = this.bias[j];
            for (let i = 0; i < this.inputDim; i++) {
                sum += inputVec[i] * this.weights[i][j];
            }
            output[j] = sum;
        }
        return output;
    }
    applyGradients(gradWeights, gradBias, learningRate, ascent = true) {
        const direction = ascent ? 1 : -1;
        for (let i = 0; i < this.inputDim; i++) {
            for (let j = 0; j < this.outputDim; j++) {
                this.weights[i][j] += direction * learningRate * gradWeights[i][j];
            }
        }
        for (let j = 0; j < this.outputDim; j++) {
            this.bias[j] += direction * learningRate * gradBias[j];
        }
    }
}

// --- MATH HELPERS ---
function toOneHot(r, c) {
    const vec = new Array(INPUT_DIM).fill(0);
    const index = r * COLS + c;
    vec[index] = 1;
    return vec;
}
function softmax(logits) {
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sumExps);
}
function sampleAction(probs) {
    const r = Math.random();
    let cum = 0;
    for (let i = 0; i < probs.length; i++) {
        cum += probs[i];
        if (r < cum) return i;
    }
    return probs.length - 1;
}
function getNextState(r, c, actionIdx) {
    let nr = r, nc = c;
    if (ACTIONS[actionIdx] === 'U') nr = Math.max(0, r - 1);
    if (ACTIONS[actionIdx] === 'D') nr = Math.min(ROWS - 1, r + 1);
    if (ACTIONS[actionIdx] === 'L') nc = Math.max(0, c - 1);
    if (ACTIONS[actionIdx] === 'R') nc = Math.min(COLS - 1, c + 1);
    return { r: nr, c: nc };
}

// --- AGENT CLASS ---
class Agent {
    constructor(id, isGlobal = false) {
        this.id = id;
        this.isGlobal = isGlobal;
        this.canvasId = isGlobal ? 'canvas-global' : `canvas-${id}`;
        this.consoleId = isGlobal ? 'console-global' : `console-${id}`;
        this.canvas = document.getElementById(this.canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.actorNet = new DenseLayer(INPUT_DIM, 4);
        this.criticNet = new DenseLayer(INPUT_DIM, 1);
        this.currentPos = { r: 0, c: 0 };
        this.running = false;

        // Selection Event Listener for Global
        if (isGlobal) {
            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const c = Math.floor(x / CELL_SIZE);
                const r = Math.floor(y / CELL_SIZE);
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    selectedGlobalCell = { r, c };
                    focusedNeuronIndex = r * COLS + c; // Auto-focus the input neuron corresponding to this cell
                    this.render();
                    if (isModalOpen) {
                        document.getElementById('modal-state-coords').innerText = `(${r},${c})`;
                        updateNetworkViz();
                    }
                }
            });
        }
        this.render();
    }

    log(msg, append = true) {
        const consoleEl = document.getElementById(this.consoleId);
        if (!append) consoleEl.textContent = "";
        consoleEl.textContent += msg + "\n";
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    sync(globalAgent) {
        this.actorNet.copyFrom(globalAgent.actorNet);
        this.criticNet.copyFrom(globalAgent.criticNet);
        this.render();
    }

    forward(r, c) {
        const inputVec = toOneHot(r, c);
        const logits = this.actorNet.forward(inputVec);
        const valueVec = this.criticNet.forward(inputVec);
        return {
            probs: softmax(logits),
            logits: logits,
            value: valueVec[0],
            inputVec: inputVec
        };
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        ctx.clearRect(0, 0, width, height);

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const { probs, value } = this.forward(r, c);
                this.drawCell(r, c, probs, value);
            }
        }
        if ((this.isGlobal && this.running) || !this.isGlobal) {
            this.drawAgent();
        }
    }

    drawCell(r, c, probs, value) {
        const ctx = this.ctx;
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        const type = MAP_LAYOUT[r][c];

        let color = COLORS.EMPTY;
        let text = "";
        if (type === 1) { color = COLORS.START; text = "S"; }
        else if (type === 2) { color = COLORS.TRAP; text = "X"; }
        else if (type === 3) { color = COLORS.GOAL; text = "G"; }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = COLORS.GRID_LINE;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        // Highlight Selection (Global Only)
        if (this.isGlobal && r === selectedGlobalCell.r && c === selectedGlobalCell.c) {
            ctx.strokeStyle = COLORS.SELECTED;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }

        if (text) {
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.font = "bold 40px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        }

        if (type === 3) {
            ctx.fillStyle = "#333";
            ctx.font = "10px monospace";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(`V: 0.0`, x + CELL_SIZE - 2, y + CELL_SIZE - 2);
        } else {
            ctx.fillStyle = "#333";
            ctx.font = "10px monospace";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(`V:${value.toFixed(1)}`, x + CELL_SIZE - 2, y + CELL_SIZE - 2);
            this.drawArrows(r, c, probs);
        }
    }

    drawArrows(r, c, probs) {
        const ctx = this.ctx;
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        const maxLen = CELL_SIZE / 2 - 5;
        const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];

        probs.forEach((p, idx) => {
            if (p < 0.05) return;
            const len = maxLen * p * 2;
            const endX = cx + dirs[idx].dx * len;
            const endY = cy + dirs[idx].dy * len;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 + p})`;
            ctx.lineWidth = 1 + p * 3;
            ctx.stroke();

            const headLen = 4;
            const angle = Math.atan2(dirs[idx].dy, dirs[idx].dx);
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(endX, endY);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 + p})`;
            ctx.fill();
        });
    }

    drawAgent() {
        const ctx = this.ctx;
        const { r, c } = this.currentPos;
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        const radius = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.isGlobal ? COLORS.AGENT_GLOBAL : COLORS.AGENT_WORKER;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
        if (this.isGlobal && this.running) {
            ctx.shadowBlur = 10; ctx.shadowColor = COLORS.AGENT_GLOBAL; ctx.stroke(); ctx.shadowBlur = 0;
        }
    }

    async runOnce() {
        if (this.isGlobal) return;
        this.log("================ UPDATE ======================================", false);
        this.log("Syncing with Global Neural Networks...");
        // 1. Sync: Get global parameters \theta, \phi
        // Formula: \theta' \leftarrow \theta, \phi' \leftarrow \phi
        this.sync(globalAgent);

        const nStepInput = document.getElementById(this.id === 'worker-0' ? 'n-step-1' : 'n-step-2');
        const n_steps = parseInt(nStepInput.value);
        this.log(`Simulated with ${n_steps} steps TD(${n_steps})`);

        let trajectory = [];
        let s = { ...this.currentPos };
        if (MAP_LAYOUT[s.r][s.c] === 3) {
            s = { r: 0, c: 0 };
            this.currentPos = s;
            this.render();
        }

        let pathStr = `(${s.r},${s.c})`;
        let actionStr = "";

        // 2. Interaction Phase: Collect trajectory (s, a, r)
        // Formula: a_t \sim \pi_{\theta'}(s_t), s_{t+1} \leftarrow Environment(s_t, a_t)
        for (let i = 0; i < n_steps; i++) {
            const { probs, value, inputVec } = this.forward(s.r, s.c);
            const aIdx = sampleAction(probs);
            const nextS = getNextState(s.r, s.c, aIdx);
            const cellType = MAP_LAYOUT[nextS.r][nextS.c];
            const r_val = REWARDS[cellType];
            trajectory.push({ s: { ...s }, a: aIdx, r: r_val, probs: probs, v: value, inputVec: inputVec });

            const probStr = `{U:${probs[0].toFixed(2)},D:${probs[1].toFixed(2)},L:${probs[2].toFixed(2)},R:${probs[3].toFixed(2)}}`;
            this.log(`[${ACTIONS[aIdx]}]: ${probStr}, V=${value.toFixed(2)}, reward ${r_val}`);

            s = nextS;
            pathStr += ` => (${s.r},${s.c})`;
            actionStr += (i > 0 ? " => " : "") + ACTIONS[aIdx];
            if (cellType === 3) break;
        }

        this.currentPos = s;
        this.render();
        this.log(`Actions chosen: ${actionStr}`);
        this.log(`Path: ${pathStr}`);

        let R = 0;
        const cellTypeFinal = MAP_LAYOUT[s.r][s.c];
        if (cellTypeFinal !== 3) {
            // 3. Bootstrap Return: R = V(s) or 0 (if terminal)
            // Formula: R \leftarrow V_{\phi'}(s_t)
            const { value } = this.forward(s.r, s.c);
            R = value;
        }
        this.log(`Accumulated reward target R initialized = ${R.toFixed(2)}`);

        let dActorW = Array.from({ length: INPUT_DIM }, () => Array(4).fill(0));
        let dActorB = Array(4).fill(0);
        let dCriticW = Array.from({ length: INPUT_DIM }, () => Array(1).fill(0));
        let dCriticB = Array(1).fill(0);

        this.log("Recursive Update (Calculating Gradients):");
        // 4. Accumulate Gradients: Backpropagation
        // Formula: R \leftarrow r_t + \gamma R
        // Formula: d\theta' \leftarrow d\theta' + \nabla \ln \pi(a_t|s_t)(R - V(s_t))
        // Formula: d\phi' \leftarrow d\phi' + \nabla (R - V(s_t))^2
        for (let t = trajectory.length - 1; t >= 0; t--) {
            const step = trajectory[t];

            // 4.1 Compute Discounted Return (Target Value)
            // R = r_t + \gamma * R_{t+1}
            R = step.r + GAMMA * R;

            // 4.2 Compute Advantage
            // A(s_t, a_t) = R_t - V(s_t)
            // Measures how much better the action was compared to the average value of the state.
            const Advantage = R - step.v;
            this.log(`Step ${t}: V(${step.s.r},${step.s.c}) target=${R.toFixed(2)}, Advantage=${Advantage.toFixed(2)}`);

            // 4.3 Accumulate Critic Gradients (Value Function Update)
            // Loss = (R - V(s))^2  => Gradient w.r.t Output = -2 * (R - V(s)) ... dropped constant 2
            // d(Loss)/dw = d(Loss)/dV * dV/dw = -(Advantage) * Input
            // We ascend the gradient, so we use +Advantage
            const inputVec = step.inputVec;
            for (let i = 0; i < INPUT_DIM; i++) {
                if (inputVec[i] !== 0) dCriticW[i][0] += Advantage * inputVec[i];
            }
            dCriticB[0] += Advantage;

            // 4.4 Accumulate Actor Gradients (Policy Gradient Update)
            // Objective J(\theta) = E [ \ln \pi(a|s) * A ]
            // Gradient \nabla J = \nabla \ln \pi(a|s) * A
            // For Softmax policy: \nabla \ln \pi(a_i) = (\mathbb{1}(a=a_i) - \pi(a_i))
            // So update is: A * (Indicator - Prob) * Input
            for (let action_i = 0; action_i < 4; action_i++) {
                // If action_i was the chosen action, Gradient term is (1 - p). 
                // If action_i was NOT chosen, Gradient term is (0 - p).
                const indicator = (action_i === step.a) ? 1 : 0;
                const gradLogit = Advantage * (indicator - step.probs[action_i]);

                for (let i = 0; i < INPUT_DIM; i++) {
                    if (inputVec[i] !== 0) dActorW[i][action_i] += gradLogit * inputVec[i];
                }
                dActorB[action_i] += gradLogit;
            }
        }

        this.log(`Gradients accumulated.`);
        this.log("Async Update GLOBAL");
        this.log(`Updating Global Weights...`);

        // 5. Async Update: Update Global \Theta, \Phi
        // Formula: \theta \leftarrow \theta + \eta_a d\theta'
        // Formula: \phi \leftarrow \phi + \eta_c d\phi'
        globalAgent.criticNet.applyGradients(dCriticW, dCriticB, LR_CRITIC, true);
        globalAgent.actorNet.applyGradients(dActorW, dActorB, LR_ACTOR, true);

        const workerIdNum = this.id === 'worker-0' ? 1 : 2;
        globalAgent.log(`====================== UPDATE FROM WORKER [${workerIdNum}] ====================`);
        globalAgent.log(`Synced up. Gradients applied.`);

        globalAgent.log(`--- UPDATED GLOBAL THETA (Policy Weights) ---`);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const idx = r * COLS + c;
                const w = globalAgent.actorNet.weights[idx].map(n => n.toFixed(3)).join(",");
                globalAgent.log(`State (${r},${c}): [${w}]`);
            }
        }
        globalAgent.log(`--- UPDATED GLOBAL PHI (Value Weights) ---`);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const idx = r * COLS + c;
                const w = globalAgent.criticNet.weights[idx].map(n => n.toFixed(3)).join(",");
                globalAgent.log(`State (${r},${c}): [${w}]`);
            }
        }
        globalAgent.render();
        if (isModalOpen) updateNetworkViz();
        this.render();
    }
}

class GlobalAgent extends Agent {
    constructor() {
        super('global', true);
        this.timer = null;
    }
    toggleRun() {
        const btn = document.getElementById('btn-global-run');
        if (this.running) {
            this.running = false;
            clearInterval(this.timer);
            btn.innerText = "Run Simulation";
            btn.classList.remove('btn-running');
            this.currentPos = { r: 0, c: 0 };
            this.render();
        } else {
            this.running = true;
            btn.innerText = "Stop Simulation";
            btn.classList.add('btn-running');
            this.currentPos = { r: 0, c: 0 };
            this.log("Running...");
            this.timer = setInterval(() => { this.step(); }, 500);
        }
    }
    step() {
        const { r, c } = this.currentPos;
        const cellType = MAP_LAYOUT[r][c];
        if (cellType === 3) {
            this.log(`Terminated at (${r},${c}). Restarting...`);
            this.currentPos = { r: 0, c: 0 };
            this.render();
            return;
        }
        const { probs } = this.forward(r, c);
        const aIdx = sampleAction(probs);
        this.currentPos = getNextState(r, c, aIdx);
        this.render();
    }
}

// --- INIT ---
let globalAgent, workers = [];
function init() {
    globalAgent = new GlobalAgent();
    globalAgent.log("Neural Networks Initialized.");
    workers = [new Agent('worker-0'), new Agent('worker-1')];

    // Interaction for Modal Canvases
    ['viz-actor', 'viz-critic'].forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => {
            handleVizClick(e, id);
        });
    });
}
function resetAll() {
    if (globalAgent.running) globalAgent.toggleRun();
    init();
    workers[0].log("Reset."); workers[1].log("Reset.");
    selectedGlobalCell = { r: 0, c: 0 };
    focusedNeuronIndex = -1;
    globalAgent.render();
    if (isModalOpen) updateNetworkViz();
}

// --- VISUALIZATION LOGIC ---
function openNetworkModal() {
    isModalOpen = true;
    document.getElementById('network-modal').classList.add('active');
    document.getElementById('modal-state-coords').innerText = `(${selectedGlobalCell.r},${selectedGlobalCell.c})`;
    focusedNeuronIndex = selectedGlobalCell.r * COLS + selectedGlobalCell.c; // Focus on active input
    updateNetworkViz();
}

function closeNetworkModal() {
    isModalOpen = false;
    document.getElementById('network-modal').classList.remove('active');
}

function handleVizClick(e, canvasId) {
    const canvas = document.getElementById(canvasId);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Input neurons are at x=50, y spaced out
    // Let's check if click is near an input neuron
    // 12 inputs, spaced roughly 500 / 14 px
    const spacingY = 500 / 14;
    const startY = spacingY;

    for (let i = 0; i < INPUT_DIM; i++) {
        const ny = startY + i * spacingY;
        const dist = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - ny, 2));
        if (dist < 15) { // Radius 12 + margin
            focusedNeuronIndex = i;
            updateNetworkViz();
            return;
        }
    }
    // If click elsewhere (background), reset focus? Maybe keep it for clarity
    // focusedNeuronIndex = -1; 
    // updateNetworkViz();
}

function updateNetworkViz() {
    const { r, c } = selectedGlobalCell;
    const res = globalAgent.forward(r, c); // Get current activation

    drawNetwork('viz-actor', globalAgent.actorNet, res.inputVec, res.probs, ['U', 'D', 'L', 'R']);
    drawNetwork('viz-critic', globalAgent.criticNet, res.inputVec, [res.value], ['Val']);
}

function drawNetwork(canvasId, layer, inputVec, outputVals, outputLabels) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    const inX = 50;
    const outX = w - 50;

    const inSpacing = h / (INPUT_DIM + 2);
    const outSpacing = h / (outputVals.length + 1);

    // Draw Connections
    for (let i = 0; i < INPUT_DIM; i++) {
        const iy = inSpacing * (i + 1);

        for (let j = 0; j < outputVals.length; j++) {
            const oy = outSpacing * (j + 1);
            const weight = layer.weights[i][j];

            // Style logic
            let isActive = false;
            let opacity = 0.05;
            let lineWidth = 1;

            if (focusedNeuronIndex !== -1) {
                if (i === focusedNeuronIndex) {
                    isActive = true;
                    opacity = 1.0;
                    lineWidth = 2;
                } else {
                    opacity = 0.02; // Very dim
                }
            } else {
                // No focus, show connections from Active Input slightly brighter
                if (inputVec[i] === 1) opacity = 0.3;
            }

            // Line color based on weight sign
            const color = weight > 0 ? `rgba(0, 255, 0, ${opacity})` : `rgba(255, 0, 0, ${opacity})`;

            ctx.beginPath();
            ctx.moveTo(inX, iy);
            ctx.lineTo(outX, oy);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Draw weight text if active
            if (isActive) {
                ctx.fillStyle = "white";
                ctx.font = "10px sans-serif";
                ctx.fillText(weight.toFixed(2), (inX + outX) / 2, (iy + oy) / 2);
            }
        }
    }

    // Draw Input Nodes
    for (let i = 0; i < INPUT_DIM; i++) {
        const iy = inSpacing * (i + 1);
        const val = inputVec[i];

        ctx.beginPath();
        ctx.arc(inX, iy, 12, 0, Math.PI * 2);

        // Color based on active/inactive
        if (val === 1) {
            ctx.fillStyle = "#fbbf24"; // Active (Yellow)
            ctx.shadowBlur = 10; ctx.shadowColor = "#fbbf24";
        } else {
            ctx.fillStyle = "#374151"; // Inactive (Gray)
            ctx.shadowBlur = 0;
        }

        // Highlight focused neuron
        if (i === focusedNeuronIndex) {
            ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
        } else {
            ctx.strokeStyle = "transparent"; ctx.stroke();
        }

        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Label index
        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        ctx.fillText(`(${row},${col})`, inX, iy);
    }

    // Draw Output Nodes
    for (let j = 0; j < outputVals.length; j++) {
        const oy = outSpacing * (j + 1);

        ctx.beginPath();
        ctx.arc(outX, oy, 18, 0, Math.PI * 2);
        ctx.fillStyle = "#2563eb";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();

        // Value Text
        ctx.fillStyle = "white";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(outputVals[j].toFixed(2), outX, oy);

        // Label
        ctx.fillStyle = "#9ca3af";
        ctx.font = "12px sans-serif";
        ctx.fillText(outputLabels[j], outX + 25, oy);
    }
}
window.onload = init;
