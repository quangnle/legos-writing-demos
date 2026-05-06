/**
 * ============================================================================
 * POLICY GRADIENT DEMO - CONFIGURATION
 * ============================================================================
 * 
 * Đây là demo về Policy Gradient trong Reinforcement Learning.
 * Policy Gradient là phương pháp học policy trực tiếp bằng cách tối ưu hóa
 * expected return thông qua gradient ascent.
 * 
 * Công thức tổng quát của Policy Gradient:
 * ∇_θ J(θ) = E_τ~π_θ [Σ_t ∇_θ log π_θ(a_t|s_t) × R(τ)]
 * 
 * Trong đó:
 * - J(θ): Expected return
 * - π_θ(a|s): Policy (xác suất chọn action a tại state s)
 * - R(τ): Return của trajectory τ
 * - θ: Policy parameters
 */

// Grid configuration - Bản đồ 3x3
const GRID_ROWS = 3;
const GRID_COLS = 3;
const START = [0, 0];  // Điểm xuất phát
const GOAL = [2, 2];   // Điểm đích
const X_POS = [1, 1];  // Vị trí penalty cao (X)

// Reward map: [row][col] = reward
// Mỗi ô có reward tương ứng khi agent đi vào
const REWARDS = {
    '0,0': 0,   // Start - không có reward
    '0,1': -1,  // Ô thường - penalty nhẹ
    '0,2': -1,  // Ô thường - penalty nhẹ
    '1,0': -1,  // Ô thường - penalty nhẹ
    '1,1': -5,  // X - penalty cao
    '1,2': -1,  // Ô thường - penalty nhẹ
    '2,0': -1,  // Ô thường - penalty nhẹ
    '2,1': -1,  // Ô thường - penalty nhẹ
    '2,2': 10   // Goal - reward cao khi đến đích
};

// Actions: 4 hướng di chuyển (left, right, up, down)
// Mỗi action là một vector [delta_row, delta_col]
const ACTIONS = [
    [0, -1], // left:  giữ nguyên hàng, giảm cột
    [0, 1],  // right: giữ nguyên hàng, tăng cột
    [-1, 0], // up:    giảm hàng, giữ nguyên cột
    [1, 0]   // down:  tăng hàng, giữ nguyên cột
];
const ACTION_NAMES = ['←', '→', '↑', '↓'];

/**
 * Policy parameters: separate theta for each method
 * 
 * Mỗi phương pháp có theta riêng để dễ so sánh:
 * - thetaRtau: Dùng R(τ) (total return) cho tất cả các bước
 * - thetaGt: Dùng G_t (return từ bước t đến cuối) cho từng bước
 * - thetaBaseline: Dùng Advantage = G_t - baseline
 * 
 * Cấu trúc: theta[state_index][action_index]
 * - state_index = row * GRID_COLS + col (mã hóa vị trí thành số)
 * - action_index: 0=left, 1=right, 2=up, 3=down
 */
let thetaRtau = [];      // Theta cho phương pháp R(τ)
let thetaGt = [];        // Theta cho phương pháp G_t
let thetaBaseline = [];  // Theta cho phương pháp Baseline

// Khởi tạo theta cho mỗi phương pháp
// Ban đầu tất cả theta = 0 (policy ngẫu nhiên đều)
for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    thetaRtau[i] = [0, 0, 0, 0];      // 4 actions cho mỗi state
    thetaGt[i] = [0, 0, 0, 0];
    thetaBaseline[i] = [0, 0, 0, 0];
}

// Episode counters - đếm số lần train cho mỗi phương pháp
let episodeCount = [0, 0, 0]; // [Rtau, Gt, Baseline]

// Learning rate (α) - hệ số học
// Công thức update: θ_new = θ_old + α × gradient
// α càng lớn thì học càng nhanh nhưng có thể không ổn định
const ALPHA = 0.1;

// Current trajectories for each column
let currentTrajectories = [[], [], []];

// Current selected trajectory and step for each column
let currentSelection = [{ trajIdx: -1, step: -1 }, { trajIdx: -1, step: -1 }, { trajIdx: -1, step: -1 }];

/**
 * Softmax Policy Function
 * 
 * Tính xác suất chọn mỗi action tại một state sử dụng softmax policy.
 * 
 * Công thức softmax:
 * π_θ(a|s) = exp(θ[s][a]) / Σ_a' exp(θ[s][a'])
 * 
 * Trong đó:
 * - θ[s][a]: Policy parameter cho state s và action a
 * - exp(θ[s][a]): Exponential của parameter (logit)
 * - Denominator: Tổng của tất cả exp(θ[s][a']) cho mọi action a'
 * 
 * Tính chất:
 * - Tổng tất cả xác suất = 1
 * - Action có θ lớn hơn sẽ có xác suất cao hơn
 * - Khi θ[s][a] >> θ[s][a'] thì π(a|s) >> π(a'|s)
 * 
 * @param {Array} state - [row, col] của state hiện tại
 * @param {Array} theta - Policy parameters [state][action]
 * @returns {Array} - Xác suất cho mỗi action [p_left, p_right, p_up, p_down]
 */
function softmax(state, theta) {
    // Mã hóa state thành index: state_index = row * COLS + col
    const stateIdx = state[0] * GRID_COLS + state[1];
    
    // Lấy logits (θ[s][a]) cho tất cả actions tại state này
    const logits = theta[stateIdx];
    
    // Trừ max logit để tránh overflow khi tính exp (numerical stability)
    // exp(x - max) = exp(x) / exp(max), nhưng ổn định hơn về số học
    const maxLogit = Math.max(...logits);
    
    // Tính exp(θ[s][a] - max) cho mỗi action
    const expLogits = logits.map(l => Math.exp(l - maxLogit));
    
    // Tính tổng để normalize (tổng xác suất = 1)
    const sum = expLogits.reduce((a, b) => a + b, 0);
    
    // Normalize: π(a|s) = exp(θ[s][a] - max) / Σ exp(θ[s][a'] - max)
    return expLogits.map(e => e / sum);
}

/**
 * Get Valid Actions
 * 
 * Lấy danh sách các action hợp lệ từ một state (không đi ra ngoài grid).
 * 
 * @param {Array} state - [row, col] của state hiện tại
 * @returns {Array} - Mảng các action index hợp lệ
 */
function getValidActions(state) {
    const validActions = [];
    for (let i = 0; i < ACTIONS.length; i++) {
        // Tính next state nếu thực hiện action i
        const nextState = [state[0] + ACTIONS[i][0], state[1] + ACTIONS[i][1]];
        // Chỉ thêm action nếu next state hợp lệ (trong grid)
        if (isValidState(nextState)) {
            validActions.push(i);
        }
    }
    return validActions;
}

/**
 * Sample Action from Policy
 * 
 * Chọn một action từ policy theo phân phối xác suất softmax.
 * Chỉ xét các action hợp lệ (không đi ra ngoài grid).
 * 
 * Thuật toán:
 * 1. Lấy danh sách action hợp lệ
 * 2. Tính xác suất softmax chỉ cho các action hợp lệ
 * 3. Sample theo phân phối xác suất (inverse CDF method)
 * 
 * @param {Array} state - [row, col] của state hiện tại
 * @param {Array} theta - Policy parameters
 * @returns {number} - Action index được chọn
 */
function sampleAction(state, theta) {
    // Bước 1: Lấy danh sách action hợp lệ
    const validActions = getValidActions(state);
    if (validActions.length === 0) {
        return 0; // Fallback (không nên xảy ra)
    }
    
    // Bước 2: Tính xác suất softmax chỉ cho các action hợp lệ
    const stateIdx = state[0] * GRID_COLS + state[1];
    const logits = validActions.map(a => theta[stateIdx][a]);
    const maxLogit = Math.max(...logits);
    const expLogits = logits.map(l => Math.exp(l - maxLogit));
    const sum = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map(e => e / sum);
    
    // Bước 3: Sample theo phân phối xác suất
    // Inverse CDF method: tạo số ngẫu nhiên [0,1), tìm action tương ứng
    const rand = Math.random();
    let cumProb = 0;
    for (let i = 0; i < probs.length; i++) {
        cumProb += probs[i];
        if (rand < cumProb) {
            return validActions[i];
        }
    }
    // Fallback: trả về action cuối cùng (nên không xảy ra)
    return validActions[validActions.length - 1];
}

// Check if state is valid
function isValidState(state) {
    return state[0] >= 0 && state[0] < GRID_ROWS && 
           state[1] >= 0 && state[1] < GRID_COLS;
}

// Get reward for state
function getReward(state) {
    const key = `${state[0]},${state[1]}`;
    return REWARDS[key] || 0;
}

/**
 * Generate Trajectory
 * 
 * Sinh một trajectory (chuỗi state-action-reward) bằng cách:
 * 1. Bắt đầu từ START
 * 2. Tại mỗi state, sample action từ policy
 * 3. Di chuyển đến next state và nhận reward
 * 4. Lặp lại cho đến khi đến GOAL hoặc đạt max steps
 * 
 * Trajectory τ = (s_0, a_0, r_1, s_1, a_1, r_2, ..., s_T)
 * 
 * @param {Array} theta - Policy parameters để sample actions
 * @returns {Object} - {trajectory: [...], totalReward: number}
 */
function generateTrajectory(theta) {
    const trajectory = [];
    let state = [...START];  // Bắt đầu từ điểm xuất phát
    let totalReward = 0;
    const MAX_STEPS = 20;     // Giới hạn số bước tối đa
    
    while (true) {
        // Điều kiện dừng 1: Đã đến đích
        if (state[0] === GOAL[0] && state[1] === GOAL[1]) {
            break;
        }
        
        // Điều kiện dừng 2: Đã đạt max steps
        if (trajectory.length >= MAX_STEPS) {
            break;
        }
        
        // Điều kiện dừng 3: Không còn action hợp lệ
        const validActions = getValidActions(state);
        if (validActions.length === 0) {
            break;
        }
        
        // Sample action từ policy: a_t ~ π_θ(·|s_t)
        const action = sampleAction(state, theta);
        
        // Tính next state: s_{t+1} = s_t + action
        const nextState = [state[0] + ACTIONS[action][0], state[1] + ACTIONS[action][1]];
        
        // Nhận reward: r_{t+1} = R(s_{t+1})
        // Khi đến G, reward = +10
        const reward = getReward(nextState);
        
        // Lưu step vào trajectory
        trajectory.push({
            state: [...state],      // s_t
            action: action,          // a_t
            reward: reward,          // r_{t+1}
            nextState: [...nextState] // s_{t+1}
        });
        
        totalReward += reward;
        state = nextState;  // Di chuyển đến state tiếp theo
    }
    
    return { trajectory, totalReward };
}

/**
 * Calculate R(τ) - Total Return
 * 
 * Tính tổng return của toàn bộ trajectory.
 * 
 * Công thức:
 * R(τ) = Σ_{t=0}^{T-1} r_{t+1}
 * 
 * Trong đó:
 * - τ: Trajectory (s_0, a_0, r_1, s_1, a_1, r_2, ..., s_T)
 * - r_{t+1}: Reward nhận được sau khi thực hiện action a_t tại state s_t
 * - T: Độ dài trajectory
 * 
 * @param {Array} trajectory - Mảng các step {state, action, reward, nextState}
 * @returns {number} - Tổng reward của trajectory
 */
function calculateRtau(trajectory) {
    return trajectory.reduce((sum, step) => sum + step.reward, 0);
}

/**
 * Calculate G_t - Return from time t
 * 
 * Tính return từ bước t đến cuối trajectory (discounted return với γ=1).
 * 
 * Công thức:
 * G_t = Σ_{k=t}^{T-1} r_{k+1}
 * 
 * Trong đó:
 * - G_t: Return từ bước t đến cuối
 * - r_{k+1}: Reward tại bước k+1
 * - T: Độ dài trajectory
 * 
 * Ví dụ: Nếu trajectory có rewards [r_1, r_2, r_3, r_4]
 * - G_0 = r_1 + r_2 + r_3 + r_4 (return từ đầu)
 * - G_1 = r_2 + r_3 + r_4 (return từ bước 1)
 * - G_2 = r_3 + r_4 (return từ bước 2)
 * 
 * @param {Array} trajectory - Mảng các step
 * @param {number} t - Bước bắt đầu tính return
 * @returns {number} - Return từ bước t đến cuối
 */
function calculateGt(trajectory, t) {
    let G = 0;
    // Cộng tất cả rewards từ bước t đến cuối
    for (let i = t; i < trajectory.length; i++) {
        G += trajectory[i].reward;
    }
    return G;
}

/**
 * Calculate Baseline
 * 
 * Tính baseline (trung bình return) từ nhiều trajectories.
 * Baseline được dùng để giảm variance trong Policy Gradient.
 * 
 * Công thức:
 * baseline = (1/N) × Σ_{i=1}^N R(τ_i)
 * 
 * Trong đó:
 * - N: Số lượng trajectories
 * - R(τ_i): Total return của trajectory thứ i
 * 
 * Lợi ích của baseline:
 * - Giảm variance của gradient estimate
 * - Tăng tốc độ hội tụ
 * - Không thay đổi expected gradient (unbiased)
 * 
 * @param {Array} trajectories - Mảng các trajectory {trajectory, totalReward}
 * @returns {number} - Trung bình return của tất cả trajectories
 */
function calculateBaseline(trajectories) {
    if (trajectories.length === 0) return 0;
    // Tính tổng tất cả returns
    const total = trajectories.reduce((sum, traj) => sum + traj.totalReward, 0);
    // Trung bình = tổng / số lượng
    return total / trajectories.length;
}

/**
 * Update Theta using R(τ) Method
 * 
 * Phương pháp Policy Gradient cơ bản: dùng total return R(τ) cho tất cả các bước.
 * 
 * Công thức Policy Gradient:
 * ∇_θ J(θ) = E_τ~π_θ [Σ_t ∇_θ log π_θ(a_t|s_t) × R(τ)]
 * 
 * Update rule:
 * θ_new = θ_old + α × ∇_θ J(θ)
 * 
 * Với softmax policy, gradient log probability:
 * ∇_θ log π_θ(a|s) = (1 - π_θ(a|s))  nếu a là action được chọn
 *                   = -π_θ(a|s)      nếu a không phải action được chọn
 * 
 * Update cho mỗi (state, action):
 * θ[s][a] += α × R(τ) × ∇_θ log π_θ(a|s)
 * 
 * Đặc điểm:
 * - Tất cả các bước trong trajectory dùng cùng R(τ)
 * - Có thể có variance cao vì R(τ) có thể rất lớn hoặc rất nhỏ
 * 
 * @param {Array} trajectories - Mảng các trajectory
 * @param {Array} theta - Policy parameters hiện tại
 * @returns {Object} - {newTheta, updates}
 */
function updateThetaRtau(trajectories, theta) {
    // Copy theta để không thay đổi bản gốc
    const newTheta = theta.map(row => [...row]);
    const updates = [];
    
    // Duyệt qua từng trajectory
    for (const { trajectory } of trajectories) {
        // Tính R(τ) = tổng tất cả rewards trong trajectory
        const Rtau = calculateRtau(trajectory);
        
        // Duyệt qua từng bước trong trajectory
        for (let t = 0; t < trajectory.length; t++) {
            const step = trajectory[t];
            const stateIdx = step.state[0] * GRID_COLS + step.state[1];
            
            // Tính xác suất policy hiện tại: π_θ(a|s)
            const probs = softmax(step.state, newTheta);
            
            // Update theta cho tất cả actions
            for (let a = 0; a < ACTIONS.length; a++) {
                // Gradient log probability:
                // - Nếu a = action được chọn: gradient = 1 - π_θ(a|s)
                // - Nếu a ≠ action được chọn: gradient = -π_θ(a|s)
                const gradient = (a === step.action ? 1 : 0) - probs[a];
                
                // Update: θ[s][a] += α × R(τ) × ∇log π(a|s)
                newTheta[stateIdx][a] += ALPHA * Rtau * gradient;
            }
            
            // Lưu thông tin update để hiển thị
            updates.push({
                step: t,
                state: step.state,
                action: step.action,
                reward: step.reward,
                Rtau: Rtau,
                prob: probs[step.action],
                gradient: (1 - probs[step.action]),
                update: ALPHA * Rtau * (1 - probs[step.action])
            });
        }
    }
    
    return { newTheta, updates };
}

/**
 * Update Theta using G_t Method
 * 
 * Phương pháp Policy Gradient cải tiến: dùng return từ bước t (G_t) thay vì R(τ).
 * 
 * Công thức Policy Gradient:
 * ∇_θ J(θ) = E_τ~π_θ [Σ_t ∇_θ log π_θ(a_t|s_t) × G_t]
 * 
 * Update rule:
 * θ[s][a] += α × G_t × ∇_θ log π_θ(a|s)
 * 
 * Trong đó:
 * - G_t = Σ_{k=t}^{T-1} r_{k+1} (return từ bước t đến cuối)
 * 
 * So sánh với R(τ):
 * - R(τ) = G_0 (return từ đầu đến cuối, giống nhau cho mọi bước)
 * - G_t khác nhau cho mỗi bước t (bước gần cuối có G_t nhỏ hơn)
 * 
 * Lợi ích:
 * - Giảm variance so với R(τ) vì G_t phản ánh đúng "giá trị" của từng bước
 * - Bước gần cuối có ít ảnh hưởng hơn (G_t nhỏ hơn)
 * - Hội tụ nhanh hơn và ổn định hơn
 * 
 * @param {Array} trajectories - Mảng các trajectory
 * @param {Array} theta - Policy parameters hiện tại
 * @returns {Object} - {newTheta, updates}
 */
function updateThetaGt(trajectories, theta) {
    const newTheta = theta.map(row => [...row]);
    const updates = [];
    
    for (const { trajectory } of trajectories) {
        // Duyệt qua từng bước trong trajectory
        for (let t = 0; t < trajectory.length; t++) {
            const step = trajectory[t];
            
            // Tính G_t = return từ bước t đến cuối
            const Gt = calculateGt(trajectory, t);
            
            const stateIdx = step.state[0] * GRID_COLS + step.state[1];
            const probs = softmax(step.state, newTheta);
            
            // Update theta cho tất cả actions
            for (let a = 0; a < ACTIONS.length; a++) {
                const gradient = (a === step.action ? 1 : 0) - probs[a];
                
                // Update: θ[s][a] += α × G_t × ∇log π(a|s)
                // Khác với R(τ): dùng G_t thay vì R(τ)
                newTheta[stateIdx][a] += ALPHA * Gt * gradient;
            }
            
            updates.push({
                step: t,
                state: step.state,
                action: step.action,
                reward: step.reward,
                Gt: Gt,
                prob: probs[step.action],
                gradient: (1 - probs[step.action]),
                update: ALPHA * Gt * (1 - probs[step.action])
            });
        }
    }
    
    return { newTheta, updates };
}

/**
 * Update Theta using Baseline Method
 * 
 * Phương pháp Policy Gradient với baseline để giảm variance.
 * 
 * Công thức Policy Gradient với baseline:
 * ∇_θ J(θ) = E_τ~π_θ [Σ_t ∇_θ log π_θ(a_t|s_t) × (G_t - b)]
 * 
 * Trong đó:
 * - b (baseline): Trung bình return của các trajectories
 * - Advantage = G_t - b: Đo lường "tốt hơn trung bình" bao nhiêu
 * 
 * Update rule:
 * θ[s][a] += α × Advantage × ∇_θ log π_θ(a|s)
 * 
 * Tính chất của baseline:
 * - E[G_t - b] = E[G_t] - b = 0 (unbiased)
 * - Var[G_t - b] < Var[G_t] (giảm variance)
 * - Không thay đổi expected gradient nhưng giảm variance
 * 
 * Lợi ích:
 * - Giảm variance → gradient estimate chính xác hơn
 * - Hội tụ nhanh hơn và ổn định hơn
 * - Đặc biệt hiệu quả khi có nhiều trajectories với returns khác nhau
 * 
 * @param {Array} trajectories - Mảng các trajectory
 * @param {Array} theta - Policy parameters hiện tại
 * @returns {Object} - {newTheta, updates}
 */
function updateThetaBaseline(trajectories, theta) {
    const newTheta = theta.map(row => [...row]);
    const updates = [];
    
    // Tính baseline = trung bình return của tất cả trajectories
    const baseline = calculateBaseline(trajectories);
    
    for (const { trajectory } of trajectories) {
        for (let t = 0; t < trajectory.length; t++) {
            const step = trajectory[t];
            
            // Tính G_t = return từ bước t đến cuối
            const Gt = calculateGt(trajectory, t);
            
            // Tính Advantage = G_t - baseline
            // Advantage > 0: trajectory tốt hơn trung bình → tăng xác suất
            // Advantage < 0: trajectory kém hơn trung bình → giảm xác suất
            const advantage = Gt - baseline;
            
            const stateIdx = step.state[0] * GRID_COLS + step.state[1];
            const probs = softmax(step.state, newTheta);
            
            // Update theta cho tất cả actions
            for (let a = 0; a < ACTIONS.length; a++) {
                const gradient = (a === step.action ? 1 : 0) - probs[a];
                
                // Update: θ[s][a] += α × Advantage × ∇log π(a|s)
                // Dùng Advantage thay vì G_t để giảm variance
                newTheta[stateIdx][a] += ALPHA * advantage * gradient;
            }
            
            updates.push({
                step: t,
                state: step.state,
                action: step.action,
                reward: step.reward,
                Gt: Gt,
                baseline: baseline,
                advantage: advantage,
                prob: probs[step.action],
                gradient: (1 - probs[step.action]),
                update: ALPHA * advantage * (1 - probs[step.action])
            });
        }
    }
    
    return { newTheta, updates };
}

// Render grid
function renderGrid(columnIdx, trajectory, stepIdx) {
    const container = document.getElementById(`viz-${columnIdx}`);
    container.innerHTML = '';
    
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid-container';
    
    for (let row = 0; row < GRID_ROWS; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid-row';
        
        for (let col = 0; col < GRID_COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            // Set cell type
            if (row === START[0] && col === START[1]) {
                cell.classList.add('start');
                cell.textContent = 'S';
            } else if (row === GOAL[0] && col === GOAL[1]) {
                cell.classList.add('goal');
                cell.textContent = 'G';
            } else if (row === X_POS[0] && col === X_POS[1]) {
                cell.classList.add('penalty-high');
                cell.textContent = 'X';
            } else if (REWARDS[`${row},${col}`] === -1) {
                cell.classList.add('penalty');
                cell.textContent = '-';
            } else {
                cell.classList.add('empty');
            }
            
            // Mark visited cells and agent position
            if (trajectory && stepIdx >= 0) {
                for (let i = 0; i <= stepIdx && i < trajectory.length; i++) {
                    const s = trajectory[i].state;
                    if (s[0] === row && s[1] === col) {
                        cell.classList.add('visited');
                    }
                }
                
                if (stepIdx < trajectory.length) {
                    const currentStep = trajectory[stepIdx];
                    // Show agent at nextState (position after action) to visualize final step at G
                    if (currentStep.nextState[0] === row && currentStep.nextState[1] === col) {
                        cell.classList.add('agent');
                        cell.textContent = '';
                    }
                }
            }
            
            rowDiv.appendChild(cell);
        }
        
        gridDiv.appendChild(rowDiv);
    }
    
    container.appendChild(gridDiv);
    
    // Add controls
    if (trajectory && trajectory.length > 0) {
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'control-btn';
        prevBtn.textContent = '<';
        prevBtn.onclick = () => navigateStep(columnIdx, -1);
        prevBtn.disabled = stepIdx <= 0;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'control-btn';
        nextBtn.textContent = '>';
        nextBtn.onclick = () => navigateStep(columnIdx, 1);
        nextBtn.disabled = stepIdx >= trajectory.length - 1;
        
        const stepInfo = document.createElement('span');
        stepInfo.style.margin = '0 10px';
        stepInfo.textContent = `Bước ${stepIdx + 1}/${trajectory.length}`;
        
        controls.appendChild(prevBtn);
        controls.appendChild(stepInfo);
        controls.appendChild(nextBtn);
        container.appendChild(controls);
    }
}

// Navigate step
function navigateStep(columnIdx, direction) {
    const selection = currentSelection[columnIdx];
    if (selection.trajIdx < 0) return;
    
    const trajectory = currentTrajectories[columnIdx][selection.trajIdx].trajectory;
    const newStep = selection.step + direction;
    
    if (newStep >= 0 && newStep < trajectory.length) {
        currentSelection[columnIdx].step = newStep;
        renderGrid(columnIdx, trajectory, newStep);
        updateCalculation(columnIdx, selection.trajIdx, newStep);
    }
}

// Update calculation display
function updateCalculation(columnIdx, trajIdx, stepIdx) {
    const textarea = document.getElementById(`calc-${columnIdx}`);
    const trajectory = currentTrajectories[columnIdx][trajIdx].trajectory;
    const method = columnIdx;
    
    // Get the appropriate theta for this method
    let currentTheta;
    if (columnIdx === 0) {
        currentTheta = thetaRtau;
    } else if (columnIdx === 1) {
        currentTheta = thetaGt;
    } else {
        currentTheta = thetaBaseline;
    }
    
    let text = '';
    
    if (method === 0) {
        // R(τ) method
        const Rtau = calculateRtau(trajectory);
        text += `=== Trajectory ${trajIdx + 1} - Phương pháp R(τ) ===\n\n`;
        
        // Show R(τ) calculation
        text += `=== Tính R(τ) ===\n`;
        text += `R(τ) = tổng tất cả rewards trong trajectory\n`;
        text += `R(τ) = `;
        const rewardList = trajectory.map((s, i) => `r_${i + 1}=${s.reward}`).join(' + ');
        text += rewardList;
        text += ` = ${Rtau}\n\n`;
        
        for (let t = 0; t <= stepIdx && t < trajectory.length; t++) {
            const step = trajectory[t];
            const stateIdx = step.state[0] * GRID_COLS + step.state[1];
            const probs = softmax(step.state, currentTheta);
            const gradLog = 1 - probs[step.action];
            
            text += `Bước ${t + 1}:\n`;
            text += `  State: (${step.state[0]}, ${step.state[1]})\n`;
            text += `  Action: ${ACTION_NAMES[step.action]} (action index: ${step.action})\n`;
            text += `  Reward: r_${t + 1} = ${step.reward}\n`;
            text += `  \n`;
            text += `  Tính π(a|s) (softmax policy):\n`;
            text += `    π(a|s) = exp(θ[s][a]) / Σ exp(θ[s][a']) = ${probs[step.action].toFixed(4)}\n`;
            text += `  \n`;
            text += `  Tính ∇log π(a|s):\n`;
            text += `    Với softmax: ∇log π(a|s) = 1 - π(a|s) (cho action được chọn)\n`;
            text += `    ∇log π(a|s) = 1 - ${probs[step.action].toFixed(4)} = ${gradLog.toFixed(4)}\n`;
            text += `  \n`;
            text += `  R(τ) = ${Rtau}\n`;
            text += `  \n`;
            text += `  Cập nhật theta:\n`;
            text += `    θ[${stateIdx}][${step.action}] += α × R(τ) × ∇log π(a|s)\n`;
            text += `    θ[${stateIdx}][${step.action}] += ${ALPHA} × ${Rtau} × ${gradLog.toFixed(4)}\n`;
            text += `    θ[${stateIdx}][${step.action}] += ${(ALPHA * Rtau * gradLog).toFixed(4)}\n\n`;
        }
        
        if (stepIdx >= trajectory.length - 1) {
            text += `\n=== Tổng kết cập nhật Theta ===\n`;
            text += `R(τ) = ${Rtau}\n`;
            text += `Áp dụng gradient ascent cho tất cả các bước trong trajectory với cùng R(τ).\n`;
        }
    } else if (method === 1) {
        // G_t method
        text += `=== Trajectory ${trajIdx + 1} - Phương pháp G_t ===\n\n`;
        
        for (let t = 0; t <= stepIdx && t < trajectory.length; t++) {
            const step = trajectory[t];
            const Gt = calculateGt(trajectory, t);
            const stateIdx = step.state[0] * GRID_COLS + step.state[1];
            const probs = softmax(step.state, currentTheta);
            const gradLog = 1 - probs[step.action];
            
            // Show G_t calculation
            text += `Bước ${t + 1}:\n`;
            text += `  State: (${step.state[0]}, ${step.state[1]})\n`;
            text += `  Action: ${ACTION_NAMES[step.action]} (action index: ${step.action})\n`;
            text += `  Reward: r_${t + 1} = ${step.reward}\n`;
            text += `  \n`;
            text += `  Tính G_t (return từ bước ${t + 1} đến cuối):\n`;
            text += `    G_t = r_${t + 1}`;
            for (let i = t + 1; i < trajectory.length; i++) {
                text += ` + r_${i + 1}`;
            }
            text += `\n    G_t = ${step.reward}`;
            let sum = step.reward;
            for (let i = t + 1; i < trajectory.length; i++) {
                text += ` + ${trajectory[i].reward}`;
                sum += trajectory[i].reward;
            }
            text += ` = ${Gt}\n`;
            text += `  \n`;
            text += `  Tính π(a|s) (softmax policy):\n`;
            text += `    π(a|s) = exp(θ[s][a]) / Σ exp(θ[s][a']) = ${probs[step.action].toFixed(4)}\n`;
            text += `  \n`;
            text += `  Tính ∇log π(a|s):\n`;
            text += `    Với softmax: ∇log π(a|s) = 1 - π(a|s) (cho action được chọn)\n`;
            text += `    ∇log π(a|s) = 1 - ${probs[step.action].toFixed(4)} = ${gradLog.toFixed(4)}\n`;
            text += `  \n`;
            text += `  Cập nhật theta:\n`;
            text += `    θ[${stateIdx}][${step.action}] += α × G_t × ∇log π(a|s)\n`;
            text += `    θ[${stateIdx}][${step.action}] += ${ALPHA} × ${Gt} × ${gradLog.toFixed(4)}\n`;
            text += `    θ[${stateIdx}][${step.action}] += ${(ALPHA * Gt * gradLog).toFixed(4)}\n\n`;
        }
        
        if (stepIdx >= trajectory.length - 1) {
            text += `\n=== Tổng kết cập nhật Theta ===\n`;
            text += `Áp dụng gradient ascent với G_t (return từ từng bước đến cuối) cho từng bước.\n`;
        }
    } else {
        // Baseline method
        const baseline = calculateBaseline(currentTrajectories[columnIdx]);
        text += `=== Trajectory ${trajIdx + 1} - Phương pháp với Baseline ===\n\n`;
        
        // Show baseline calculation
        text += `=== Tính Baseline ===\n`;
        text += `Baseline = trung bình của tất cả returns từ các trajectories\n`;
        if (currentTrajectories[columnIdx].length > 0) {
            text += `Returns: `;
            const returns = currentTrajectories[columnIdx].map((traj, idx) => {
                const R = calculateRtau(traj.trajectory);
                return `R(τ_${idx + 1})=${R}`;
            }).join(', ');
            text += returns + '\n';
            text += `Baseline = (${currentTrajectories[columnIdx].map((traj, idx) => calculateRtau(traj.trajectory)).join(' + ')}) / ${currentTrajectories[columnIdx].length}\n`;
            text += `Baseline = ${baseline.toFixed(4)}\n\n`;
        }
        
        for (let t = 0; t <= stepIdx && t < trajectory.length; t++) {
            const step = trajectory[t];
            const Gt = calculateGt(trajectory, t);
            const advantage = Gt - baseline;
            const stateIdx = step.state[0] * GRID_COLS + step.state[1];
            const probs = softmax(step.state, currentTheta);
            const gradLog = 1 - probs[step.action];
            
            text += `Bước ${t + 1}:\n`;
            text += `  State: (${step.state[0]}, ${step.state[1]})\n`;
            text += `  Action: ${ACTION_NAMES[step.action]} (action index: ${step.action})\n`;
            text += `  Reward: r_${t + 1} = ${step.reward}\n`;
            text += `  \n`;
            text += `  Tính G_t (return từ bước ${t + 1} đến cuối):\n`;
            text += `    G_t = r_${t + 1}`;
            for (let i = t + 1; i < trajectory.length; i++) {
                text += ` + r_${i + 1}`;
            }
            text += `\n    G_t = ${step.reward}`;
            for (let i = t + 1; i < trajectory.length; i++) {
                text += ` + ${trajectory[i].reward}`;
            }
            text += ` = ${Gt}\n`;
            text += `  \n`;
            text += `  Tính Advantage:\n`;
            text += `    Advantage = G_t - baseline = ${Gt} - ${baseline.toFixed(4)} = ${advantage.toFixed(4)}\n`;
            text += `  \n`;
            text += `  Tính π(a|s) (softmax policy):\n`;
            text += `    π(a|s) = exp(θ[s][a]) / Σ exp(θ[s][a']) = ${probs[step.action].toFixed(4)}\n`;
            text += `  \n`;
            text += `  Tính ∇log π(a|s):\n`;
            text += `    Với softmax: ∇log π(a|s) = 1 - π(a|s) (cho action được chọn)\n`;
            text += `    ∇log π(a|s) = 1 - ${probs[step.action].toFixed(4)} = ${gradLog.toFixed(4)}\n`;
            text += `  \n`;
            text += `  Cập nhật theta:\n`;
            text += `    θ[${stateIdx}][${step.action}] += α × Advantage × ∇log π(a|s)\n`;
            text += `    θ[${stateIdx}][${step.action}] += ${ALPHA} × ${advantage.toFixed(4)} × ${gradLog.toFixed(4)}\n`;
            text += `    θ[${stateIdx}][${step.action}] += ${(ALPHA * advantage * gradLog).toFixed(4)}\n\n`;
        }
        
        if (stepIdx >= trajectory.length - 1) {
            text += `\n=== Tổng kết cập nhật Theta ===\n`;
            text += `Baseline = ${baseline.toFixed(4)}\n`;
            text += `Áp dụng gradient ascent với Advantage (G_t - baseline) cho từng bước.\n`;
        }
    }
    
    textarea.value = text;
}

// Display trajectories list
function displayTrajectories(columnIdx, trajectories) {
    const container = document.getElementById(`trajectories-${columnIdx}`);
    container.innerHTML = '';
    
    trajectories.forEach((traj, idx) => {
        const item = document.createElement('div');
        item.className = 'trajectory-item';
        item.textContent = `Trajectory ${idx + 1}: ${traj.trajectory.length} bước, Return = ${traj.totalReward}`;
        item.onclick = () => selectTrajectory(columnIdx, idx);
        container.appendChild(item);
    });
}

// Select trajectory
function selectTrajectory(columnIdx, trajIdx) {
    // Update selection
    const items = document.querySelectorAll(`#trajectories-${columnIdx} .trajectory-item`);
    items.forEach((item, idx) => {
        if (idx === trajIdx) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    currentSelection[columnIdx] = { trajIdx, step: 0 };
    const trajectory = currentTrajectories[columnIdx][trajIdx].trajectory;
    renderGrid(columnIdx, trajectory, 0);
    updateCalculation(columnIdx, trajIdx, 0);
}

/**
 * Train Episode
 * 
 * Thực hiện một episode training cho một phương pháp cụ thể.
 * 
 * Thuật toán Policy Gradient (Monte Carlo):
 * 1. Generate N trajectories từ policy hiện tại: τ_i ~ π_θ
 * 2. Tính gradient estimate: ∇_θ J ≈ (1/N) Σ_i [Σ_t ∇log π(a_t|s_t) × return]
 * 3. Update parameters: θ_new = θ_old + α × gradient
 * 
 * Các bước:
 * 1. Lấy theta phù hợp với phương pháp
 * 2. Generate 5 trajectories từ policy hiện tại
 * 3. Tính gradient và update theta theo phương pháp tương ứng
 * 4. Cập nhật episode counter và hiển thị
 * 
 * @param {number} columnIdx - Index của phương pháp (0=R(τ), 1=G_t, 2=Baseline)
 */
function trainEpisode(columnIdx) {
    // Bước 1: Lấy theta phù hợp với phương pháp
    let currentTheta;
    if (columnIdx === 0) {
        currentTheta = thetaRtau;
    } else if (columnIdx === 1) {
        currentTheta = thetaGt;
    } else {
        currentTheta = thetaBaseline;
    }
    
    // Bước 2: Generate 5 trajectories từ policy hiện tại
    // Mỗi trajectory là một sample từ phân phối π_θ
    const trajectories = [];
    for (let i = 0; i < 5; i++) {
        trajectories.push(generateTrajectory(currentTheta));
    }
    
    // Lưu trajectories để hiển thị
    currentTrajectories[columnIdx] = trajectories;
    displayTrajectories(columnIdx, trajectories);
    
    // Bước 3: Update theta dựa trên phương pháp
    let result;
    if (columnIdx === 0) {
        // Phương pháp R(τ): dùng total return cho tất cả bước
        result = updateThetaRtau(trajectories, thetaRtau);
        thetaRtau = result.newTheta;
    } else if (columnIdx === 1) {
        // Phương pháp G_t: dùng return từ bước t đến cuối
        result = updateThetaGt(trajectories, thetaGt);
        thetaGt = result.newTheta;
    } else {
        // Phương pháp Baseline: dùng Advantage = G_t - baseline
        result = updateThetaBaseline(trajectories, thetaBaseline);
        thetaBaseline = result.newTheta;
    }
    
    // Bước 4: Cập nhật episode counter và hiển thị
    episodeCount[columnIdx]++;
    updateEpisodeDisplay(columnIdx);
    updateThetaDisplay();
    
    // Xóa visualization và calculation để người dùng chọn trajectory mới
    document.getElementById(`viz-${columnIdx}`).innerHTML = '';
    document.getElementById(`calc-${columnIdx}`).value = '';
    currentSelection[columnIdx] = { trajIdx: -1, step: -1 };
}

// Update episode display
function updateEpisodeDisplay(columnIdx) {
    const methodNames = ['R(τ)', 'G_t', 'Baseline'];
    const episodeElement = document.getElementById(`episode-${columnIdx}`);
    if (episodeElement) {
        episodeElement.textContent = `Episode: ${episodeCount[columnIdx]}`;
    }
}

// Update theta display
function updateThetaDisplay() {
    const container = document.getElementById('theta-display');
    let html = '<div class="theta-values">';
    
    // Display theta for R(τ) method
    html += '<h4>Theta - R(τ) method:</h4>';
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
        const row = Math.floor(i / GRID_COLS);
        const col = i % GRID_COLS;
        html += `<div class="theta-value">State (${row}, ${col}): [${thetaRtau[i].map(t => t.toFixed(3)).join(', ')}]</div>`;
    }
    
    // Display theta for G_t method
    html += '<h4>Theta - G_t method:</h4>';
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
        const row = Math.floor(i / GRID_COLS);
        const col = i % GRID_COLS;
        html += `<div class="theta-value">State (${row}, ${col}): [${thetaGt[i].map(t => t.toFixed(3)).join(', ')}]</div>`;
    }
    
    // Display theta for Baseline method
    html += '<h4>Theta - Baseline method:</h4>';
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
        const row = Math.floor(i / GRID_COLS);
        const col = i % GRID_COLS;
        html += `<div class="theta-value">State (${row}, ${col}): [${thetaBaseline[i].map(t => t.toFixed(3)).join(', ')}]</div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Switch tab
function switchTab(tabIndex) {
    // Hide all tab panels
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab panel
    document.getElementById(`tab-${tabIndex}`).classList.add('active');
    buttons[tabIndex].classList.add('active');
}

// Initialize
updateThetaDisplay();
// Initialize episode displays
for (let i = 0; i < 3; i++) {
    updateEpisodeDisplay(i);
}
// Initialize first tab as active
switchTab(0);

