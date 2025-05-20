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
    updateInfoDisplay() 
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

function trainWOGraphicRender(nTimes) {
    console.log(`Bắt đầu huấn luyện không hiển thị đồ họa trong ${nTimes} thế hệ...`);
    for (let i = 0; i < nTimes; i++) {
        console.log(`Huấn luyện Thế hệ: ${populationController.neat.generation + 1}`);
        startNewGeneration(); // Tạo quần thể xe mới

        let generationFrame = 0;
        let activeCarsCount = cars.filter(car => car.isActive).length;

        while (activeCarsCount > 0 && generationFrame < MAX_FRAMES_PER_GENERATION) {
            for (let car of cars) {
                if (car.isActive) {
                    car.updateSensors(track);
                    car.think();
                    car.updatePhysics();
                    car.checkBoundaries(track);
                    car.calculateProgress(track);
                    car.checkFinishLine(track);
                }
            }
            generationFrame++;
            activeCarsCount = cars.filter(car => car.isActive).length;
        }

        endCurrentGeneration(); // Đánh giá và tiến hóa quần thể
        console.log(`Fitness (avg/best) của lần huấn luyện ${populationController.neat.generation}: ${averageFitnessHistory[averageFitnessHistory.length - 1].toFixed(2)} / ${bestFitnessEver.toFixed(2)}`);
    }
    console.log("Huấn luyện không hiển thị đồ họa hoàn tất.");
}

// Huấn luyện không hiển thị đồ họa cho đến khi có xe về đích
function trainWOGraphicRenderUntilSuccess() {
    let maxTrainingTimes = populationController.neat.generation + (+document.getElementById('maxTrainingTimes').value);
    while (averageFitnessHistory[averageFitnessHistory.length - 1] < 2000 && populationController.neat.generation < maxTrainingTimes) {
        console.log(`Huấn luyện Thế hệ: ${populationController.neat.generation + 1}`);
        startNewGeneration(); // Tạo quần thể xe mới

        let generationFrame = 0;
        let activeCarsCount = cars.filter(car => car.isActive).length;

        while (activeCarsCount > 0 && generationFrame < MAX_FRAMES_PER_GENERATION) {
            for (let car of cars) {
                if (car.isActive) {
                    car.updateSensors(track);
                    car.think();
                    car.updatePhysics();
                    car.checkBoundaries(track);
                    car.calculateProgress(track);
                    car.checkFinishLine(track);
                }
            }
            generationFrame++;
            activeCarsCount = cars.filter(car => car.isActive).length;
        }

        endCurrentGeneration(); // Đánh giá và tiến hóa quần thể

        console.log(`Fitness (avg/best) của lần huấn luyện ${populationController.neat.generation}: ${averageFitnessHistory[averageFitnessHistory.length - 1].toFixed(2)} / ${bestFitnessEver.toFixed(2)}`);
    }
}

// Hàm xử lý sự kiện nhấn phím
function keyPressed() {
    if (key === 's' || key === 'S') {
        let fittest = populationController.getFittestGenome();
        if (fittest) {
            let json = fittest.toJSON();
            saveJSON(json, `best_brain_${generationCount}.json`);
            console.log(`Đã lưu bộ não tốt nhất của thế hệ ${generationCount} vào file!`);
            fittestBrainJSON = json; // Cập nhật cả biến trong bộ nhớ
        } else {
            console.log("Không có bộ não nào để lưu.");
        }
    } else if (key === 'l' || key === 'L') {
        loadBestBrain();
    } else if (key === 't' || key === 'T') {
        trainWOGraphicRender(300); // Huấn luyện không hiển thị đồ họa trong 300 thế hệ
    } else if (key === 'u' || key === 'U') {
        trainWOGraphicRenderUntilSuccess(); // Huấn luyện không hiển thị đồ họa cho đến khi có xe về đích
    }
}

function loadBestBrain() {

    populationController.loadBrain(BEST_BRAIN); // Tải bộ não tốt nhất từ JSON
    startNewGeneration(); // Khởi tạo lại quần thể với bộ não đã tải

    // không hiểu sao lại không chạy được
    // loadJSON('best_brain.json', (loadedBrain) => {
    //     if (loadedBrain) {
    //         populationController.loadBrain(loadedBrain);
    //         generationCount = 0; // Reset thế hệ
    //         startNewGeneration(); // Khởi tạo lại quần thể với bộ não đã tải
    //         console.log("Đã tải bộ não tốt nhất từ best_brain.json và khởi tạo lại quần thể.");
    //     } else {
    //         console.log("Không tìm thấy file best_brain.json.");
    //     }
    // }, (error) => {
    //     console.error("Lỗi khi tải best_brain.json:", error);
    // });
}