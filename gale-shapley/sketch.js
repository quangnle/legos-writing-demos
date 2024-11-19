
function setup() {
  const canvasElement = createCanvas(800, 330);
  canvasElement.parent('canvas-container');
  processor.generate(5);
  // processor.run();
}

function draw() {
    background(220);
    processor.draw();
}