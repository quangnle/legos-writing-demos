// js/car.js

// const WAYPOINT_CAPTURE_RADIUS = CAR_WIDTH * 1.5; // Đảm bảo hằng số này được định nghĩa

class Car {
    constructor(x, y, brain, startAngle = 0) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.angle = startAngle;
        this.angleV = 0; 

        this.brain = brain; 
        if (this.brain) {
            this.brain.score = 0; 
        }

        this.carWidth = CAR_WIDTH;
        this.carLength = CAR_LENGTH;

        this.isActive = true;
        this.isWinner = false;
        this.isExploded = false;
        this.timeToFinish = 0;
        this.framesAlive = 0;
        this.carColor = CAR_COLOR; 

        this.sensors = [];
        this.sensorAngles = [];
        this.numSensors = SENSOR_COUNT;
        this.sensorRange = SENSOR_RANGE;
        const dAngle = SENSOR_FOV_RADIANS / (this.numSensors > 1 ? this.numSensors - 1 : 1);
        for (let i = 0; i < this.numSensors; i++) {
            if (this.numSensors == 1) this.sensorAngles.push(0);
            else this.sensorAngles.push(-SENSOR_FOV_RADIANS / 2 + i * dAngle);
            this.sensors.push(this.sensorRange);
        }

        this.currentWaypointIndex = 0; 
        this.maxWaypointReachedThisLap = 0; 
        this.distanceOnCurrentLap = 0; 
        this.lapsCompleted = 0;

        this.corners = []; 
        this.updateCorners();
        this.previousPos = this.pos.copy(); 
    }

    // Hàm kiểm tra giao cắt giữa hai đoạn thẳng (p1-p2 và p3-p4)
    // Được định nghĩa là một phương thức của lớp Car
    lineLineIntersection(p1, p2, p3, p4) {
        let den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (den == 0) {
            return false; // Các đường thẳng song song hoặc trùng nhau
        }

        let t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
        let u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;

        // Nếu t và u nằm trong khoảng (0, 1) thì hai đoạn thẳng cắt nhau
        return t > 0 && t < 1 && u > 0 && u < 1;
    }

    getHeadingVector() { return p5.Vector.fromAngle(this.angle); }
    getSidewaysVector() { return p5.Vector.fromAngle(this.angle + PI / 2); }

    updateCorners() {
        const heading = this.getHeadingVector();
        const sideways = this.getSidewaysVector();
        const halfL = this.carLength / 2;
        const halfW = this.carWidth / 2;
        const fl_rel = heading.copy().mult(halfL).add(sideways.copy().mult(-halfW));
        const fr_rel = heading.copy().mult(halfL).add(sideways.copy().mult(halfW));
        const rl_rel = heading.copy().mult(-halfL).add(sideways.copy().mult(-halfW));
        const rr_rel = heading.copy().mult(-halfL).add(sideways.copy().mult(halfW));
        this.corners = [
            p5.Vector.add(this.pos, fl_rel), p5.Vector.add(this.pos, fr_rel),
            p5.Vector.add(this.pos, rr_rel), p5.Vector.add(this.pos, rl_rel)
        ];
    }

    updateSensors(track) { 
        if (!this.isActive) return;
        const sensorOriginOffset = this.carLength / 2 * 0.9;
        const sensorOrigin = this.pos.copy().add(this.getHeadingVector().mult(sensorOriginOffset));
        for (let i = 0; i < this.numSensors; i++) {
            const sensorAngleAbs = this.angle + this.sensorAngles[i];
            const rayDir = p5.Vector.fromAngle(sensorAngleAbs);
            let closestDist = this.sensorRange;
            const stepSize = 5;
            for (let d = stepSize; d <= this.sensorRange; d += stepSize) {
                const checkPoint = sensorOrigin.copy().add(rayDir.copy().mult(d));
                if (track.isPointOffTrack(checkPoint)) {
                    closestDist = d;
                    break;
                }
            }
            this.sensors[i] = closestDist;
        }
    }

    think() {
        if (!this.isActive) return;

        const inputs = [];

        // **1. Đầu vào mới: Độ lớn vận tốc của xe**
        const speedMagnitude = this.vel.mag();
        inputs.push(speedMagnitude / MAX_SPEED); // Chuẩn hóa về [0, 1]

        // **2. Đầu vào mới: Góc lệch giữa hướng xe và hướng của tim đường**
        let relativeAngleToTrack = 0;
        if (track.centerlineWaypoints.length > 1) {
            const currentWpIndex = this.currentWaypointIndex; // Đã cập nhật trong calculateProgress
            const nextWpIndex = (currentWpIndex + 1) % track.centerlineWaypoints.length;

            const currentWp = track.centerlineWaypoints[currentWpIndex];
            const nextWp = track.centerlineWaypoints[nextWpIndex];

            // Đảm bảo có thể tính toán vector hướng
            if (currentWp && nextWp) {
                const trackDirVector = p5.Vector.sub(nextWp.pos, currentWp.pos);
                if (trackDirVector.magSq() > 0.0001) { // Tránh chia cho 0 nếu 2 waypoint trùng nhau
                    trackDirVector.normalize();
                    const carHeadingVector = this.getHeadingVector();

                    // Tính góc giữa hai vector (rad)
                    // p5.Vector.angleBetween trả về góc giữa hai vector
                    relativeAngleToTrack = p5.Vector.angleBetween(carHeadingVector, trackDirVector);
                    // Chuẩn hóa góc lệch về khoảng [-1, 1] hoặc [0, 1]
                    // Map từ [-PI, PI] sang [-1, 1]
                    relativeAngleToTrack = map(relativeAngleToTrack, -PI, PI, -1, 1);
                }
            }
        }
        inputs.push(relativeAngleToTrack);

        // **3. Đầu vào: Dữ liệu từ cảm biến**
        for (let i = 0; i < this.numSensors; i++) {
            inputs.push(this.sensors[i] / this.sensorRange); // Chuẩn hóa cảm biến về [0, 1]
        }

        const outputs = this.brain.activate(inputs);
        this.applyControls(outputs);
    }

    applyControls(outputs) { 
        let accelerateInput = outputs[0];
        let brakeInput = outputs[1];
        let turnLeftInput = outputs[2];
        let turnRightInput = outputs[3];

        if (accelerateInput > 0.5 && accelerateInput > brakeInput) {
            this.acc.add(this.getHeadingVector().mult(ACCELERATION_RATE));
        }
        if (brakeInput > 0.5 && brakeInput > accelerateInput) {
            if (this.vel.magSq() > 0.01) {
                let currentSpeed = this.vel.mag();
                let newSpeed = max(0, currentSpeed - DECELERATION_RATE);
                if (currentSpeed > 0) this.vel.setMag(newSpeed);
            }
        }
        let steering = 0;
        if (turnLeftInput > 0.5 && turnLeftInput >= turnRightInput) {
            steering = -(turnLeftInput - 0.5) * 2 * TURN_SPEED;
        } else if (turnRightInput > 0.5) {
            steering = (turnRightInput - 0.5) * 2 * TURN_SPEED;
        }
        this.angleV = steering;
    }
    
    updatePhysics() {
        if (!this.isActive) return;
        this.previousPos = this.pos.copy(); 

        this.framesAlive++;
        if (this.vel.magSq() > 0) {
             let frictionMagnitude = NATURAL_DECELERATION;
             if (this.vel.mag() < frictionMagnitude) this.vel.set(0,0);
             else this.vel.mult(1 - (frictionMagnitude / this.vel.mag()));
        }
        this.vel.add(this.acc);
        this.vel.limit(MAX_SPEED);
        this.angle += this.angleV;
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.updateCorners();
    }

    checkBoundaries(track) {
        if (!this.isActive) return;

        for (let corner of this.corners) {
            if (track.isPointOffTrack(corner)) {
                this.explode("Hit track boundary");
                return;
            }
        }

        if (track.antiReverseBoundary) {
            let vecToCurrentPos = p5.Vector.sub(this.pos, track.antiReverseBoundary.p1);
            let currentProj = vecToCurrentPos.dot(track.antiReverseBoundary.normal);

            if (currentProj < -CAR_WIDTH * 0.1 && this.vel.dot(track.antiReverseBoundary.normal) < -0.05) {
                // Kiểm tra giao cắt của các cạnh xe với ranh giới chạy ngược
                // Cạnh sau: corners[2] (RR) đến corners[3] (RL)
                // Cạnh trái: corners[3] (RL) đến corners[0] (FL)
                // Cạnh phải: corners[2] (RR) đến corners[1] (FR)
                if (this.lineLineIntersection(this.corners[2], this.corners[3], track.antiReverseBoundary.p1, track.antiReverseBoundary.p2) || // Cạnh sau
                    this.lineLineIntersection(this.corners[3], this.corners[0], track.antiReverseBoundary.p1, track.antiReverseBoundary.p2) || // Cạnh trái
                    this.lineLineIntersection(this.corners[2], this.corners[1], track.antiReverseBoundary.p1, track.antiReverseBoundary.p2) || // Cạnh phải
                    this.lineLineIntersection(this.previousPos, this.pos, track.antiReverseBoundary.p1, track.antiReverseBoundary.p2) // Đường đi của tâm xe
                   ) {
                    this.explode("Hit anti-reverse boundary");
                    return;
                }
            }
        }
    }

    explode(reason = "Crashed") {
        this.isActive = false;
        this.isExploded = true;
        this.vel.mult(0);
        this.angleV = 0;
        this.carColor = CAR_EXPLODED_COLOR;
        // console.log("Car exploded: " + reason);
    }

    checkFinishLine(track) {
        // 1. Điều kiện thoát sớm (Guard Clauses)
        if (!this.isActive || this.isWinner || !track.actualFinishLine) return;
        // Xe không hoạt động (đã nổ hoặc đã thắng) hoặc đã là người thắng cuộc thì không cần kiểm tra nữa.
        // Nếu track.actualFinishLine chưa được định nghĩa (lỗi khởi tạo), cũng thoát.

        // Lấy tọa độ hai điểm của vạch đích thực tế từ đối tượng track
        const finishLineP1 = track.actualFinishLine.check_p1;
        const finishLineP2 = track.actualFinishLine.check_p2;

        // 2. Điều kiện về quãng đường (Proximity Check)
        // Xe phải ở gần vạch đích về mặt quãng đường đã đi trong vòng hiện tại.
        let targetFinishDistance = track.totalCenterlineLength * 0.90; // Vạch đích nằm ở 90% tổng chiều dài đường đua
        // Khoảng cách kiểm tra: xe càng nhanh, cửa sổ kiểm tra càng lớn để đảm bảo bắt được khoảnh khắc cắt vạch
        let proximityThreshold = this.vel.mag() > 0 ? this.vel.mag() * 10 : WAYPOINT_CAPTURE_RADIUS * 4;

        // Kiểm tra xem quãng đường xe đã đi trong vòng hiện tại (distanceOnCurrentLap)
        // có nằm trong một "cửa sổ" xung quanh vị trí vạch đích hay không.
        // Điều này giúp tránh kiểm tra giao cắt không cần thiết khi xe ở xa vạch đích
        // và đảm bảo xe đã đi đủ quãng đường của một vòng.
        if (this.distanceOnCurrentLap > targetFinishDistance - proximityThreshold &&
            this.distanceOnCurrentLap < targetFinishDistance + proximityThreshold) {

            // 3. Kiểm tra giao cắt vật lý (Line Segment Intersection)
            // Sử dụng phương thức lineLineIntersection() để xem đoạn đường xe đi trong frame vừa rồi
            // (từ this.previousPos đến this.pos) có cắt qua vạch đích (finishLineP1 đến finishLineP2) hay không.
            if (this.lineLineIntersection(this.previousPos, this.pos, finishLineP1, finishLineP2)) {

                // 4. Kiểm tra hướng di chuyển (Direction Check)
                // Đảm bảo xe đi qua vạch đích đúng hướng (theo chiều kim đồng hồ của đường đua).
                // Lấy vector hướng của đoạn đường đua tại vạch đích.
                let trackDirectionAtFinish = p5.Vector.fromAngle(track.actualFinishLine.trackSegmentAngle);
                // Lấy vector hướng di chuyển của xe trong frame vừa rồi.
                let carMovementDirection = p5.Vector.sub(this.pos, this.previousPos);

                // Tính tích vô hướng (dot product) giữa vector hướng di chuyển của xe và vector hướng của đường đua.
                // Nếu tích vô hướng dương (lớn hơn 0.01 để có độ chính xác), nghĩa là xe đang di chuyển cùng hướng.
                if (carMovementDirection.dot(trackDirectionAtFinish) > 0.01) {
                    // 5. Xác nhận chiến thắng và cập nhật trạng thái
                    this.isWinner = true; // Đánh dấu xe này là người thắng cuộc
                    this.isActive = false; // Ngừng cập nhật xe (để nó đứng yên sau khi thắng)
                    this.timeToFinish = this.framesAlive; // Ghi lại thời gian hoàn thành (số frame)
                    this.lapsCompleted++; // Tăng số vòng đã hoàn thành
                    this.carColor = color(0, 200, 50); // Đổi màu xe thành màu xanh lá cây
                }
            }
        }
    }

    distSq(a,b) {
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }

    calculateProgress(track) { 
        if (!this.isActive || track.centerlineWaypoints.length === 0) return;

        let carPos = this.pos;
        let minDistSqToNext = Infinity;
        let newNextWaypointIndex = this.currentWaypointIndex; 

        const searchWindow = min(15, track.centerlineWaypoints.length); 
        for (let i = 0; i < searchWindow; i++) {
            let testIdx = (this.currentWaypointIndex + i) % track.centerlineWaypoints.length;
            // Kiểm tra xem track.centerlineWaypoints[testIdx] có tồn tại không
            if (!track.centerlineWaypoints[testIdx]) continue; 
            let distSq = this.distSq(carPos, track.centerlineWaypoints[testIdx].pos);

            if (distSq < minDistSqToNext) {
                minDistSqToNext = distSq;
                newNextWaypointIndex = testIdx;
            }
        }
        
        if (minDistSqToNext < WAYPOINT_CAPTURE_RADIUS * WAYPOINT_CAPTURE_RADIUS * 1.5) { 
            let potentialMaxWp = newNextWaypointIndex;
            let currentMax = this.maxWaypointReachedThisLap;
            let trackLen = track.centerlineWaypoints.length;
            
            let isForwardOrLap = false;
            if (potentialMaxWp >= currentMax) {
                isForwardOrLap = true;
            } else if (currentMax > trackLen * 0.8 && potentialMaxWp < trackLen * 0.2) { // Qua vòng
                isForwardOrLap = true;
                // Nếu thực sự qua vòng, checkFinishLine sẽ xử lý lapsCompleted, 
                // maxWaypointReachedThisLap sẽ tự nhiên trở thành index nhỏ của vòng mới.
            }

            if (isForwardOrLap) {
                 this.maxWaypointReachedThisLap = potentialMaxWp;
            }
        }
        this.currentWaypointIndex = newNextWaypointIndex; 

        if (track.centerlineWaypoints[this.maxWaypointReachedThisLap]) {
            this.distanceOnCurrentLap = track.centerlineWaypoints[this.maxWaypointReachedThisLap].cumulativeDistance;
        } else if (track.centerlineWaypoints.length > 0) { // Fallback nếu index bị lỗi
             this.distanceOnCurrentLap = track.centerlineWaypoints[0].cumulativeDistance; // Hoặc giá trị hợp lý khác
        } else {
             this.distanceOnCurrentLap = 0;
        }
    }


    calculateAndSetFitness(track) { 
        if (!this.brain) return 0;
        let fitness = 0;
        fitness += this.distanceOnCurrentLap + (this.lapsCompleted * track.totalCenterlineLength * 1.1);

        // Thưởng thêm nếu xe đang đi đúng hướng
        if (track.centerlineWaypoints.length > 1 && this.vel.magSq() > 0.1) {
            const currentWp = track.centerlineWaypoints[this.currentWaypointIndex % track.centerlineWaypoints.length];
            const nextWpIndex = (this.currentWaypointIndex + 1) % track.centerlineWaypoints.length;
            const nextWp = track.centerlineWaypoints[nextWpIndex];

            const trackDir = p5.Vector.sub(nextWp.pos, currentWp.pos).normalize();
            const carHeading = this.getHeadingVector().normalize();
            const alignment = carHeading.dot(trackDir);

            // Thưởng nếu alignment dương (cùng hướng), phạt nhẹ nếu ngược hướng            
            fitness += fitness * 0.5 * alignment;
        }

        if (this.isWinner) {
            fitness += 2000;
            fitness += (MAX_FRAMES_PER_GENERATION * 2 - this.timeToFinish) * 0.5;
        } else if (this.isExploded) {
            fitness *= 0.75;
        } else {
            fitness *= 0.9;
        }
        this.fitness = max(1, fitness);
        this.brain.score = this.fitness;
        return this.fitness;
    }

    display() { 
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);
        rectMode(CENTER);
        strokeWeight(1);
        
        fill(this.carColor); 
        if (this.isExploded) stroke(0); 
        else if (this.isWinner) stroke(255); 
        else stroke(0);

        rect(0, 0, this.carLength, this.carWidth);
        stroke(this.isWinner ? 0 : 255); 
        line(this.carLength * 0.25, 0, this.carLength / 2, 0);
        

        if (this.isActive && !this.isWinner) { 
            stroke(SENSOR_COLOR);
            strokeWeight(1.5);
            const sensorDrawOriginX = this.carLength / 2 * 0.8;
            for (let i = 0; i < this.numSensors; i++) {
                line(sensorDrawOriginX, 0,
                     sensorDrawOriginX + cos(this.sensorAngles[i]) * this.sensors[i],
                     sin(this.sensorAngles[i]) * this.sensors[i]);
            }
        }
        pop();
    }
}