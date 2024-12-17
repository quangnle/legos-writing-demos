let start = null;
let end = null;

function initRandomMap(size) {
    let map = [];
    for (let i = 0; i < size; i++) {
        map.push([]);
        for (let j = 0; j < size; j++) {
            map[i].push(Math.random() < 0.2 ? -1 : 0);
        }
    }
    return map;
}

let map = null;
function setup() {
    createCanvas(500, 500);
    map = initRandomMap(20);
}

function draw(){    
    background(0);
    // draw map
    let w = width / map.length;
    let h = height / map.length;
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            fill(map[i][j] === -1 ? 0 : 255);
            rect(i * w, j * h, w, h);
        }
    }

    // draw start and end
    if (start !== null) {
        fill(0, 255, 0);
        rect(start.row * w, start.col * h, w, h);
    }
    if (end !== null) {
        fill(255, 0, 0);
        rect(end.row * w, end.col * h, w, h);
    }

    // draw path
    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[i].length; j++) {
            if (map[i][j] === 2) {
                fill(0, 0, 255);
                ellipse(i * w + w/2, j * h + h/2, w/4, h/4);
            }
        }
    }
}

function mousePressed() {
    if (start === null) {
        start = {row: Math.floor(mouseX / (width / map.length)), col: Math.floor(mouseY / (height / map.length))};
    } else if (end === null) {
        end = {row: Math.floor(mouseX / (width / map.length)), col: Math.floor(mouseY / (height / map.length))};
        let path = findShortestPath(map, start, end);
        // mark the path
        while (path != null) {
            map[path.row][path.col] = 2;
            path = path.prev;
        }
    }    
}

function keyPressed() {
    if (keyCode === ENTER) {
        start = null;
        end = null;
        map = initRandomMap(20);
    }
}

function findShortestPath(map, start, end) {
    let q = [start];    
    let checked = [];
    while (q.length > 0) {
        let cell = q.shift(); // dequeue

        // check if cell is the destination
        if (cell.row === end.row && cell.col === end.col) {
            return cell;
        }

        // check 4 cells around
        let directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (let dir of directions) {
            let newRow = cell.row + dir[0];
            let newCol = cell.col + dir[1];
            // check if new cell is valid
            if (newRow >= 0 && newRow < map.length && newCol >= 0 && newCol < map[0].length) {
                // check if new cell is empty and not checked
                if (map[newRow][newCol] === 0 && !checked.some(c => c.row === newRow && c.col === newCol)) {
                    q.push({row: newRow, col: newCol, prev: cell}); // enqueue
                    checked.push({row: newRow, col: newCol}); // mark as checked
                }
            }
        }
    }
    return null;
}