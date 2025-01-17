class SineWave {
    // f(t) = amplitude * sin(2 * pi * frequency * t + phase) 
    constructor(amplitude, frequency, phase, color) {
        amplitude = amplitude > 40 ? 40 : amplitude;
        amplitude = amplitude < 20 ? 20 : amplitude;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.phase = phase;
        this.color = color;
    }

    evaluate(t) {
        return this.amplitude * sin(2 * PI * this.frequency * t + this.phase);
    }
}

class SinePanel {
    constructor(x, y, sinewave) {
        this.x = x;
        this.y = y;
        this.wave = sinewave;
        this.t = 0;
        this.values = [];
    }

    reset() {
        this.t = 0;
        this.values = [];
    }

    drawCirclePanel() {
        ellipse(50, 50, this.wave.amplitude * 2, this.wave.amplitude * 2);

        push();
        translate(50, 50);
        const tx = this.wave.amplitude * cos(2 * PI * this.wave.frequency * this.t / 360 + this.wave.phase);
        const ty = this.wave.evaluate(this.t / 360); 
        ellipse(tx, ty, 3, 3);
        ellipse(0, 0, 3, 3);
        line(tx, ty, 0, 0);

        this.values.push(ty);

        //draw connecting line
        stroke(0);
        line(tx, ty, 100, ty);

        pop();
    }

    drawSineWavePanel() {
        push();
        translate(100, 0);
        rect(0, 0, 500, 100);
        // zero line
        stroke(0);
        line(0, 50, 500, 50);
        // sine wave
        
        
        stroke(this.wave.color);
        for (let i = 0; i <this.values.length - 1; i++) {
            line(this.values.length - i, this.values[i] + 50, this.values.length - i-1, this.values[i + 1] + 50);
        }
        pop();
        
        if(this.values.length > 500) {
            this.values.shift();
        }
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        this.drawCirclePanel();
        this.drawSineWavePanel();
        pop();

        this.t += 1;
    }
}

class CombinedSinePanel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.waves = [];
        this.values = [];
        this.t = 0;
    }

    reset() {
        this.t = 0;
        this.values = [];
        this.waves = [];
    }

    draw() {
        push();        
        translate(this.x, this.y);
        rect(0, 0, 500, 200);
        line(0, 100, 500, 100);

        let y = 0;
        this.waves.forEach(wave => {
            y+= wave.evaluate(this.t / 360);
        });
        this.values.push(y);

        if (this.values.length > 500) {
            this.values.shift();
        }

        for (let i = 0; i <this.values.length - 1; i++) {
            line(this.values.length - i, this.values[i] + 100, this.values.length - i-1, this.values[i + 1] + 100);
        }
        pop();

        this.t += 1;
    }
}   