const DRAW = 0;
const PLAY = 1;

let x = [];
let y = [];
let fourierX;
let fourierY;
let time = 0;
let path = [];
let drawing = [];
let state = -1;

let startX = 0;
let startY = 0;

function setup() {
    createCanvas(800, 600);
	startX = width / 2;
	startY = height / 2;
}

function epiCycles(x, y, rotation, fourier) {
    for (let i = 0; i < fourier.length; i++) {
        let prevx = x;
        let prevy = y;
        let freq = fourier[i].freq;
        let radius = fourier[i].amp;
        let phase = fourier[i].phase;
        x += radius * cos(freq * time + phase + rotation);
        y += radius * sin(freq * time + phase + rotation);

        stroke(255, 100);
        noFill();
        ellipse(prevx, prevy, radius * 2);
        stroke(255);
        line(prevx, prevy, x, y);
    }
    return createVector(x, y);
}

function draw() {
    background(0);

    fill(0);
    stroke(255);
    rect(startX - 200, startY - 150, 400, 300);
    fill(255,0,0);
    text("Draw a shape here", startX - 200, startY - 150);

    if (state == DRAW) {
        let px = mouseX - startX;
        let py = mouseY - startY;
        if (abs(px) < 200 && abs(py) < 150) {
            let p = createVector(mouseX - startX, mouseY - startY);
            drawing.push(p);
            stroke(255);
            noFill();
            beginShape();
            for (let v of drawing) {
                vertex(v.x + startX, v.y + startY);
            }
            endShape();
        }
        
    } else if (state == PLAY) {
        let vx = epiCycles(startX, 100, 0, fourierX);
        let vy = epiCycles(100, startY, HALF_PI, fourierY);
        let v = createVector(vx.x, vy.y);
        path.unshift(v);
        line(vx.x, vx.y, v.x, v.y);
        line(vy.x, vy.y, v.x, v.y);

        beginShape();
        noFill();
        for (let i = 0; i < path.length; i++) {
            vertex(path[i].x, path[i].y);
        }
        endShape();

        const dt = TWO_PI / fourierY.length;
        time += dt;

        if (time > TWO_PI) {
            time = 0;
            path = [];
        }
    }
}

function mousePressed() {
    state = DRAW;
    drawing = [];
    x = [];
    y = [];
    time = 0;
    path = [];
}

function mouseReleased() {
    state = PLAY;
    const skip = 1;
    for (let i = 0; i < drawing.length; i += skip) {
        x.push(drawing[i].x);
        y.push(drawing[i].y);
    }
    fourierX = dft(x);
    fourierY = dft(y);

    fourierX.sort((a, b) => b.amp - a.amp);
    fourierY.sort((a, b) => b.amp - a.amp);
}