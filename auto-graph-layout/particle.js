class Particle {
    constructor(x, y, mass) {
        this.pos = createVector(x, y);
        this.vel = createVector();
        this.acc = createVector();
        this.mass = mass;
    }

    applyForce(force) {
        // theo Newton II, F=ma => a=F/m
        force.div(this.mass);
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.mult(friction);
        this.pos.add(this.vel);
    }

    draw() {
        fill(0);
        ellipse(this.pos.x, this.pos.y, 10 + this.mass * 2, 10 + this.mass * 2);
    }
}