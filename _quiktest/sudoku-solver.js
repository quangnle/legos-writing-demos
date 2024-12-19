function rowCheck(board, row, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) {
            return false;
        }
    }
    return true;
}

function colCheck(board, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[i][col] === num) {
            return false;
        }
    }
    return true;
}

function boxCheck(board, row, col, num) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + row][j + col] === num) {
                return false;
            }
        }
    }
    return true;
}

function isValid(board, row, col, num) {
    return rowCheck(board, row, num) && colCheck(board, col, num) && boxCheck(board, row - row % 3, col - col % 3, num);
}

function findEmptyCell(board) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) {
                return [i, j];
            }
        }
    }
    return null;
}

function solve(board) {
    const s = [];
    let last = 0;
    do {
        const emptyCell = findEmptyCell(board);
        if (emptyCell === null) {
            return true;
        }
        const [row, col] = emptyCell;
        let canFind = false;
        for (let val = last + 1; val <= 9; val++) {
            if (isValid(board, row, col, val)) {
                board[row][col] = val;
                s.push([row, col, val]);
                canFind = true;
                last = 0;
                break;                
            }
        }
        if (!canFind) {
            const lastElement = s.pop();
            board[lastElement[0]][lastElement[1]] = 0;
            last = lastElement[2];
        }
    } while (s.length < 81);
    return false;
}

const board = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

solve(board);
console.log(board);