// --- Tham số môi trường ---
let gravity = 0.05;
let wind = 0;
let groundY;
let landingZone;
let maxWindVariation = 0.0003;
let safeVy = 2.0;
let safeVx = 1.2;

// --- Trạng thái mô phỏng ---
let timeStep = 0;
let generation = 0;
let simulationRunning = true;
let commonStartPos = {}; // Lưu vị trí bắt đầu chung để hiển thị

// --- Tham số Thuật toán Di truyền (GA) ---
let populationSize = 50; // Kích thước quần thể
let chromosomeLength = 150; // Độ dài chuỗi gen
let mutationRate = 0.02; // Tỉ lệ đột biến
const elitismCount = 2;
const actions = ["NONE", "UP", "LEFT", "RIGHT", ]; // 0, 1, 2, 3
let population = []; // Mảng chứa quần thể cá thể

// --- Lịch sử Fitness ---
let bestFitnessHistory = [];
let avgFitnessHistory = [];
let maxHistory = 100;

function setup() {
    createCanvas(600, 400);
    groundY = height - 50;
    landingZone = { x: width / 2 - 70, w: 140 };

    // Khởi tạo quần thể từ gp.js
    initializePopulation();
    // Reset lần đầu và lấy vị trí bắt đầu chung
    commonStartPos = resetSimulationForNewGeneration(width, height);

    console.log(`Generation ${generation} initialized. Starting at (${commonStartPos.startX.toFixed(0)}, ${commonStartPos.startY.toFixed(0)})`);
}

function draw() {
    background(30, 30, 50);
    drawGround();
    drawLandingZone();
    drawInfo(); // Vẽ thông tin trước đồ thị
    drawFitnessGraph(); // Vẽ đồ thị fitness

    // --- Cập nhật gió ---
    let windVariation = random(-maxWindVariation, maxWindVariation);
    wind += windVariation;
    wind = constrain(wind, -0.04, 0.04);

    // --- Chạy mô phỏng & Vẽ ---
    if (simulationRunning) {
        // Chạy 1 bước mô phỏng từ gp.js, truyền các tham số cần thiết
        runSimulationStep(wind, timeStep, gravity, groundY, landingZone, safeVx, safeVy);

        // Vẽ quần thể từ mảng population trong gp.js
        drawPopulation();

        timeStep++;

        // --- Kiểm tra kết thúc thế hệ ---
        let allDone = population.every((ind) => !ind.isAlive); // Kiểm tra xem tất cả cá thể đã dừng chưa
        if (timeStep >= chromosomeLength || allDone) {
            console.log(`Generation ${generation} finished simulation at step ${timeStep}. All done: ${allDone}`);

            // Tính fitness từ gp.js
            let fitnessResults = calculateFitnessAll(landingZone, groundY, safeVx, safeVy);

            // Lưu lịch sử fitness
            if (bestFitnessHistory.length > maxHistory)
                bestFitnessHistory.shift();
            if (avgFitnessHistory.length > maxHistory)
                avgFitnessHistory.shift();
            // Chỉ push nếu kết quả hợp lệ
            if (isFinite(fitnessResults.best))
                bestFitnessHistory.push(fitnessResults.best);
            if (isFinite(fitnessResults.avg))
                avgFitnessHistory.push(fitnessResults.avg);

            // Tiến hóa quần thể từ gp.js
            evolvePopulation();

            // Reset cho thế hệ mới và lấy điểm bắt đầu mới (nếu có thay đổi)
            timeStep = 0; // Reset timeStep
            commonStartPos = resetSimulationForNewGeneration(width, height);
            generation++;
            simulationRunning = true; // Đảm bảo chạy lại
            console.log(
                `Generation ${generation} started. Starting at (${commonStartPos.startX.toFixed(0)}, ${commonStartPos.startY.toFixed(0)})`
            );
        }
    } else {
        // Nếu cần xử lý gì đó khi toàn bộ quá trình dừng hẳn
        drawPopulation(); // Vẫn vẽ trạng thái cuối
    }
}

function resetTraining() {
    // Reset lại mọi thứ về trạng thái ban đầu
    timeStep = 0;
    generation = 0;
    simulationRunning = true;
    commonStartPos = resetSimulationForNewGeneration(width, height); // Lấy vị trí bắt đầu chung
    bestFitnessHistory = [];
    avgFitnessHistory = [];
    wind = 0; // Reset gió về 0
    initializePopulation(); // Khởi tạo lại quần thể
    console.log(`Simulation reset. Starting at (${commonStartPos.startX.toFixed(0)}, ${commonStartPos.startY.toFixed(0)})`);
}

// --- Các hàm vẽ Helper ---
function drawGround() {
    fill(100, 180, 100);
    noStroke();
    rect(0, groundY, width, height - groundY);
}

function drawLandingZone() {
    fill(100, 100, 255);
    noStroke();
    rect(landingZone.x, groundY, landingZone.w, 10);
}

function drawPopulation() {
    // Truy cập mảng population từ gp.js để vẽ
    for (let i = 0; i < population.length; i++) {
        // Vẽ lander của cá thể này và dấu X nếu rơi
        let ind = population[i];
        ind.lander.draw(i === 0 ? color(255, 255, 0, 220) : ind.isAlive ? color(255, 255, 255, 100): color(150, 150, 150, 50));
        if (!ind.isAlive && ind.status !== "SUCCESS") {
            return; // ko vẽ gì thêm nếu đã rơi vì vẽ rối mắt quá! :( 
            //   push();
            //   translate(ind.lander.x, ind.lander.y);
            //   stroke(255,0,0,150);
            //   strokeWeight(2);
            //   line(-5,-5, 5,5);
            //   line(-5,5, 5,-5);
            //   pop();
        }
    }
}

function drawInfo() {
    fill(255);
    textSize(10);
    textAlign(LEFT, TOP);
    text(`Generation: ${generation}`, 10, 10);
    text(`Time Step: ${timeStep} / ${chromosomeLength}`, 10, 25);
    text(`Population Size: ${populationSize}`, 10, 40);
    // Lấy best fitness từ quần thể đã sắp xếp
    if (
        population.length > 0 &&
        population[0].fitness !== -Infinity &&
        isFinite(population[0].fitness)
    ) {
        text(`Best Fitness: ${population[0].fitness.toFixed(0)}`, 10, 70);
    } else if (bestFitnessHistory.length > 0) {
        // Hiển thị best fitness cuối cùng từ history nếu quần thể chưa có fitness hợp lệ
        text(`Last Best Fit: ${bestFitnessHistory[bestFitnessHistory.length - 1].toFixed(0)}`, 10, 70);
    }

    textAlign(RIGHT, TOP);
    text(`Wind: ${wind.toFixed(4)}`, width - 10, 10);
    // Hiển thị vị trí bắt đầu chung của thế hệ này
    if (commonStartPos.startX !== undefined) {
        text(`Start: (${commonStartPos.startX.toFixed(0)}, ${commonStartPos.startY.toFixed(0)})`,width - 10,height - 40);
    }
}

function drawFitnessGraph() {
    let graphX = 30,
        graphY = height - 300,
        graphW = maxHistory * 1.5 > width - 20 ? width - 20 : maxHistory * 1.5,
        graphH = 60;

    let allFitnessValues = [...bestFitnessHistory, ...avgFitnessHistory].filter((f) => isFinite(f)); // Lọc bỏ giá trị không hợp lệ
    if (allFitnessValues.length === 0) return; // Chưa có dữ liệu hợp lệ

    let currentMax = Math.max(...allFitnessValues);
    let currentMin = Math.min(...allFitnessValues);

    if (currentMin >= currentMax) currentMax = currentMin + 1;

    // --- Vẽ khung và trục ---
    push(); // Sử dụng push/pop để giới hạn style
    translate(graphX, graphY); // Dịch chuyển gốc tọa độ để vẽ dễ hơn
    stroke(255, 100);
    noFill();
    rect(0, 0, graphW, graphH);

    // --- Vẽ đường Best Fitness ---
    stroke(100, 255, 100); // Xanh lá
    noFill();
    beginShape();
    for (let i = 0; i < bestFitnessHistory.length; i++) {
        if (!isFinite(bestFitnessHistory[i])) continue; // Bỏ qua nếu không hợp lệ
        let x = map(i, 0, Math.max(1, bestFitnessHistory.length - 1), 0, graphW);
        let y = map(bestFitnessHistory[i], currentMin, currentMax, graphH, 0); // Trục Y ngược
        vertex(x, constrain(y, 0, graphH));
    }
    endShape();

    // --- Vẽ đường Average Fitness ---
    stroke(255, 255, 100); // Vàng
    noFill();
    beginShape();
    for (let i = 0; i < avgFitnessHistory.length; i++) {
        if (!isFinite(avgFitnessHistory[i])) continue; // Bỏ qua nếu không hợp lệ
        let x = map(i, 0, Math.max(1, avgFitnessHistory.length - 1), 0, graphW);
        let y = map(avgFitnessHistory[i], currentMin, currentMax, graphH, 0);
        vertex(x, constrain(y, 0, graphH));
    }
    endShape();

    // --- Vẽ nhãn trục Y ---
    fill(200);
    noStroke();
    textSize(9);
    textAlign(RIGHT, BOTTOM);
    text(currentMax.toFixed(0), -2, 5); // Gần đỉnh
    textAlign(RIGHT, TOP);
    text(currentMin.toFixed(0), -2, graphH - 5); // Gần đáy

    pop(); // Khôi phục hệ tọa độ
}
