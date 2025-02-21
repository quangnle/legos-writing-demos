const size = 200;
const radius = size / 2;
const halfR = radius / 2;
let nLines = 0;
let nLongLines = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(0);
  const xc = width>>1;
  const yc = height>>1;
  ellipse(xc, yc, 3);

  noFill();
  ellipse(xc, yc, size);
  const [p1,p2] = genTwoRandomPoints(xc,yc,radius);
  nLines ++;
  const d = dPoint2Line({x:xc, y:yc}, p1, p2);
  if (d <= halfR) {
    nLongLines++;
  }

  fill("#f00");
  ellipse(p1.x, p1.y,3);
  ellipse(p2.x, p2.y,3);
  line(p1.x,p1.y,p2.x,p2.y);

  text(`${nLongLines}, ${nLines}, ${nLongLines/nLines}`, 10, 20)
}

function genTwoRandomPoints(xc,yc,r) {
  const angle1 = random(2*PI);
  const angle2 = random(2*PI);
  const p1x = xc + r*cos(angle1);  
  const p1y = yc + r*sin(angle1);
  const p2x = xc + r*cos(angle2);  
  const p2y = yc + r*sin(angle2);
  return [{x:p1x, y:p1y}, {x:p2x, y:p2y}];
}

function dPoint2Line(p1, p2, p3){
  let area = Math.abs(0.5 * (p2.x * p3.y + p3.x * p1.y + p1.x * p2.y - p3.x * p2.y - p1.x * p3.y - p2.x * p1.y))    
  let bottom = sqrt((p2.x-p3.x)**2 + (p2.y-p3.y)**2);
  let height = area / bottom * 2.0;

  return height;
}