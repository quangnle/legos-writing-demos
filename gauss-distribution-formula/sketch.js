function setup() {
    createCanvas(800, 600);
    background(255);
}

function drawOrigin(minX, maxX, minY, maxY) {
    stroke(0);
    line(0, height / 2, width, height / 2);
    line(width / 2, 0, width / 2, height);
    fill(0);
    // text(minX, 5, height / 2 + 15);
    // text(maxX, width - 20, height / 2 + 15);
    // text(minY, width / 2 + 5, height - 5);
    // text(maxY, width / 2 + 5, 15);

    text("0", width / 2 + 5, height / 2 + 15);
}

function drawGaussian(mean, sigma, scaleX = 1, scaleY = 1) {
    stroke("#0f0");
    noFill();
    beginShape();
    const startX = -0.5*scaleX;
    const endX = 0.5*scaleX;
    const startY = -0.5*scaleY;
    const endY = 0.5*scaleY;
    const step = 0.01;

    for (let x = startX; x < endX; x += step) {
        let y = gaussian(x, mean, sigma);
        vertex(map(x, startX, endX, 0, width), map(y, startY, endY, height, 0));
    }
    endShape();

    strokeWeight(2);
    stroke("#00f");
    fill(color(0,0,255,100));
    beginShape();
    for (let x = -sigma; x <= sigma; x += step) {
        let y = gaussian(x, mean, sigma);
        vertex(map(x, startX, endX, 0, width), map(y, startY, endY, height, 0));
    }
    vertex(map(sigma, startX, endX, 0, width), map(0, startY, endY, height, 0));
    vertex(map(-sigma, startX, endX, 0, width), map(0, startY, endY, height, 0));    
    endShape(CLOSE);    
}

function draw() {
    background(255);
    push();
    translate(0, height/2 - 20);
    drawOrigin(-5, 5, -2, 2);
    drawGaussian(mu, sigma, scaleX = 5, scaleY = 2);
    pop();
}

function gaussian(x, mean, sigma) {
    return (1 / (sigma*sqrt(2 * PI))) * exp(-0.5 * pow((x - mean) / sigma, 2));
}

/*

var f2 = function(x,y) {
	return Math.sqrt(x**2 + y**2);
}
var expr = math.parse("f(x,y)").compile(math);
console.log(expr.eval({x:4, y:3, f: f2}));
var expr2 = math.parse("f(x,mu,sigma)").compile(math);
console.log(expr2.eval({x:4, mu:0, sigma:2, f:f}));
*/