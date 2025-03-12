const points = [];

function setup() {
    createCanvas(400, 400);
    background(255);
}

function draw() {
    background(255);
    // side of the square
    const d = 300;
    // radius of the circle
    const r = d / 2;
    // center of the canvas
    const cx = width / 2;
    const cy = height / 2;

    fill(255);
    stroke(0);
    // Draw the square at the center of the canvas
    rect(cx - r, cy - r, d, d);

    // Draw the circle at the center of the canvas
    ellipse(cx, cy, r*2, r*2);    
    
    // add a random point inside the square
    const px = Math.random() * d + cx - r;
    const py = Math.random() * d + cy - r;

    // push the point to the array
    points.push({ x: px, y: py });
    
    // draw all the points
    fill(0);
    let k = 0;
    points.forEach(p => {
        // calculate the distance from the center of the circle to the point
        const l = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        // check if the point is inside the circle
        if (l < r) {
            // if the point is inside the circle, color it green
            fill(0, 255, 0);
            // increment the counter of points inside the circle
            k++;
        } else {
            // if the point is outside the circle, color it red
            fill(255, 0, 0);
        }
        // draw the point
        noStroke();
        ellipse(p.x, p.y, 2, 2);
    });

    // calculate the ratio of points inside the circle to all points
    const n = points.length;
    const ratio = k / n;
    // calculate the estimated value of pi
    const estPI = 4 * ratio;

    // display the estimated value of pi
    fill(0);
    textSize(28);
    text(`Approx. PI ~ ${estPI.toFixed(8)}`, 50, 30);
}