let boxes = [];
let values = [];

function setup() {
    let canvas = createCanvas(400, 400);
    canvas.parent('sketch-holder');
    background(200);    
    genRandomBoxes();
}

function genRandomBoxes() {
    boxes = [];
    values = [];
    // Create values
    for (let i = 0; i < nPrisoners; i++) {
        values.push(i+1);
    }
    // Shuffle values
    for (let i = values.length - 1; i > 0; i--) {
        let j = floor(random(i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    // Create boxes
    for (let i = 0; i < nPrisoners; i++) {
        let box = new Box(i, values[i]);
        boxes.push(box);
    }
}

function draw() {
    fill(200);
    rect(0, 0, width, height);
    for (let box of boxes) {
        box.draw();
    }
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }

    let boxId = floor(mouseX / 40) + floor(mouseY / 40) * 10;
    let box = boxes[boxId];
    
    if (box.isOpen) {
        return;
    }

    for (let box of boxes) {
        box.onMousePressed();
    }

    if (numOpenedBoxes == nPrisoners / 2) {
        alert("Unfortunately, you've failed!");
        regenerate();
        nMatches++;
        document.getElementById('nMatches').innerText = nMatches;
        return;
    }

    numOpenedBoxes++;

    if (box.value == currentPrisonerId + 1) {
        if (currentPrisonerId == nPrisoners) {
            alert("Congratulations! You've succeeded!");
            regenerate();
            
            nMatches++;
            document.getElementById('nMatches').innerText = nMatches;
            nWins++;
            document.getElementById('nWins').innerText = nWins;

            return;
        }
        alert("Prisoner " + (currentPrisonerId + 1) + " has been released successfully!");
        currentPrisonerId++;        
        genRandomBoxes();
        numOpenedBoxes = 0;
    }

    document.getElementById('currentPrisoner').innerText = currentPrisonerId + 1;
    document.getElementById('nTests').innerText = numOpenedBoxes;
}