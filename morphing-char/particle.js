class Particle {
    constructor(current, end, color, noiseRange){
        this.end = end;
        this.current = current;        
        this.noiseRange = noiseRange;
        this.color = color;
    }

    update (animationProgress) {
        // update the particle's position
        // lerp() is a p5.js function that interpolates between two values        
        this.current.x = lerp(this.current.x, this.end.x, animationProgress);
        this.current.y = lerp(this.current.y, this.end.y, animationProgress);    
        
        // add some noise to the particle's position
        this.current.x += random(-this.noiseRange, this.noiseRange);
        this.current.y += random(-this.noiseRange, this.noiseRange);
    }

    draw () {
        // draw the particle
        const red = color(this.color).levels[0];
        const green = color(this.color).levels[1];
        const blue = color(this.color).levels[2];

        stroke(red, green, blue, 100);
        strokeWeight(4);
        point(this.current.x, this.current.y);
    }
}