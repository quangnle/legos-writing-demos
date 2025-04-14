class Car {
    /**
     * Khởi tạo xe
     * @param {object} genome Genome Neataptic
     * @param {number} startX Vị trí X ban đầu
     * @param {number} startY Vị trí Y ban đầu
     * @param {number} startAngle Góc ban đầu (radians)
     */
    constructor(genome, startX, startY, startAngle) {
        // --- NEAT ---
        this.genome = genome;
        this.genome.score = 0;

        // --- Vật lý & Vị trí ---
        this.pos = createVector(startX, startY);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.angle = startAngle;
        this.speed = 0;
        this.steer = 0;
        this.width = 15;
        this.height = 10;
        // Bán kính va chạm gần đúng (dùng hình tròn)
        this.collisionRadius = max(this.width, this.height) / 1.8; // Tăng nhẹ để bao phủ tốt hơn

        // --- Cảm biến ---
        this.sensors = []; // Mảng lưu { point: vector, dist: number }
        this.sensorDistances = new Array(SENSOR_COUNT).fill(0); // Input cho NN [0..1]

        // --- Trạng thái & Fitness ---
        this.alive = true;
        this.finished = false; // Đã về đích chưa?
        this.timeToFinish = 0; // Thời gian về đích (frames)
        this.fitness = 0;
        this.timeAlive = 0;
        this.totalDistance = 0; // Tổng quãng đường đi được
        this.lastPos = this.pos.copy();
        this.initialY = startY; // Lưu Y ban đầu
        this.progress = 0; // Quãng đường Y đi được (dương, tính từ startY)
    }

    // --- Cập nhật cảm biến ---
    /**
     * Tính toán va chạm của các tia cảm biến với vật cản và biên đường.
     * @param {object[]} obstacles Mảng các chướng ngại vật {x, y, radius, type:'circle'}
     * @param {object} leftBoundary Biên trái {x1, y1, x2, y2, type:'line'}
     * @param {object} rightBoundary Biên phải {x1, y1, x2, y2, type:'line'}
	 * @param {object} bottomBoundary Biên dưới 
     */
    look(obstacles, leftBoundary, rightBoundary, bottomBoundary) {
        this.sensors = [];
        const thingsToDetect = [];

        if (obstacles) obstacles.forEach(obs => thingsToDetect.push(obs));
        if (leftBoundary) thingsToDetect.push(leftBoundary);
        if (rightBoundary) thingsToDetect.push(rightBoundary);
		if (bottomBoundary) thingsToDetect.push(bottomBoundary);

        for (let i = 0; i < SENSOR_COUNT; i++) {
            const sensorAngle = this.angle + map(i, 0, SENSOR_COUNT - 1, -PI / 2, PI / 2);
            const rayStartVec = this.pos;
            const rayEndVec = createVector(
                rayStartVec.x + SENSOR_LENGTH * cos(sensorAngle),
                rayStartVec.y + SENSOR_LENGTH * sin(sensorAngle)
            );

            let closestDist = SENSOR_LENGTH;
            let closestPoint = rayEndVec;

            for (const item of thingsToDetect) {
                let intersectionInfo = null;

                if (item.type === 'circle') {
                    // Gọi hàm tính giao điểm tia-hình tròn 
                    intersectionInfo = intersectLineSegmentCircle(
                        rayStartVec, rayEndVec,
                        createVector(item.x, item.y), item.radius
                    );
                } else if (item.type === 'line') {
                    // Gọi hàm tính giao điểm tia-đoạn thẳng
                    let intersectionPoint = lineLineIntersection(
                        rayStartVec.x, rayStartVec.y, rayEndVec.x, rayEndVec.y,
                        item.x1, item.y1, item.x2, item.y2
                    );
                    if (intersectionPoint) {
                        intersectionInfo = {
                            point: intersectionPoint,
                            dist: p5.Vector.dist(rayStartVec, intersectionPoint)
                        };
                    }
                }

                // Cập nhật điểm gần nhất cho tia này
                if (intersectionInfo && intersectionInfo.dist < closestDist) {
                    closestDist = intersectionInfo.dist;
                    closestPoint = intersectionInfo.point;
                }
            }

            this.sensors.push({ point: closestPoint, dist: closestDist });
            this.sensorDistances[i] = map(closestDist, 0, SENSOR_LENGTH, 1, 0); // 1=gần, 0=xa
        }
    }

    // --- Quyết định từ NEAT ---
    think() {
        if (!this.alive) return;
        
        // Tính toán đầu vào cho mạng nơ-ron
        let inputs = [...this.sensorDistances]; // input sẽ bao gồm các thông tin của cảm biến và
        inputs.push(this.vel.x / MAX_SPEED); // thông số tốc độ vx hiện tại (0-1)
        inputs.push(this.vel.y / MAX_SPEED); // thông số tốc độ vy hiện tại (0-1)
        let distanceToTarget = map(this.pos.y, this.initialY, 0, 0, 1); // khoảng cách đến vạch đích (0-1)
        inputs.push(distanceToTarget); // khoảng cách đến vạch đích (0-1)    

        const outputs = this.genome.activate(inputs); // Đầu ra từ mạng nơ-ron        
        // Map output sang lực lái và ga/phanh
        this.steer = map(outputs[0], 0, 1, -STEER_FORCE, STEER_FORCE);
        const throttle = map(outputs[1], 0, 1, -ACCELERATION * 0.3, ACCELERATION); // Giảm khả năng lùi
        this.applyForce(createVector(throttle, 0)); // Tạo lực ga/phanh
    }

    // --- Áp dụng lực ---
    applyForce(force) {
        let rotatedForce = force.copy().rotate(this.angle);
        this.acc.add(rotatedForce);
    }

    // --- Cập nhật vật lý ---
    update() {
        if (!this.alive) return;
        this.timeAlive++;

        if (this.speed > 0.1) { this.angle += this.steer * (this.speed / MAX_SPEED); }
        this.vel.add(this.acc);
        this.vel.limit(MAX_SPEED);
        this.vel.mult(1 - FRICTION);
        this.pos.add(this.vel);
        this.speed = this.vel.mag();
        this.acc.mult(0); // Reset gia tốc
        this.totalDistance += p5.Vector.dist(this.pos, this.lastPos);
        this.progress = max(0, this.initialY - this.pos.y); // Cập nhật tiến độ Y

        // Kiểm tra timeout
        if (this.timeAlive > MAX_TIME_ALIVE) {
            this.alive = false;
        }
        // Cập nhật lastPos sau khi di chuyển
        this.lastPos = this.pos.copy();
    }

    // --- Kiểm tra Va chạm (Thân xe với obstacles/biên) ---
    checkCollision(obstacles, leftBoundary, rightBoundary, bottomBoundary) {
        if (!this.alive) return;

        // --- 1. Va chạm Xe (hình tròn) vs Obstacles (hình tròn) ---
        if (obstacles) {
            for (const obs of obstacles) {
                // Tính khoảng cách giữa tâm xe và tâm obstacle
                let d = dist(this.pos.x, this.pos.y, obs.x, obs.y);
                // Va chạm nếu khoảng cách <= tổng bán kính
                if (d <= this.collisionRadius + obs.radius) {
                    this.alive = false;
                    // console.log("--- Xe chết do va chạm obstacle ---");
                    return; // Dừng kiểm tra ngay khi có va chạm
                }
            }
        }

        // --- 2. Va chạm Xe (hình tròn) vs Biên (đoạn thẳng) ---
        // Tạo vector cho các điểm biên để dùng với hàm distPointLineSegment
        let vLeftA = leftBoundary ? createVector(leftBoundary.x1, leftBoundary.y1) : null;
        let vLeftB = leftBoundary ? createVector(leftBoundary.x2, leftBoundary.y2) : null;
        let vRightA = rightBoundary ? createVector(rightBoundary.x1, rightBoundary.y1) : null;
        let vRightB = rightBoundary ? createVector(rightBoundary.x2, rightBoundary.y2) : null;
        let vBottomA = bottomBoundary ? createVector(bottomBoundary.x1, bottomBoundary.y1) : null;
        let vBottomB = bottomBoundary ? createVector(bottomBoundary.x2, bottomBoundary.y2) : null;

        // Kiểm tra biên trái
        if (vLeftA && vLeftB) {
            let distToLeft = distPointLineSegment(this.pos, vLeftA, vLeftB);
            if (distToLeft <= this.collisionRadius) {
                this.alive = false;
                // console.log("--- Xe chết do va chạm biên TRÁI ---");
                return;
            }
        }

        // Kiểm tra biên phải
        if (vRightA && vRightB) {
            let distToRight = distPointLineSegment(this.pos, vRightA, vRightB);
            if (distToRight <= this.collisionRadius) {
                this.alive = false;
                // console.log("--- Xe chết do va chạm biên PHẢI ---");
                return;
            }
        }

        // Kiểm tra biên dưới
        if (vBottomA && vBottomB) {
            let distToBottom = distPointLineSegment(this.pos, vBottomA, vBottomB);
            if (distToBottom <= this.collisionRadius) {
                this.alive = false;
                // console.log("--- Xe chết do va chạm biên DƯỚI ---");
                return;
            }
        }
    }

    // --- Kiểm tra Về Đích ---
    checkFinishLine(finishLine) {
        if (!this.alive || this.finished || !finishLine) return;
        // Vượt qua đường Y của vạch đích
        if (this.pos.y < finishLine.y) {
            this.finished = true;
            this.alive = false; // Dừng lại
            this.timeToFinish = this.timeAlive;
        }
    }

    // --- Tính Fitness ---
    calculateFitness() {
        let finishBonus = 0;
        if (this.finished) {
            finishBonus = 10000; // Thưởng lớn khi về đích
            // Thưởng thêm nếu về đích nhanh
            finishBonus += max(0, MAX_TIME_ALIVE - this.timeToFinish) * 0.5;
        }

        // Phần thưởng tiến độ dựa trên quãng đường Y đi được
        let progressReward = this.progress * 5;
        //console.log("Progress: ", this.progress);

        // Phạt nhẹ nếu chết giữa đường (để phân biệt với xe không làm gì)
        let penalty = 0;
        if (!this.alive && !this.finished && this.timeAlive < MAX_TIME_ALIVE) {
             penalty = -5; // Phạt nhẹ
             progressReward *= 0.95; // Giảm nhẹ phần thưởng tiến độ
        }

        this.fitness = finishBonus + progressReward + penalty;
        this.fitness = max(0, this.fitness); // Đảm bảo không âm
        this.genome.score = this.fitness;
    }

    // --- Vẽ xe ---
    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        rectMode(CENTER);
        noStroke();

        // Màu sắc theo trạng thái
        if (this.finished) fill(0, 255, 0, 220);       // Xanh lá cây (về đích)
        else if (this.alive) {
            if (this.fitness >= highestFitness && highestFitness > 10) fill(255, 255, 0, 220); // Vàng (tốt nhất)
            else fill(180, 180, 255, 180);             // Xanh nhạt (đang chạy)
        }
        else fill(100, 100, 100, 100);                // Xám (chết)

        rect(0, 0, this.width, this.height);          // Thân xe
        fill(0, 0, 0, this.alive ? 200 : 100);        // Màu đen cho dấu phía trước
        beginShape(); // Bắt đầu vẽ hình tam giác
        fill(255, 0, 0, this.alive ? 200 : 100); // Màu đỏ cho dấu phía trước
        vertex(this.width * 0.3, -this.height * 0.25); // Đỉnh trên
        vertex(this.width * 0.3, this.height * 0.25); // Đỉnh dưới
        vertex(this.width * 0.5, 0); // Đỉnh nhọn phía trước
        endShape(CLOSE); // Kết thúc vẽ hình tam giác
        // mui xe là một hình chữ nhật nhỏ hơn nhưng nằm ở giữa thân xe
        // và có màu khác để tạo sự tương phản với thân xe
        fill(130, 130, 255, this.alive ? 200 : 100); // Màu xanh dương cho mui xe
        rect(0, 0, this.width * 0.5, this.height); // Mui xe

        pop();

        // Vẽ cảm biến (DEBUG)
        if (this.alive && DEBUG_MODE) {
            for (const sensor of this.sensors) {
				stroke(0, 255, 0, 80); strokeWeight(1);
                line(this.pos.x, this.pos.y, sensor.point.x, sensor.point.y);
                fill(255, 0, 0); noStroke();
                ellipse(sensor.point.x, sensor.point.y, 5, 5);
            }
        }

        // Vẽ vùng va chạm (DEBUG)
        if (DEBUG_MODE) {
            noFill();
            strokeWeight(1);
            if (this.finished) stroke(0, 255, 0, 150);
            else if (this.alive) stroke(255, 0, 0, 150);
            else stroke(100, 100, 100, 100);
            ellipse(this.pos.x, this.pos.y, this.collisionRadius * 2);
        }
    }
}