let board;
let aStar;
let start;
let end;
let h_Path;
let e_Path;
let z_Path;

function setup(){
    let canvas = createCanvas(600, 600);
    canvas.parent('sketch-holder');
    board = new Board(30, 30);
    aStar = new AStar(board);
    h_Path = [];
    e_Path = [];
    z_Path = [];
}

function drawBoard() {
    const cellWidth = width / board.width;
    const cellHeight = height / board.height;

    for (let row = 0; row < board.height; row++) {
        for (let col = 0; col < board.width; col++) {
            if (board.grid[row][col] === 1) {
                fill(0);
                rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            } else if (board.grid[row][col] === 0) {
                fill(255);
                rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }            
        }
    }
}

function draw(){
    background(0);
    const cellWidth = width / board.width;
    const cellHeight = height / board.height;
    
    drawBoard();
    
    // draw Hammington path
    if (showMahattan) {
        for (const node of h_Path) {
            fill(255, 0, 0);
            rect(node.col * cellWidth, node.row * cellHeight, cellWidth, cellHeight);
        }
    }

    // draw Euclidean path
    if (showEuclidean) {
        for (const node of e_Path) {
            fill(0, 0, 255);
            rect(node.col * cellWidth, node.row * cellHeight, cellWidth, cellHeight);
        }
    }

    // draw Zero path
    if (showNonHeuristic) {
        for (const node of z_Path) {
            fill(0, 255, 0);
            rect(node.col * cellWidth, node.row * cellHeight, cellWidth, cellHeight);
        }
    }

    if (start != null) {
        fill(0, 255, 0);
        rect(start.col * cellWidth, start.row * cellHeight, cellWidth, cellHeight);
        fill(255, 0, 0);
        ellipse(start.col * cellWidth + cellWidth / 2, start.row * cellHeight + cellHeight / 2, cellWidth / 2);
    }

    if (end != null) {
        fill(0, 255, 0);
        rect(end.col * cellWidth, end.row * cellHeight, cellWidth, cellHeight);
        fill(255, 0, 0);
        ellipse(end.col * cellWidth + cellWidth / 2, end.row * cellHeight + cellHeight / 2, cellWidth / 2);
    }
}

function mousePressed(){

    if (mouseX < 0 || mouseX >= width || mouseY < 0 || mouseY >= height) {
        return;
    }

    const cellWidth = width / board.width;
    const cellHeight = height / board.height;
    const row = Math.floor(mouseY / cellHeight);
    const col = Math.floor(mouseX / cellWidth);

    if (mouseButton === LEFT) {
        if (start == null) {
            start = new Node(row, col);
        } else {
            if (end == null) {
                end = new Node(row, col);                
                // Find the path with the A* algorithm
                // using the Manhattan distance as the heuristic
                const solution = aStar.find(start, end, (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col));
                let currentNode = solution.result;
                while (currentNode) {
                    h_Path.push(currentNode);
                    currentNode = currentNode.parent;
                }
                // console.log(`Hammington Steps: ${solution.stepCounter}, length: ${h_Path.length}`);
                document.getElementById("mahattanInfo").value = `Pprocessing steps: ${solution.stepCounter}\r\nPath length: ${h_Path.length}`;

                // Find the path with the A* algorithm
                // using the Euclidean distance as the heuristic
                const solution2 = aStar.find(start, end, (a, b) => Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2));
                let currentNode2 = solution2.result;
                while (currentNode2) {
                    e_Path.push(currentNode2);
                    currentNode2 = currentNode2.parent;
                }
                // console.log(`Euclidean Steps: ${solution2.stepCounter}, length: ${e_Path.length}`);
                document.getElementById("euclideanInfo").value = `Processing steps: ${solution2.stepCounter}\r\nPath length: ${e_Path.length}`;

                // Find the path with the A* algorithm
                // using the Zero distance as the heuristic
                const solution3 = aStar.find(start, end, (a, b) => 0);
                let currentNode3 = solution3.result;
                while (currentNode3) {
                    z_Path.push(currentNode3);
                    currentNode3 = currentNode3.parent;
                }
                // console.log(`Zero Steps: ${solution3.stepCounter}, length: ${z_Path.length}`);
                document.getElementById("nonHeuristicInfo").value = `Processing steps: ${solution3.stepCounter}\r\nPath length: ${z_Path.length}`;

            } else {
                start = new Node(row, col);
                end = null;
                h_Path = [];
                e_Path = [];
                z_Path = [];
            }
        }
    } 

    if (mouseButton === RIGHT) {
        board.grid[row][col] = (board.grid[row][col] + 1) % 2;
    }
}