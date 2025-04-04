// Biến cờ để đảm bảo chỉ tăng success/fail counter một lần mỗi episode
let successCounterIncreasedThisEpisode = false;
let failCounterIncreasedThisEpisode = false;

class Lander {
    constructor() {
        // Khởi tạo vị trí và vận tốc ngẫu nhiên 
        this.x = random(width * 0.2, width * 0.8);
        this.y = random(50, 150);
        this.vx = random(-1, 1); // Vận tốc ngang ban đầu
        this.vy = random(0, 1);  // Vận tốc dọc ban đầu
        this.size = 15; // Kích thước nhỏ hơn chút
        this.controlState = "NONE"; // Trạng thái điều khiển để vẽ hình ảnh
    }

    applyGravity() {
        this.vy += gravity;
    }

    applyWind(force) {
        this.vx += force;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        // Giới hạn tốc độ tối đa (tránh trường hợp tăng tốc quá mức)
        this.vx = constrain(this.vx, -5, 5);
        this.vy = constrain(this.vy, -8, 8);
    }

    // --- Các hành động điều khiển ---
    thrustUp() {
        this.vy -= 0.2; // Lực đẩy mạnh hơn chút
        this.controlState = "UP";
    }

    thrustLeft() {
        this.vx -= 0.12; // Lực đẩy ngang mạnh hơn chút
        this.controlState = "LEFT";
    }

    thrustRight() {
        this.vx += 0.12;
        this.controlState = "RIGHT";
    }

    // --- Dừng tàu khi kết thúc episode ---
    stop() {
        this.vx = 0;
        this.vy = 0;
    }

    // --- Kiểm tra trạng thái kết thúc ---
    checkStatus() {
        // 1. Kiểm tra ra ngoài biên
        if (this.x < 0 || this.x > width || this.y < 0) {
            // Không cần tăng failCounter ở đây nữa, sẽ tăng dựa trên gameState ở draw() nếu cần
            if (!failCounterIncreasedThisEpisode) { // Đảm bảo chỉ tăng 1 lần mỗi episode
                failCounter++;
                failCounterIncreasedThisEpisode = true;
            }
            return STATE_CRASHED_OOB;
        }

        // 2. Kiểm tra va chạm mặt đất
        if (this.y + this.size / 2 >= groundY) {
            let inZone = this.x > landingZone.x && this.x < landingZone.x + landingZone.w;
            let safeSpeed = Math.abs(this.vy) < safeVy && Math.abs(this.vx) < safeVx;

            if (inZone && safeSpeed) {
                 if (!successCounterIncreasedThisEpisode) {
                    successCounter++;
                    successCounterIncreasedThisEpisode = true;
                 }
                return STATE_SUCCESS; // Hạ cánh thành công
            } else {
                 if (!failCounterIncreasedThisEpisode) {
                    failCounter++;
                    failCounterIncreasedThisEpisode = true;
                 }
                return STATE_CRASHED_GROUND; // Rơi trên mặt đất (ngoài vùng/quá tốc độ)
            }
        }

        // Nếu không rơi vào trạng thái kết thúc nào -> đang chạy
        successCounterIncreasedThisEpisode = false; // Reset cờ đếm cho episode tiếp theo
        failCounterIncreasedThisEpisode = false;   // Reset cờ đếm cho episode tiếp theo
        return STATE_RUNNING;
    }

    draw() {
        push();
        translate(this.x, this.y);
        // Vẽ thân tàu (đơn giản hóa)
        fill(200);
        rect(-this.size / 2, -this.size / 2, this.size, this.size);
        // Vẽ mũi tàu
        fill(255, 0, 0);
        triangle(0, -this.size, -this.size / 2, -this.size / 2, this.size / 2, -this.size / 2);
        // Vẽ chân đáp (đơn giản)
        stroke(150);
        line(-this.size / 2, this.size / 2, -this.size * 0.8, this.size * 1.2);
        line(this.size / 2, this.size / 2, this.size * 0.8, this.size * 1.2);

        // Vẽ lửa đẩy nếu có
        if (this.controlState !== "NONE" && gameState !== STATE_SUCCESS) {
            fill(255, random(150, 255), 0, 200); // Màu cam/vàng
            noStroke();
            let flameSize = this.size * 0.8 + random(-2, 2);
            if (this.controlState === "UP") {
                // Lửa đẩy dưới thân
                triangle(0, this.size * 0.7, -this.size / 3, this.size * 0.5, this.size / 3, this.size * 0.5);
                triangle(0, this.size * 1.1, -this.size / 4, this.size * 0.7, this.size / 4, this.size * 0.7);
            } else if (this.controlState === "LEFT") {
                // Lửa đẩy bên phải
                triangle(this.size * 0.6, 0, this.size * 0.4, -this.size / 3, this.size * 0.4, this.size / 3);
                triangle(this.size * 0.9, 0, this.size * 0.6, -this.size / 4, this.size * 0.6, this.size / 4);
            } else if (this.controlState === "RIGHT") {
                // Lửa đẩy bên trái
                triangle(-this.size * 0.6, 0, -this.size * 0.4, -this.size / 3, -this.size * 0.4, this.size / 3);
                triangle(-this.size * 0.9, 0, -this.size * 0.6, -this.size / 4, -this.size * 0.6, this.size / 4);
            }
        }
        pop();
    }
}