class Chart {
    constructor(nDices, probs, maxSimCount) {
        this.reset(nDices, probs);
        this.maxSimCount = maxSimCount;
    }

    reset(nDices, probs) {
        this.nDices = nDices;
        this.probs = probs;
        
        // We use 100 bins for the sample mean between 1.0 and 6.0
        this.numBins = 60; 
        this.bins = new Array(this.numBins).fill(0);
        this.simCount = 0;
        this.isRunning = false;
        
        // Population stats
        this.mu = 0;
        for (let i = 0; i < 6; i++) this.mu += (i + 1) * this.probs[i];
        
        let variance = 0;
        for (let i = 0; i < 6; i++) variance += this.probs[i] * Math.pow((i + 1) - this.mu, 2);
        this.sigma = Math.sqrt(variance);
        
        this.zValue = 0;
        this.sumX = 0;
        this.sumX2 = 0;
    }

    setZ(z) {
        this.zValue = z;
    }

    start() {
        this.isRunning = true;
    }

    update() {
        if (!this.isRunning || this.simCount >= this.maxSimCount) {
            this.isRunning = false;
            return;
        }

        // Run batches for performance/animation factor
        let batchSize = 10;
        for (let b = 0; b < batchSize && this.simCount < this.maxSimCount; b++) {
            let sum = 0;
            for (let i = 0; i < this.nDices; i++) {
                let rnd = Math.random();
                for (let j = 0; j < 6; j++) {
                    rnd -= this.probs[j];
                    if (rnd <= 0) {
                        sum += (j + 1);
                        break;
                    }
                }
            }
            let sampleMean = sum / this.nDices;
            
            // Map sampleMean [1, 6] to bin index [0, numBins-1]
            let binIdx = Math.floor(((sampleMean - 1) / 5) * this.numBins);
            if (binIdx >= this.numBins) binIdx = this.numBins - 1;
            this.bins[binIdx]++;
            this.sumX += sampleMean;
            this.sumX2 += sampleMean * sampleMean;
            this.simCount++;
        }
    }

    getExpMean() {
        if (this.simCount === 0) return 0;
        return this.sumX / this.simCount;
    }

    getExpStdDev() {
        if (this.simCount < 2) return 0;
        const mean = this.getExpMean();
        const variance = (this.sumX2 / this.simCount) - (mean * mean);
        return Math.sqrt(Math.max(0, variance));
    }

    draw() {
        const padding = 50;
        const graphW = width - padding * 2;
        const graphH = height - padding * 2;
        const x0 = padding;
        const y0 = height - padding;

        // Draw Axes
        stroke(156, 163, 175); // gray-400
        strokeWeight(1);
        line(x0, y0, x0 + graphW, y0); // X axis
        line(x0, y0, x0, y0 - graphH); // Y axis

        // Draw Labels
        fill(156, 163, 175);
        noStroke();
        textSize(12);
        textAlign(CENTER);
        for (let i = 1; i <= 6; i++) {
            let x = x0 + ((i - 1) / 5) * graphW;
            text(i, x, y0 + 20);
        }
        textAlign(LEFT);
        text("Sample Mean (X\u0304)", x0 + graphW - 50, y0 + 35);

        // Find max bin for scaling
        let maxFreq = Math.max(...this.bins, 10); // at least 10 for initial scale

        // Draw Histogram
        const binW = graphW / this.numBins;
        fill(59, 130, 246, 150); // blue-500 with alpha
        stroke(59, 130, 246);
        for (let i = 0; i < this.numBins; i++) {
            let h = (this.bins[i] / maxFreq) * graphH;
            let bx = x0 + i * binW;
            let by = y0 - h;
            rect(bx, by, binW, h);
        }

        // Draw Theoretical Normal Curve: N(mu, sigma/sqrt(n))
        this.drawNormalCurve(x0, y0, graphW, graphH, maxFreq);

        // Draw Z-score line
        this.drawZLine(x0, y0, graphW, graphH);

        // Legend/Info
        fill(243, 244, 246);
        noStroke();
        textSize(14);
        text(`Trials: ${this.simCount} / ${this.maxSimCount}`, x0 + 20, y0 - graphH + 30);
    }

    drawNormalCurve(x0, y0, graphW, graphH, maxFreq) {
        const n = this.nDices;
        const se = this.sigma / Math.sqrt(n);
        
        noFill();
        stroke(139, 92, 246); // violet-500
        strokeWeight(2);
        
        beginShape();
        for (let px = 0; px <= graphW; px += 2) {
            let xVal = 1 + (px / graphW) * 5;
            // Normal PDF: (1 / (se * sqrt(2pi))) * exp(-0.5 * ((x-mu)/se)^2)
            let exponent = -0.5 * Math.pow((xVal - this.mu) / se, 2);
            let yPdf = (1 / (se * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
            
            // We need to scale yPdf to match the histogram's "frequency" units
            // total area of histogram = simCount * (bin size in x units)
            // bin size in x units = 5 / numBins
            // To match height: freq = PDF * simCount * (bin size)
            let expectedFreq = yPdf * this.simCount * (5 / this.numBins);
            let py = y0 - (expectedFreq / maxFreq) * graphH;
            
            vertex(x0 + px, py);
        }
        endShape();
    }

    drawZLine(x0, y0, graphW, graphH) {
        if (isNaN(this.zValue)) return;
        
        const n = this.nDices;
        const se = this.sigma / Math.sqrt(n);
        const targetX = this.mu + this.zValue * se;
        
        if (targetX < 1 || targetX > 6) return;
        
        let px = ((targetX - 1) / 5) * graphW;
        
        // Glowing line
        stroke(236, 72, 153, 100); // pink-500 glowing
        strokeWeight(4);
        line(x0 + px, y0, x0 + px, y0 - graphH);
        
        stroke(236, 72, 153);
        strokeWeight(2);
        line(x0 + px, y0, x0 + px, y0 - graphH);
        
        fill(236, 72, 153);
        noStroke();
        textAlign(CENTER);
        text(`z = ${this.zValue}`, x0 + px, y0 - graphH - 10);
    }
}