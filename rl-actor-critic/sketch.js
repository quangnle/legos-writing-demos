// ===========================
// 1. CÁC BIẾN TOÀN CỤC
// ===========================
let maxRewardSoFar = 0;       // Điểm số (reward) cao nhất đạt được trong quá trình training
let bestEpisodeStates = [];   // Mảng lưu trữ toàn bộ các trạng thái (states) của episode tốt nhất
                               // Mỗi phần tử là một mảng [x, x_dot, theta, theta_dot]
                               // Dùng để chiếu lại (replay) episode kỷ lục
let bestModel = null;         // Mô hình tốt nhất (policy tốt nhất) - được lưu khi phá kỷ lục
                               // Dùng để chơi thử với policy tốt nhất thay vì policy hiện tại
let isReplaying = false;      // Cờ boolean đánh dấu đang trong quá trình chiếu lại episode tốt nhất
                               // Khi đang replay thì sẽ không chạy training để tránh xung đột
let isTraining = true;        // Cờ boolean điều khiển việc training có đang chạy hay không
                               // Có thể tạm dừng/resume thông qua UI
let isTestPlaying = false;    // Cờ boolean đánh dấu đang trong chế độ chơi thử (test play)
                               // Khi đang test play thì sẽ không chạy training để tránh xung đột
let episodeCount = 0;         // Bộ đếm số lượng episode đã chạy từ khi khởi động

// ===========================
// 2. MÔI TRƯỜNG CART-POLE & MẠNG NEURAL NETWORK
// ===========================

/**
 * Class mô phỏng môi trường CartPole (Xe đẩy với cây gậy)
 * Đây là bài toán cổ điển trong Reinforcement Learning
 */
class CartPole {
    /**
     * Constructor khởi tạo các tham số vật lý của môi trường
     */
    constructor() {
        this.gravity = 9.8;        // Gia tốc trọng trường (m/s²)
        this.massCart = 1.0;       // Khối lượng của xe đẩy (kg)
        this.massPole = 0.1;       // Khối lượng của cây gậy (kg)
        this.totalMass = this.massCart + this.massPole;  // Tổng khối lượng
        this.length = 0.5;         // Chiều dài một nửa của cây gậy (m)
        this.poleMoment = this.massPole * this.length;   // Momen quán tính của gậy
        this.forceMag = 10.0;      // Độ lớn lực đẩy tối đa có thể áp dụng (N)
        this.tau = 0.02;           // Bước thời gian cho mỗi step (s) - 0.02s = 50Hz
        this.reset();              // Khởi tạo trạng thái ban đầu
    }

    /**
     * Reset môi trường về trạng thái ban đầu
     * @returns {Array} Mảng chứa 4 giá trị trạng thái: [x, x_dot, theta, theta_dot]
     *   - x: vị trí ngang của xe (m), khoảng [-2.4, 2.4]
     *   - x_dot: vận tốc ngang của xe (m/s)
     *   - theta: góc nghiêng của gậy (radian), khoảng [-0.209, 0.209] (~±12 độ)
     *   - theta_dot: vận tốc góc của gậy (radian/s)
     */
    reset() {
        // Khởi tạo với giá trị ngẫu nhiên nhỏ gần trung tâm để đảm bảo tính ổn định
        this.state = [
            Math.random()*0.1-0.05,    // x: ngẫu nhiên trong [-0.05, 0.05]
            Math.random()*0.1-0.05,    // x_dot: vận tốc ngang ban đầu nhỏ
            Math.random()*0.1-0.05,    // theta: góc nghiêng ban đầu nhỏ
            Math.random()*0.1-0.05     // theta_dot: vận tốc góc ban đầu nhỏ
        ];
        this.done = false;  // Cờ báo hiệu episode chưa kết thúc
        return this.state;
    }

    /**
     * Thực hiện một bước trong môi trường
     * @param {number} action - Hành động: 0 = đẩy sang trái, 1 = đẩy sang phải
     * @returns {Object} Object chứa:
     *   - state: Trạng thái mới sau khi thực hiện hành động
     *   - reward: Điểm thưởng (1 nếu chưa fail, 0 nếu đã fail)
     *   - done: Boolean cho biết episode đã kết thúc chưa
     */
    step(action) {
        // Giải nén trạng thái hiện tại
        let [x, x_dot, theta, theta_dot] = this.state;
        
        // Xác định lực đẩy dựa trên hành động
        // action = 1: đẩy sang phải (lực dương), action = 0: đẩy sang trái (lực âm)
        const force = action === 1 ? this.forceMag : -this.forceMag;
        
        // Tính toán các giá trị lượng giác cần thiết
        const costheta = Math.cos(theta);
        const sintheta = Math.sin(theta);
        
        // Tính gia tốc tạm thời (theo công thức vật lý)
        // Công thức này dựa trên phương trình chuyển động của hệ thống cart-pole
        const temp = (force + this.poleMoment * theta_dot * theta_dot * sintheta) / this.totalMass;
        
        // Tính gia tốc góc của gậy (thetaacc)
        // Đây là phương trình vi phân bậc hai mô tả chuyển động của con lắc ngược
        const thetaacc = (this.gravity * sintheta - costheta * temp) / 
                        (this.length * (4.0/3.0 - this.massPole * costheta * costheta / this.totalMass));
        
        // Tính gia tốc ngang của xe (xacc)
        const xacc = temp - this.poleMoment * thetaacc * costheta / this.totalMass;
        
        // Cập nhật trạng thái bằng phương pháp Euler (tích phân số)
        // Sử dụng công thức: vị_trí_mới = vị_trí_cũ + vận_tốc * delta_t
        x += this.tau * x_dot;
        x_dot += this.tau * xacc;
        theta += this.tau * theta_dot;
        theta_dot += this.tau * thetaacc;
        
        // Lưu trạng thái mới
        this.state = [x, x_dot, theta, theta_dot];
        
        // Kiểm tra điều kiện kết thúc episode (fail conditions)
        // Episode kết thúc nếu:
        // - Xe di chuyển quá xa: |x| > 2.4m
        // - Gậy nghiêng quá nhiều: |theta| > 0.209 radian (~12 độ)
        this.done = x < -2.4 || x > 2.4 || theta < -0.209 || theta > 0.209;
        
        // Reward = 1 nếu chưa fail, 0 nếu đã fail
        // Mục tiêu là giữ gậy thẳng đứng càng lâu càng tốt
        const reward = this.done ? 0 : 1;
        
        return { state: this.state, reward, done: this.done };
    }
}

// ===========================
// CẤU HÌNH MẠNG NEURAL NETWORK (ACTOR-CRITIC)
// ===========================
const numInputs = 4;           // Số đầu vào: 4 giá trị trạng thái [x, x_dot, theta, theta_dot] 
                               // tương ứng với 4 sensor của xe đẩy bao gồm vị trí ngang, vận tốc ngang, góc nghiêng và vận tốc góc của gậy    
const numActions = 2;          // Số hành động: 0 (trái) và 1 (phải)
                               // tương ứng với 2 hành động: đẩy sang trái và đẩy sang phải
const hiddenSize = 128;        // Số neuron trong lớp ẩn
const learningRate = 0.01;     // Tốc độ học (learning rate) cho optimizer
const gamma = 0.99;            // Hệ số chiết khấu (discount factor) cho reward tương lai

/**
 * Tạo mô hình Actor-Critic sử dụng TensorFlow.js
 * Actor-Critic kết hợp ưu điểm của Policy Gradient và Value-based methods
 * 
 * - Actor: Học policy (xác suất chọn mỗi hành động)
 * - Critic: Đánh giá giá trị (value) của trạng thái hiện tại
 * 
 * @returns {tf.Model} Mô hình có 2 đầu ra: [actor_output, critic_output]
 */
function createActorCriticModel() {
    // Lớp đầu vào: nhận 4 giá trị trạng thái
    const input = tf.input({shape: [numInputs]});
    
    // Lớp ẩn: Dense layer với 128 neurons, dùng ReLU activation
    // ReLU giúp mạng học các hàm phi tuyến tính
    const dense = tf.layers.dense({units: hiddenSize, activation: 'relu'}).apply(input);
    
    // Actor head: Output xác suất cho mỗi hành động (softmax để tổng = 1)
    // Softmax đảm bảo phân phối xác suất hợp lệ: p(action=0) + p(action=1) = 1
    const actor = tf.layers.dense({units: numActions, activation: 'softmax'}).apply(dense);
    
    // Critic head: Output giá trị kỳ vọng (expected value) của trạng thái
    // Không dùng activation, output là số thực (có thể âm hoặc dương)
    const critic = tf.layers.dense({units: 1}).apply(dense);
    
    // Tạo model với 1 đầu vào và 2 đầu ra
    return tf.model({inputs: input, outputs: [actor, critic]});
}

// Khởi tạo mô hình, optimizer và môi trường
const model = createActorCriticModel();
const optimizer = tf.train.adam(learningRate);  // Adam optimizer - adaptive learning rate
const env = new CartPole();

// ===========================
// 3. HÀM VẼ (RENDER) VÀ REPLAY EPISODE TỐT NHẤT
// ===========================

// Lấy reference đến canvas và context để vẽ
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Các tham số vẽ (scale để chuyển đổi từ không gian vật lý sang pixel)
const scale = 50;           // Tỷ lệ: 1 đơn vị vật lý = 50 pixel
const cartWidth = 50;       // Chiều rộng xe (pixel)
const cartHeight = 30;      // Chiều cao xe (pixel)

/**
 * Vẽ trạng thái hiện tại của CartPole lên canvas
 * @param {Array} state - Mảng [x, x_dot, theta, theta_dot] mô tả trạng thái
 */
function render(state) {
    // Xóa canvas trước khi vẽ frame mới
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chuyển đổi tọa độ x từ không gian vật lý sang pixel
    // canvas.width/2 là giữa màn hình (x=0 trong không gian vật lý)
    const x = state[0] * scale + canvas.width / 2;
    const theta = state[2];  // Góc nghiêng của gậy (radian)
    
    // Vẽ sàn (đường ngang màu xám)
    ctx.beginPath();
    ctx.moveTo(0, 250);
    ctx.lineTo(600, 250);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Vẽ xe đẩy (hình chữ nhật màu đen)
    ctx.fillStyle = '#555';
    ctx.fillRect(x - cartWidth/2, 250 - cartHeight/2, cartWidth, cartHeight);
    
    // Vẽ cây gậy (đường thẳng màu đỏ)
    const poleLen = 100;  // Chiều dài gậy trên màn hình (pixel)
    // Tính tọa độ đầu gậy dựa trên góc theta
    const poleX = x + Math.sin(theta) * poleLen;
    const poleY = 250 - Math.cos(theta) * poleLen;
    
    ctx.beginPath();
    ctx.moveTo(x, 250);           // Bắt đầu từ đỉnh xe
    ctx.lineTo(poleX, poleY);     // Kết thúc ở đầu gậy
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d9534f';  // Màu đỏ
    ctx.stroke();
}

/**
 * Chiếu lại (replay) episode tốt nhất đã lưu
 * Hàm này sẽ vẽ từng frame một cách tuần tự để người xem thấy được quá trình chơi
 */
async function replayBestEpisode() {
    // Bật cờ replay để ngăn training chạy đồng thời
    isReplaying = true;
    
    // Cập nhật UI để hiển thị đang chiếu lại
    const mainStatus = document.getElementById('status-main');
    mainStatus.innerHTML = `🎉 REPLAYING BEST EPISODE: ${maxRewardSoFar.toFixed(0)} POINTS! 🎉`;
    mainStatus.classList.add('highlight-record');  // Thêm hiệu ứng highlight

    // Duyệt qua từng frame đã lưu và vẽ lại tuần tự
    for (let i = 0; i < bestEpisodeStates.length; i++) {
        render(bestEpisodeStates[i]);
        
        // Dùng Promise + setTimeout để tạo độ trễ giữa các frame
        // 20ms tương đương khoảng 50fps - tốc độ vừa đủ để mắt người nhìn thấy
        // Tăng giá trị này nếu muốn chiếu chậm hơn (ví dụ: 50ms = 20fps)
        await new Promise(r => setTimeout(r, 20)); 
    }

    // Tắt hiệu ứng highlight và cờ replay
    mainStatus.classList.remove('highlight-record');
    isReplaying = false;
    
    // Tiếp tục training ngay sau khi replay xong (nếu đang trong chế độ training)
    if (isTraining) {
        runEpisode();
    }
}

// ===========================
// 4. VÒNG LẶP HUẤN LUYỆN CHÍNH (TRAINING LOOP)
// ===========================

/**
 * Chạy một episode huấn luyện
 * Episode = một lần chơi từ đầu đến khi fail hoặc đạt điểm tối đa
 * 
 * Quy trình:
 * 1. Thu thập dữ liệu: chơi episode và lưu lại states, actions, rewards, values
 * 2. Tính returns: dùng discount factor để tính giá trị kỳ vọng
 * 3. Cập nhật mạng: dùng gradient descent để cải thiện policy và value function
 * 4. Kiểm tra kỷ lục: nếu có kỷ lục mới thì replay
 */
async function runEpisode() {
    // Kiểm tra điều kiện: chỉ train nếu đang bật training, không đang replay và không đang test play
    if (!isTraining || isReplaying || isTestPlaying) return;

    // Reset môi trường về trạng thái ban đầu
    let state = env.reset();
    let totalReward = 0;  // Tổng điểm tích lũy trong episode này
    
    // Các mảng để lưu trữ dữ liệu cho việc training
    // Mỗi phần tử tương ứng với một time step trong episode
    const stateBatch = [];   // Các trạng thái đã quan sát
    const actionBatch = [];  // Các hành động đã thực hiện
    const rewardBatch = [];  // Các reward nhận được
    const valueBatch = [];   // Các giá trị do critic dự đoán

    // ==========================================
    // PHASE A: THU THẬP DỮ LIỆU (DATA COLLECTION)
    // Chạy ở tốc độ cao, KHÔNG vẽ để tăng tốc độ training
    // ==========================================
    while (true) {
        // Lưu trạng thái hiện tại vào batch
        // Quan trọng: phải copy mảng (dùng spread operator [...])
        // vì state sẽ bị thay đổi ở bước sau, nếu không copy thì tất cả phần tử trong
        // stateBatch sẽ cùng trỏ đến cùng một mảng và sẽ bị cập nhật giống nhau
        stateBatch.push([...state]); 

        // Dùng tf.tidy() để tự động giải phóng bộ nhớ TensorFlow
        // Tránh memory leak khi làm việc với TensorFlow.js
        const actionInfo = tf.tidy(() => {
            // Chuyển state thành tensor 2D: shape = [1, 4]
            // Dimension đầu là batch size (1 vì chỉ có 1 state)
            const stateTensor = tf.tensor2d([state]);
            
            // Mô hình dự đoán: actor cho xác suất hành động, critic cho giá trị
            const [probs, value] = model.predict(stateTensor);
            
            // Lấy dữ liệu từ tensor về JavaScript array
            const probData = probs.dataSync();
            
            // Chọn hành động theo policy (xác suất)
            // probData[0] là xác suất chọn action 0 (trái)
            // Nếu random < probData[0] thì chọn 0, ngược lại chọn 1
            // Đây là sampling từ phân phối xác suất
            const action = Math.random() < probData[0] ? 0 : 1;
            
            // Trả về hành động đã chọn và giá trị dự đoán
            return { 
                action: action, 
                value: value.dataSync()[0]  // Giá trị là số thực
            };
        });

        // Lấy hành động và giá trị từ kết quả dự đoán
        const { action, value } = actionInfo;
        
        // Thực hiện hành động trong môi trường và nhận kết quả
        const stepResult = env.step(action);
        
        // *** LƯU Ý QUAN TRỌNG: Không vẽ (render) ở đây để tăng tốc training ***
        // Việc vẽ canvas rất tốn tài nguyên, chỉ vẽ khi replay episode tốt nhất

        // Lưu lại dữ liệu vào các batch
        actionBatch.push(action);
        rewardBatch.push(stepResult.reward);  // Reward: 1 nếu chưa fail, 0 nếu fail
        valueBatch.push(value);

        // Cập nhật trạng thái cho bước tiếp theo
        state = stepResult.state;
        totalReward += stepResult.reward;
        
        // Điều kiện kết thúc episode:
        // - Môi trường báo done (xe ra ngoài hoặc gậy ngã)
        // - Hoặc đạt 2000 điểm (giới hạn để tránh tràn bộ nhớ nếu mô hình học quá tốt)
        if (stepResult.done || totalReward >= 2000) break; 
    }

    // ==========================================
    // PHASE B: TÍNH TOÁN RETURNS VÀ CẬP NHẬT MẠNG
    // ==========================================
    
    // Tính discounted returns (giá trị kỳ vọng từ mỗi time step)
    // Return tại time step t = reward_t + gamma * reward_{t+1} + gamma^2 * reward_{t+2} + ...
    // Dùng backward pass để tính hiệu quả: đi từ cuối episode về đầu
    const returns = [];
    let R = 0;  // Return tích lũy từ cuối episode
    
    // Duyệt ngược từ bước cuối cùng về bước đầu tiên
    for (let i = rewardBatch.length - 1; i >= 0; i--) {
        // Return tại bước i = reward tại bước i + gamma * return tại bước i+1
        R = rewardBatch[i] + gamma * R;
        // Thêm vào đầu mảng (unshift) để giữ thứ tự thời gian
        returns.unshift(R);
    }

    // Cập nhật trọng số mạng bằng gradient descent
    // tf.tidy() để tự động cleanup tensor sau khi xong
    tf.tidy(() => {
        // Chuyển đổi các batch thành tensor
        const stateTensor = tf.tensor2d(stateBatch);      // [num_steps, 4]
        const returnsTensor = tf.tensor1d(returns);       // [num_steps]
        const actionsTensor = tf.tensor1d(actionBatch, 'int32');  // [num_steps], kiểu integer
        
        // Hàm loss để tối thiểu hóa
        optimizer.minimize(() => {
            // Dự đoán lại policy và values từ states
            const [probs, values] = model.predict(stateTensor);
            
            // ===== CRITIC LOSS (Value Loss) =====
            // So sánh giá trị dự đoán với returns thực tế
            // Dùng Mean Squared Error (MSE)
            // Mục tiêu: critic học cách đánh giá chính xác giá trị của trạng thái
            const valueLoss = tf.losses.meanSquaredError(
                returnsTensor,           // Giá trị thực tế (ground truth)
                values.reshape([-1])     // Giá trị dự đoán, reshape về 1D
            );
            
            // ===== ADVANTAGE =====
            // Advantage = Returns - Value
            // Đo lường hành động tốt hơn hay tệ hơn so với kỳ vọng
            // Advantage > 0: hành động tốt hơn kỳ vọng -> nên tăng xác suất
            // Advantage < 0: hành động tệ hơn kỳ vọng -> nên giảm xác suất
            const advantage = returnsTensor.sub(values.reshape([-1]));
            
            // ===== ACTOR LOSS (Policy Loss) =====
            // Chuyển actions thành one-hot encoding: [0] -> [1,0], [1] -> [0,1]
            const oneHotActions = tf.oneHot(actionsTensor, numActions);
            
            // Lấy xác suất của hành động đã chọn
            // probs: [num_steps, 2] (xác suất cho action 0 và 1)
            // oneHotActions: [num_steps, 2] (1 ở vị trí action đã chọn)
            // mul: nhân element-wise, sum(1): tổng theo chiều hành động -> được [num_steps]
            const selectedProbs = probs.mul(oneHotActions).sum(1);
            
            // Tính log probability (cần cho policy gradient)
            // Thêm 1e-5 để tránh log(0) = -Infinity (khi xác suất = 0)
            const logProbs = selectedProbs.log().add(1e-5);
            
            // Policy Loss = -mean(log_prob * advantage)
            // Dấu trừ vì ta muốn maximize reward nên minimize negative reward
            // Nhân với advantage để tăng xác suất hành động tốt, giảm hành động xấu
            const policyLoss = logProbs.mul(advantage).mean().mul(-1);
            
            // Tổng loss = Policy Loss + Value Loss
            // Cân bằng giữa việc học policy tốt và đánh giá chính xác
            return policyLoss.add(valueLoss);
        });
    });

    // ==========================================
    // PHASE C: KIỂM TRA KỶ LỤC VÀ ĐIỀU HƯỚNG
    // ==========================================
    
    episodeCount++;  // Tăng bộ đếm episode
    
    // Lấy reference đến các phần tử UI để cập nhật
    const mainStatus = document.getElementById('status-main');
    const subStatus = document.getElementById('status-sub');

    // Luôn cập nhật kỷ lục hiện tại
    subStatus.innerText = `Current record: ${maxRewardSoFar.toFixed(0)}`;

    // Kiểm tra xem có phá kỷ lục không
    if (totalReward > maxRewardSoFar) {
        // ========== PHÁ KỶ LỤC MỚI! ==========
        maxRewardSoFar = totalReward;
        
        // Lưu lại toàn bộ chuỗi trạng thái của episode tốt nhất
        // Copy toàn bộ stateBatch để dùng cho replay sau này
        bestEpisodeStates = [...stateBatch];
        
        // Lưu lại model weights của mô hình tốt nhất
        // Clone model để có bản sao độc lập, không bị ảnh hưởng bởi training tiếp theo
        // Điều này cho phép chơi thử với policy tốt nhất ngay cả khi mô hình hiện tại đã thay đổi
        if (bestModel) {
            bestModel.dispose();  // Giải phóng model cũ để tránh memory leak
        }
        // Clone toàn bộ model với cùng cấu trúc
        bestModel = createActorCriticModel();
        // Copy weights từ model hiện tại sang bestModel
        // getWeights() trả về array các tensor, setWeights() sẽ tự động clone nội bộ
        const weights = model.getWeights();
        bestModel.setWeights(weights); 
        
        // Cập nhật UI: thông báo kỷ lục mới và chuẩn bị replay
        mainStatus.innerText = `New record Ep ${episodeCount}: ${totalReward.toFixed(0)} points. Preparing replay...`;
        mainStatus.classList.add('highlight-record');

        // Đợi 1 giây rồi bắt đầu chiếu lại episode tốt nhất
        // Thời gian này để người dùng có thể đọc thông báo
        setTimeout(() => {
            mainStatus.classList.remove('highlight-record');
            replayBestEpisode();  // Bắt đầu replay
        }, 1000);

    } else {
        // ========== CHƯA PHÁ KỶ LỤC ==========
        // Hiển thị thông tin episode hiện tại
        mainStatus.innerText = `Training Ep ${episodeCount}... Score: ${totalReward.toFixed(0)}`;
        
        // Tiếp tục training episode tiếp theo ngay lập tức
        // setImmediate ưu tiên hơn setTimeout nhưng không phải trình duyệt nào cũng hỗ trợ
        // Nên dùng fallback setTimeout(..., 0) nếu setImmediate không có
        if (isTraining) {
            (window.setImmediate || setTimeout)(runEpisode, 0);
        }
    }
}

// ===========================
// 4.5. HÀM CHƠI THỬ (TEST PLAY)
// ===========================

/**
 * Chơi thử một episode với mô hình hiện tại
 * Khác với training: có render đầy đủ, không cập nhật trọng số mạng
 * Cho phép người dùng xem mô hình chơi như thế nào với policy hiện tại
 */
async function playTestEpisode() {
    // Nếu đang replay hoặc đang test play khác thì bỏ qua
    if (isReplaying || isTestPlaying) return;
    
    // Kiểm tra xem đã có best model chưa
    // Nếu chưa có episode tốt nhất thì không thể test play
    if (!bestModel) {
        const mainStatus = document.getElementById('status-main');
        mainStatus.innerText = "No best model yet. Train more to get a record first!";
        return;
    }
    
    // Bật cờ test play và tạm dừng training
    isTestPlaying = true;
    const wasTraining = isTraining;  // Lưu lại trạng thái training trước đó
    isTraining = false;              // Tạm dừng training
    
    // Cập nhật UI và disable button để tránh click nhiều lần
    const mainStatus = document.getElementById('status-main');
    const subStatus = document.getElementById('status-sub');
    const testBtn = document.getElementById('btn-test');
    testBtn.disabled = true;
    testBtn.innerText = "Playing...";
    
    mainStatus.innerText = `Test Play: Playing with BEST model (Record: ${maxRewardSoFar.toFixed(0)} points)...`;
    subStatus.innerText = "Using the best policy learned so far.";
    
    // Tạo môi trường mới để test (không dùng env chung với training)
    const testEnv = new CartPole();
    let state = testEnv.reset();
    let totalReward = 0;
    let stepCount = 0;
    
    // Chạy episode với render đầy đủ
    while (true) {
        // Render trạng thái hiện tại
        render(state);
        
        // Dự đoán hành động từ BEST MODEL (policy tốt nhất) thay vì model hiện tại
        // Điều này cho phép xem mô hình tốt nhất chơi như thế nào
        const actionInfo = tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            const [probs] = bestModel.predict(stateTensor);  // Dùng bestModel thay vì model
            const probData = probs.dataSync();
            
            // Chọn hành động theo policy (sampling)
            const action = Math.random() < probData[0] ? 0 : 1;
            return { action };
        });
        
        // Thực hiện hành động
        const stepResult = testEnv.step(actionInfo.action);
        state = stepResult.state;
        totalReward += stepResult.reward;
        stepCount++;
        
        // Cập nhật UI với điểm số hiện tại
        mainStatus.innerText = `Test Play: Score ${totalReward} (${stepCount} steps)`;
        
        // Đợi một chút để animation mượt mà (20ms = 50fps)
        await new Promise(r => setTimeout(r, 20));
        
        // Kiểm tra điều kiện kết thúc: chỉ dừng khi thua (done = true)
        // Không giới hạn điểm số, để xem mô hình có thể chơi được bao lâu
        if (stepResult.done) {
            break;
        }
    }
    
    // Hiển thị kết quả cuối cùng
    mainStatus.innerText = `Test Play Finished: ${totalReward.toFixed(0)} points in ${stepCount} steps`;
    subStatus.innerText = `Current record: ${maxRewardSoFar.toFixed(0)}`;
    
    // Re-enable button
    testBtn.disabled = false;
    testBtn.innerText = "Test Play";
    
    // Đợi 2 giây để người dùng xem kết quả
    await new Promise(r => setTimeout(r, 2000));
    
    // Tắt cờ test play và khôi phục trạng thái training
    isTestPlaying = false;
    isTraining = wasTraining;
    
    // Nếu đang trong chế độ training thì tiếp tục training
    if (isTraining) {
        mainStatus.innerText = "Resuming training...";
        runEpisode();
    } else {
        mainStatus.innerText = "Training paused. Click 'Test Play' again or 'Resume Training'.";
    }
}

// ===========================
// 5. ĐIỀU KHIỂN GIAO DIỆN NGƯỜI DÙNG (UI CONTROLS)
// ===========================

/**
 * Bật/tắt chế độ training (pause/resume)
 * Được gọi khi người dùng click nút "Pause" hoặc "Resume Training"
 */
function toggleTraining() {
    // Đảo trạng thái training
    isTraining = !isTraining;
    
    // Lấy reference đến các phần tử UI
    const btn = document.getElementById('btn-toggle');
    const status = document.getElementById('status-main');
    
    if (isTraining) {
        // Chuyển sang chế độ đang training
        btn.innerText = "Pause";
        status.innerText = "Resuming training...";
        
        // Chỉ chạy episode mới nếu không đang trong quá trình replay
        // Nếu đang replay thì sẽ tự động tiếp tục sau khi replay xong
        if (!isReplaying) {
            runEpisode();
        }
    } else {
        // Chuyển sang chế độ tạm dừng
        btn.innerText = "Resume Training";
        status.innerText = "Training paused.";
        // Không cần gọi runEpisode() vì runEpisode() sẽ tự kiểm tra isTraining
        // và return ngay nếu isTraining = false
    }
}

// ===========================
// KHỞI TẠO VÀ BẮT ĐẦU CHƯƠNG TRÌNH
// ===========================

// Vẽ một frame đầu tiên ngay khi trang load
// Điều này đảm bảo canvas không bị trắng khi đợi TensorFlow.js khởi tạo
render(env.reset());

// Đợi 1 giây để:
// 1. TensorFlow.js có thời gian load và khởi tạo hoàn toàn
// 2. Người dùng có thể thấy trạng thái ban đầu trước khi training bắt đầu
setTimeout(runEpisode, 1000);
