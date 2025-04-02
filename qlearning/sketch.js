let lander;
let gravity = 0.05;
let wind = 0;
let groundY;
let landed = false;
let crashed = false;
let landingZone;
let qTable = {};
let actions = ["NONE", "UP", "LEFT", "RIGHT"];
let epsilon = 0.1;
let alpha = 0.2; // Tốc độ học, alpha càng lớn thì tốc độ học càng nhanh nhưng dễ bị overfitting
let gamma = 0.95; // Hệ số giảm giá, gamma càng lớn thì càng chú trọng đến phần thưởng trong tương lai
let state; // Trạng thái hiện tại của tàu vũ trụ
let previousState; // Trạng thái trước đó của tàu vũ trụ
let previousAction; // Hành động trước đó của tàu vũ trụ
let frameCounter = 0;
let episodeReward = 0; // Phần thưởng cho một lần tập đáp
let rewardHistory = [];
let maxHistory = 150; // Số lượng phần thưởng tối đa được lưu trữ trong lịch sử
let counter = 0;
let successCounter = 0;
let failCounter = 0;
let safeVy = 3.8; // Tốc độ rơi tối đa cho phép khi hạ cánh
let safeVx = 2.2; // Tốc độ dịch trái phải tối đa cho phép khi hạ cánh
let maxWindVariation = 0.0003; // Biến thiên gió tối đa
let timer = 0; // Thời gian bay tính bằng giây

function setup() {
    createCanvas(600, 400);
    groundY = height - 40;
    resetEpisode();
    landingZone = {x: width / 2 - 40, w: 80};
}

function resetEpisode() {

    // Lưu trữ kết quả của lần trước
    if (rewardHistory.length > maxHistory) rewardHistory.shift();
    rewardHistory.push(successCounter / (failCounter + epsilon)); // Tính tỷ lệ thành công

    console.log(`Episode reward: ${episodeReward}`);

    // Khởi tạo lại các biến cho một lần tập mới
    lander = new Lander();
    landed = false;
    crashed = false;
    frameCounter = 0;
    previousState = null;
    previousAction = null;    
    episodeReward = 0;
    counter++;
    timer = 0;
}

function draw() {
    background(30);
    strokeWeight(0.5);
    drawGround();
    drawLandingZone();
    drawRewardGraph();

    // Tạo gió ngẫu nhiên
    let windVariation = random(-maxWindVariation, maxWindVariation);
    wind += windVariation;
    wind = constrain(wind, -0.1, 0.1);

    if (!landed && !crashed) {
        state = getState();
        let action = chooseAction(state);
        applyAction(action);

        lander.applyGravity(); // áp dụng trọng lực
        lander.applyWind(wind); // áp dụng gió
        lander.update(); // cập nhật vị trí
        lander.checkCollision(); // kiểm tra va chạm
        lander.checkBounds(); // kiểm tra ra ngoài biên

        let reward = getReward(timer); // tính phần thưởng
        episodeReward += reward; // cập nhật phần thưởng cho lần tập đáp này
        updateQTable(previousState, previousAction, reward, state); // cập nhật Q table

        previousState = state;
        previousAction = action;
    } else {
        if (frameCounter > 180) resetEpisode(); // khởi động lại sau 3 giây nếu hạ cánh thành công hoặc va chạm
        if (landed) {
            lander.vy = 0; // dừng tàu lại khi hạ cánh thành công
            lander.vx = 0;
        }
        if (crashed) {
            lander.vy = 0; // dừng tàu lại khi va chạm
            lander.vx = 0;
            // vẽ ký hiệu nổ khi va chạm
            fill(255, 0, 0);
            textSize(25);
            text("💥", lander.x - 20, lander.y - 10);
        }
    }

    frameCounter++;
    timer ++; // thời gian tính bằng giây
    if (!crashed) {
        lander.draw(); // vẽ tàu vũ trụ
    }
    displayStatus(); // hiển thị trạng thái
}

function drawGround() {
    fill(80, 200, 100);
    rect(0, groundY, width, height - groundY);
}

function drawLandingZone() {
    fill(100, 255, 255);
    rect(landingZone.x, groundY, landingZone.w, 10);
}

function drawRewardGraph() {
    let graphX = 10,
        graphY = 80,
        graphW = maxHistory,
        graphH = 50;

    fill(0);
    stroke(255);
    rect(graphX, graphY, graphW, graphH);
    noFill();
    beginShape();
    stroke(100, 255, 100);
    for (let i = 0; i < rewardHistory.length; i++) {
        let x = map(i, 0, maxHistory, graphX, graphX + graphW);
        let y = map(rewardHistory[i], -0.1, 1.1, graphY + graphH, graphY);
        vertex(x, y);
    }
    endShape();
    fill(255);
    textSize(9);
    text(`Reward over time (# trials = ${counter}, rate: ${successCounter} / ${failCounter})`, graphX, graphY - 5);
}

function displayStatus() {
    fill(255);
    textSize(9);
    if (landed) {
        text("✅ Landed Successfully in Zone!", 10, 20);    
        
    } else if (crashed) {
        text("💥 Crashed!", 10, 20);
    } else {
        text("Q-learning pilot active...", 10, 20);
    }

    text(`Velocity: vy=${lander.vy.toFixed(2)}, vx=${lander.vx.toFixed(2)}`, 10, 40);
    text(`Wind: ${wind.toFixed(3)}`, 10, 60);
}

function getState() {
    let x = floor(lander.x / 40);
    let y = floor(lander.y / 40);
    let vx = floor(lander.vx * 10);
    let vy = floor(lander.vy * 10);
    return `${x},${y},${vx},${vy}`;
}

function chooseAction(state) {
    if (!qTable[state]) qTable[state] = Array(actions.length).fill(0);
    if (random() < epsilon) {
        return floor(random(actions.length));
    } else {
        return qTable[state].indexOf(Math.max(...qTable[state]));
    }
}

function applyAction(action) {
    switch (actions[action]) {
        case "UP":
            lander.thrustUp();
            break;
        case "LEFT":
            lander.thrustLeft();
            break;
        case "RIGHT":
            lander.thrustRight();
            break;
    }
}

function getReward(t = 0) {
    const maxDistance = width / 2; // Khoảng cách tối đa từ tâm đến biên
    const epsilon = 0.1; // Hằng số nhỏ tránh chia cho 0

    // Kiểm tra trạng thái khi chạm đất
    if (lander.y <= groundY) {
        const inLandingZone = lander.x >= (landingZone.x - landingZone.w / 2) && 
                              lander.x <= (landingZone.x + landingZone.w / 2);
        const safeVelocity = Math.abs(lander.vx) < 0.5 && Math.abs(lander.vy) < 1.0;
        
        if (inLandingZone && safeVelocity) {
            return 10000; // Hạ cánh thành công
        } else {
            return -10000; // Va chạm hoặc hạ cánh thất bại
        }
    }

    // Khi đang bay
    let reward = 0;

    // Khoảng cách đến trung tâm vùng hạ cánh
    let distanceToLandingZone = Math.abs(lander.x - (landingZone.x + landingZone.w / 2));
    reward += -distanceToLandingZone / maxDistance; // Chuẩn hóa khoảng cách

    // Phạt vận tốc, tăng mạnh khi gần mặt đất
    let distanceToGround = Math.abs(lander.y - groundY);
    let totalVelocity = Math.abs(lander.vx) + Math.abs(lander.vy);
    reward += -totalVelocity / (Math.sqrt(distanceToGround) + epsilon);

    // Phạt thời gian
    reward += -t / 10; // Tăng hình phạt thời gian

    return reward;
}

function updateQTable(prevState, action, reward, newState) {
    if (!prevState || action === null) return; // không cập nhật nếu không có trạng thái trước hoặc hành động
    // khởi tạo Q-table nếu chưa có
    if (!qTable[prevState]) qTable[prevState] = Array(actions.length).fill(0); 
    if (!qTable[newState]) qTable[newState] = Array(actions.length).fill(0); 

    // cập nhật Q-table theo công thức Q-learning
    let oldValue = qTable[prevState][action]; // giá trị Q cũ
    let futureValue = Math.max(...qTable[newState]); // giá trị Q tối đa của trạng thái mới
    // cập nhật giá trị Q theo công thức Q-learning
    // với công thức là Q(s, a) = Q(s, a) + α * (r + γ * max(Q(s', a')) - Q(s, a))
    // trong đó:
    // - Q(s, a): giá trị Q của trạng thái s và hành động a
    // - r: phần thưởng nhận được sau khi thực hiện hành động a
    // - γ: hệ số giảm giá (discount factor)
    // - max(Q(s', a')): giá trị Q tối đa của trạng thái mới s'
    // - α: hệ số học (learning rate)    
    qTable[prevState][action] =
        oldValue + alpha * (reward + gamma * futureValue - oldValue);
}
