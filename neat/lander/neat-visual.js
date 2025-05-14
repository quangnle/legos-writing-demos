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