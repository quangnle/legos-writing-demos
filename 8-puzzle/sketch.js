let path = [];

let astar = new AStar((node, end) => {
    return node.arr.reduce((h, value, index) => value !== end.arr[index] ? h + 1 : h, 0);
});

let startNode = new ClickableNode(new Node([1, 2, 3, 4, 5, 6, 7, 8, 0]));
let targetNode = new ClickableNode(new Node([1, 2, 3, 4, 5, 6, 7, 8, 0]));

function setup() {
    let canvas = createCanvas(700, 600);
    canvas.parent('sketch-holder');

    let resultObj = astar.find(startNode.node, targetNode.node);
    let result = resultObj.result;
    while (result) {
        path.push(result);
        result = result.parent;
    }
    path.reverse();
}

function drawBlock(x, y, size, node) {
    for (let i = 0; i < node.arr.length; i++) {
        let value = node.arr[i];
        let row = Math.floor(i / 3);
        let col = i % 3;
        fill(255);
        stroke(0);
        rect(x + col * size, y + row * size, size, size);
        if (value !== 0) {
            fill(0);
            textAlign(CENTER, CENTER);
            text(value, x + col * size + size / 2, y + row * size + size / 2);
        } else {
            fill(200);
            rect(x + col * size, y + row * size, size, size);
        }
    }
}

function draw() {
    background(255);  

    fill(0);
    textAlign(LEFT, CENTER);
    text('Setup the START and TARGET states by clicking on their blocks to move', 10, 10);

    text('START', 10, 30);
    startNode.draw(0, 40);

    fill(0);
    text('TARGET', 150, 30);
    targetNode.draw(110, 40);

    fill(0);
    text('RESULT', 30, 150);
    targetNode.draw(110, 40);

    if (path.length > 0) {
        let x = 0;
        let y = 0;
        for (let i = 0; i < path.length; i++) {
            let node = path[i];
            x = i % 6;
            y = Math.floor(i / 6);
            drawBlock(x * 100, y*100 + 160, 30, node);
        }
    }
}

function mousePressed() {
    startNode.mousePressed(mouseX, mouseY);
    targetNode.mousePressed(mouseX, mouseY);

    path = [];
    let resultObj = astar.find(startNode.node, targetNode.node);
    let result = resultObj.result;
    while (result) {
        path.push(result);
        result = result.parent;
    }
    path.reverse();
}