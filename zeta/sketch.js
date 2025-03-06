let sReal = 0.5; // real part 1/2 (critical line)
let tRange = 30; // range of imaginary part
let nPoints = 0; // number of points to draw
let zVals = []; // array to store zeta values
let maxPoints = 5000; // maximum number of points to store
let scale = 50; // scale factor for plotting

function setup() {
    createCanvas(800, 600);
    background(200);

    // pre-calculate and store zeta values
    for (let i = 0; i < maxPoints; i++) {
        let t = map(i, 0, maxPoints, -tRange, tRange);
        let s = new Complex(sReal, t);
        zVals.push(zeta(s));
    }
}

function draw() {
    background(240);

    // draw axes and labels
    stroke(150);
    line(width / 2, 0, width / 2, height); // real axis
    line(0, height / 2, width, height / 2); // imaginary axis

    // draw grid
    stroke(200);
    for (let i = 0; i < width; i += 20) {
        line(i, 0, i, height);
    }

    for (let i = 0; i < height; i += 20) {
        line(0, i, width, i);
    }

    // draw Zeta's y-values as a function of x-values
    push();
    translate(width / 2, height / 2); // move origin to center
    stroke(0, 100);
    noFill();
    beginShape();
    for (let i = 0; i < nPoints; i++) {
        let zetaVal = zVals[i]; // Zeta value at s
        let x = zetaVal.re * scale; // convert the real part of Zeta to x
        let y = zetaVal.im * -scale;  // convert the imaginary part of Zeta to y        
        vertex(x, y);
    }
    endShape();
    pop();

    // draw label for x-axis
    fill(0);
    noStroke();
    text("Re", width - 20, height / 2 - 10);

    // draw value of s
    fill(0);
    noStroke();
    text(`s = 0.5 + i*${nPoints}, zeta(s) = ${zVals[nPoints].re.toFixed(4)} + i*${zVals[nPoints].im.toFixed(4)}`, 60, height - 10);
    
    // draw label for y-axis
    text("Im", width / 2 + 10, 20);

    // update nPoints
    nPoints = (nPoints + 1) % maxPoints;
}

// compute zeta function, approximated by summing the first 50 terms
function zeta(s) {
    let sum = new Complex(0, 0);

    // sum the first 50 terms
    for (let n = 1; n < 50; n++) {
        let sign = n % 2 == 0 ? -1 : 1;
        let ns = complexPow(n, s);
        let term = new Complex(sign, 0).div(ns);
        sum = sum.add(term);
    }    

    // normalize the sum
    let twoPow = complexPow(2, s);
    let denom = new Complex(1, 0).sub(twoPow);
    let result = sum.div(denom);
    return result;
}

// compute complex power
function complexPow(base, exp) {
    let r = pow(base, exp.re);
    let theta = exp.im * log(base);
    return new Complex(r * cos(theta), r * sin(theta));
}