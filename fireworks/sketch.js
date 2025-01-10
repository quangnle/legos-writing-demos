
let fireworks;
function setup() {
    createCanvas(600, 400);
    fireworks = new Fireworks(100);
}

function draw() {
    background(0,0,0,100);  
    fireworks.draw();
}

function touchStarted() {
    fireworks.explode(mouseX, mouseY);
}