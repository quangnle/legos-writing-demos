function setup() {
    const size = getContainerSize();
    const canvas = createCanvas(size.w, size.h);
    canvas.parent('p5-container');
    pixelDensity(displayDensity());
}

function windowResized() {
    const size = getContainerSize();
    resizeCanvas(size.w, size.h);
}

function draw() {
    background(11, 15, 25); // --bg-color
    
    // Grid settings
    const scaleX = 4; // Domain is [-4, 4]
    const scaleY = 1.2; // Co-domain for PDF
    
    drawGrid(scaleX, scaleY);
    drawGaussian(mu, sigma, scaleX, scaleY);
}

function drawGrid(scaleX, scaleY) {
    const padding = 40;
    const graphW = width - padding * 2;
    const graphH = height - padding * 2;
    const x0 = width / 2;
    const y0 = height - padding;

    // Draw Axes
    stroke(31, 41, 55); // --border-color
    strokeWeight(1);
    
    // Vertical lines (Grid)
    for (let x = -scaleX; x <= scaleX; x += 1) {
        let px = map(x, -scaleX, scaleX, padding, width - padding);
        line(px, padding, px, height - padding);
        
        // Labels
        fill(156, 163, 175);
        noStroke();
        textAlign(CENTER);
        textSize(10);
        text(x, px, height - padding + 20);
        stroke(31, 41, 55);
    }

    // Horizontal lines (subdued)
    for (let y = 0; y <= scaleY; y += 0.2) {
        let py = map(y, 0, scaleY, height - padding, padding);
        line(padding, py, width - padding, py);
    }
}

function drawGaussian(mu, sigma, scaleX, scaleY) {
    const padding = 40;
    const graphW = width - padding * 2;
    const graphH = height - padding * 2;
    
    // 1. Draw Sigma Area (shading)
    noStroke();
    fill(139, 92, 246, 30); // purple with alpha
    beginShape();
    for (let x = mu - sigma; x <= mu + sigma; x += 0.01) {
        let y = gaussian(x, mu, sigma);
        let px = map(x, -scaleX, scaleX, padding, width - padding);
        let py = map(y, 0, scaleY, height - padding, padding);
        vertex(px, py);
    }
    vertex(map(mu + sigma, -scaleX, scaleX, padding, width - padding), height - padding);
    vertex(map(mu - sigma, -scaleX, scaleX, padding, width - padding), height - padding);
    endShape(CLOSE);

    // 2. Draw FWHM Line
    const maxVal = gaussian(mu, mu, sigma);
    const halfMax = maxVal / 2;
    const halfWidth = sigma * Math.sqrt(2 * Math.log(2));
    
    const fwhmX1 = mu - halfWidth;
    const fwhmX2 = mu + halfWidth;
    const fwhmY = map(halfMax, 0, scaleY, height - padding, padding);
    const fwhmPX1 = map(fwhmX1, -scaleX, scaleX, padding, width - padding);
    const fwhmPX2 = map(fwhmX2, -scaleX, scaleX, padding, width - padding);

    stroke(139, 92, 246);
    strokeWeight(2);
    setLineDash([5, 5]);
    line(fwhmPX1, fwhmY, fwhmPX2, fwhmY);
    setLineDash([]); // Reset
    
    fill(139, 92, 246);
    noStroke();
    textAlign(CENTER);
    text("FWHM", (fwhmPX1 + fwhmPX2) / 2, fwhmY - 10);

    // 3. Draw the Curve
    noFill();
    stroke(59, 130, 246); // --accent-color
    strokeWeight(3);
    
    // Glow effect (simplified)
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(59, 130, 246, 0.5)';
    
    beginShape();
    for (let x = -scaleX; x <= scaleX; x += 0.02) {
        let y = gaussian(x, mu, sigma);
        let px = map(x, -scaleX, scaleX, padding, width - padding);
        let py = map(y, 0, scaleY, height - padding, padding);
        vertex(px, py);
    }
    endShape();
    
    // Reset glow
    drawingContext.shadowBlur = 0;

    // 4. Mean line
    stroke(243, 244, 246);
    strokeWeight(1);
    const muPX = map(mu, -scaleX, scaleX, padding, width - padding);
    line(muPX, height - padding, muPX, padding);
    
    fill(243, 244, 246);
    noStroke();
    ellipse(muPX, map(maxVal, 0, scaleY, height - padding, padding), 6, 6);
}

function gaussian(x, mean, sigma) {
    return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI));
}

function setLineDash(list) {
    drawingContext.setLineDash(list);
}