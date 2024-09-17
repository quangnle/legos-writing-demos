class Fireworks {
    constructor(nParticles) {
        this.nParticles = nParticles;
        this.particles = [];
    }

    explode(x, y) {
        for (let i = 0; i < this.nParticles; i++) {
            let p = new Particle(x, y, color(random(255), random(255), random(255)), random(2, 4));
            p.addForce(createVector(random(-1.0, 1.0), random(-1.0, 1.0)));
            this.particles.push(p);
        }
    }

    update() {
        for (let i = 0; i < this.particles.length; i++) {
            //add gravity
            this.particles[i].addForce(createVector(0, 0.03));
            // update and check if particle is dead
            this.particles[i].update();
            if (this.particles[i].life >= this.particles[i].maxLife) {
                this.particles.splice(i, 1);
                i--;
            }         
        }
    }

    draw() {
        this.update();
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw();
        }
    }
}