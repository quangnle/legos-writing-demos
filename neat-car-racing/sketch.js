// js/sketch.js

let populationController;
let track;
let cars = [];
let generationCount = 0;
let currentFrame = 0;
let bestFitnessEver = 0;
let averageFitnessHistory = [];

// Kích thước Canvas (có thể điều chỉnh hoặc lấy từ window)
let canvasWidth = 600; // Tăng chiều rộng để đường đua thoải mái hơn
let canvasHeight = 400; // Tăng chiều cao

let fittestBrainJSON = null; // Để lưu trữ JSON của bộ não tốt nhất

function setup() {
    createCanvas(canvasWidth, canvasHeight);
    frameRate(60); // Chạy ở 60 FPS (có thể giảm nếu quá nặng)

    // 1. Khởi tạo đường đua
    // Các hằng số RACE_LANE_WIDTH, TRACK_CORNER_RADIUS được lấy từ constants.js
    track = new Track(CAR_WIDTH);

    // 2. Khởi tạo Neataptic Controller
    // Các hằng số POPULATION_SIZE, INPUT_NODES, OUTPUT_NODES từ constants.js
    populationController = new NeatController(POPULATION_SIZE, INPUT_NODES, OUTPUT_NODES);
    // 3. Bắt đầu thế hệ đầu tiên
    startNewGeneration();

    // 4. Thiết lập Div hiển thị thông tin
    setupInfoDiv();
}

function draw() {
    background(51); // Màu nền xám đậm
    push(); // Lưu trạng thái canvas hiện tại (để vẽ đường đua trước)
    translate(50, 50); // Đặt lại vị trí vẽ về góc trên bên trái

    // 1. Vẽ đường đua
    track.display();

    let activeCarsCount = 0;

    // 2. Cập nhật và vẽ từng chiếc xe
    for (let i = cars.length - 1; i >= 0; i--) {
        let car = cars[i];
        if (car.isActive) {
            activeCarsCount++;

            // a. Cập nhật cảm biến của xe
            car.updateSensors(track);

            // b. Xe "suy nghĩ" để đưa ra quyết định (kích hoạt mạng nơ-ron)
            car.think(); // Bên trong hàm này sẽ gọi car.applyControls()

            // c. Cập nhật trạng thái vật lý (vị trí, tốc độ, góc)
            car.updatePhysics();

            // d. Kiểm tra va chạm với tường
            car.checkBoundaries(track);

            // e. Tính toán tiến trình trên đường đua (cập nhật waypoint, quãng đường)
            car.calculateProgress(track);

            // f. Kiểm tra xem xe có về đích không
            car.checkFinishLine(track);
        }
        // g. Vẽ xe (vẽ cả xe active và inactive/exploded/winner để thấy trạng thái cuối)
        car.display();        
    }

    currentFrame++;

    // 3. Kiểm tra điều kiện kết thúc thế hệ hiện tại
    if (activeCarsCount === 0 || currentFrame >= MAX_FRAMES_PER_GENERATION) {
        endCurrentGeneration();
        startNewGeneration();
    }
    pop();

    // 4. Hiển thị thông tin huấn luyện
    displayInfo(activeCarsCount);
}

function startNewGeneration() {
    currentFrame = 0;
    generationCount++; // Tăng số thế hệ
    cars = []; // Xóa các xe của thế hệ cũ

    // Lấy danh sách các bộ não (genomes) từ NeatController cho thế hệ mới
    let genomes = populationController.getGenomes();

    for (let i = 0; i < genomes.length; i++) {
        // Tạo một chiếc xe mới với một bộ não từ quần thể
        // Vị trí và góc xuất phát được lấy từ đối tượng track
        cars.push(new Car(track.startPosition.x, track.startPosition.y, genomes[i], track.startAngle));
    }
    // console.log(`Bắt đầu Thế hệ: ${generationCount} với ${cars.length} xe.`);
}

function endCurrentGeneration() {
    // 1. Tính toán và gán điểm thích nghi cho mỗi bộ não (genome) trong quần thể
    // Hàm car.calculateAndSetFitness() sẽ tự động cập nhật car.brain.score
    let totalFitnessThisGen = 0;
    let bestFitnessThisGen = 0;

    for (let car of cars) {
        car.calculateAndSetFitness(track); // Quan trọng: Hàm này đặt car.brain.score
        totalFitnessThisGen += car.fitness;
        if (car.fitness > bestFitnessThisGen) {
            bestFitnessThisGen = car.fitness;
        }
    }

    if (bestFitnessThisGen > bestFitnessEver) {
        bestFitnessEver = bestFitnessThisGen;
        // Lưu bộ não tốt nhất nếu muốn
        let fittestGenomeOverall = populationController.getFittestGenome();
        if (fittestGenomeOverall) {
            fittestBrainJSON = fittestGenomeOverall.toJSON();
            // console.log("New best brain saved to fittestBrainJSON (in memory).");
            // Bạn có thể dùng saveJSON(fittestBrainJSON, 'best_overall_brain.json'); ở đây nếu muốn lưu file ngay.
        }
    }

    let avgFitness = cars.length > 0 ? totalFitnessThisGen / cars.length : 0;
    averageFitnessHistory.push(avgFitness);
    if (averageFitnessHistory.length > 20) { // Giữ lịch sử 20 thế hệ gần nhất
        averageFitnessHistory.shift();
    }

    // 2. Gọi NeatController để tiến hóa quần thể (sắp xếp, chọn lọc, lai ghép, đột biến)
    // Neataptic sẽ sử dụng các giá trị 'score' đã được gán cho mỗi genome.
    populationController.neat.evolve(); // Đây là hàm cốt lõi của Neataptic
}

function setupInfoDiv() {
    let infoDiv = select('#infoDiv');
    if (!infoDiv) { // Tạo nếu chưa có
        infoDiv = createDiv('');
        infoDiv.id('infoDiv'); // Đặt ID để có thể chọn lại
        infoDiv.style('font-family', 'Arial, sans-serif');
        infoDiv.style('position', 'fixed'); // Hoặc 'absolute' nếu canvas là tương đối
        infoDiv.style('top', '10px');
        infoDiv.style('left', '10px');
        infoDiv.style('background-color', 'rgba(255, 255, 255, 0.85)');
        infoDiv.style('padding', '10px');
        infoDiv.style('border-radius', '5px');
        infoDiv.style('border', '1px solid #ccc');
        infoDiv.style('max-width', '250px'); // Giới hạn chiều rộng
        infoDiv.style('line-height', '1.4');
    }
}


function displayInfo(activeCarsCount) {
    let infoContent = `
        <b>Thế hệ:</b> ${generationCount} (Neat: ${populationController.neat.generation})<br>
        <b>Khung hình:</b> ${currentFrame} / ${MAX_FRAMES_PER_GENERATION}<br>
        <b>Xe hoạt động:</b> ${activeCarsCount} / ${POPULATION_SIZE}<br>
        <hr style="margin: 4px 0;">
        <b>Fitness Cao Nhất (Từ trước đến nay):</b> ${bestFitnessEver.toFixed(2)}<br>
        <b>Fitness TB (Cuối):</b> ${averageFitnessHistory.length > 0 ? averageFitnessHistory[averageFitnessHistory.length - 1].toFixed(2) : 'N/A'}<br>
        <hr style="margin: 4px 0;">
        Nhấn 'S' để lưu bộ não tốt nhất hiện tại. <br>
        Nhấn 'L' để tải bộ não tốt nhất đã lưu.
    `;
    const infoDiv = select('#infoDiv');
    if (infoDiv) {
        infoDiv.html(infoContent);
    }
}

// Hàm xử lý sự kiện nhấn phím
function keyPressed() {
    if (key === 's' || key === 'S') {
        let fittest = populationController.getFittestGenome();
        if (fittest) {
            let json = fittest.toJSON();
            saveJSON(json, `best_brain.json`);
            console.log(`Đã lưu bộ não tốt nhất của thế hệ ${generationCount} vào file!`);
            fittestBrainJSON = json; // Cập nhật cả biến trong bộ nhớ
        } else {
            console.log("Không có bộ não nào để lưu.");
        }
    } else if (key === 'l' || key === 'L') {
        loadBestBrain();
    }
}

function loadBestBrain() {
    loadJSON('best_brain.json', (loadedBrain) => {
        if (loadedBrain) {
            populationController.loadBrain(loadedBrain);
            generationCount = 0; // Reset thế hệ
            startNewGeneration(); // Khởi tạo lại quần thể với bộ não đã tải
            console.log("Đã tải bộ não tốt nhất từ best_brain.json và khởi tạo lại quần thể.");
        } else {
            console.log("Không tìm thấy file best_brain.json.");
        }
    }, (error) => {
        console.error("Lỗi khi tải best_brain.json:", error);
    });
}