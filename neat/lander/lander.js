// === Lander Constants ===
const GRAVITY = 0.008; // Gia tốc trọng trường
const THRUST_POWER = 0.025; // Lực đẩy động cơ chính
const SIDE_THRUST_POWER = 0.015; // Lực đẩy động cơ ngang
const FUEL_PENALTY = 0.05; // Điểm phạt cho mỗi lần bật động cơ
const CRASH_PENALTY = -150; // Điểm phạt cơ bản khi rơi hỏng / bay ra ngoài
const SUCCESS_REWARD = 200; // Điểm thưởng cơ bản khi hạ cánh thành công
const SAFE_LANDING_VX = 1.0; // Vận tốc ngang tối đa cho phép khi hạ cánh
const SAFE_LANDING_VY = 1.5; // Vận tốc dọc tối đa cho phép khi hạ cánh
const MAX_STEPS = 800; // Số bước tối đa cho mỗi lần thử nghiệm

// --- Thêm hằng số cho gió ---
const MAX_WIND_STRENGTH = 0.006; // Gia tốc ngang tối đa do gió
const WIND_NOISE_SCALE_TIME = 0.005; // Tốc độ thay đổi của gió theo thời gian


// === Lander Class ===
class Lander {
    constructor(genome, startX, startY) {
        this.genome = genome;
        this.genome.score = 0; // Initialize score for this run

        this.pos = createVector(startX, startY);
        this.vel = createVector(random(-1, 1), random(-0.5, 0.5));
        this.size = 10; // Base size for drawing

        this.active = true; // Is the lander still flying?
        this.landed = false;
        this.crashed = false;
        this.reason = ""; // Store reason for crash/landing

        this.fuelUsed = 0;
        this.steps = 0;

        // Thuộc tính để lưu vận tốc khi chạm đất
        this.landingVx = 0;
        this.landingVy = 0;

        // --- Thuộc tính để lưu gió hiện tại ---
        this.currentWind = 0;
        

        // Thrust indicators for drawing
        this.thrustingUp = false;
        this.thrustingLeft = false;
        this.thrustingRight = false;
        this.action = 'NONE'; // Current action decided by think()
    }

    // --- Cập nhật normalizeInputs để thêm gió (7 inputs) ---
    normalizeInputs() {
        let normX = this.pos.x / canvasWidth;
        let normY = this.pos.y / canvasHeight;

        let maxV = 5;
        let normVx = constrain(this.vel.x / maxV, -1, 1) / 2 + 0.5;
        let normVy = constrain(this.vel.y / maxV, -1, 1) / 2 + 0.5;

        let distL = max(0, this.pos.x - landingZoneX1) / canvasWidth;
        let distR = max(0, landingZoneX2 - this.pos.x) / canvasWidth;

        // Chuẩn hóa gió về khoảng [0, 1]
        let normWind = constrain(this.currentWind / MAX_WIND_STRENGTH, -1, 1) / 2 + 0.5;

        return [normX, normY, normVx, normVy, distL, distR, normWind];
    }
    

    // Use the neural network to decide action
    think() {
        if (!this.active) return;

        let inputs = this.normalizeInputs();
        let outputs = this.genome.activate(inputs);

        this.thrustingUp = false;
        this.thrustingLeft = false;
        this.thrustingRight = false;

        let decision = outputs.indexOf(Math.max(...outputs));
        const threshold = 0.5;

        if (decision === 0 && outputs[0] > threshold) {
            this.action = 'UP';
            this.thrustingUp = true;
        } else if (decision === 1 && outputs[1] > threshold) {
            this.action = 'LEFT';
            this.thrustingLeft = true;
        } else if (decision === 2 && outputs[2] > threshold) {
            this.action = 'RIGHT';
            this.thrustingRight = true;
        } else {
            this.action = 'NONE';
        }
    }

    // --- Cập nhật update() để tính toán và áp dụng gió ---
    update() {
        if (!this.active) return;

        // Tính toán gió hiện tại
        let noiseVal = noise(frameCount * WIND_NOISE_SCALE_TIME);
        this.currentWind = map(noiseVal, 0, 1, -MAX_WIND_STRENGTH, MAX_WIND_STRENGTH);

        // Apply Gravity
        this.vel.y += GRAVITY;

        // Apply Wind
        this.vel.x += this.currentWind; // Gió tác động lên vận tốc ngang

        // Apply Thrust
        let thrustApplied = false;
        if (this.action === 'UP') {
            this.vel.y -= THRUST_POWER;
            thrustApplied = true;
        } else if (this.action === 'LEFT') {
            this.vel.x -= SIDE_THRUST_POWER;
            thrustApplied = true;
        } else if (this.action === 'RIGHT') {
            this.vel.x += SIDE_THRUST_POWER;
            thrustApplied = true;
        }

        if (thrustApplied) {
            this.fuelUsed++;
        }

        // Update Position
        this.pos.add(this.vel);
        this.steps++;

        // Check Boundaries and Landing/Crash
        if (this.pos.y >= landingZoneY) { // Hit Ground
            this.landingVx = this.vel.x;
            this.landingVy = this.vel.y; // Store final velocity
            this.pos.y = landingZoneY;
            this.active = false;
            const inZone = this.pos.x >= landingZoneX1 && this.pos.x <= landingZoneX2;
            const safeSpeed = abs(this.landingVx) < SAFE_LANDING_VX && abs(this.landingVy) < SAFE_LANDING_VY;
            if (inZone && safeSpeed) {
                this.landed = true;
                this.reason = "Landed Successfully";
            } else {
                this.crashed = true;
                this.reason = !inZone ? `Crash! Outside Zone` : `Crash! Hard Landing`;
                this.reason += ` (vx:${this.landingVx.toFixed(1)},vy:${this.landingVy.toFixed(1)})`;
            }
            this.vel.mult(0);
        } else if (this.pos.x < 0 || this.pos.x > canvasWidth || this.pos.y < 0) { // Out of Bounds
            this.active = false;
            this.crashed = true;
            this.reason = "Out of Bounds";
            this.landingVx = this.vel.x;
            this.landingVy = this.vel.y;
        } else if (this.steps >= MAX_STEPS) { // Timeout
            this.active = false;
            this.crashed = true;
            this.reason = "Timeout";
            this.landingVx = this.vel.x;
            this.landingVy = this.vel.y;
        }
    }

    calculateFitness() {
        let fitness = 0;
        if (this.landed) {
            fitness = SUCCESS_REWARD;
            let vxFactor = constrain(1.0 - (abs(this.landingVx) / SAFE_LANDING_VX), 0, 1);
            let vyFactor = constrain(1.0 - (abs(this.landingVy) / SAFE_LANDING_VY), 0, 1);
            fitness += (vxFactor * 40) + (vyFactor * 40); // Thưởng nếu vận tốc nhỏ 
    
            let centerDist = abs(this.pos.x - (landingZoneX1 + landingZoneX2) / 2);
            let precisionFactor = constrain(1 - (centerDist / ((landingZoneX2 - landingZoneX1) / 2)), 0, 1);
            fitness += precisionFactor * 30; // thưởng nếu hạ cánh gần giữa vùng hạ cánh
            fitness += (MAX_STEPS - this.steps) * (40 / MAX_STEPS);
            fitness -= this.fuelUsed * FUEL_PENALTY * 0.5;
        } else if (this.crashed) {
            fitness = CRASH_PENALTY;
            const crashedInZone = this.pos.x >= landingZoneX1 && this.pos.x <= landingZoneX2 && this.pos.y >= landingZoneY;
            if (crashedInZone) {
                fitness *= 0.7;
                fitness += 80; // Thưởng thêm nếu rơi vào vùng hạ cánh
            }
            // Hình phạt khoảng cách
            let distanceToTargetCenter = dist(this.pos.x, this.pos.y, (landingZoneX1 + landingZoneX2) / 2, landingZoneY);
            fitness -= distanceToTargetCenter * 0.1; // Penalize distance from target
            // Phạt thêm tốc độ va chạm mạnh (nếu không phải timeout/out of bounds)
            if (!this.reason.includes("Timeout") && !this.reason.includes("Out of Bounds")) {
                let excessiveVy = max(0, abs(this.landingVy) - SAFE_LANDING_VY);
                fitness -= excessiveVy * 20; // Phạt thêm tốc độ dọc
                let excessiveVx = max(0, abs(this.landingVx) - SAFE_LANDING_VX);
                fitness -= excessiveVx * 10; // Phạt thêm tốc độ ngang
            }
            if (this.reason === "Timeout") {
                fitness *= 0.8;
            } // giảm hình phạt nếu hết giờ
            fitness -= this.fuelUsed * FUEL_PENALTY; // Phạt thêm nhiên liệu đã sử dụng
        } else {
            fitness = CRASH_PENALTY * 2;
            fitness -= this.fuelUsed * FUEL_PENALTY;
        }
        this.genome.score = isNaN(fitness) ? CRASH_PENALTY * 2 : fitness;
    }

    // --- draw() với hình ảnh chi tiết và căn chỉnh chân ---
    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        let s = this.size;
        const verticalOffset = s * 1.75;
        translate(0, -verticalOffset);

        let bodyFill = color(200, 200, 255);
        let bodyStroke = color(this.active ? 255 : 100);
        if (this.landed) {
            bodyFill = color(0, 255, 0, 200);
        } else if (this.crashed) {
            bodyFill = color(255, 0, 0, 200);
        }
        fill(bodyFill);
        stroke(bodyStroke);
        strokeWeight(1);

        let bodyWidth = s;
        let bodyHeight = s * 1.5;
        let bodyTopY = -bodyHeight / 2;
        let bodyBottomY = bodyHeight / 2;
        rect(-bodyWidth / 2, bodyTopY, bodyWidth, bodyHeight, s * 0.1); // Body

        let coneHeight = s * 0.6;
        let coneBaseWidth = bodyWidth * 0.8;
        triangle(-coneBaseWidth / 2, bodyTopY, coneBaseWidth / 2, bodyTopY, 0, bodyTopY - coneHeight); // Cone

        strokeWeight(max(1, s * 0.15));
        let legStartY = bodyBottomY * 0.8;
        let legTopXOffset = bodyWidth * 0.4;
        let legBottomY_calc = bodyBottomY + s * 1.0;
        let legBottomXOffset = bodyWidth * 0.7;
        line(-legTopXOffset, legStartY, -legBottomXOffset, legBottomY_calc); // Left Leg
        line(legTopXOffset, legStartY, legBottomXOffset, legBottomY_calc); // Right Leg

        let padWidth = s * 0.5;
        strokeWeight(max(2, s * 0.2));
        line(-legBottomXOffset - padWidth / 2, legBottomY_calc, -legBottomXOffset + padWidth / 2, legBottomY_calc); // Left Pad
        line(legBottomXOffset - padWidth / 2, legBottomY_calc, legBottomXOffset + padWidth / 2, legBottomY_calc); // Right Pad

        noStroke();
        if (this.active) { // Thrust flames
            let flameLength = s * 1.2;
            let flameBaseWidth = bodyWidth * 0.6;
            if (this.thrustingUp) {
                fill(255, 150, 0, 200);
                triangle(-flameBaseWidth / 2, bodyBottomY, flameBaseWidth / 2, bodyBottomY, 0, bodyBottomY + flameLength);
            }
            let sideFlameLength = s * 0.8;
            let sideFlameYOffset = 0;
            let sideFlameWidth = s * 0.4;
            if (this.thrustingLeft) {
                fill(255, 150, 0, 200);
                triangle(bodyWidth / 2, sideFlameYOffset - sideFlameWidth / 2, bodyWidth / 2, sideFlameYOffset + sideFlameWidth / 2, bodyWidth / 2 + sideFlameLength, sideFlameYOffset);
            }
            if (this.thrustingRight) {
                fill(255, 150, 0, 200);
                triangle(-bodyWidth / 2, sideFlameYOffset - sideFlameWidth / 2, -bodyWidth / 2, sideFlameYOffset + sideFlameWidth / 2, -bodyWidth / 2 - sideFlameLength, sideFlameYOffset);
            }
        }
        pop();
    }
    
}