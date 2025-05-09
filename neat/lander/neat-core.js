const {
    Neat,
    architect,
    methods,
    config
} = neataptic;

// === NEAT Constants ===
const POPULATION_SIZE = 50;
const INPUT_SIZE = 7; // !!! Đã cập nhật thành 7 inputs (thêm gió) !!!
const OUTPUT_SIZE = 3; // Thrust Up, Left, Right

// === NEAT Global Instance & State ===
let neat;
let lastBestGenomeJSON = null; // Lưu JSON của genome tốt nhất thế hệ trước

// === History statistics ===
const successfulLanders = []; // Lưu lại các lander thành công

// Initialize the NEAT instance
function initializeNeat() {
    neat = new Neat(
        INPUT_SIZE, // kích thước đầu vào (7 inputs)
        OUTPUT_SIZE,
        null, // Fitness assigned during evaluation
        {
            popsize: POPULATION_SIZE,
            elitism: Math.round(0.1 * POPULATION_SIZE),
            mutationRate: 0.7, // Tỉ lệ đột biến
            mutationAmount: 3, // Độ lớn của đột biến 
            mutation: [ // Các phương thức đột biến
                methods.mutation.ADD_NODE, // Thêm node mới
                methods.mutation.ADD_CONN,  // Thêm kết nối mới
                methods.mutation.MOD_WEIGHT, // Thay đổi trọng số
                methods.mutation.SUB_NODE, // Xóa node
                methods.mutation.SUB_CONN, // Xóa kết nối
            ],
            // Cập nhật architect với các thông số mới
            // Nếu không có architect, NEAT sẽ tự động tạo một mạng ngẫu nhiên
            network: new architect.Random(INPUT_SIZE, Math.floor(POPULATION_SIZE / 5), OUTPUT_SIZE)
        }
    );
    console.log(`NEAT Initialized with ${INPUT_SIZE} inputs.`);
}

// Start evaluation for the current population
function startEvaluation() {
    landers = []; // Clear previous landers
    activeLanders = 0;
    if (!neat || !neat.population) {
        console.error("NEAT instance or population not ready for startEvaluation.");
        return;
    }
    for (let i = 0; i < neat.popsize; i++) {
        let startX = random(canvasWidth * 0.1, canvasWidth * 0.9);
        let startY = random(50, 150);
        landers.push(new Lander(neat.population[i], startX, startY)); // Tạo lander mới với 7 inputs
        activeLanders++;
    }
    currentGeneration++;
    console.log(`Starting Generation ${currentGeneration} with ${activeLanders} landers.`);
}

// End evaluation, calculate fitness, perform selection/mutation
function endEvaluation() {
    let currentMaxScore = -Infinity;
    let bestLanderInfo = "N/A";

    if (!landers || landers.length === 0) {
        return;
    } // Không có gì để đánh giá

    // Tính fitness cho tất cả genomes
    for (let lander of landers) {
        lander.calculateFitness();
        if (lander.genome && typeof lander.genome.score === 'number') {
            if (lander.genome.score > currentMaxScore) {
                currentMaxScore = lander.genome.score;
                bestLanderInfo = lander.reason;
            }
        }
    }

    // Lưu lại các lander thành công
    let nSuccessfulLanders = landers.filter(lander => lander.landed).length;
    successfulLanders.push(nSuccessfulLanders);

    if (isFinite(currentMaxScore) && currentMaxScore > highestScore) {
        highestScore = currentMaxScore;
    }

    // NEAT steps
    neat.sort(); // Sắp xếp population theo score

    // Lưu lại JSON của genome tốt nhất
    if (neat.population && neat.population.length > 0) {
        lastBestGenomeJSON = neat.population[0].toJSON();
        console.log(`Generation ${currentGeneration -1} Result - Best Score: ${neat.population[0].score.toFixed(2)} (${bestLanderInfo})`);
    } else {
        lastBestGenomeJSON = null;
    }

    // Elitism and Breeding
    const newPopulation = [];
    for (let i = 0; i < neat.elitism && i < neat.population.length; i++) {
        newPopulation.push(neat.population[i]);
    }
    let offspringCount = neat.popsize - newPopulation.length;
    for (let i = 0; i < offspringCount; i++) {
        newPopulation.push(neat.getOffspring());
    }
    neat.population = newPopulation;

    // Mutation
    neat.mutate();

    console.log("Population evolved for next generation.");
}