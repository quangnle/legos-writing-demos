/**
 * dRNG Demo - Elliptic curve visualization (p5.js)
 * Click points on curve to select them; supports highlight overlays.
 */
const leftMargin = 15;
const bottomMargin = 15;
let xStep = 0;
let yStep = 0;
let hoveringIndex = -1;

function setup() {
    const cvs = createCanvas(350, 350);
    cvs.parent('canvas-container');
    background(30);
}

function draw() {
    if (typeof ec === 'undefined') return;
    background(22, 22, 26);
    drawNumberPlane(ec.p - 1, ec.p - 1);
    drawEllipticCurve();
}

function drawNumberPlane(xMax, yMax) {
    const step = 5;
    xStep = Math.max(1, Math.floor((width - leftMargin) / Math.max(1, xMax)));
    yStep = Math.max(1, Math.floor((height - bottomMargin) / Math.max(1, yMax)));
    stroke(60);
    strokeWeight(1);
    for (let x = 0; x <= xMax; x += step) {
        const xPos = x * xStep + leftMargin;
        line(xPos, height - bottomMargin, xPos, 0);
        textAlign(CENTER, CENTER);
        textSize(8);
        fill(160);
        text(x, xPos, height - bottomMargin + 10);
    }
    for (let y = 0; y <= yMax; y += step) {
        const yPos = height - bottomMargin - y * yStep;
        line(leftMargin, yPos, width, yPos);
        textAlign(RIGHT, CENTER);
        textSize(8);
        fill(160);
        text(y, leftMargin - 2, yPos);
    }
}

function drawEllipticCurve() {
    const points = ec.points;
    const highlightIndices = typeof drngState !== 'undefined' ? (drngState.highlightIndices || []) : [];
    const highlightMap = {};
    (highlightIndices || []).forEach(i => { highlightMap[i] = true; });

    fill(34, 197, 94);
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const px = p.x * xStep + leftMargin;
        const py = height - p.y * yStep - bottomMargin;
        if (highlightMap[i]) {
            fill(99, 102, 241);
            ellipse(px, py, 10);
            fill(34, 197, 94);
        } else {
            ellipse(px, py, 5);
        }
    }

    if (hoveringIndex !== -1) {
        const p = ec.points[hoveringIndex];
        const px = p.x * xStep + leftMargin;
        const py = height - p.y * yStep - bottomMargin;
        fill(161, 161, 170);
        ellipse(px, py, 8);
        fill(244, 244, 245);
        textAlign(LEFT, CENTER);
        textSize(9);
        const xText = px > width - 45 ? px - 40 : px + 6;
        text(`(${p.x}, ${p.y})`, xText, py);
    }

    if (typeof drngSelectedIndex !== 'undefined' && drngSelectedIndex !== -1) {
        const p = ec.points[drngSelectedIndex];
        const px = p.x * xStep + leftMargin;
        const py = height - p.y * yStep - bottomMargin;
        fill(239, 68, 68);
        ellipse(px, py, 10);
    }

    // Labels for Step 1: G and x (Y) when selected
    if (typeof drngState !== 'undefined' && ec && ec.points) {
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12);
        fill(99, 102, 241);
        const labelOffset = 14;
        if (drngState.G && drngState.G.x !== Infinity) {
            const gPx = drngState.G.x * xStep + leftMargin;
            const gPy = height - drngState.G.y * yStep - bottomMargin;
            text('G', gPx, gPy - labelOffset);
        }
        if (drngState.Y && drngState.Y.x !== Infinity) {
            const yPx = drngState.Y.x * xStep + leftMargin;
            const yPy = height - drngState.Y.y * yStep - bottomMargin;
            text('Y', yPx, yPy - labelOffset);
        }
    }
}

function mouseMoved() {
    if (typeof ec === 'undefined') return;
    const x = mouseX - leftMargin;
    const y = height - mouseY - bottomMargin;
    let minDist = Infinity;
    let minIndex = -1;
    for (let i = 0; i < ec.points.length; i++) {
        const p = ec.points[i];
        const xVal = p.x * xStep;
        const yVal = p.y * yStep;
        const d = dist(xVal, yVal, x, y);
        if (d < minDist) { minDist = d; minIndex = i; }
    }
    hoveringIndex = minDist < 12 ? minIndex : -1;
}

function mousePressed() {
    if (typeof ec === 'undefined') return;
    if (mouseX < leftMargin || mouseX > width - leftMargin || mouseY < 0 || mouseY > height - bottomMargin) return;
    if (hoveringIndex !== -1 && typeof drngOnPointSelected === 'function') {
        drngOnPointSelected(hoveringIndex, ec.points[hoveringIndex]);
    }
}
