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
}

function drawGaussian(mu, sigma, scaleX = 1, scaleY = 1) {
    stroke("#0f0");
    noFill();
    beginShape();
    const startX = -0.5*scaleX;
    const endX = 0.5*scaleX;
    const startY = -0.5*scaleY;
    const endY = 0.5*scaleY;
    const step = 0.01;

    for (let x = startX; x < endX; x += step) {
        let y = gaussian(x, mu, sigma);
        vertex(map(x, startX, endX, 0, width), map(y, startY, endY, height, 0));
    }
    endShape();

    strokeWeight(2);
    stroke("#00f");
    fill(color(0,0,255,100));
    beginShape();
    for (let x = mu-sigma; x <= mu+sigma+step; x += step) {
        let y = gaussian(x, mu, sigma);
        vertex(map(x, startX, endX, 0, width), map(y, startY, endY, height, 0));
    }
    vertex(map(mu + sigma, startX, endX, 0, width), map(0, startY, endY, height, 0));
    vertex(map(mu - sigma, startX, endX, 0, width), map(0, startY, endY, height, 0));    
    endShape(CLOSE);    

    // draw point at mu
    strokeWeight(4);
    stroke("#f00");
    point(map(mu, startX, endX, 0, width), map(0, startY, endY, height, 0));
    strokeWeight(1);
    // draw line at mu
    stroke("#f00");
    line(map(mu, startX, endX, 0, width), 0, map(mu, startX, endX, 0, width), height);
    // draw text at mu
    stroke("#000");
    fill("#000");
    text("μ=" + mu, map(mu, startX, endX, 0, width), height / 2 + 15);
    // draw text at sigma
    fill("#000");
    text("μ+σ=" + (mu+sigma).toFixed(2), map(mu + sigma, startX, endX, 0, width), height / 2 + 15);
    text("μ-σ=" + (mu-sigma).toFixed(2), map(mu - sigma, startX, endX, 0, width), height / 2 + 15);

}

function draw() {
    background(255);
    drawOrigin(-5, 5, -2, 2);
    drawGaussian(mu, sigma, scaleX = 5, scaleY = 2);
}

function gaussian(x, mean, sigma) {
    return Math.exp(-0.5 * ((x - mean) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}