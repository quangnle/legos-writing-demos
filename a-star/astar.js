class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.f = 0;
        this.g = 0;
        this.h = 0;        
    }
}

class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];

        // Generate a random grid
        this.grid = Array.from({ length: height }, () => 
            Array.from({ length: width }, () => (Math.random() < 0.2 ? 1 : 0))
        );
    }

    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;

        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];

        for (const direction of directions) {
            const newRow = row + direction.row;
            const newCol = col + direction.col;

            if (newRow >= 0 && newRow < this.height && newCol >= 0 && newCol < this.width && this.grid[newRow][newCol] == 0) {
                neighbors.push(new Node(newRow, newCol));
            }
        }

        return neighbors;
    }
}

class AStar {
    constructor(board) {
        this.board = board;
    }

    find(start, end, heuristic){
        const openSet = [new Node(start.row, start.col)];
        const closedSet = [];
        let result = null;
        let stepCounter = 0;

        while (openSet.length > 0) {
            stepCounter++;
            let current = openSet.reduce((prev, curr) => (curr.f < prev.f ? curr : prev));

            if (current.row === end.row && current.col === end.col) {
                result = current;
                break;
            } 

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);

            const neighbors = this.board.getNeighbors(current);            
            for (let i = 0; i < neighbors.length; i++) {
                let neighbor = neighbors[i];
                if (!closedSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                    let tempG = current.g + 1;
                    if (tempG < neighbor.g || !openSet.some(node => node.row === neighbor.row && node.col === neighbor.col)) {
                        neighbor.g = tempG;
                        neighbor.h = heuristic(neighbor, end);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = current;                        
                        openSet.push(neighbor);                        
                    }
                }
            }
        }

        return { result, stepCounter };
    }
}