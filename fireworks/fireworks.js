class Fireworks {
    constructor(nParticles) {
        this.nParticles = nParticles;
        this.particles = [];
        this.exploded = false;
    }

    explode(x ,y) {
        this.exploded = true;
        for (let i = 0; i < this.nParticles; i++) {
            let p = new Particle(x, y, color(random(255), random(255), random(255)), random(2, 4));
            p.addForce(createVector(random(-1.5, 1.5), random(-1.5, 1.5)));
            this.particles.push(p);
        }
    }

    draw() {
        if (this.exploded) {
            for (let i = 0; i < this.particles.length; i++) {
                //add gravity
                this.particles[i].addForce(createVector(0, 0.03));

                this.particles[i].update();                
                this.particles[i].draw();
            }
        }
    }
}