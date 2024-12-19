// 8 queens board
const board = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

function tryPlace(atRow, atColumn){
    // check if there is a queen in the same row
    for(let i = 0; i < 8; i++){
        if(board[atRow][i] === 1){
            return false;
        }
    }

    // check if there is a queen in the same column
    for(let i = 0; i < 8; i++){
        if(board[i][atColumn] === 1){
            return false;
        }
    }

    // check if there is a queen in the same diagonal
    for (let i=0; i<8; i++){
        if(atRow + i < 8 && atColumn + i < 8){
            if(board[atRow + i][atColumn + i] === 1){
                return false;
            }
        }
        if(atRow - i >= 0 && atColumn - i >= 0){
            if(board[atRow - i][atColumn - i] === 1){
                return false;
            }
        }
        if(atRow + i < 8 && atColumn - i >= 0){
            if(board[atRow + i][atColumn - i] === 1){
                return false;
            }
        }
        if(atRow - i >= 0 && atColumn + i < 8){
            if(board[atRow - i][atColumn + i] === 1){
                return false;
            }
        }                         
    }           

    return true;
}

function solve(){
    // stack to store the queens
    const s = [];
    // start from the first row
    let last = -1;
    do {                
        // try to place a queen in the next column
        let canPlace = false;
        // start from the last column
        for (let i = last + 1; i < 8; i++){
            if(tryPlace(s.length, i)){                        
                // place the queen
                board[s.length][i] = 1;
                // push the column to the stack
                s.push(i);
                // reset the last column
                last = -1;

                canPlace = true;
                break;
            }
        }

        // if we can't place a queen in the current row
        if(!canPlace){
            if(s.length === 0) break;
            
            // remove the last queen
            last = s.pop();
            // remove the queen from the board
            board[s.length][last] = 0;
        }
    } while (s.length < 8);
    
    console.log(s);
    console.log(board);
}
solve();