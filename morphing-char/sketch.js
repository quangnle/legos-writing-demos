// Global variables
let font;
let particles = [];
const numParticles = 1500; // Number of particles to sample
let animationProgress = 0; // Animation progress
const morphingStrings = ["ENTER to begin...", "Creative Coding", "Morphing Effect", "by Legos - Techwiz", "legos.hashnode.dev", "P5.js Library", "Enjoy!!!"];
let currentStringIndex = 0;
const fontSize = 35;

function preload() {
    // Load a font (you can replace 'Arial' with a custom font if hosted)
    font = loadFont(
        "https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf"
    );
}

function setup() {
    createCanvas(800, 600); // Set canvas size
    background(255); // White background

    const srcParticles = getStringParticles(morphingStrings[currentStringIndex], 100, 100, "#fff", numParticles);
    const destParticles = getStringParticles(morphingStrings[currentStringIndex], 100, 100, "#fff", numParticles);
    particles = morph(srcParticles, destParticles);    
}

function draw() {
    background(0); // Clear canvas each frame
    
    // Draw particles
    fill(250, 100); // Black particles
    noStroke();
    for (let p of particles) {
        p.draw();
        p.update(animationProgress);
    }

    // Update animation progress
    animationProgress += 0.01;
    if (animationProgress >= 1) {
        animationProgress = 1;
    }
}

function keyPressed() {
    // if ENTER is pressed, morph the particles
    if (keyCode === ENTER) {
        // increment the currentStringIndex
        currentStringIndex = (currentStringIndex + 1) % morphingStrings.length;

        // get the source and destination particles
        const srcParticles = particles;
        // generate a random position within the canvas
        const newX = random(width * 0.25, width - morphingStrings[currentStringIndex].length * fontSize);
        const newY = random(height * 0.25, height - fontSize);                

        //generate a random color string #RRGGBB
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);

        // get the destination particles        
        const destParticles = getStringParticles(morphingStrings[currentStringIndex], newX, newY, randomColor, numParticles);

        // morph the particles
        particles = morph(srcParticles, destParticles);

        // reset animation progress
        animationProgress = 0;
    }    
}

/**
 * Morphs particles from one string to another.
 * @param {Array} srcParticles - Array of Particle objects representing the start state
 * @param {Array} destParticles - Array of Particle objects representing the end state
 * @returns {Array} Array of Particle objects representing the morphed state
 * @see Particle
 * @see getStringParticles
 * @see getTextPoints
 */
function morph(srcParticles, destParticles) {
    let result = [];
    for (let i = 0; i < srcParticles.length; i++) {
        let current = srcParticles[i].current;
        let end = destParticles[i].current;
        result.push(new Particle(current, end, destParticles[i].color, 3));
    }
    return result;
}

/**
 * Creates particles for a given string at a specified position.
 * @param {string} str - The text to render
 * @param {number} x - X position on the canvas
 * @param {number} y - Y position on the canvas
 * @param {number} nSamples - Number of particles to create
 * @returns {Array} Array of Particle objects
 * @see Particle
 */
function getStringParticles(str, x, y, color, nSamples) {
    const points = getTextPoints(str, x, y, fontSize, nSamples);
    const particles = [];
    for (let i = 0; i < nSamples; i++) {
        particles.push(new Particle(points[i], points[i], color, 3));
    }
    return particles;
}

/**
 * Samples a specified number of points from the rendered text.
 * @param {string} str - The text to render
 * @param {number} x - X position on the canvas
 * @param {number} y - Y position on the canvas
 * @param {number} N - Number of points to sample
 * @returns {Array} Array of {x, y} objects
 */
function getTextPoints(str, x, y, fontSize, N) {
    // Create an offscreen graphics buffer
    let pg = createGraphics(fontSize * str.length, fontSize * 2); // Height accommodates font size
    pg.background(0); // Black background
    pg.fill(255); // White text
    pg.textFont(font);
    pg.textSize(fontSize); // Match fontSize from setup
    pg.text(str, 0, fontSize); // Draw text with baseline at y=50

    // Load pixel data from the graphics buffer
    pg.loadPixels();
    let filledPixels = [];

    // Collect positions of white pixels (text)
    for (let py = 0; py < pg.height; py++) {
        for (let px = 0; px < pg.width; px++) {
            // Get pixel index
            // multiply by 4 because each pixel has 4 values (RGBA)
            // pg.width is the width of the graphics buffer                        
            let index = (px + py * pg.width) * 4;
            if (pg.pixels[index] > 128) {
                // Threshold for white pixels
                // Map to canvas coordinates, adjusting for baseline
                filledPixels.push({ x: px + x, y: py + y - 50 });
            }
        }
    }

    // Sample N points
    if (filledPixels.length <= N) {
        // If there are fewer points than requested, 
        // add random points to fill the gap
        // those random points are just the randomly cloned points from the text
        while (filledPixels.length < N) {
            let randomIndex = floor(random(filledPixels.length));
            filledPixels.push({ x: filledPixels[randomIndex].x, y: filledPixels[randomIndex].y });
        }

        return filledPixels;
    } else {
        // Shuffle and take first N points
        let shuffled = filledPixels.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, N);
    }
}
