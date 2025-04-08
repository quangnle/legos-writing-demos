class Lander {
    constructor() {
        // Khởi tạo tạm thời, sẽ được reset đúng cách với vị trí chung
        this.size = 10;
        // Gọi reset với giá trị mặc định ban đầu, sẽ bị ghi đè
        this.reset(width / 2 || 400, 50, 0, 0); // Sử dụng width/2 nếu có, nếu không thì mặc định
    }

    // Reset VỚI CÁC THAM SỐ ĐẦU VÀO
    reset(startX, startY, startVX, startVY) {
        this.x = startX;
        this.y = startY;
        this.vx = startVX;
        this.vy = startVY;
        this.actionState = 0; // Reset trạng thái hành động để vẽ
    }

    applyGravity(gravityForce) {
        this.vy += gravityForce;
    }

    applyWind(windForce) {
        this.vx += windForce;
    }

    // Áp dụng lực đẩy dựa trên action index (0:NONE, 1:UP, 2:LEFT, 3:RIGHT)
    applyAction(actionIndex) {
        this.actionState = actionIndex; // Lưu lại để vẽ
        // Các hằng số lực đẩy có thể được định nghĩa ở đây hoặc bên ngoài
        const thrustUpForce = 0.18;
        const thrustSideForce = 0.15;
        switch (actionIndex) {
            case 1: // UP
                this.vy -= thrustUpForce;
                break;
            case 2: // LEFT
                this.vx -= thrustSideForce;
                break;
            case 3: // RIGHT
                this.vx += thrustSideForce;
                break;
            // case 0: NONE - không làm gì
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    // Kiểm tra trạng thái dựa trên môi trường được truyền vào
    checkStatus(groundY, landingZone, safeVx, safeVy) {
        // 1. Kiểm tra Out Of Bounds (sử dụng p5.js globals width/height)
        if (this.x < -this.size || this.x > width + this.size || this.y < -this.size * 2) {
            return 'CRASHED_OOB';
        }

        // 2. Kiểm tra chạm đất
        if (this.y + this.size / 2 >= groundY) {
            this.y = groundY - this.size / 2; // Đặt lại vị trí ngay trên mặt đất
            let inZone = this.x > landingZone.x && this.x < landingZone.x + landingZone.w;
            let safeSpeed = Math.abs(this.vy) < safeVy && Math.abs(this.vx) < safeVx;

            // Dừng hẳn khi chạm đất để tránh lún/nảy
            this.vx = 0;
            this.vy = 0;

            return (inZone && safeSpeed) ? 'SUCCESS' : 'CRASHED_GROUND';
        }

        return 'RUNNING'; // Nếu không có gì xảy ra
    }

    // Vẽ tàu (có thể nhận màu để phân biệt)
    draw(col = color(255, 150)) {
        push();
        translate(this.x, this.y);
        fill(col);
        noStroke();
        // Thân tàu đơn giản
        rect(-this.size * 0.4, -this.size * 0.5, this.size * 0.8, this.size);
        // Mũi
        triangle(0, -this.size * 0.8, -this.size * 0.4, -this.size * 0.5, this.size * 0.4, -this.size * 0.5);
        // Chân (đơn giản)
        
        stroke(red(col), green(col), blue(col), alpha(col)*0.8);
        strokeWeight(1);
        line(-this.size * 0.3, this.size * 0.5, -this.size * 0.5, this.size * 0.9);
        line(this.size * 0.3, this.size * 0.5, this.size * 0.5, this.size * 0.9);

        // Vẽ lửa đẩy
        if (this.actionState !== 0) {
            fill(255, random(100, 200), 0, 180);
            noStroke();
            let flameBaseY = this.size * 0.5;
            let flameTipY = this.size * 0.9 + random(0, this.size * 0.3);
            let flameSideX = this.size * 0.2;
            if (this.actionState === 2) { // UP -> Lửa dưới
                triangle(0, flameTipY, -flameSideX, flameBaseY, flameSideX, flameBaseY);
            } else if (this.actionState === 3) { // LEFT -> Lửa phải
                triangle(this.size * 0.6 + random(0, this.size*0.2), 0, this.size * 0.4, -flameSideX*0.8, this.size * 0.4, flameSideX*0.8);
            } else if (this.actionState === 4) { // RIGHT -> Lửa trái
                triangle(-this.size * 0.6 - random(0, this.size*0.2), 0, -this.size * 0.4, -flameSideX*0.8, -this.size * 0.4, flameSideX*0.8);
            }
        }
        pop();
    }
}