// --- Cài đặt NEAT ---
const POPULATION_SIZE = 60; // Kích thước quần thể, tăng để khám phá nhiều hơn
const MUTATION_RATE = 0.4; // Tỷ lệ đột biến, tăng để khám phá nhiều hơn
const ELITISM_PERCENT = 0.1; // Tỷ lệ chọn lọc, tăng để giữ lại nhiều cá thể tốt hơn

// --- Cài đặt Mô phỏng & Xe ---
const SENSOR_COUNT = 7;
const SENSOR_LENGTH = 100; // Chiều dài cảm biến
const MAX_SPEED = 5;
const STEER_FORCE = 0.12; // Lực rẽ (điều khiển góc)
const ACCELERATION = 0.08; // Lực tăng Gia tốc
const FRICTION = 0.03; // Lực ma sát (giảm tốc độ)
const MAX_TIME_ALIVE = 1000; // Tăng thời gian để về đích (~50s)
let DEBUG_MODE = true; // Bật/tắt vẽ debug

// --- Cài đặt Môi trường ---
const TRACK_WIDTH = 200; // Kích thước Đường đua 
const FINISH_LINE_Y = 0; // Vạch đích ở Y = 0
const NUM_OBSTACLES = 10; // số lượng obstacles
const OBSTACLE_MIN_RADIUS = 15; // Kích thước chướng ngại vật nhỏ nhất
const OBSTACLE_MAX_RADIUS = 20; // Kích thước chướng ngại vật lớn nhất
const OBSTACLE_MIN_DIST = 50; // Khoảng cách tối thiểu giữa các chướng ngại vật
const OBSTACLE_MAX_DIST = 100; // Khoảng cách tối đa giữa các chướng ngại vật

// --- Biến Toàn Cục ---
let neat;
let population = [];
let obstacles = [];
let leftBoundary = {};
let rightBoundary = {};
let bottomBoundary = {};
let finishLine = {};

let generation = 0;
let highestFitness = 0; // Fitness cao nhất của thế hệ TRƯỚC
let currentHighestFitness = 0; // Fitness cao nhất của thế hệ HIỆN TẠI (để highlight)
let averageFitness = 0;
let activeCars = 0; // Xe đang chạy (alive and not finished)
let startYPosition; // Vị trí Y xuất phát

function setup() {
    createCanvas(windowWidth, windowHeight);
    startYPosition = height - 60; // Xuất phát gần cuối hơn

    // Kiểm tra thư viện, cài đặt cho TensorFlow.js nếu có
    try {
        if (tf) tf.setBackend("cpu");
        else throw new Error();
    } catch (e) {
        console.warn("TensorFlow.js (tf) not found or backend setting failed.");
    }

    // 1. Tạo môi trường ban đầu
    createEnvironment(startYPosition);

    // 2. Khởi tạo NEAT
    const inputSize = SENSOR_COUNT + 2 + 1; // số cảm biến + tốc độ hiện tại vx, vy và khoảng cách đến điểm đích
    neat = new neataptic.Neat(inputSize, 2, null, {
        mutation: neataptic.methods.mutation.ALL, 
        popsize: POPULATION_SIZE, 
        mutationRate: MUTATION_RATE,
        elitism: Math.round(ELITISM_PERCENT * POPULATION_SIZE),
        network: new neataptic.architect.Random( 
            inputSize,
            Math.ceil(inputSize / 1.5),
            Math.ceil(inputSize / 1.5),
            Math.ceil(inputSize / 1.5),
            Math.ceil(inputSize / 1.5),
            Math.ceil(inputSize / 1.5),
            Math.ceil(inputSize / 1.5),
            2
        ),});

    console.log("NEAT Initialized.");

    // 3. Bắt đầu thế hệ đầu tiên
    startNextGeneration();
}

function draw() {
    background(51);

    // --- Camera ---
    let targetY = startYPosition;
    let livingCarsYSum = 0;
    let livingCarsCount = 0;
    for (const car of population) {
        if (car.alive) {
            // Chỉ tính xe đang chạy vào vị trí camera
            livingCarsYSum += car.pos.y;
            livingCarsCount++;
        }
    }
    if (livingCarsCount > 0) targetY = livingCarsYSum / livingCarsCount;
    translate(0, -targetY + height * 0.8); // Giữ trung bình xe sống ở 60% dưới màn hình

    // 1. Vẽ Môi trường
    drawEnvironment();

    // 2. Cập nhật & Vẽ Xe
    activeCars = 0;
    currentHighestFitness = 0;
    highestFitness = 0; // Reset mỗi frame để highlight

    for (let i = population.length - 1; i >= 0; i--) {
        let car = population[i];

        if (car.alive && !car.finished) {
            activeCars++;
            car.look(obstacles, leftBoundary, rightBoundary, bottomBoundary);
            car.think();
            car.update();
            car.checkCollision(obstacles, leftBoundary, rightBoundary, bottomBoundary);

            if (car.alive) {
                car.checkFinishLine(finishLine);
            }
        }

        car.calculateFitness();
        if (car.fitness > currentHighestFitness) {
            currentHighestFitness = car.fitness;
        }
        if (car.fitness > highestFitness) {
            highestFitness = car.fitness;
        }

        car.draw();
    }

    // --- Vẽ HUD ---
    push();
    resetMatrix();
    displayInfo();
    pop();
    //----------------

    // 4. Chuyển thế hệ
    // Chỉ chuyển khi không còn xe nào đang *hoạt động* (alive và chưa finished)
    if (activeCars === 0 && population.length > 0) {
        nextGeneration();
    }
}

// ==================================================
// --- Quản lý Thế Hệ & NEAT ---
// ==================================================

function startNextGeneration() {
    population = [];
    let startX = width / 2;
    let startAngle = -PI / 2; // Hướng lên

    for (let i = 0; i < neat.popsize; i++) {
        population.push(
            new Car(neat.population[i], startX, startYPosition, startAngle)
        );
    }
    generation++;
    activeCars = population.length; // Reset số xe hoạt động
    console.log(`--- Starting Generation ${generation} ---`);
}

function nextGeneration() {
    console.log(`--- Generation ${generation} Ended ---`);
    // 1. Tính Stats (Lấy score từ genome đã được Car.calculateFitness cập nhật)
    let totalFitness = 0;
    let maxFitness = 0;
    for (let genome of neat.population) {
        totalFitness += genome.score;
        if (genome.score > maxFitness) maxFitness = genome.score;
    }
    highestFitness = maxFitness; // Lưu lại fitness cao nhất của thế hệ vừa xong
    averageFitness = totalFitness / neat.popsize;
    console.log(`Highest Fitness: ${highestFitness.toFixed(2)}, Average: ${averageFitness.toFixed(2)}`);

    // 2. Sort, Evolve, Mutate
    neat.sort();
    let newPopulation = [];
    for (let i = 0; i < neat.elitism; i++) {
        newPopulation.push(neat.population[i]);
    }
        
    for (let i = 0; i < neat.popsize - neat.elitism; i++) {
        newPopulation.push(neat.getOffspring());
    }
    neat.population = newPopulation;
    neat.mutate();

    // 3. Tạo lại Môi trường MỚI
    createEnvironment(startYPosition);

    // 4. Bắt đầu thế hệ mới
    startNextGeneration();
}

// ==================================================
// --- Tạo & Vẽ Môi trường ---
// ==================================================

function createEnvironment(startY) {
    obstacles = [];
    console.log("Creating new environment with bottom boundary...");

    // --- Biên Đường Đua ---
    let trackLeftX = width / 2 - TRACK_WIDTH / 2;
    let trackRightX = width / 2 + TRACK_WIDTH / 2;
    let trackTopY = FINISH_LINE_Y - 50;
    let trackBottomY = startY + 25; // Đặt biên dưới thấp hơn điểm xuất phát một chút

    leftBoundary = {
        x1: trackLeftX,
        y1: trackTopY,
        x2: trackLeftX,
        y2: trackBottomY,
        type: "line",
    };
    
    rightBoundary = {
        x1: trackRightX,
        y1: trackTopY,
        x2: trackRightX,
        y2: trackBottomY,
        type: "line",
    };

    bottomBoundary = {
        x1: trackLeftX,
        y1: trackBottomY,
        x2: trackRightX,
        y2: trackBottomY,
        type: "line",
    };

    // --- Vạch Đích ---
    finishLine = { y: FINISH_LINE_Y, x1: trackLeftX, x2: trackRightX };

    // --- Tạo Chướng Ngại Vật theo hình zigzag ---
    let safeZoneY = startY - 30;
    let spacingY = (safeZoneY - FINISH_LINE_Y) / NUM_OBSTACLES; // Khoảng cách dọc giữa các chướng ngại vật   
    let direction = 1; // Hướng zigzag (1: phải, -1: trái)

    for (let i = 0; i < NUM_OBSTACLES; i++) {
        let zigzagOffset = random(OBSTACLE_MAX_RADIUS, TRACK_WIDTH / 4); // Độ lệch zigzag
        let obsRadius = random(OBSTACLE_MIN_RADIUS, OBSTACLE_MAX_RADIUS);
        let obsY = FINISH_LINE_Y + spacingY * i + spacingY / 2; // Vị trí Y đều nhau
        let obsX = width / 2 + direction * zigzagOffset; // Zigzag qua lại quanh tâm đường đua

        // Đảm bảo chướng ngại vật không vượt ra ngoài biên đường đua
        obsX = constrain(obsX, trackLeftX + obsRadius, trackRightX - obsRadius);

        obstacles.push({ x: obsX, y: obsY, radius: obsRadius, type: "circle" });

        // Đổi hướng zigzag cho chướng ngại vật tiếp theo
        direction *= -1;
    }
    console.log(`Generated ${obstacles.length} zigzag obstacles.`);
}

function drawEnvironment() {
    // Vẽ Biên Trái/Phải
    stroke(150);
    strokeWeight(1);
    noFill(); // Giảm độ dày biên
    if (leftBoundary)
        line(leftBoundary.x1, leftBoundary.y1, leftBoundary.x2, leftBoundary.y2);
    if (rightBoundary)
        line(rightBoundary.x1, rightBoundary.y1, rightBoundary.x2, rightBoundary.y2);

    // Vẽ Biên Dưới
    if (bottomBoundary) {
        stroke(255, 165, 0, 200); // Màu cam
        strokeWeight(2);
        line(bottomBoundary.x1, bottomBoundary.y1, bottomBoundary.x2, bottomBoundary.y2);
    }

    // Vẽ Vạch Đích
    if (finishLine) {
        stroke(0, 255, 0, 200);
        strokeWeight(4);
        line(finishLine.x1, finishLine.y, finishLine.x2, finishLine.y);
    }

    // Vẽ Chướng Ngại Vật
    noStroke();
    fill(255, 80, 80, 200);
    if (obstacles) {
        for (const obs of obstacles) {
            ellipse(obs.x, obs.y, obs.radius * 2);
        }
    }
}

function keyPressed() {
    if (keyCode === 32) {
        DEBUG_MODE = !DEBUG_MODE; // Bật/tắt chế độ debug
        console.log(`Debug mode: ${DEBUG_MODE ? "ON" : "OFF"}`);
    }
}

function displayInfo() {
    fill(255);
    noStroke();
    textSize(10);
    textAlign(LEFT, TOP);
    
    text(`Generation: ${generation}`, 10, 10);
    text(`Cars Alive: ${activeCars} / ${POPULATION_SIZE}`, 10, 20);
    
    // Hiển thị fitness của thế hệ *trước* (đã hoàn thành)
    text(`Highest Fitness (Prev Gen): ${highestFitness.toFixed(2)}`, 10, 30);
    text(`Average Fitness (Prev Gen): ${averageFitness.toFixed(2)}`, 10, 40);
}
