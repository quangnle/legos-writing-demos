let sReal = 0.5;
let tRange = 30;
let scaleFactor = 60;
let zVals = [];
let maxPoints = 2000;
let currentIdx = 0;

// UI Elements
let reSlider, tSlider, scaleSlider;
let reValLabel, tValLabel, scaleValLabel;
let sDisplay, zetaDisplay, zerosList;
let detectedZeros = [];
let borwein_n = 50; // High precision
let borwein_coeffs = [];

function setup() {
    let canvas = createCanvas(800, 600);
    canvas.parent('p5-holder');
    
    // Connect UI
    reSlider = select('#re-slider');
    tSlider = select('#t-slider');
    scaleSlider = select('#scale-slider');
    
    reValLabel = select('#re-val');
    tValLabel = select('#t-val');
    scaleValLabel = select('#scale-val');
    
    sDisplay = select('#s-display');
    zetaDisplay = select('#zeta-display');
    zerosList = select('#zeros-list');
    
    precomputeBorwein();
    calculateZeta();
}

function precomputeBorwein() {
    let n = borwein_n;
    
    function fact(num) {
        let res = BigInt(1);
        for (let i = 2; i <= num; i++) res *= BigInt(i);
        return res;
    }

    let d_vals = new Array(n + 1);
    let nBig = BigInt(n);
    
    for (let k = 0; k <= n; k++) {
        let sum = BigInt(0);
        for (let i = k; i <= n; i++) {
            let num = fact(n + i - 1) * (BigInt(4) ** BigInt(i));
            let den = fact(n - i) * fact(2 * i);
            sum += num / den;
        }
        d_vals[k] = nBig * sum;
    }
    
    let d0 = Number(d_vals[0]);
    let dn = Number(d_vals[n]);
    
    borwein_coeffs = [];
    for (let k = 0; k < n; k++) {
        let ck = ((-1)**k) * (Number(d_vals[k]) - dn) / d0;
        borwein_coeffs.push(ck);
    }
}

function draw() {
    background(11, 17, 33); // Match panel-bg
    
    // Update labels and check for changes
    if (reSlider.value() != sReal || tSlider.value() != tRange || scaleSlider.value() != scaleFactor) {
        sReal = parseFloat(reSlider.value());
        tRange = parseFloat(tSlider.value());
        scaleFactor = parseFloat(scaleSlider.value());
        
        reValLabel.html(sReal.toFixed(2));
        tValLabel.html(tRange);
        scaleValLabel.html(scaleFactor);
        
        calculateZeta();
        currentIdx = 0; // Restart animation
        detectedZeros = [];
        zerosList.html(''); // Clear list
    }
    
    drawAxes();
    drawZetaPath();
    updateInfo();
    
    // Scan all intermediate indices for zeros to ensure none are missed
    let prevIdx = currentIdx;
    if (currentIdx < zVals.length - 1) {
        currentIdx += 4; // Speed up drawing
        if (currentIdx > zVals.length - 1) currentIdx = zVals.length - 1;
    }
    
    for (let i = prevIdx + 1; i <= currentIdx; i++) {
        detectZeroAt(i);
    }
}

function detectZeroAt(idx) {
    if (idx > 1 && idx < zVals.length - 1) {
        let y1 = zVals[idx - 1].mag();
        let y2 = zVals[idx].mag();
        let y3 = zVals[idx + 1].mag();
        
        // Local minimum detection
        if (y2 < y1 && y2 < y3) {
            // Parabolic Interpolation to find the exact minimum between samples
            let denom = y1 - 2 * y2 + y3;
            let y_min = y2;
            let offset = 0;
            
            if (denom > 0) {
                offset = (y1 - y3) / (2 * denom);
                y_min = y2 - (y1 - y3) * (y1 - y3) / (8 * denom);
            }
            
            // Relaxed threshold for interpolated minimum to avoid missing zeros
            if (y_min < 0.15) { 
                let dt = tRange / zVals.length;
                let t_base = map(idx, 0, zVals.length, 0, tRange);
                let t_true = t_base + offset * dt;
                
                // Avoid duplicate detections
                if (detectedZeros.length === 0 || t_true - detectedZeros[detectedZeros.length - 1] > 0.5) {
                    detectedZeros.push(t_true);
                    let chip = createElement('div', `t ≈ ${t_true.toFixed(4)}`);
                    chip.addClass('zero-chip');
                    chip.parent(zerosList);
                    zerosList.elt.scrollTop = zerosList.elt.scrollHeight;
                }
            }
        }
    }
}

function drawAxes() {
    stroke(30, 41, 59);
    strokeWeight(1);
    
    // Grid
    for (let x = -width; x < width; x += scaleFactor) {
        line(width/2 + x, 0, width/2 + x, height);
    }
    for (let y = -height; y < height; y += scaleFactor) {
        line(0, height/2 + y, width, height/2 + y);
    }
    
    // Main Axes
    stroke(71, 85, 105);
    strokeWeight(2);
    line(width / 2, 0, width / 2, height);
    line(0, height / 2, width, height / 2);
    
    // Labels
    fill(148, 163, 184);
    noStroke();
    textSize(12);
    text("Re", width - 25, height / 2 + 15);
    text("Im", width / 2 + 10, 20);
}

function drawZetaPath() {
    push();
    translate(width / 2, height / 2);
    
    noFill();
    strokeWeight(2);
    
    // Draw the full shadow path
    stroke(6, 182, 212, 40); // Faint cyan
    beginShape();
    for (let i = 0; i < zVals.length; i++) {
        vertex(zVals[i].re * scaleFactor, -zVals[i].im * scaleFactor);
    }
    endShape();
    
    // Draw the animated glowing path
    stroke(34, 211, 238); // Bright cyan
    beginShape();
    for (let i = 0; i <= currentIdx; i++) {
        vertex(zVals[i].re * scaleFactor, -zVals[i].im * scaleFactor);
    }
    endShape();
    
    // Highlight current point
    if (currentIdx < zVals.length) {
        fill(241, 245, 249);
        noStroke();
        ellipse(zVals[currentIdx].re * scaleFactor, -zVals[currentIdx].im * scaleFactor, 6, 6);
        
        // Glow effect
        fill(34, 211, 238, 100);
        ellipse(zVals[currentIdx].re * scaleFactor, -zVals[currentIdx].im * scaleFactor, 12, 12);
    }
    
    pop();
}

function calculateZeta() {
    zVals = [];
    // Dynamic density: at least 80 samples per t-unit to catch fast oscillations
    let points = Math.max(1000, Math.ceil(tRange * 80)); 
    for (let i = 0; i < points; i++) {
        let t = map(i, 0, points, 0, tRange); // Show from 0 to max T
        let s = new Complex(sReal, t);
        zVals.push(zetaBorwein(s));
    }
}

function updateInfo() {
    if (currentIdx < zVals.length) {
        let t = map(currentIdx, 0, zVals.length, 0, tRange);
        sDisplay.html(`${sReal.toFixed(2)} + ${t.toFixed(2)}i`);
        zetaDisplay.html(`${zVals[currentIdx].re.toFixed(4)} + ${zVals[currentIdx].im.toFixed(4)}i`);
    }
}

/**
 * Riemann Zeta high-precision via Borwein's algorithm (1995)
 */
function zetaBorwein(s) {
    let etaSum = new Complex(0, 0);
    
    for (let k = 0; k < borwein_n; k++) {
        let ck = borwein_coeffs[k];
        let ks = complexPow(k + 1, s);
        let term = new Complex(ck, 0).div(ks);
        etaSum = etaSum.add(term);
    }
    
    // Normalization factor: 1 - 2^(1-s)
    let oneMinusS = new Complex(1 - s.re, -s.im);
    let twoPowOneMinusS = complexPow(2, oneMinusS);
    let denom = new Complex(1, 0).sub(twoPowOneMinusS);
    
    if (denom.magSq() < 1e-12) return new Complex(0, 0);
    
    return etaSum.div(denom);
}

function complexPow(base, exp) {
    // n^s = e^(s * ln(n)) = e^((re+i*im) * ln(n)) = e^(re*ln(n)) * e^(i*im*ln(n))
    let r = Math.pow(base, exp.re);
    let theta = exp.im * Math.log(base);
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
}