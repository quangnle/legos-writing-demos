
function setup() {
  const canvasElement = createCanvas(800, 330);
  canvasElement.parent('canvas-container');
  processor.generate(5);
  // processor.run();
}

const CANVAS_BG = [22, 22, 26];

function draw() {
    background(CANVAS_BG[0], CANVAS_BG[1], CANVAS_BG[2]);
    processor.draw();
}