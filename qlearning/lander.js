class Lander {
    constructor() {
        this.x = width / 2;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.size = 20;
        this.controlState = "NONE"; // NONE, UP, LEFT, RIGHT
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
    }

    thrustUp() {
        this.vy -= 0.2;
        this.controlState = "UP";
    }

    thrustLeft() {
        this.vx -= 0.1;
        this.controlState = "LEFT";
    }

    thrustRight() {
        this.vx += 0.1;
        this.controlState = "RIGHT";
    }

    checkCollision() {
        if (this.y + this.size / 2 >= groundY) {
            let inZone = this.x > landingZone.x && this.x < landingZone.x + landingZone.w;
            if (abs(this.vy) < safeVy && abs(this.vx) < safeVx && inZone) {
                console.log(`✅ Landed successfully! vx=${this.vx.toFixed(3)}, vy=${this.vy.toFixed(3)}, in landing zone = ${inZone}`);
                landed = true;
                successCounter++;    
            } else {
                console.log(`💥 Crashed! vx=${this.vx.toFixed(3)}, vy=${this.vy.toFixed(3)}, in landing zone = ${inZone}`);
                crashed = true;
                failCounter++;
            }
            this.vy = 0;
            this.vx = 0;
        }
    }

    checkBounds() {
        if (this.x < 0 || this.x > width || this.y < 0){
            crashed = true;
            console.log(`💥 Out of Bound - Crashed! vx=${this.vx.toFixed(3)}, vy=${this.vy.toFixed(3)}, x=${this.x.toFixed(3)}, y=${this.y.toFixed(3)}`);
            failCounter++;
        } 
    }

    draw() {
        push();
        translate(this.x, this.y);

        // vẽ phần đuôi
        fill(255, 0, 0);
        triangle(0, this.size * -1.5, -this.size * 0.5, this.size * 1.5, this.size * 0.5, this.size * 1.5);

        // vẽ cánh 
        fill(255, 0, 0);
        triangle(0, this.size * -0.5, -this.size * 0.5, this.size * 0.5, this.size * 0.5, this.size * 0.5);

        // vẽ thân
        fill(255);
        rect(-this.size * 0.3, -this.size * 1.5, this.size * 0.6, this.size * 2);

        // vẽ mũi
        fill(255, 0, 0);
        triangle(0, -this.size * 2.2, -this.size * 0.5, -this.size * 1.5, this.size * 0.5, -this.size * 1.5);

        // vẽ trạng thái điều khiển các ký tự mũi tên tương ứng với trạng thái điều khiển
        fill(0, 255, 0);
        textAlign(CENTER, CENTER);
        if (this.controlState === "UP") {
            text("↑", 0, this.size * -2.4);
        } else if (this.controlState === "LEFT") {
            text("←", -this.size * 0.7, this.size * -1);
        } else if (this.controlState === "RIGHT") {
            text("→", this.size * 0.7, this.size * -1);
        }
        
        pop();
    }
}