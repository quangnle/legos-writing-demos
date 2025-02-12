let startX = -2.0;
let startY = -1.0;
let endX = 1.0;
let endY = 1.0;
let zoom = 1.0;

function setup() {
    createCanvas(300, 200);
}

function draw() {
    background(0);
    const max_iter = 200;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let a = map(x, 0, width, startX, endX);
            let b = map(y, 0, height, startY, endY);
            let n = mandelbrot(a, b, max_iter * zoom**2);
            let bright = map(n, 0, max_iter, 0, 255);
            stroke(bright);
            point(x, y);
        }
    }
}

function mousePressed() {
    if (mouseButton === LEFT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        if (zoom > 10) {
            zoom = 1.0;
            startX = -2.0;
            startY = -1.0;
            endX = 1.0;
            endY = 1.0;            
        } else {
            zoom *= 1.05;
            let ztop = map(mouseY, 0, height, startY, endY);
            let zleft = map(mouseX, 0, width, startX, endX);
            let zwidth = (endX - startX) / zoom;
            let zheight = (endY - startY) / zoom;
            startX = zleft - zwidth / 2;
            startY = ztop - zheight / 2;
            endX = zleft + zwidth / 2;
            endY = ztop + zheight / 2;        
        }
    } 
}