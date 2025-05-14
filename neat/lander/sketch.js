// === Global Simulation Variables ===
let canvasWidth = 700;
let canvasHeight = 600;
let groundHeight = 20;
let landingZoneX1, landingZoneX2, landingZoneY;

let landers = []; // Array of Lander objects
let activeLanders = 0; // Counter for active landers

let currentGeneration = 0; // Generation counter
let highestScore = -Infinity; // Highest score tracker
let showAll = true; // Toggle drawing all landers or just the best

// --- Network Visualization Variables ---
let networkCanvas; // Graphics buffer for network drawing
let isNetworkVisible = false; // Flag to control network visibility
let networkCanvasWidth = 400;
let networkCanvasHeight = 300;
let networkButton; // Button to toggle network view
let viewToggleButton; // Button to toggle all/best lander view
let trainWithoutGraphicButton; // Flag to disable graphics during training

function setup() {
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent(document.body); // Attach canvas directly to body
    frameRate(60); // Consistent frame rate

    // Define landing zone
    let landingZoneWidth = 100;
    landingZoneX1 = canvasWidth / 2 - landingZoneWidth / 2;
    landingZoneX2 = canvasWidth / 2 + landingZoneWidth / 2;
    landingZoneY = canvasHeight - groundHeight;

    // Initialize NEAT (from core-neat.js - now expects 7 inputs)
    initializeNeat();

    // Start the first generation (from core-neat.js)
    startEvaluation();

    console.log("p5 Setup complete. Starting simulation with random wind.");

    // --- Create Buttons and attach to container ---
    let buttonContainer = select('#button-container'); // Select the div

    viewToggleButton = createButton('View: All');
    viewToggleButton.parent(buttonContainer);
    viewToggleButton.mousePressed(() => {
        showAll = !showAll;
        viewToggleButton.html(showAll ? 'View: All' : 'View: Best');
    });

    networkButton = createButton('Show Network');
    networkButton.parent(buttonContainer);
    networkButton.mousePressed(toggleNetworkVisualization);

    trainWithoutGraphicButton = createButton('Train Without Graphics (300 times)');
    trainWithoutGraphicButton.parent(buttonContainer);
    trainWithoutGraphicButton.mousePressed(() => {
        setTimeout(() => {
            simulateTrain(300);
        }, 1000); 
    });

    // Create graphics buffer for network visualization
    networkCanvas = createGraphics(networkCanvasWidth, networkCanvasHeight);
    
}

function draw() {
    background(20, 20, 35); // Dark background

    // Draw Ground and Landing Pad
    fill(150);
    noStroke();
    rect(0, landingZoneY, canvasWidth, groundHeight); // Ground
    fill(0, 200, 0);
    rect(landingZoneX1, landingZoneY, landingZoneX2 - landingZoneX1, 5); // Landing pad marker

    // --- Simulation Loop ---
    if (activeLanders > 0) {
        let bestLanderIndex = -1;
        // Find index of the lander associated with the best genome for drawing 'Best' view
        if (!showAll && landers.length > 0 && neat.population && neat.population.length > 0) {
            let bestGenome = neat.population[0]; // Assumes neat.population is sorted by endEvaluation
            bestLanderIndex = landers.findIndex(l => l.genome === bestGenome);
        }

        // Update and draw landers
        for (let i = landers.length - 1; i >= 0; i--) {
            let lander = landers[i];
            if (lander.active) {
                lander.think();
                lander.update(); // Wind is calculated and applied here
                if (!lander.active) {
                    activeLanders--;
                }
            }
            // Drawing Logic
            if (showAll || i === bestLanderIndex) { // Draw all or only the best
                lander.draw();
            }
        }
    } else { // End of generation or initialization
        if (landers.length > 0 && neat && neat.population && neat.population.length > 0) {
            // Run NEAT evolution steps
            endEvaluation();
            startEvaluation();
        } else if (!neat || !neat.population || neat.population.length === 0) {
            // Waiting state - Display message if needed
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(10);
            text("Initializing NEAT / Waiting for Population...", width / 2, height / 2);
        }
    }

    // draw mini chart    
    let chartData = successfulLanders.slice(-150); // Get the last 10 successful landers
    drawMiniChart(chartData, 10, 80, 150, 50);

    // --- Draw Info Panel ---
    drawInfoPanel();

    // --- Draw Wind Indicator ---
    drawWindIndicator();

    // --- Draw Network Visualization if active ---
    if (isNetworkVisible) {
        let networkX = canvasWidth - networkCanvasWidth - 10;
        let networkY = 10;
        image(networkCanvas, networkX, networkY);
        noFill();
        stroke(255);
        strokeWeight(1);
        rect(networkX - 1, networkY - 1, networkCanvasWidth + 2, networkCanvasHeight + 2);
    }
    
}

function drawMiniChart(data, x, y, w, h) {
    // --- draw a mini chart of the number of successful landings ---
    textSize(10);
    textAlign(LEFT, TOP);
    text(`Successful landers chart`, x, y - 10);
    let chartWidth = w;
    let chartHeight = h;
    let chartX = x;
    let chartY = y;
    let chartData = data;
    // draw the chart background
    fill(50, 50, 70, 200);
    noStroke();
    rect(chartX, chartY, chartWidth, chartHeight);    
    // draw the chart data
    noStroke(); 
    fill(0, 200, 0, 150);
    
    for (let i = 0; i < chartData.length; i++) {
        let x = chartX + i;
        let val = (chartData[i] / POPULATION_SIZE) * (chartHeight - 1) + 1; // Avoid zero height bars
        let y = chartY + chartHeight - val - 1;
        rect(x, y, 1, val); // Draw the bar
    }
}

function drawWindIndicator() {
    // --- Wind Indicator ---
    let currentWindForDisplay = 0;
    let displayLander = landers.find(l => l.active) || (landers.length > 0 ? landers[0] : null);
    if (displayLander) {
        currentWindForDisplay = displayLander.currentWind;
    } else {
        let noiseVal = noise(frameCount * WIND_NOISE_SCALE_TIME);
        currentWindForDisplay = map(noiseVal, 0, 1, -MAX_WIND_STRENGTH, MAX_WIND_STRENGTH);
    }

    let windIndicatorX = canvasWidth - 150;
    let windIndicatorY = 70;
    let windArrowLength = map(abs(currentWindForDisplay), 0, MAX_WIND_STRENGTH, 0, 50);
    let windArrowXEnd = windIndicatorX + (currentWindForDisplay >= 0 ? windArrowLength : -windArrowLength); // Handle zero wind case slightly better

    stroke(255, 255, 0, 180);
    strokeWeight(2);
    line(windIndicatorX, windIndicatorY, windArrowXEnd, windIndicatorY); // Arrow shaft
    if (windArrowLength > 1) { // Draw arrowhead
        let arrowSize = 5;
        if (currentWindForDisplay >= 0) {
            line(windArrowXEnd, windIndicatorY, windArrowXEnd - arrowSize, windIndicatorY - arrowSize);
            line(windArrowXEnd, windIndicatorY, windArrowXEnd - arrowSize, windIndicatorY + arrowSize);
        } else {
            line(windArrowXEnd, windIndicatorY, windArrowXEnd + arrowSize, windIndicatorY - arrowSize);
            line(windArrowXEnd, windIndicatorY, windArrowXEnd + arrowSize, windIndicatorY + arrowSize);
        }
    }
    noStroke();
    fill(255, 255, 0);
    textSize(10);
    textAlign(CENTER, BOTTOM);
    text(`Wind: ${(currentWindForDisplay / MAX_WIND_STRENGTH * 100).toFixed(0)}%`, windIndicatorX, windIndicatorY - 5);
}

function drawInfoPanel() {
// --- Display Info Texts ---
    fill(255);
    textSize(10);
    textAlign(LEFT, TOP);
    text(`Generation: ${currentGeneration}`, 10, 10);
    text(`Active Landers: ${activeLanders} / ${POPULATION_SIZE}`, 10, 25);
    text(`Number of successful landings: ${landers.filter(l => l.landed).length}`, 10, 40);
    text(`Highest Score Ever: ${isFinite(highestScore) ? highestScore.toFixed(2) : 'N/A'}`, 10, 55);
}