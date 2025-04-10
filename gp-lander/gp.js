class Individual {
    constructor(chromosome = null) {
        this.lander = new Lander(); // Lander sẽ được reset đúng vị trí sau
        if (chromosome) {
            this.chromosome = chromosome;
        } else {
            this.chromosome = [];
            for (let i = 0; i < chromosomeLength; i++) {
                this.chromosome.push(floor(random(actions.length)));
            }
        }
        this.fitness = -Infinity;
        this.isAlive = true;
        this.status = 'RUNNING';
        this.timeTaken = chromosomeLength;
        this.finalState = null;
    }

    // Tính điểm fitness dựa trên kết quả mô phỏng và môi trường
    calculateFitness(landingZone, groundY, safeVx, safeVy) {
        if (this.finalState === null) {
            this.fitness = -20000 - Math.max(0, this.lander.y - groundY) * 5; // Phạt nặng nếu chưa kết thúc
            return;
        }

        let fitnessScore = 0;
        let final = this.finalState;

        if (this.status === 'SUCCESS') {
            fitnessScore = 10000;
            let speedFactor = 1 / (1 + Math.abs(final.vx) + Math.abs(final.vy));
            fitnessScore += 5000 * speedFactor;
            fitnessScore -= this.timeTaken * 5;
            let targetX = landingZone.x + landingZone.w / 2;
            let distanceToCenter = Math.abs(final.x - targetX);
            fitnessScore += 1000 / (1 + distanceToCenter);

        } else { // CRASHED_GROUND hoặc CRASHED_OOB
            fitnessScore = -10000;
            let targetX = landingZone.x + landingZone.w / 2;
            let targetY = groundY;
            let distanceToTarget = dist(final.x, final.y, targetX, targetY);
            fitnessScore -= distanceToTarget * 15;
            fitnessScore -= (Math.abs(final.vx) + Math.abs(final.vy)) * 25;

            if (this.status === 'CRASHED_OOB') {
                fitnessScore -= 5000;
            } else if (this.status === 'CRASHED_GROUND') {
                let inZone = final.x > landingZone.x && final.x < landingZone.x + landingZone.w;
                if (inZone) {
                    fitnessScore += 500; // Thưởng nhỏ vì rơi đúng khu vực
                }
            }
        }
        this.fitness = fitnessScore;
    }

    // Reset trạng thái cho thế hệ mới VỚI ĐIỂM XUẤT PHÁT CHUNG
    reset(startX, startY, startVX, startVY) {
        this.lander.reset(startX, startY, startVX, startVY);
        this.fitness = -Infinity;
        this.isAlive = true;
        this.status = 'RUNNING';
        this.timeTaken = chromosomeLength;
        this.finalState = null;
    }
}

// --- Các hàm GA ---

function initializePopulation() {
    population = [];
    for (let i = 0; i < populationSize; i++) {
        population.push(new Individual());
    }
}

// Chạy một bước mô phỏng cho cả quần thể, nhận các tham số môi trường
function runSimulationStep(currentWind, currentTimeStep, gravityForce, groundY, landingZone, safeVx, safeVy) {
    for (let i = 0; i < population.length; i++) {
        let ind = population[i];
        if (ind.isAlive) {
            let actionIndex = ind.chromosome[currentTimeStep];
            ind.lander.applyAction(actionIndex);
            ind.lander.applyGravity(gravityForce); // Truyền trọng lực
            ind.lander.applyWind(currentWind);   // Truyền gió
            ind.lander.update();
            // Truyền các tham số môi trường cần thiết cho checkStatus
            let status = ind.lander.checkStatus(groundY, landingZone, safeVx, safeVy);

            if (status !== 'RUNNING') {
                if (status === 'SUCCESS') {
                    ind.fitness += 5000; // Thưởng cho thành công
                }
                ind.isAlive = false;
                ind.status = status;
                ind.timeTaken = currentTimeStep + 1;
                ind.finalState = { x: ind.lander.x, y: ind.lander.y, vx: ind.lander.vx, vy: ind.lander.vy };
            } 
        }
    }
}

// Tính Fitness cho toàn bộ quần thể, nhận các tham số môi trường
function calculateFitnessAll(landingZone, groundY, safeVx, safeVy) {
    let totalFitness = 0;
    let bestFitness = -Infinity;
    for (let i = 0; i < population.length; i++) {
        // Truyền tham số môi trường vào hàm tính fitness của cá thể
        population[i].calculateFitness(landingZone, groundY, safeVx, safeVy);
        totalFitness += population[i].fitness;
        if(population[i].fitness > bestFitness) {
             bestFitness = population[i].fitness;
        }
    }
    population.sort((a, b) => b.fitness - a.fitness); // Sắp xếp để lấy elite và best fitness
    let avgFitness = totalFitness / populationSize;
    return { best: population[0].fitness, avg: avgFitness }; // Trả về fitness tốt nhất và trung bình
}

function evolvePopulation() {
    let newPopulation = [];
    // 1. Elitism - chọn những cá thể tốt nhất để giữ lại cho thế hệ sau
    // Giữ lại elitismCount cá thể tốt nhất từ quần thể hiện tại
    for (let i = 0; i < elitismCount; i++) {
        newPopulation.push(new Individual(population[i].chromosome));
    }
    // 2. Crossover & Mutation - tạo ra cá thể mới từ các cá thể cha mẹ
    // Chọn 2 cá thể cha mẹ từ quần thể hiện tại và lai ghép chúng để tạo ra cá thể con
    for (let i = elitismCount; i < populationSize; i++) {
        let parent1 = tournamentSelection();
        let parent2 = tournamentSelection();
        let childChromosome = crossover(parent1.chromosome, parent2.chromosome);
        mutate(childChromosome);
        newPopulation.push(new Individual(childChromosome));
    }
    population = newPopulation;
}

function tournamentSelection() {
    let tournamentSize = 5;
    let bestInd = null;
    // chọn ngẫu nhiên một số lần (tournamentSize) để tìm cá thể tốt nhất trong số đó
    // cách này sẽ làm cho việc chọn cá thể lai ghép trở nên đa dạng hơn
    // và không bị ảnh hưởng quá nhiều bởi cá thể tốt nhất trong quần thể hiện tại
    for (let i = 0; i < tournamentSize; i++) {
        let randomInd = random(population); // lấy ngẫu nhiên 1 cá thể từ quần thể
        // Nếu bestInd chưa được khởi tạo hoặc cá thể ngẫu nhiên tốt hơn bestInd thì cập nhật bestInd
        if (bestInd === null || randomInd.fitness > bestInd.fitness) {
            bestInd = randomInd;
        }
    }
    return bestInd;
}

// Crossover (lai ghép) giữa 2 cá thể, trả về một cá thể mới
function crossover(chromo1, chromo2) {
    let newChromo = [];
    // chọn môi điểm cắt ngẫu nhiên
    let crossoverPoint = floor(random(1, chromosomeLength - 1));
    for (let i = 0; i < chromosomeLength; i++) {
        // Nếu i < crossoverPoint thì lấy từ chromo1, ngược lại lấy từ chromo2
        // Đảm bảo không lấy cả 2 từ 1 cá thể
        newChromo.push(i < crossoverPoint ? chromo1[i] : chromo2[i]);
    }
    return newChromo;
}

function mutate(chromosome) {
    for (let i = 0; i < chromosomeLength; i++) {
        if (random() < mutationRate) {
            let currentAction = chromosome[i];
            let newAction;
            do {
                newAction = floor(random(actions.length));
            } while (newAction === currentAction && actions.length > 1);
            chromosome[i] = newAction;
        }
    }
}

// Reset mô phỏng cho thế hệ mới, trả về điểm xuất phát chung
function resetSimulationForNewGeneration(canvasWidth, canvasHeight) {
    // Đặt điểm xuất phát chung
    let startX = canvasWidth / 2;
    let startY = 50;
    let startVX = 0;
    let startVY = 0.5;

    // Reset từng cá thể với điểm xuất phát chung
    for (let i = 0; i < population.length; i++) {
        population[i].reset(startX, startY, startVX, startVY);
    }
    return { startX, startY, startVX, startVY }; // Trả về để có thể hiển thị nếu cần
}