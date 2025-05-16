let cartPoleEnv; // Đối tượng môi trường CartPole
let policyNet;   // Đối tượng mạng chính sách

// Các hằng số cấu hình cho mô hình và môi trường
const SEQUENCE_LENGTH = 8;
const NUM_FEATURES = 4;
const NUM_ACTIONS = 2;
const LEARNING_RATE = 0.001; // Giảm learning rate một chút
const MAX_STEPS_PER_EPISODE_HEADLESS = 500; 
const MAX_STEPS_PER_EPISODE_VISUAL = 500; 

// Biến theo dõi quá trình huấn luyện và mô phỏng
let currentEpisode = 0;
let currentScore = 0;
let maxScore = 0;
let averageScore = 0;
const scoreHistory = [];
const MAX_HISTORY_LENGTH = 100;

let currentStateSequence = [];

// Các phần tử giao diện người dùng
let infoDisplay;
let trainButton;
let fastTrainButton;
let isTrainingVisual = true; 
let isHeadlessTrainingActive = false;
let visualEpisodeInProgress = false; // Cờ mới để tuần tự hóa gameStepVisual

async function setup() {
    createCanvas(700, 450);

    infoDisplay = select('#info');
    if (!infoDisplay) console.error("HTML element with ID 'info' not found!");

    trainButton = select('#trainButton');
    if (!trainButton) console.error("HTML element with ID 'trainButton' not found!");

    fastTrainButton = select('#fastTrainButton');
    if (!fastTrainButton) console.error("HTML element with ID 'fastTrainButton' not found!");

    if (infoDisplay) infoDisplay.html('Đang khởi tạo môi trường và mạng nơ-ron...');

    cartPoleEnv = new CartPoleEnv();
    policyNet = new PolicyNetwork(SEQUENCE_LENGTH, NUM_FEATURES, NUM_ACTIONS, LEARNING_RATE);

    if (trainButton) {
        trainButton.mousePressed(() => {
            if (isHeadlessTrainingActive) {
                console.log("Đang huấn luyện không đồ họa, không thể thay đổi chế độ huấn luyện thường.");
                return;
            }
            isTrainingVisual = !isTrainingVisual;
            trainButton.html(isTrainingVisual ? 'Tạm dừng Huấn luyện (Visual)' : 'Tiếp tục Huấn luyện (Visual)');
            console.log(isTrainingVisual ? "Huấn luyện đồ họa được tiếp tục." : "Huấn luyện đồ họa đã tạm dừng.");
        });
    } else {
        console.warn("trainButton không tìm thấy, sự kiện mousePressed sẽ không được gắn.");
    }

    if (fastTrainButton) {
        fastTrainButton.mousePressed(async () => {
            if (isHeadlessTrainingActive || visualEpisodeInProgress) {
                console.log("Một tiến trình khác đang chạy (huấn luyện không đồ họa hoặc lượt chơi đồ họa).");
                return;
            }
            await trainingWOGraphicRender(2000);
        });
    } else {
        console.warn("fastTrainButton không tìm thấy, sự kiện mousePressed sẽ không được gắn.");
    }

    initializeEpisodeState();
    if (infoDisplay) infoDisplay.html('Sẵn sàng! Bắt đầu mô phỏng...');
}

function initializeEpisodeState() {
    currentScore = 0;
    let initialState = cartPoleEnv.reset();
    currentStateSequence = [];
    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        currentStateSequence.push(Array(NUM_FEATURES).fill(0));
    }
    updateStateSequence(initialState);
}

function updateStateSequence(newState) {
    currentStateSequence.shift();
    currentStateSequence.push(newState.slice());
}

async function gameStepVisual() {
    if (!policyNet || !policyNet.model || isHeadlessTrainingActive || visualEpisodeInProgress) {
        return;
    }
    visualEpisodeInProgress = true; // Đánh dấu bắt đầu xử lý lượt chơi đồ họa

    try {
        const { action, logProb } = await policyNet.predictAction(currentStateSequence);
        const [nextState, reward, done, _info] = cartPoleEnv.step(action);
        currentScore += reward;

        if (isTrainingVisual) {
            policyNet.record(currentStateSequence.map(s => s.slice()), action, reward);
        }
        logProb.dispose(); // Luôn dispose logProb sau khi sử dụng hoặc không sử dụng

        updateStateSequence(nextState);

        if (done || currentScore >= MAX_STEPS_PER_EPISODE_VISUAL) {
            currentEpisode++;
            if (currentScore > maxScore) {
                maxScore = currentScore;
            }
            scoreHistory.push(currentScore);
            if (scoreHistory.length > MAX_HISTORY_LENGTH) {
                scoreHistory.shift();
            }
            averageScore = scoreHistory.length > 0 ? scoreHistory.reduce((sum, val) => sum + val, 0) / scoreHistory.length : 0;

            let trainLossInfo = "N/A";
            if (isTrainingVisual && policyNet.episodeActions.length > 0) {
                const trainInfo = await policyNet.trainEpisode();
                trainLossInfo = trainInfo.loss !== undefined && !isNaN(trainInfo.loss) ? trainInfo.loss.toFixed(4) : "NaN/Error";
                console.log(`Lượt đồ họa ${currentEpisode} kết thúc. Điểm: ${currentScore}. Loss: ${trainLossInfo}`);
            } else if (isTrainingVisual && policyNet.episodeActions.length === 0) {
                 console.log(`Lượt đồ họa ${currentEpisode} kết thúc. Điểm: ${currentScore}. Không có data để huấn luyện.`);
                 // Dọn dẹp buffer nếu không huấn luyện để tránh tích tụ từ lượt trước
                 policyNet.episodeStateSequences = [];
                 policyNet.episodeActions = [];
                 policyNet.episodeRewards = [];
            }
            
            if (infoDisplay) {
                infoDisplay.html(`Lượt: ${currentEpisode} | Điểm: ${Math.round(currentScore)} | Cao nhất: ${Math.round(maxScore)} | TB 100: ${averageScore.toFixed(2)} | Loss: ${trainLossInfo}`);
            }
            initializeEpisodeState(); // Reset cho lượt chơi đồ họa tiếp theo
        }
    } catch (error) {
        console.error("Lỗi trong gameStepVisual:", error);
    } finally {
        visualEpisodeInProgress = false; // Đánh dấu kết thúc xử lý lượt chơi đồ họa
    }
}

async function trainingWOGraphicRender(nTimes) {
    if (isHeadlessTrainingActive) {
        console.log("Huấn luyện không đồ họa đã đang chạy.");
        return;
    }
    isHeadlessTrainingActive = true; // Đặt cờ này ĐẦU TIÊN
    if (fastTrainButton) {
        fastTrainButton.html('Đang Huấn Luyện Nhanh...');
        fastTrainButton.attribute('disabled', '');
    }
    if (trainButton) {
        trainButton.attribute('disabled', ''); 
    }

    console.log(`Bắt đầu huấn luyện không đồ họa cho ${nTimes} lượt...`);

    for (let i = 0; i < nTimes; i++) {
        let currentHeadlessScore = 0;
        let initialStateForHeadless = cartPoleEnv.reset(); // Môi trường được reset cho mỗi episode
        let currentSequenceForHeadless = []; // Chuỗi trạng thái cục bộ cho episode này
        for (let k = 0; k < SEQUENCE_LENGTH; k++) {
            currentSequenceForHeadless.push(Array(NUM_FEATURES).fill(0));
        }
        // Khởi tạo chuỗi cục bộ đúng cách
        currentSequenceForHeadless.shift(); 
        currentSequenceForHeadless.push(initialStateForHeadless.slice());

        let done = false;
        let stepsInEpisode = 0;

        // Buffer cục bộ cho policyNet trong headless training để không ảnh hưởng visual
        // Tuy nhiên, policyNet.record() sử dụng buffer của instance, nên cần đảm bảo nó được dọn dẹp
        // policyNet.trainEpisode() đã tự dọn dẹp buffer của nó.

        while (!done && stepsInEpisode < MAX_STEPS_PER_EPISODE_HEADLESS) {
            stepsInEpisode++;
            // Sử dụng chuỗi trạng thái cục bộ
            const { action, logProb } = await policyNet.predictAction(currentSequenceForHeadless);
            const [nextState, reward, episodeDone, _info] = cartPoleEnv.step(action);
            currentHeadlessScore += reward;

            policyNet.record(currentSequenceForHeadless.map(s_item => s_item.slice()), action, reward);
            logProb.dispose();

            currentSequenceForHeadless.shift();
            currentSequenceForHeadless.push(nextState.slice());
            done = episodeDone;
        }

        currentEpisode++; 
        if (currentHeadlessScore > maxScore) {
            maxScore = currentHeadlessScore;
        }
        scoreHistory.push(currentHeadlessScore);
        if (scoreHistory.length > MAX_HISTORY_LENGTH) {
            scoreHistory.shift();
        }
        averageScore = scoreHistory.length > 0 ? scoreHistory.reduce((sum, val) => sum + val, 0) / scoreHistory.length : 0;

        let trainLossInfo = "N/A";
        if (policyNet.episodeActions.length > 0) { // Kiểm tra buffer của policyNet
            const trainInfo = await policyNet.trainEpisode(); 
            trainLossInfo = trainInfo.loss !== undefined && !isNaN(trainInfo.loss) ? trainInfo.loss.toFixed(4) : "NaN/Error";
        } else {
            // Nếu không có actions, đảm bảo buffer của policyNet được dọn dẹp (trainEpisode đã làm)
             policyNet.episodeStateSequences = []; // Thêm để chắc chắn
             policyNet.episodeActions = [];
             policyNet.episodeRewards = [];
        }

        if ((i + 1) % 10 === 0 || i === nTimes - 1) { 
            console.log(`HL KĐH: Lượt ${currentEpisode} (Tổng ${i + 1}/${nTimes}). Điểm: ${currentHeadlessScore}. Loss: ${trainLossInfo}. TB 100: ${averageScore.toFixed(2)}`);
            if (infoDisplay) {
                infoDisplay.html(`Đang HL KĐH... Lượt ${currentEpisode} (${i + 1}/${nTimes}) | Cao nhất: ${maxScore.toFixed(0)} | TB 100: ${averageScore.toFixed(2)} | Loss: ${trainLossInfo}`);
            }
            await new Promise(resolve => setTimeout(resolve, 20)); // Tăng nhẹ thời gian chờ
        }
    }

    console.log("Hoàn tất huấn luyện không đồ họa.");
    if (infoDisplay) {
        infoDisplay.html(`Hoàn tất ${nTimes} lượt HL KĐH. Lượt hiện tại: ${currentEpisode} | Cao nhất: ${maxScore.toFixed(0)} | TB 100: ${averageScore.toFixed(2)}`);
    }
    
    isHeadlessTrainingActive = false;
    if (fastTrainButton) {
        fastTrainButton.html('Huấn luyện Nhanh (100 lượt)');
        fastTrainButton.removeAttribute('disabled');
    }
    if (trainButton) {
        trainButton.removeAttribute('disabled');
    }
    initializeEpisodeState(); // Reset trạng thái cho vòng lặp đồ họa tiếp theo
}

function draw() {
    if (!isHeadlessTrainingActive) { 
        background(235, 245, 255);
        cartPoleEnv.render(this); // Chỉ render nếu không huấn luyện không đồ họa
        gameStepVisual().catch(err => { // Gọi gameStepVisual
            console.error("Lỗi xảy ra trong gameStepVisual:", err);
        });
    } else {
        // Khi huấn luyện không đồ họa, chỉ vẽ nền và thông báo
        background(235, 245, 255);
        if (infoDisplay) { // infoDisplay được cập nhật bởi trainingWOGraphicRender
             // Không cần cập nhật infoDisplay ở đây nữa
        }
        fill(50);
        textSize(16);
        textAlign(CENTER, CENTER);
        text("Đang huấn luyện không đồ họa...", width/2, height/2);
    }

    // Cập nhật text hiển thị chung (có thể gộp với phần trên)
    if (infoDisplay) { // Chỉ cập nhật nếu infoDisplay tồn tại
        // Phần text này sẽ được cập nhật bởi gameStepVisual hoặc trainingWOGraphicRender
        // nên có thể không cần thiết ở đây nếu các hàm đó cập nhật đủ thường xuyên.
        // Tuy nhiên, để đảm bảo UI luôn có thông tin cơ bản:
        const statusTextVisual = isTrainingVisual ? 'Đang Huấn Luyện (Visual)' : 'Chỉ Chạy (Visual)';
        const statusTextHeadless = 'Đang Huấn Luyện Nhanh (KĐH)';
        
        // Hiển thị thông tin điểm số và trạng thái huấn luyện
        // (infoDisplay đã được cập nhật bởi các hàm kia, phần này có thể dùng để vẽ trực tiếp lên canvas nếu muốn)
        fill(50);
        textSize(16);
        textAlign(LEFT); // Reset textAlign cho các text vẽ trên canvas
        if (!isHeadlessTrainingActive) {
            text(`Lượt chơi (Episode): ${currentEpisode}`, 15, 30);
            text(`Điểm hiện tại: ${Math.round(currentScore)}`, 15, 55);
            text(`Điểm cao nhất: ${Math.round(maxScore)}`, 15, 80);
            text(`Điểm TB (100 lượt): ${averageScore.toFixed(2)}`, 15, 105);
            if (isTrainingVisual) {
                fill(0, 150, 0);
                text(statusTextVisual, 15, 130);
            } else {
                fill(200, 0, 0);
                text(statusTextVisual, 15, 130);
            }
        } else { // Nếu đang huấn luyện không đồ họa, infoDisplay đã được cập nhật
             // Chỉ vẽ trạng thái lên canvas
            fill(0, 0, 200);
            text(statusTextHeadless, 15, 30); // Hiển thị trạng thái KĐH lên canvas
            text(`Lượt tổng: ${currentEpisode}`, 15, 55);
            text(`Cao nhất: ${maxScore.toFixed(0)}`, 15, 80);
            text(`TB 100: ${averageScore.toFixed(2)}`, 15, 105);
        }
    }
}
