class Chart {
    constructor(nDices, probs, maxSimcount, x, y, width, height) {
        this.nDices = nDices;
        this.probs = probs;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        //create a new array to with nDices*6 - nDices + 1 elements
        this.data = new Array(nDices * 5  + 1).fill(0);
        this.maxSimcount = maxSimcount;
        this.simCount = 0;
    }

    reset() {
        this.data.fill(0);
        this.simCount = 0;
    }

    throwDices() {
        if (this.simCount >= this.maxSimcount) {
            return;
        }
        let sum = 0;
        for (let i = 0; i < this.nDices; i++) {
            // throw a dice with accordant probabilities
            let rnd = Math.random();
            for (let j = 0; j < this.probs.length; j++) {
                rnd -= this.probs[j];
                if (rnd <= 0) {
                    sum += j + 1;
                    break;
                }
            }
        }
        this.data[sum - this.nDices]++;
        this.simCount++;
    }

    getMean() {
        let mean = 0;
        for (let i = 0; i < this.data.length; i++) {
            mean += this.data[i] * (i + this.nDices);
        }
        return mean / this.simCount;
    }

    getStdDev() {
        let mean = this.getMean();
        let stdDev = 0;
        for (let i = 0; i < this.data.length; i++) {
            stdDev += Math.pow(i + this.nDices - mean, 2) * this.data[i];
        }
        return Math.sqrt(stdDev / this.simCount);
    }


    draw() {        
        const padding = 2;
        const xAxisHeight = this.height - padding * 2;
        const yAxisWidth = this.width - padding * 2;
        
        // Draw x-axis
        line(this.x + padding, this.y + this.height - padding, this.x + this.width - padding, this.y + this.height - padding);
        
        // Draw y-axis
        line(this.x + padding, this.y + this.height - padding, this.x + padding, this.y + padding);
        
        // Scale data
        const xScale = yAxisWidth / this.data.length;
        const yScale = xAxisHeight / this.height;
        
        // Draw bars
        for (let i = 0; i < this.data.length; i++) {
            const barHeight = this.data[i] * yScale;
            const barWidth = xScale - padding;
            const barX = this.x + padding + i * xScale;
            const barY = this.y + this.height - padding - barHeight;
            
            fill('blue');
            rect(barX, barY, barWidth, barHeight);
        }

        // draw mean and standard deviation text
        const mean = this.getMean();
        const stdDev = this.getStdDev();
        fill('black');
        text(`Mean: ${mean.toFixed(2)}`, this.x + padding, this.y + 10);
        text(`StdDev: ${stdDev.toFixed(2)}`, this.x + padding, this.y + 20);
    }
}