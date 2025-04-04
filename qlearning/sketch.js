let lander;
let gravity = 0.05;
let wind = 0;
let groundY;
// --- Trạng thái Game ---
const STATE_RUNNING = 'RUNNING';
const STATE_SUCCESS = 'SUCCESS';
const STATE_CRASHED_GROUND = 'CRASHED_GROUND'; // Rơi chạm đất (ngoài vùng/quá tốc độ)
const STATE_CRASHED_OOB = 'CRASHED_OOB'; // Rơi ra ngoài biên
let gameState = STATE_RUNNING;
// ---------------------
let landingZone;
let qTable = {};
let actions = ["NONE", "UP", "LEFT", "RIGHT"];
let epsilon = 0.1; // Tỷ lệ khám phá
let alpha = 0.1;   // Tốc độ học
let gamma = 0.95;  // Hệ số chiết khấu phần thưởng tương lai

// Biến lưu trữ cho Q-learning update
let currentState;
let previousState;
let previousAction;
let nWidthParts = 6; // Số phần chia chiều rộng
let nHeightParts = 6; // Số phần chia chiều cao

// Biến theo dõi và hiển thị
let frameCounter = 0; // Đếm frame trong 1 episode để reset
let episodeReward = 0;
let rewardHistory = [];
let maxHistory = 150;
let episodeCounter = 0; // Đổi tên counter thành episodeCounter cho rõ nghĩa
let successCounter = 0;
let failCounter = 0;
let safeVy = 2.5; // Tốc độ rơi an toàn 
let safeVx = 1.5; // Tốc độ ngang an toàn 
let maxWindVariation = 0.0003;
let timer = 0; // Đếm frame tổng thể (có thể dùng để phạt thời gian)
let debugMode = false; // Chế độ debug

function setup() {
    createCanvas(600, 400);
    groundY = height - 40;
    landingZone = { x: width / 2 - 100, w: 200 };
    resetEpisode();
}

function resetEpisode() {
    // Lưu trữ kết quả của lần trước (nếu có)
    if (episodeCounter > 0) { // Chỉ lưu khi đã chạy ít nhất 1 episode
         if (rewardHistory.length > maxHistory) rewardHistory.shift();
         // Tính tỷ lệ thành công thực tế
         let successRate = (successCounter + failCounter > 0) ? successCounter / (successCounter + failCounter) : 0;
         rewardHistory.push(successRate);
         console.log(`Episode ${episodeCounter} ended. Reward: ${episodeReward.toFixed(2)}. Success Rate: ${successRate.toFixed(2)}.`);
    }

    // Khởi tạo lại các biến cho một lần tập mới
    lander = new Lander();
    gameState = STATE_RUNNING; // Reset trạng thái game
    frameCounter = 0;
    previousState = null;
    previousAction = null;
    episodeReward = 0;
    episodeCounter++; // Tăng bộ đếm episode
    timer = 0;        // Reset bộ đếm thời gian/frame của episode
    wind = 0;         // Reset gió
}

function draw() {
    background(30);
    strokeWeight(0.5);
    drawGround();
    drawLandingZone();
    drawRewardGraph();
    displayStatus(); // Hiển thị trạng thái (dùng gameState)
    if (debugMode) {
        drawScenePartitions(nWidthParts, nHeightParts); // Vẽ các đường phân chia scene
    }

    // Cập nhật và vẽ lander (luôn vẽ trừ khi bị OOB)
    if (gameState !== STATE_CRASHED_OOB) {
         lander.draw();
    } else {
         // Có thể vẽ biểu tượng nổ ở vị trí cuối cùng nếu muốn
    }

    // Xử lý logic chính của game và AI
    if (gameState === STATE_RUNNING) {
        // --- Chu kỳ Q-Learning ---
        // 1. Lấy trạng thái hiện tại (s)
        currentState = getState();

        // 2. Chọn hành động (a)
        let actionIndex = chooseAction(currentState);
        // Lưu trạng thái và hành động *trước khi* thực hiện để update Q-table sau
        let stateBeforeAction = currentState;
        let actionTaken = actionIndex;

        // 3. Thực hiện hành động & cập nhật môi trường
        applyAction(actionIndex);
        lander.applyGravity();
        // Tạo và áp dụng gió ngẫu nhiên
        let windVariation = random(-maxWindVariation, maxWindVariation);
        wind += windVariation;
        wind = constrain(wind, -0.03, 0.03);
        lander.applyWind(wind);
        lander.update(); // Cập nhật vị trí vật lý

        // 4. Quan sát trạng thái mới (s') và phần thưởng (r)
        let nextState = getState(); // Trạng thái sau khi hành động và vật lý được áp dụng
        let terminalStateReached = lander.checkStatus(); // Kiểm tra xem có rơi vào trạng thái kết thúc không
        let reward = getReward(terminalStateReached); // Tính phần thưởng cho việc chuyển đến trạng thái mới

        // 5. Cập nhật Q-Table
        updateQTable(stateBeforeAction, actionTaken, reward, nextState, terminalStateReached !== STATE_RUNNING);

        // Cập nhật tổng phần thưởng episode
        episodeReward += reward;

        // Chuyển sang trạng thái mới (có thể là terminal)
        gameState = terminalStateReached;

        // Tăng bộ đếm thời gian/frame
        timer++;

    } else {
        // --- Xử lý khi Episode kết thúc ---
        lander.stop(); // Dừng chuyển động của tàu

        // Vẽ hiệu ứng nếu rơi
        if (gameState === STATE_CRASHED_GROUND || gameState === STATE_CRASHED_OOB) {
            fill(255, 0, 0);
            textSize(35);
            textAlign(CENTER, CENTER);
            text("💥", lander.x, lander.y);
        }

        // Tăng frameCounter để đếm thời gian trước khi reset
        frameCounter++;
        if (frameCounter > 120) { // Reset sau 2 giây (120 frames / 60 fps)
            resetEpisode();
        }
    }
}

function keyPressed() {
    if (key === ' ') { // Nhấn 'D' để bật chế độ debug
        debugMode = !debugMode; // Chuyển đổi chế độ debug
    }
}

// --- Vẽ vời ---
function drawGround() {
    fill(80, 200, 100);
    rect(0, groundY, width, height - groundY);
}

function drawLandingZone() {
    fill(100, 100, 255);
    rect(landingZone.x, groundY, landingZone.w, 10); // Làm vùng đáp mỏng hơn chút
}

function drawScenePartitions(nWidthParts, nHeightParts) {
    stroke(50, 50, 50, 100); // Màu xám nhạt
    // vẽ các đường phân chia scene
    for (let i = 0; i < nWidthParts; i++) {
        line(i * (width / nWidthParts), 0, i * (width / nWidthParts), height);
    }
    for (let j = 0; j < nHeightParts; j++) {
        line(0, j * (height / nHeightParts), width, j * (height / nHeightParts));
    }    

    // tính xem tàu vũ trụ đang ở phần nào
    // tiếp tục tính toán xem vy và vx nằm trong khoảng nào từ -1,0,1 theo cách rời rạc hóa bên trên
    // vẽ hình chữ nhật cho phần đó với màu tính bằng cách grayscale = abs(vx) + abs(vy)
    let partWidth = width / nWidthParts;
    let partHeight = height / nHeightParts;
    let partX = Math.floor(lander.x / partWidth);
    let partY = Math.floor(lander.y / partHeight);
    
    let vx = lander.vx > safeVx ? 1 : (lander.vx < -safeVx ? -1 : 0); // 1 nếu lớn hơn safeVx, -1 nếu nhỏ hơn -safeVx, 0 nếu nằm trong khoảng [-safeVx, safeVx]
    let vy = lander.vy > safeVy ? 1 : (lander.vy < -safeVy ? -1 : 0); // 1 nếu lớn hơn safeVy, -1 nếu nhỏ hơn -safeVy, 0 nếu nằm trong khoảng [-safeVy, safeVy]    
    let unsafeRate  = abs(vx) + abs(vy);    // Tính tỷ lệ không an toàn (0-2)
    
    if (unsafeRate === 0) {
        fill(100, 255, 100, 100); // Màu xám nhạt hơn cho phần không an toàn
    } else if (unsafeRate === 1) {
        fill(255, 255, 100, 100); // Màu vàng nhạt cho phần không an toàn
    }
    else {
        fill(255, 100, 100, 100); // Màu đỏ nhạt cho phần không an toàn
    }

    rect(partX * partWidth, partY * partHeight, partWidth, partHeight); // Vẽ hình chữ nhật cho phần đó

    // vẽ giá trị trong Q-table cho phần đó
    // nằm ở 4 góc tương ứng với 4 hành động
    // nếu có giá trị trong Q-table cho phần đó thì vẽ
    // nếu không có thì vẽ màu xám nhạt
    let qValues = qTable[`${partX},${partY},${vx},${vy}`]; // Lấy Q-values cho phần đó
    if (qValues) {
        // vẽ 4 giá trị Q-table cho 4 hành động tương ứng: lên (0), trái (1), phải (2), không làm gì (3)
        
        // tìm max Q-value trong 4 hành động
        let maxQ = Math.max(...qValues);
        let maxQIndex = qValues.indexOf(maxQ); // tìm chỉ số hành động có Q-value lớn nhất

        // vị trí để vẽ trên, dưới, trái, phải
        let topPos = {x: partX * partWidth + partWidth / 2, y: partY * partHeight + partHeight / 4};
        let leftPos = {x: partX * partWidth + partWidth / 4, y: partY * partHeight + partHeight / 2};
        let rightPos = {x: partX * partWidth + partWidth * 3 / 4, y: partY * partHeight + partHeight / 2};
        let downPos = {x: partX * partWidth + partWidth / 2, y: partY * partHeight + partHeight * 3 / 4};

        fill(100, 255, 100, 200); // Màu xanh lá
        // vẽ một hình tròn nhỏ để biểu thị cho giá trị Q lớn nhất tại vị trí tương ứng
        if (maxQIndex === 0) { // Hành động "UP"
            ellipse(topPos.x, topPos.y, 10); // Vẽ hình tròn cho hành động "UP"
        } else if (maxQIndex === 1) { // Hành động "LEFT"
            ellipse(leftPos.x, leftPos.y, 10); // Vẽ hình tròn cho hành động "LEFT"
        } else if (maxQIndex === 2) { // Hành động "RIGHT"
            ellipse(rightPos.x, rightPos.y, 10); // Vẽ hình tròn cho hành động "RIGHT"
        } else { // Hành động "NONE"
            ellipse(downPos.x, downPos.y, 10); // Vẽ hình tròn cho hành động "NONE"
        }
              
    }
    else {
        fill(200, 200, 200, 100); // Màu xám nhạt nếu không có giá trị Q
        rect(partX * partWidth, partY * partHeight, partWidth / 2, partHeight / 2); // Vẽ hình chữ nhật cho phần đó
    }    

}

function drawRewardGraph() {
    let graphX = 10,
        graphY = 100,
        graphW = maxHistory, // Chiều rộng bằng số lượng lịch sử tối đa
        graphH = 50;

    // Vẽ khung
    noFill();
    stroke(255);
    rect(graphX, graphY, graphW, graphH);

    // Vẽ đường đồ thị tỷ lệ thành công
    noFill();
    beginShape();
    stroke(100, 255, 100); // Màu xanh lá
    for (let i = 0; i < rewardHistory.length; i++) {
        // Map index sang tọa độ x, map tỷ lệ (0-1) sang tọa độ y
        let x = map(i, 0, rewardHistory.length -1 , graphX, graphX + graphW); // điều chỉnh map để vẽ hết chiều rộng
        let y = map(rewardHistory[i], 0, 1, graphY + graphH, graphY); // Tỷ lệ từ 0 đến 1
        vertex(x, y);
    }
    endShape();

    // Hiển thị text thông tin
    fill(255);
    textSize(9);
    textAlign(LEFT, BOTTOM); // Canh chỉnh text
    text(`Episode: ${episodeCounter}`, graphX, graphY - 22);
    text(`Success Rate (Avg): ${rewardHistory.length > 0 ? (rewardHistory.reduce((a, b) => a + b, 0) / rewardHistory.length).toFixed(2) : 'N/A'}`, graphX, graphY - 12);
    text(`Success/Fail: ${successCounter}/${failCounter}`, graphX, graphY-2); // Đặt bên phải đồ thị

}

function displayStatus() {
    fill(255);
    strokeWeight(0.5);
    textSize(9); 
    textAlign(LEFT, TOP);
    let statusText = "";
    switch (gameState) {
        case STATE_RUNNING:
            statusText = "🚀 Q-Learning Pilot Active...";
            break;
        case STATE_SUCCESS:
            statusText = "✅ Landed Successfully!";
            break;
        case STATE_CRASHED_GROUND:
            statusText = "💥 Crashed on Ground!";
            break;
        case STATE_CRASHED_OOB:
            statusText = "💥 Crashed - Out of Bounds!";
            break;
    }
    text(statusText, 10, 10);
    text(`Velocity: vx=${lander.vx.toFixed(2)}, vy=${lander.vy.toFixed(2)}`, 10, 31);
    text(`Position: x=${lander.x.toFixed(1)}, y=${lander.y.toFixed(1)}`, 10, 43);
    text(`Wind: ${wind.toFixed(4)}`, 10, 55);
}