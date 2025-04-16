// --- GA Constants ---
// POPULATION_SIZE được định nghĩa trong sketch.js
const MUTATION_RATE = 0.1;     // Tỷ lệ trọng số bị đột biến trong mỗi cá thể được chọn đột biến
const MUTATION_AMOUNT = 0.05;  // Biên độ đột biến (ví dụ: thay đổi +/- 5%)
const ELITISM_COUNT = 4;       // Giữ lại 4 cá thể tốt nhất

/**
 * Tạo model neural network tf.js.
 * Sử dụng các hằng số toàn cục: NETWORK_INPUT_NODES, NETWORK_HIDDEN_NODES, NETWORK_OUTPUT_NODES
 * @returns {tf.LayersModel} Model TensorFlow.js mới.
 */
function createBrain() {
    if (typeof NETWORK_INPUT_NODES === 'undefined' ||
        typeof NETWORK_HIDDEN_NODES === 'undefined' ||
        typeof NETWORK_OUTPUT_NODES === 'undefined') {
        console.error("Network constants (NETWORK_*) are not defined globally.");
        alert("Lỗi cấu hình mạng!"); // Dừng nếu thiếu hằng số
        return null;
    }
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: NETWORK_HIDDEN_NODES,
        inputShape: [NETWORK_INPUT_NODES],
        activation: 'relu' // ReLU cho lớp ẩn
    }));
    // Có thể thêm lớp ẩn thứ 2 ở đây nếu muốn
    model.add(tf.layers.dense({
        units: NETWORK_OUTPUT_NODES,
        activation: 'sigmoid' // Sigmoid cho output [0, 1]
    }));
    // Biên dịch model không cần thiết nếu chỉ dùng predict,
    // nhưng có thể hữu ích nếu muốn dùng các tính năng khác sau này.
    // model.compile({optimizer: 'adam', loss: 'meanSquaredError'});
    return model;
}

/**
 * Chọn cha mẹ dựa trên fitness (Fitness Proportionate Selection).
 * @param {Car[]} sortedCars Mảng xe đã sắp xếp theo fitness giảm dần.
 * @returns {Car[]} Mảng các xe được chọn làm cha mẹ (có thể trùng lặp).
 */
function selectParents(sortedCars) {
    let pool = [];
    let totalFitness = 0;
    // Tính tổng fitness, đảm bảo dương để tránh lỗi chia cho 0
    for (const car of sortedCars) {
        totalFitness += max(car.fitness, 0.01); // Dùng fitness đã tính, đảm bảo > 0
    }

    if (totalFitness <= 0) { // Nếu tất cả fitness <= 0
        console.warn("Total fitness is zero or negative, selecting parents randomly.");
        // Trả về mảng chứa các xe ban đầu để tránh lỗi
        return sortedCars;
    }

    for (let car of sortedCars) {
        let fitness = max(car.fitness, 0.01);
        // Số lượng bản sao trong pool tỉ lệ với fitness
        let count = floor((fitness / totalFitness) * sortedCars.length * 2) + 1; // Tăng cơ hội cho cá thể tốt
        for (let j = 0; j < count; j++) {
            pool.push(car);
        }
    }
    return pool.length > 0 ? pool : sortedCars; // Đảm bảo pool không rỗng
}

/**
 * Đột biến trọng số của model (KHÔNG dispose tensor cũ ở đây).
 * @param {tf.LayersModel} brain Model cần đột biến.
 * @param {number} rate Tỷ lệ trọng số bị đột biến (0 đến 1).
 * @param {number} amount Độ lệch chuẩn của nhiễu Gaussian.
 */
function mutate(brain, rate, amount) {
    tf.tidy(() => { // Tidy vẫn dùng để quản lý tensor mới tạo
        const oldWeights = brain.getWeights(); // Lấy danh sách tensor trọng số hiện tại
        const mutatedWeights = []; // Mảng chứa các tensor MỚI

        for (let i = 0; i < oldWeights.length; i++) {
            const tensor = oldWeights[i]; // Tham chiếu đến tensor gốc
            const shape = tensor.shape;
            const values = tensor.dataSync(); // Lấy dữ liệu gốc
            const newValues = new Float32Array(values.length); // Mảng dữ liệu mới

            // Thực hiện đột biến
            for (let j = 0; j < values.length; j++) {
                if (random(1) < rate) {
                    newValues[j] = values[j] + randomGaussian(0, amount);
                } else {
                    newValues[j] = values[j];
                }
            }
            // Tạo tensor MỚI từ dữ liệu đã đột biến
            mutatedWeights.push(tf.tensor(newValues, shape));

        } // Kết thúc vòng lặp qua các lớp trọng số

        // Gán danh sách các tensor trọng số MỚI cho model brain.
        // Model 'brain' bây giờ tham chiếu đến các tensor mới này.
        brain.setWeights(mutatedWeights);

    });
}

/**
 * Thực hiện lai ghép giữa 2 model (KHÔNG dispose tensor cũ ở đây).
 * @returns {tf.LayersModel} Model con mới.
 * @param {tf.LayersModel} brainA Model cha A.
 * @param {tf.LayersModel} brainB Model cha B.
 * */
function crossover(brainA, brainB) {
    return tf.tidy(() => {
        const weightsA = brainA.getWeights();
        const weightsB = brainB.getWeights();
        const childWeights = [];
        for (let i = 0; i < weightsA.length; i++) {
            // ... (logic tạo childValues) ...
             const tensorA = weightsA[i]; // Lấy tensor để lấy shape
             const shape = tensorA.shape;
             const valuesA = tensorA.dataSync();
             const valuesB = weightsB[i].dataSync();
             const childValues = new Float32Array(valuesA.length);
             for (let j = 0; j < valuesA.length; j++) {
                 childValues[j] = (random(1) < 0.5) ? valuesA[j] : valuesB[j];
             }
            childWeights.push(tf.tensor(childValues, shape));
            // Không dispose tensorA, tensorB
        }
        let childBrain = createBrain();
        childBrain.setWeights(childWeights);
        
        return childBrain;
    });
}


/**
 * Thực hiện quá trình tiến hóa GA cho một thế hệ.
 * @param {Car[]} currentCars Mảng xe của thế hệ hiện tại.
 * @returns {object} Chứa { newCars: Car[], stats: {max, avg} }
 */
function evolveGA(currentCars) {
    console.log(`--- Ending Generation ${generation} ---`);

    // 1. Tính toán fitness cuối cùng và stats
    let totalFitness = 0;
    let maxFitness = -Infinity;
    for (let car of currentCars) {
        car.calculateFinalFitness(); // Tính điểm cuối cùng
        totalFitness += car.fitness;
        maxFitness = max(maxFitness, car.fitness);
    }
    // Đảm bảo totalFitness không âm để tránh lỗi chia cho 0 khi chọn lọc
    totalFitness = max(totalFitness, 0.1);
    let averageFitness = totalFitness / currentCars.length;
    console.log(`Fitness - Max: ${maxFitness.toFixed(2)}, Avg: ${averageFitness.toFixed(2)}`);

    // 2. Sắp xếp xe theo fitness giảm dần
    currentCars.sort((a, b) => b.fitness - a.fitness);

    // 3. Tạo thế hệ mới
    let newCars = [];

    // Elitism: Giữ lại những cá thể tốt nhất
    for (let i = 0; i < ELITISM_COUNT && i < currentCars.length; i++) {
        let eliteCar = currentCars[i];
        let newBrain = createBrain();
        // Sao chép trọng số (cần clone())
        tf.tidy(() => {
             newBrain.setWeights(eliteCar.brain.getWeights().map(w => w.clone()));
         });
        newCars.push(new Car(newBrain, startPosVec, -PI / 2));
    }

    // Tạo phần còn lại bằng lai ghép và đột biến
    let parentPool = selectParents(currentCars); // Chọn cha mẹ
    for (let i = ELITISM_COUNT; i < POPULATION_SIZE; i++) {
        if (parentPool.length < 2) {
            console.warn("Parent pool too small, adding clones of elite.");
            let eliteBrain = newCars[i % ELITISM_COUNT].brain; // Lấy elite làm gốc
             let childBrain = createBrain();
             tf.tidy(() => {
                 childBrain.setWeights(eliteBrain.getWeights().map(w => w.clone()));
             });
             mutate(childBrain, MUTATION_RATE * 2, MUTATION_AMOUNT * 2); // Đột biến mạnh hơn
             newCars.push(new Car(childBrain, startPosVec, -PI / 2));
             continue;
        }
        // Chọn 2 cha mẹ khác nhau nếu có thể
        let parentA = random(parentPool);
        let parentB = random(parentPool);
        while (parentPool.length > 1 && parentB === parentA) {
            parentB = random(parentPool);
        }

        let childBrain = crossover(parentA.brain, parentB.brain); // Lai ghép
        mutate(childBrain, MUTATION_RATE, MUTATION_AMOUNT);       // Đột biến
        newCars.push(new Car(childBrain, startPosVec, -PI / 2));
    }

    // Giải phóng bộ nhớ model TF.js của thế hệ cũ
    for (let oldCar of currentCars) {
        oldCar.dispose();
    }

    console.log("GA Evolution complete.");
    return {
        newCars: newCars,
        stats: { max: maxFitness, avg: averageFitness }
    };
}