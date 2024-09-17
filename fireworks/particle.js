class Particle {
    constructor(x, y, color, radius) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;

        this.color = color;
        this.radius = radius;

        this.life = 0;
        this.maxLife = Math.random() * 50 + 50;
    }

    addForce(f) {
        this.ax += f.x;
        this.ay += f.y;        
    }
    
    update() {
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        this.ax = 0;
        this.ay = 0;
        this.life++;        
    }
    
    draw() {
        fill(this.color);
        noStroke();
        ellipse(this.x, this.y, this.radius, this.radius);        
    }
}