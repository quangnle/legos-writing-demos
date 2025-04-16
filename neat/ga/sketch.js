// ==========================
// === File: sketch.js ===
// ==========================

// --- Network Constants ---
// (Được dùng bởi ga.js và car.js)
const NETWORK_INPUT_NODES = 7;  // 5 sensors + dist + angle
const NETWORK_HIDDEN_NODES = 10; // Lớp ẩn
const NETWORK_OUTPUT_NODES = 2; // throttle, steer

// --- GA Constants ---
// (Được dùng bởi ga.js và sketch.js)
const POPULATION_SIZE = 70;

// --- Environment Constants ---
const TRACK_WIDTH = 300;    // Chiều rộng track
const FINISH_LINE_Y = 100;  // Đích
const NUM_OBSTACLES = 25;   // Số lượng vật cản hơn
const OBSTACLE_MIN_RADIUS = 8;
const OBSTACLE_MAX_RADIUS = 25;

// --- Simulation Constants ---
const MAX_TIME_ALIVE = 1000; // Thời gian tối đa
const DEBUG_MODE = true;

// --- Physics Constants ---
// (Được dùng bởi car.js)
const MAX_SPEED = 5.0; // Tăng tốc độ tối đa
const STEER_FORCE = Math.PI / 90; // Góc lái tối đa mỗi frame (radians)
// Các hằng số khác như ACCELERATION, FRICTION không dùng trong logic Car hiện tại

// --- Sensor Constants ---
// (Được dùng bởi car.js)
const SENSOR_COUNT = NETWORK_INPUT_NODES - 2; // = 5
const SENSOR_LENGTH = 160; // Tầm nhìn

// --- Global Variables ---
let cars = [];
let obstacles = [];
let leftBoundary = {}, rightBoundary = {}, bottomBoundary = {}, finishLine = {};
let goal = {}; // Tọa độ tâm đích {x, y}

let generation = 0;
let highestFitnessLastGen = 0;
let averageFitnessLastGen = 0;
let currentHighestFitness = 0; // Dùng để highlight xe tốt nhất trong Car.draw
let activeCarsCount = 0;
let startPosVec;             // Vector vị trí xuất phát

function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(RADIANS); // QUAN TRỌNG: Dùng radians cho p5
    tf.setBackend('cpu').then(() => console.log("TF Backend set to CPU (recommended for many small models)"));

    startPosVec = createVector(width / 2, height - 60);
    createEnvironment(startPosVec.y); // Tạo môi trường đầu tiên
    startFirstGeneration();           // Tạo population đầu tiên
    console.log("Setup complete. Starting simulation...");
}

// ==================================================
// --- P5.js Draw Loop ---
// ==================================================
function draw() {
    background(45); // Nền tối hơn

    // --- Camera ---
    // let avgY = startPosVec.y; let count = 0;
    // for(let car of cars){ if(car.alive){ avgY += car.pos.y; count++; } }
    // if(count > 0) avgY /= count; else { // Nếu không có xe sống, lấy trung bình Y của xe đã chết/finish gần nhất
    //     let lastY = startPosVec.y;
    //     for(let car of cars) lastY = min(lastY, car.pos.y);
    //     avgY = lastY;
    // }
    // translate(0, -avgY + height * 0.85); // Điều chỉnh vị trí camera
    //----------------

    // 1. Vẽ Môi trường
    drawEnvironment();

    // 2. Cập nhật & Vẽ Xe
    activeCarsCount = 0;
    currentHighestFitness = 0; // Reset mỗi frame

    for (let car of cars) {
        if (car.alive) {
            activeCarsCount++;
            car.run(obstacles, leftBoundary, rightBoundary, bottomBoundary, finishLine);
            // Ước lượng fitness hiện tại để highlight (dựa trên progress)
            currentHighestFitness = max(currentHighestFitness, car.progress);
        }
        car.draw();
    }
    // Cập nhật biến toàn cục để Car.draw sử dụng highlight
    // (Lưu ý: highestFitness này là dựa trên progress, không phải final fitness)
    highestFitness = currentHighestFitness;


    // --- Vẽ HUD ---
    push(); resetMatrix(); displayInfo(); pop();
    //----------------

    // 4. Kiểm tra và thực hiện Tiến hóa
    if (allCarsInactive()) {
        evolve();
    }
}

// ==================================================
// --- Simulation Management ---
// ==================================================

/** Bắt đầu thế hệ xe đầu tiên */
function startFirstGeneration() {
    cars = [];
    let startAngle = -PI / 2; // Hướng lên
    for (let i = 0; i < POPULATION_SIZE; i++) {
        let brain = createBrain(); // Từ ga.js
        if (!brain) { alert("Failed to create TF model!"); return; }
        cars.push(new Car(brain, startPosVec, startAngle));
    }
    generation = 1;
    activeCarsCount = cars.length;
    console.log(`--- Starting Generation ${generation} (TF.js + GA) ---`);
}

/** Kiểm tra xem tất cả xe đã dừng chưa */
function allCarsInactive() {
    if (cars.length === 0) return false; // Chưa có xe nào
    for (let car of cars) {
        if (car.alive) return false; // Còn xe đang chạy
    }
    return true; // Tất cả đã dừng
}

/** Hàm chính điều phối quá trình tiến hóa */
function evolve() {
    // Gọi hàm tiến hóa từ ga.js
    const evolutionResult = evolveGA(cars); // Hàm này dispose model cũ và trả về xe mới

    // Cập nhật biến toàn cục
    cars = evolutionResult.newCars;
    highestFitnessLastGen = evolutionResult.stats.max;
    averageFitnessLastGen = evolutionResult.stats.avg;

    // Tạo lại môi trường
    createEnvironment(startPosVec.y);
    generation++;
    activeCarsCount = cars.length; // Reset số xe hoạt động
    // Log đã có trong evolveGA
}

// ==================================================
// --- Environment Creation & Drawing ---
// ==================================================

function createEnvironment(startY) {
    obstacles = [];
    console.log("Creating new environment...");

    // --- Biên ---
    let trackLeftX = width / 2 - TRACK_WIDTH / 2;
    let trackRightX = width / 2 + TRACK_WIDTH / 2;
    let trackTopY = FINISH_LINE_Y - 150; // Biên trên cùng
    let trackBottomY = startY + 50;   // Biên dưới cùng

    leftBoundary = { x1: trackLeftX, y1: trackTopY, x2: trackLeftX, y2: trackBottomY, type: 'line' };
    rightBoundary = { x1: trackRightX, y1: trackTopY, x2: trackRightX, y2: trackBottomY, type: 'line' };
    bottomBoundary = { x1: trackLeftX, y1: trackBottomY, x2: trackRightX, y2: trackBottomY, type: 'line' };

    // --- Đích ---
    finishLine = { y: FINISH_LINE_Y, x1: trackLeftX, x2: trackRightX };
    goal = { x: width / 2, y: FINISH_LINE_Y }; // Tâm đích

    // --- Vật cản (hình tròn) ---
    let safeZoneY = startY; // Vùng an toàn gần start
    let attempts = 0;
    const maxAttempts = NUM_OBSTACLES * 10; // Giới hạn số lần thử

    while (obstacles.length < NUM_OBSTACLES && attempts < maxAttempts) {
        attempts++;
        let r = random(OBSTACLE_MIN_RADIUS, OBSTACLE_MAX_RADIUS);
        let x = random(trackLeftX + r, trackRightX - r);
        // Đặt Y giữa đích và vùng an toàn
        let y = random(FINISH_LINE_Y + r + 15, safeZoneY - r); // Tăng khoảng cách với đích

        // Kiểm tra không quá gần điểm bắt đầu
        if (dist(x, y, startPosVec.x, startPosVec.y) < r + 60) continue;

        // Kiểm tra chồng lấn vật cản khác
        let overlap = false;
        for (let obs of obstacles) {
            if (dist(x, y, obs.x, obs.y) < r + obs.radius + 8) { // Tăng nhẹ khoảng đệm
                overlap = true; break;
            }
        }

        if (!overlap) {
            obstacles.push({ x: x, y: y, radius: r, type: 'circle' });
        }
    }
    if (attempts >= maxAttempts) {
        console.warn(`Obstacle generation stopped early after ${attempts} attempts due to density.`);
    }
    console.log(`Generated ${obstacles.length} obstacles.`);
}

function drawEnvironment() {
    // Biên
    stroke(120); strokeWeight(1); noFill();
    if (leftBoundary) line(leftBoundary.x1, leftBoundary.y1, leftBoundary.x2, leftBoundary.y2);
    if (rightBoundary) line(rightBoundary.x1, rightBoundary.y1, rightBoundary.x2, rightBoundary.y2);
    if (bottomBoundary) { stroke(255, 165, 0, 180); strokeWeight(2); line(bottomBoundary.x1, bottomBoundary.y1, bottomBoundary.x2, bottomBoundary.y2); } // Cam

    // Vạch đích
    if (finishLine) { stroke(0, 255, 0, 220); strokeWeight(5); line(finishLine.x1, finishLine.y, finishLine.x2, finishLine.y); } // Xanh lá

    // Vật cản
    noStroke(); fill(255, 90, 90, 200);
    if (obstacles) { for (const obs of obstacles) { ellipse(obs.x, obs.y, obs.radius * 2); } }
}

// ==================================================
// --- Geometry & Utility Functions ---
// ==================================================

/** Tính khoảng cách ngắn nhất từ điểm p đến đoạn thẳng a-b */
function distPointLineSegment(p, a, b) {
    let v_ab = p5.Vector.sub(b, a);
    let v_ap = p5.Vector.sub(p, a);
    let lenSq = v_ab.magSq();
    if (lenSq < 1e-10) return p5.Vector.dist(p, a);
    let t = v_ap.dot(v_ab) / lenSq;
    t = constrain(t, 0, 1);
    // Dùng p5.Vector.mult tĩnh để không thay đổi v_ab
    let closestPoint = p5.Vector.add(a, p5.Vector.mult(v_ab, t));
    return p5.Vector.dist(p, closestPoint);
}

/** Tìm giao điểm gần nhất của đoạn thẳng p1-p2 và hình tròn */
function intersectLineSegmentCircle(p1, p2, circleCenter, radius) {
    // Tạo bản sao để không thay đổi vector gốc p1, p2 nếu chúng được dùng lại
    let rayStart = p1.copy();
    let rayEnd = p2.copy();
    let center = circleCenter.copy();

    let vRay = p5.Vector.sub(rayEnd, rayStart);
    let dStartCenter = p5.Vector.sub(rayStart, center);

    let a = vRay.dot(vRay);
    let b = 2 * dStartCenter.dot(vRay);
    let c = dStartCenter.dot(dStartCenter) - radius * radius;

    // Tránh chia cho 0
    if (abs(a) < 1e-5) return null;

    let delta = b * b - 4 * a * c;
    if (delta < 0) return null; // Không cắt

    let sqrtDelta = sqrt(delta);
    let t1 = (-b - sqrtDelta) / (2 * a);
    let t2 = (-b + sqrtDelta) / (2 * a);

    let valid_t = [];
    const epsilon = 1e-5; // Sai số
    // Kiểm tra t có nằm trong đoạn [0, 1] không
    if (t1 >= -epsilon && t1 <= 1 + epsilon) valid_t.push(t1);
    if (t2 >= -epsilon && t2 <= 1 + epsilon) valid_t.push(t2);

    if (valid_t.length === 0) return null; // Cắt đường thẳng nhưng ngoài đoạn

    // Lấy t nhỏ nhất hợp lệ (gần điểm bắt đầu nhất)
    let best_t = min(valid_t);
    best_t = max(0, best_t); // Đảm bảo không âm do sai số

    // Tính điểm giao và khoảng cách
    let intersectPoint = p5.Vector.add(rayStart, vRay.mult(best_t)); // vRay bị thay đổi ở đây!
    // Tính lại vRay hoặc dùng bản sao
    let vRayOriginal = p5.Vector.sub(rayEnd, rayStart);
    intersectPoint = p5.Vector.add(rayStart, vRayOriginal.mult(best_t));
    let intersectDist = p5.Vector.dist(rayStart, intersectPoint);

    // Chỉ trả về nếu khoảng cách nhỏ hơn chiều dài tia (tránh lỗi làm tròn)
    if (intersectDist <= SENSOR_LENGTH + epsilon) {
        return { point: intersectPoint, dist: intersectDist };
    }
    return null;

}


/** Tìm giao điểm của 2 đoạn thẳng */
function lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den == 0) return null; // Parallel
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0 && u < 1) { // Check if intersection is on both segments
        return createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
    return null; // Intersection outside segments
}


// ==================================================
// --- Display & Event Handlers ---
// ==================================================

function displayInfo() {
    fill(240); noStroke();
    textSize(14); textAlign(LEFT, TOP);
    let yPos = 10;
    const margin = 10;
    const lh = 18; // Line height
    text(`Generation: ${generation}`, margin, yPos); yPos += lh;
    text(`Cars Active: ${activeCarsCount} / ${POPULATION_SIZE}`, margin, yPos); yPos += lh;
    text(`Highest Fitness (Last Gen): ${highestFitnessLastGen.toFixed(2)}`, margin, yPos); yPos += lh;
    text(`Average Fitness (Last Gen): ${averageFitnessLastGen.toFixed(2)}`, margin, yPos);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    startPosVec = createVector(width / 2, height - 60);
    createEnvironment(startPosVec.y);
    // Không nên tự động reset generation khi resize, để người dùng F5 nếu muốn.
}