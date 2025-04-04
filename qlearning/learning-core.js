// Rời rạc hóa trạng thái để dùng làm key cho Q-table
function getState() {
    // Rời rạc hóa vị trí (ví dụ: chia thành 6x6 grid)
    let xState = constrain(floor(lander.x / (width / nWidthParts)), 0, nWidthParts - 1);
    let yState = constrain(floor(lander.y / (height / nHeightParts)), 0, nHeightParts - 1);

    // Rời rạc hóa vận tốc (ví dụ: chia thành các khoảng)
    let vxThreshold = 1.0;
    let vyThreshold = 1.5;
    let vxState = 0;
    if (lander.vx > vxThreshold) vxState = 1;
    else if (lander.vx < -vxThreshold) vxState = -1;

    let vyState = 0;
    if (lander.vy > vyThreshold) vyState = 1;
    else if (lander.vy < -vyThreshold) vyState = -1; // Có thể thêm nhiều mức hơn

    // Kết hợp thành chuỗi trạng thái
    return `${xState},${yState},${vxState},${vyState}`;
}

function chooseAction(stateKey) {
    // Khởi tạo Q-value cho trạng thái mới nếu chưa có
    if (!qTable[stateKey]) {
        qTable[stateKey] = Array(actions.length).fill(0);
    }

    // Chiến lược Epsilon-Greedy
    if (random() < epsilon) {
        // Khám phá: chọn hành động ngẫu nhiên
        return floor(random(actions.length));
    } else {
        // Khai thác: chọn hành động tốt nhất từ Q-table
        let qValues = qTable[stateKey];
        // Tìm giá trị Q lớn nhất
        let maxQ = -Infinity;
        for(let q of qValues) {
             if (q > maxQ) maxQ = q;
        }
        // Tìm tất cả các hành động có giá trị Q lớn nhất (để phá vỡ sự cân bằng ngẫu nhiên)
        let bestActions = [];
        for(let i=0; i < qValues.length; i++){
             if(qValues[i] === maxQ) {
                  bestActions.push(i);
             }
        }
        // Chọn ngẫu nhiên một trong các hành động tốt nhất
        return random(bestActions);
       // Hoặc đơn giản là: return qValues.indexOf(Math.max(...qValues));
    }
}

function applyAction(actionIndex) {
     if (actionIndex === null) return; // Không làm gì nếu không có hành động
    // Reset trạng thái điều khiển trực quan trước khi áp dụng hành động mới
    lander.controlState = "NONE";
    switch (actions[actionIndex]) {
        case "UP":
            lander.thrustUp();
            break;
        case "LEFT":
            lander.thrustLeft();
            break;
        case "RIGHT":
            lander.thrustRight();
            break;
        // case "NONE": không làm gì cả
    }
}

// Tính toán phần thưởng dựa trên trạng thái kết thúc ĐƯỢC TRUYỀN VÀO
function getReward(terminalState) {
    // 1. Phần thưởng/phạt lớn cho trạng thái kết thúc
    switch (terminalState) {
        case STATE_SUCCESS:
            return 1000; // Phần thưởng lớn khi hạ cánh thành công
        case STATE_CRASHED_GROUND:
            return -500; // Phạt nặng khi rơi trên mặt đất (sai vị trí/tốc độ)
        case STATE_CRASHED_OOB:
            return -1000; // Phạt cực nặng khi bay ra ngoài biên
        case STATE_RUNNING:
             // Tiếp tục tính phần thưởng trung gian nếu đang bay
             break;
        default:
             return 0; // Trường hợp không xác định
    }

    // 2. Phần thưởng/phạt trung gian khi đang bay (STATE_RUNNING)
    let intermediateReward = 0;

    // Khuyến khích ở gần tâm vùng đáp theo chiều ngang
    let targetX = landingZone.x + landingZone.w / 2;
    let distanceX = Math.abs(lander.x - targetX);
    // Phạt dựa trên bình phương khoảng cách để khuyến khích mạnh mẽ hơn khi ở xa
    intermediateReward -= (distanceX / (width / 2))**2 * 0.5; // Giảm trọng số phạt X

    // Khuyến khích giảm tốc độ khi gần mặt đất
    let distanceY = Math.abs(lander.y - groundY);
    let speedPenalty = (Math.abs(lander.vx) + Math.abs(lander.vy)) * 0.1; // Giảm nhẹ phạt tốc độ
    // Phạt tốc độ nhiều hơn khi gần mặt đất
    intermediateReward -= speedPenalty / (Math.sqrt(distanceY + 1)); // +1 để tránh chia cho 0

    // Phạt nhẹ cho mỗi bước thời gian để khuyến khích hạ cánh nhanh
    intermediateReward -= 0.05; // Phạt thời gian nhỏ

    return constrain(intermediateReward, -5, 5); // Giới hạn phần thưởng trung gian
}


function updateQTable(prevStateKey, actionIndex, reward, nextStateKey, isTerminal) {
    // Bỏ qua nếu không có trạng thái trước hoặc hành động
    if (prevStateKey === null || actionIndex === null) {
        return;
    }

    // Khởi tạo Q-value nếu trạng thái chưa tồn tại
    if (!qTable[prevStateKey]) {
        qTable[prevStateKey] = Array(actions.length).fill(0);
    }
    if (!qTable[nextStateKey]) {
        qTable[nextStateKey] = Array(actions.length).fill(0);
    }

    // Lấy giá trị Q hiện tại
    let oldQValue = qTable[prevStateKey][actionIndex];

    // Tính giá trị tương lai kỳ vọng (Expected Future Value)
    let futureValue = 0;
    if (!isTerminal) {
        // Nếu trạng thái tiếp theo không phải là kết thúc, giá trị tương lai là max Q của trạng thái đó
        futureValue = Math.max(...qTable[nextStateKey]);
    }
    // Nếu là trạng thái kết thúc, giá trị tương lai bằng 0 vì không có bước đi nào sau đó

    // Công thức cập nhật Q-Learning: Q(s, a) <- Q(s, a) + alpha * (reward + gamma * max Q(s', a') - Q(s, a))
    let newQValue = oldQValue + alpha * (reward + gamma * futureValue - oldQValue);

    // Cập nhật Q-table
    qTable[prevStateKey][actionIndex] = newQValue;

    // (Tùy chọn) Giảm epsilon từ từ để tăng cường khai thác khi AI đã học được nhiều
    if (epsilon > 0.01 && episodeCounter % 50 === 0) { // Giảm sau mỗi 50 episode
         epsilon *= 0.99;
    }
}