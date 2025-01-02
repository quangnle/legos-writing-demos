class Node {
    constructor(arr) {
        this.arr = arr;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;        
    }

    equals(node) {
        return this.arr.every((val, i) => val === node.arr[i]);
    }

    getNeighbors() {
        // generate all possible neighbors of this node
        // based on the 8-puzzle rules        
        const neighbors = [];
        const zeroIndex = this.arr.indexOf(0);
        const zeroRow = Math.floor(zeroIndex / 3);
        const zeroCol = zeroIndex % 3;

        const directions = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];

        // swap the zero with the neighbor
        for (const direction of directions) {
            const newRow = zeroRow + direction.row;
            const newCol = zeroCol + direction.col;

            if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
                const newZeroIndex = newRow * 3 + newCol;
                const newArr = [...this.arr];
                newArr[zeroIndex] = newArr[newZeroIndex];
                newArr[newZeroIndex] = 0;
                neighbors.push(new Node(newArr));
            }
        }

        return neighbors;
    }

    toString() {
        // return a string representation of the node
        let str = '';
        for (let i = 0; i < 3; i++) {
            str += this.arr.slice(i * 3, i * 3 + 3).join(' ') + '\n';
        }
        return str;
    }
}

class AStar {
    constructor(heuristic) {
        this.heuristic = heuristic;
    }

    find(start, end){
        const openSet = [start];
        const closedSet = [];
        let result = null;
        let stepCounter = 0;

        while (openSet.length > 0) {
            stepCounter++;
            let current = openSet.reduce((prev, curr) => (curr.f < prev.f ? curr : prev));

            if (current.equals(end)) {
                result = current;
                break;
            } 

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);

            const neighbors = current.getNeighbors(current);            
            for (let i = 0; i < neighbors.length; i++) {
                let neighbor = neighbors[i];
                if (!closedSet.some(node => node.equals(neighbor))) {
                    let tempG = current.g + 1;
                    if (tempG < neighbor.g || !openSet.some(node => node.equals(neighbor))) {
                        neighbor.g = tempG;
                        neighbor.h = this.heuristic(neighbor, end);
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