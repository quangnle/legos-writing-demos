let particles = []; // Mảng chứa các particle
let links = []; // Mảng chứa các cặp particle có liên kết
let nParticles = 50; // Số lượng particle
const k = 5000; // Hằng số lực đẩy
const ks = 0.1; // Hằng số lò xo
const r0 = 30; // Độ dài nghỉ của lò xo
const friction = 0.9; // Hệ số ma sát

let selectedParticleIndex = -1; // Index của particle được chọn

function setup() {
    createCanvas(800, 600);
    // Tạo particle ngẫu nhiên
    for (let i = 0; i < nParticles; i++) {
        particles.push(new Particle(random(width), random(height), random(1, 5)));
    }

    // tạo liên kết đan lưới giữa các particles
    // sao cho các particle luôn có ít nhất 1 liên kết
    for (let i = 0; i < particles.length; i++) {
        let nLinks = int(random(1, 3));
        for (let j = 0; j < nLinks; j++) {
            let otherIndex = int(random(particles.length));
            if (otherIndex !== i) {
                links.push([i, otherIndex]);
            }
        }
    }

}

function draw() {
    background(250, 100);

    // Tính lực cho từng particle
    for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        p1.acc.set(0, 0); // Reset gia tốc
        p1.vel.set(0, 0); // Giới hạn vận tốc

        // // Lực đẩy từ các particle khác
        for (let j = 0; j < particles.length; j++) {
            if (i !== j) {
                let p2 = particles[j];
                let dir = p5.Vector.sub(p2.pos, p1.pos);
                let r = dir.mag();
                if (r > 0) {
                    let forceMag = k / (r * r);
                    let force = dir.copy().normalize().mult(-forceMag);
                    p1.applyForce(force);
                }
            }
        }

        // Lực lò xo từ liên kết
        for (let link of links) {
            if (link[0] === i || link[1] === i) {
                let otherIndex = link[0] === i ? link[1] : link[0];
                let p2 = particles[otherIndex];
                let dir = p5.Vector.sub(p1.pos, p2.pos);
                let r = dir.mag();
                if (r > 0) {
                    let forceMag = -ks * (r - r0);
                    let force = dir.copy().normalize().mult(forceMag);
                    p1.applyForce(force);
                }
            }
        }
    }

    // Cập nhật vận tốc và vị trí
    for (let p of particles) {
        p.update();
    }

    // Vẽ liên kết
    stroke(0);
    for (let link of links) {
        let p1 = particles[link[0]];
        let p2 = particles[link[1]];
        line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
    }

    // Vẽ particle
    for (let p of particles) {
        p.draw();
    }

    // Vẽ particle được chọn
    if (selectedParticleIndex >= 0) {
        let p = particles[selectedParticleIndex];
        fill(255, 0, 0);
        ellipse(p.pos.x, p.pos.y, 10 + p.mass * 2, 10 + p.mass * 2);
    }

    // Vẽ hướng dẫn
    fill(0);
    stroke(0);
    text("Drag a particle to move", 10, 20);
}

function mousePressed() {
    // tìm particle gần nhất với chuột
    let minDist = Infinity;    
    for (let i = 0; i < particles.length; i++) {
        let d = dist(particles[i].pos.x, particles[i].pos.y, mouseX, mouseY);
        if (d < minDist) {
            minDist = d;
            selectedParticleIndex = i;
        }
    }    
}

function mouseDragged() {
    if (selectedParticleIndex >= 0) {
        particles[selectedParticleIndex].pos.set(mouseX, mouseY);
    }
}

function mouseReleased() {
    selectedParticleIndex = -1;
}

