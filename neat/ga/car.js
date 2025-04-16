// ======================
// === File: car.js ===
// ======================

class Car {
    /**
     * Khởi tạo xe
     * @param {tf.LayersModel} brain Mô hình mạng nơ-ron TensorFlow.js
     * @param {p5.Vector} startPos Vector vị trí bắt đầu
     * @param {number} startAngle Góc ban đầu (radians)
     */
    constructor(brain, startPos, startAngle) {
        // --- TF.js Model ---
        this.brain = brain;

        // --- Vật lý & Vị trí ---
        this.pos = startPos.copy();
        this.vel = createVector(0, 0);
        this.angle = startAngle; // radians
        this.speed = 0; // Tốc độ hiện tại (tính toán)
        this.throttle = 0; // Output ga [-1, 1] từ NN
        this.steer = 0;    // Output lái [-1, 1] từ NN
        this.width = 15;
        this.height = 10;
        this.collisionRadius = 10; // Bán kính va chạm

        // --- Cảm biến ---
        this.sensors = [];
        this.sensorDistances = new Array(SENSOR_COUNT).fill(SENSOR_LENGTH); // Khởi tạo với max dist

        // --- Trạng thái & Fitness ---
        this.alive = true;
        this.finished = false;
        this.timeToFinish = 0;
        this.fitness = 0; // Fitness cuối cùng
        this.timeAlive = 0;
        this.totalDistance = 0;
        this.lastPos = this.pos.copy();
        this.startDistanceToGoal = dist(this.pos.x, this.pos.y, goal.x, goal.y);
        this.closestDistToGoal = this.startDistanceToGoal;
        this.progress = 0;
    }

    /**
     * Wrapper chạy logic chính của xe.
     */
    run(obstacles, leftBoundary, rightBoundary, bottomBoundary, finishLine) {
        if (!this.alive) return;

        const inputs = this.getInputs(obstacles, leftBoundary, rightBoundary, bottomBoundary);
        this.think(inputs); // Quyết định throttle và steer
        this.update();      // Cập nhật vật lý dựa trên throttle/steer
        this.checkCollision(obstacles, leftBoundary, rightBoundary, bottomBoundary);
        if (this.alive) {
            this.checkFinish(finishLine);
        }
    }


    /**
     * Lấy inputs cho mạng nơ-ron.
     */
    getInputs(obstacles, leftBoundary, rightBoundary, bottomBoundary) {
        // 1. Cập nhật cảm biến
        this.look(obstacles, leftBoundary, rightBoundary, bottomBoundary);
        // Chuẩn hóa khoảng cách sensor [0, 1] (0=xa, 1=gần)
        const normalizedSensorDistances = this.sensorDistances.map(d => constrain(map(d, 0, SENSOR_LENGTH, 1, 0), 0, 1));

        // 2. Tính toán thông tin về đích
        let vectorToGoal = p5.Vector.sub(createVector(goal.x, goal.y), this.pos);
        let distToGoal = vectorToGoal.mag();
        let angleToGoal = vectorToGoal.heading();
        let relativeAngle = angleToGoal - this.angle;
        // Chuẩn hóa góc tương đối về [-PI, PI]
        while (relativeAngle > PI) relativeAngle -= TWO_PI;
        while (relativeAngle < -PI) relativeAngle += TWO_PI;

        // 3. Chuẩn hóa thông tin đích
        const maxPossibleDist = dist(0, 0, width, height); // Hoặc một giá trị ước lượng hợp lý
        let normalizedDist = constrain(map(distToGoal, 0, maxPossibleDist, 0, 1), 0, 1);
        let normalizedAngle = relativeAngle / PI; // Chuẩn hóa về [-1, 1]

        // Kiểm tra NaN (có thể xảy ra nếu dist = 0)
        if (isNaN(normalizedDist)) normalizedDist = 0;
        if (isNaN(normalizedAngle)) normalizedAngle = 0;

        return [...normalizedSensorDistances, normalizedDist, normalizedAngle];
    }

    /**
     * Cập nhật cảm biến.
     */
    look(obstacles, leftBoundary, rightBoundary, bottomBoundary) {
        this.sensors = []; // Reset sensor data for drawing
        this.sensorDistances = []; // Reset distances for input
        const thingsToDetect = [];
        if (obstacles) obstacles.forEach(obs => thingsToDetect.push(obs));
        if (leftBoundary) thingsToDetect.push(leftBoundary);
        if (rightBoundary) thingsToDetect.push(rightBoundary);
        if (bottomBoundary) thingsToDetect.push(bottomBoundary);

        for (let i = 0; i < SENSOR_COUNT; i++) {
            const sensorAngle = this.angle + map(i, 0, SENSOR_COUNT - 1, -PI / 1.8, PI / 1.8);
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
                    intersectionInfo = intersectLineSegmentCircle(rayStartVec, rayEndVec, createVector(item.x, item.y), item.radius);
                } else if (item.type === 'line') {
                    let p = lineLineIntersection(rayStartVec.x, rayStartVec.y, rayEndVec.x, rayEndVec.y, item.x1, item.y1, item.x2, item.y2);
                    if (p) { intersectionInfo = { point: p, dist: p5.Vector.dist(rayStartVec, p) }; }
                }

                if (intersectionInfo && intersectionInfo.dist < closestDist) {
                    closestDist = intersectionInfo.dist;
                    closestPoint = intersectionInfo.point;
                }
            }
            this.sensors.push({ point: closestPoint, dist: closestDist });
            this.sensorDistances.push(closestDist); // Lưu khoảng cách thực tế
        }
    }

    /**
     * Sử dụng mạng tf.js để quyết định hành động (throttle, steer).
     */
    think(inputs) {
        // tf.tidy để quản lý bộ nhớ
        tf.tidy(() => {
            const inputTensor = tf.tensor2d([inputs]);
            const outputTensor = this.brain.predict(inputTensor);
            const actions = outputTensor.dataSync(); // Lấy output [0, 1]

            // Map sang [-1, 1]
            this.throttle = actions[0] * 2 - 1;
            this.steer = actions[1] * 2 - 1;

            // Giới hạn throttle lùi (tùy chọn)
            this.throttle = max(-0.3, this.throttle);
        });
    }


    /**
     * Cập nhật vật lý dựa trên throttle và steer.
     */
    update() {
        if (!this.alive) return;
        this.timeAlive++;

        // Tính toán tốc độ và góc quay
        this.speed = this.throttle * MAX_SPEED;
        let turnAmount = this.steer * STEER_FORCE; // * (1 - abs(this.speed) / (MAX_SPEED * 1.5)); // Bỏ giảm góc cua khi nhanh cho đơn giản

        // Cập nhật góc
        this.angle += turnAmount;
        // Giữ góc trong khoảng [-PI, PI] hoặc [0, TWO_PI] (tùy chọn)
        // this.angle = (this.angle + PI) % TWO_PI - PI;

        // Cập nhật vận tốc vector
        this.vel.x = this.speed * cos(this.angle);
        this.vel.y = this.speed * sin(this.angle);

        // Cập nhật vị trí
        this.pos.add(this.vel);

        // Cập nhật thông số fitness
        let currentDist = dist(this.pos.x, this.pos.y, goal.x, goal.y);
        this.closestDistToGoal = min(this.closestDistToGoal, currentDist);
        this.progress = max(0, this.initialY - this.pos.y);
        this.totalDistance += this.vel.mag(); // Quãng đường = độ lớn vận tốc

        // Kiểm tra timeout
        if (this.timeAlive > MAX_TIME_ALIVE) {
            this.alive = false;
        }
        // Cập nhật lastPos
        this.lastPos = this.pos.copy();
    }

    /**
     * Kiểm tra va chạm (Không dùng p5.collide2D).
     */
    checkCollision(obstacles, leftBoundary, rightBoundary, bottomBoundary) {
        if (!this.alive) return;

        // 1. Obstacles (Circle-Circle)
        if (obstacles) {
            for (const obs of obstacles) {
                if (dist(this.pos.x, this.pos.y, obs.x, obs.y) <= this.collisionRadius + obs.radius) {
                    this.alive = false; return;
                }
            }
        }

        // 2. Biên (Circle-LineSegment)
        const boundaries = [leftBoundary, rightBoundary, bottomBoundary];
        for (const boundary of boundaries) {
            if (boundary) {
                let vA = createVector(boundary.x1, boundary.y1);
                let vB = createVector(boundary.x2, boundary.y2);
                // Gọi hàm trợ giúp từ sketch.js
                if (distPointLineSegment(this.pos, vA, vB) <= this.collisionRadius) {
                    this.alive = false; return;
                }
            }
        }
    }

    /**
     * Kiểm tra về đích.
     */
    checkFinish(finishLine) {
        if (!this.alive || this.finished || !finishLine) return;
        if (this.pos.y < finishLine.y && this.pos.x > finishLine.x1 && this.pos.x < finishLine.x2) {
            this.finished = true;
            this.alive = false; // Dừng khi về đích
            this.timeToFinish = this.timeAlive;
        }
    }

    /**
     * Tính toán fitness cuối cùng (gọi khi xe dừng).
     */
    calculateFinalFitness() {
        let baseFitness = 0;
        const finishBonus = 5000; // Thưởng khi về đích
        const timeBonusFactor = 0.3; // Hệ số thưởng cho thời gian sống
        const progressFactor = 3.0; // Hệ số thưởng cho quãng đường hoàn thành 
        const deathPenaltyFactor = 0.3; // Hệ số phạt khi chết 

        if (this.finished) {
            baseFitness = finishBonus;
            baseFitness += max(0, MAX_TIME_ALIVE - this.timeToFinish) * timeBonusFactor;
        } else {
            // Thưởng dựa trên % quãng đường đã hoàn thành (so với khoảng cách ban đầu)
            baseFitness = max(0, this.startDistanceToGoal - this.closestDistToGoal) * progressFactor;            

            // phần này làm cho xe sẽ có chiều hướng đi thẳng tới đích, nhưng lại làm cho xe không muốn né vật cản 
            // nên tạm thời mình không dùng
            // // thưởng nếu xe có hướng di chuyển tốt là hướng về đích -PI/2 (tương đối với góc)
            // let vectorToGoal = p5.Vector.sub(createVector(goal.x, goal.y), this.pos);
            // let angleToGoal = vectorToGoal.heading();
            // let relativeAngle = angleToGoal - this.angle;
            // // Chuẩn hóa góc tương đối về [-PI, PI]
            // while (relativeAngle > PI) relativeAngle -= TWO_PI;
            // while (relativeAngle < -PI) relativeAngle += TWO_PI;
            // // Tính toán phần thưởng dựa trên góc
            // let angleReward = map(abs(relativeAngle), 0, PI, 1, 0); // Thưởng khi gần 0 độ
            // baseFitness += angleReward * 100; // Thưởng thêm cho góc di chuyển tốt
            
            // Phạt nếu chết
            if (!this.alive) {
                 baseFitness *= deathPenaltyFactor;
                 // Phạt thêm nếu chết quá sớm?
                 // baseFitness *= (this.timeAlive / MAX_TIME_ALIVE);
            }
        }
        // Thưởng nhỏ cho thời gian sống sót? (Có thể gây nhiễu)
        // baseFitness += this.timeAlive * 0.001;

        this.fitness = max(0.1, baseFitness); // Đảm bảo fitness luôn > 0 một chút
    }

    /**
     * Vẽ xe.
     */
    draw() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        rectMode(CENTER);
        noStroke();

        // Chọn màu
        if (this.finished) fill(0, 255, 0, 220);
        else if (this.alive) {
            // Dùng currentHighestFitness (ước lượng) để highlight
            if (max(0, this.startDistanceToGoal - this.closestDistToGoal) >= currentHighestFitness && currentHighestFitness > 1) fill(255, 255, 0, 220);
            else fill(180, 180, 255, 180);
        }
        else fill(100, 100, 100, 100);

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

        // Vẽ debug
        if (DEBUG_MODE) {
            // Collision Radius
            noFill(); strokeWeight(1);
            if (this.finished) stroke(0, 255, 0, 150);
            else if (this.alive) stroke(255, 0, 0, 150);
            else stroke(100, 100, 100, 100);
            ellipse(this.pos.x, this.pos.y, this.collisionRadius * 2);

            // Sensors
            if(this.alive){
                for (const sensor of this.sensors) {
                    stroke(0, 255, 0, 80); 
                    strokeWeight(0.5);
                    line(this.pos.x, this.pos.y, sensor.point.x, sensor.point.y);
                    fill(255, 0, 0); noStroke(); ellipse(sensor.point.x, sensor.point.y, 5, 5);
                }
            }
        }
    }

    /** Giải phóng bộ nhớ model TF.js */
    dispose() {
        if (this.brain) {
            this.brain.dispose();
        }
    }
}