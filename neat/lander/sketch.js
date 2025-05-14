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

// === p5.js Setup ===
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

// === p5.js Draw (Main Loop) ===
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

    // --- draw a mini chart of the number of successful landings ---
    textSize(10);
    textAlign(LEFT, TOP);
    text(`Successful landers chart`, 10, 70);
    let chartWidth = 150;
    let chartHeight = 51;
    let chartX = 10;
    let chartY = 80;
    // draw the chart background
    fill(50, 50, 70, 200);
    noStroke();
    rect(chartX, chartY, chartWidth, chartHeight);    
    // draw the chart data
    noStroke(); 
    fill(0, 200, 0, 150);
    let chartData = successfulLanders.slice(-chartWidth); // Get the last 150 generations
    for (let i = 0; i < chartData.length; i++) {
        let x = chartX + i;
        let y = chartY + chartHeight - chartData[i] - 1;
        let val = chartData[i] + 1; // Avoid zero height bars
        rect(x, y, 1, val); // Draw the bar
    }

    // --- Display Info Texts ---
    fill(255);
    textSize(10);
    textAlign(LEFT, TOP);
    text(`Generation: ${currentGeneration}`, 10, 10);
    text(`Active Landers: ${activeLanders} / ${POPULATION_SIZE}`, 10, 25);
    text(`Number of successful landings: ${landers.filter(l => l.landed).length}`, 10, 40);
    text(`Highest Score Ever: ${isFinite(highestScore) ? highestScore.toFixed(2) : 'N/A'}`, 10, 55);
    

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

// === Network Visualization Functions ===

function toggleNetworkVisualization() {
    isNetworkVisible = !isNetworkVisible;
    networkButton.html(isNetworkVisible ? 'Hide Network' : 'Show Network');
    if (isNetworkVisible) {
        drawNetworkVisualization(lastBestGenomeJSON); // Redraw when shown
    }
}

function drawNetworkVisualization(genomeJSON) {
    networkCanvas.background(40, 40, 60); // Clear background

    if (!genomeJSON || !genomeJSON.nodes || !genomeJSON.connections) {
        networkCanvas.fill(200);
        networkCanvas.textAlign(CENTER, CENTER);
        networkCanvas.textSize(12);
        networkCanvas.text("No Genome Data Yet\n(Complete 1st Gen)", networkCanvasWidth / 2, networkCanvasHeight / 2);
        return;
    }

    let nodes = genomeJSON.nodes;
    let connections = genomeJSON.connections;
    let nodePositions = {};
    let nodeCounts = {
        input: 0,
        hidden: 0,
        output: 0
    };
    let nodeTotals = {
        input: 0,
        hidden: 0,
        output: 0
    };

    nodes.forEach(node => {
        if (node.type === 'input') nodeTotals.input++;
        else if (node.type === 'output') nodeTotals.output++;
        else nodeTotals.hidden++;
    });

    let marginX = networkCanvasWidth * 0.1;
    let marginY = networkCanvasHeight * 0.15;
    let drawWidth = networkCanvasWidth - 2 * marginX;
    let drawHeight = networkCanvasHeight - 2 * marginY;

    // Calculate node positions
    nodes.forEach(node => {
        let x, y, count, total;
        if (node.type === 'input') {
            x = marginX;
            count = ++nodeCounts.input;
            total = nodeTotals.input;
            y = marginY + (total > 1 ? (count - 1) * drawHeight / (total - 1) : drawHeight / 2);
        } else if (node.type === 'output') {
            x = marginX + drawWidth;
            count = ++nodeCounts.output;
            total = nodeTotals.output;
            y = marginY + (total > 1 ? (count - 1) * drawHeight / (total - 1) : drawHeight / 2);
        } else {
            x = marginX + drawWidth * 0.5;
            count = ++nodeCounts.hidden;
            total = nodeTotals.hidden;
            y = marginY + (total > 0 ? (count - 0.5) * drawHeight / total : drawHeight / 2);
            x += random(-drawWidth * 0.1, drawWidth * 0.1);
        }
        nodePositions[node.index] = {
            x: x,
            y: y
        };
    });

    // Draw Connections
    connections.forEach(conn => {
        if (conn.from === undefined || conn.to === undefined || !nodePositions[conn.from] || !nodePositions[conn.to]) return;
        let fromPos = nodePositions[conn.from];
        let toPos = nodePositions[conn.to];
        let weight = conn.weight;
        let sw = constrain(map(abs(weight), 0, 2, 0.5, 4), 0.5, 4);
        networkCanvas.strokeWeight(sw);
        if (weight > 0) networkCanvas.stroke(0, 255, 0, 150);
        else networkCanvas.stroke(255, 0, 0, 150);
        networkCanvas.line(fromPos.x, fromPos.y, toPos.x, toPos.y);
    });

    // Draw Nodes
    let nodeSize = 10;
    networkCanvas.strokeWeight(1);
    networkCanvas.stroke(200);
    nodes.forEach(node => {
        let pos = nodePositions[node.index];
        if (!pos) return;
        if (node.type === 'input') networkCanvas.fill(0, 150, 255);
        else if (node.type === 'output') networkCanvas.fill(255, 150, 0);
        else networkCanvas.fill(200, 200, 200);
        networkCanvas.ellipse(pos.x, pos.y, nodeSize, nodeSize);
    });

    // Draw Legend
    let legendY = networkCanvasHeight - marginY / 1.5;
    let legendX = 10;
    let legendSpacing = 70;
    networkCanvas.textSize(10);
    networkCanvas.textAlign(LEFT, CENTER);
    networkCanvas.fill(0, 150, 255);
    networkCanvas.ellipse(legendX, legendY, 8, 8);
    networkCanvas.fill(255);
    networkCanvas.text("Input", legendX + 10, legendY);
    legendX += legendSpacing;
    networkCanvas.fill(200);
    networkCanvas.ellipse(legendX, legendY, 8, 8);
    networkCanvas.fill(255);
    networkCanvas.text("Hidden", legendX + 10, legendY);
    legendX += legendSpacing;
    networkCanvas.fill(255, 150, 0);
    networkCanvas.ellipse(legendX, legendY, 8, 8);
    networkCanvas.fill(255);
    networkCanvas.text("Output", legendX + 10, legendY);
    legendX += legendSpacing + 10;
    networkCanvas.strokeWeight(1.5);
    networkCanvas.stroke(0, 255, 0, 150);
    networkCanvas.line(legendX, legendY, legendX + 15, legendY);
    networkCanvas.noStroke();
    networkCanvas.fill(255);
    networkCanvas.text("+Weight", legendX + 20, legendY);
    legendX += legendSpacing;
    networkCanvas.strokeWeight(1.5);
    networkCanvas.stroke(255, 0, 0, 150);
    networkCanvas.line(legendX, legendY, legendX + 15, legendY);
    networkCanvas.noStroke();
    networkCanvas.fill(255);
    networkCanvas.text("-Weight", legendX + 20, legendY);
}