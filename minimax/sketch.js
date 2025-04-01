const boardSize = 11;
const cellSize = 25; // Kích thước của mỗi ô trên bàn cờ
const diamondRate = 0.2; // Tỷ lệ viên kim cương trên bàn cờ
let humanPlayer = { x: 0, y: 0, score: 0 }; // Vị trí của người chơi
let aiPlayer = { x: boardSize - 1, y: boardSize - 1, score: 0 }; // Vị trí của AI
let currentState = null; // Trạng thái hiện tại của trò chơi
let depth = 1; // Độ sâu tìm kiếm của thuật toán Minimax

function setup() {
    // Thiết lập kích thước canvas    
    createCanvas(boardSize * cellSize, boardSize * cellSize + 30);
    background(220);

    // Tạo bàn cờ
    let board = new Board(boardSize, cellSize);
    board.generateDiamonds(diamondRate);
    // Tạo người chơi
    let players = [humanPlayer, aiPlayer];
    // Tạo trạng thái ban đầu
    currentState = new State(board, players);
}

function drawState(state) {
    // vẽ bàn cờ
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            stroke(0);
            strokeWeight(1);
            fill(255);
            rect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }

    // vẽ người chơi là hình tròn màu xanh lá cây
    fill(0, 255, 0);
    ellipse(
        state.players[0].x * cellSize + cellSize / 2,
        state.players[0].y * cellSize + cellSize / 2,
        cellSize / 2
    );
    // vẽ AI là hình tròn màu đỏ
    fill(255, 0, 0);
    ellipse(
        state.players[1].x * cellSize + cellSize / 2,
        state.players[1].y * cellSize + cellSize / 2,
        cellSize / 2
    );

    // vẽ viên kim cương là hình vuông màu xanh dương nhạt có kích thước 0.8 lần kích thước ô
    fill(0, 130, 230);
    stroke(0);    
    for (let diamond of state.board.diamonds) {
        rect(
            diamond.x * cellSize + cellSize * 0.1,
            diamond.y * cellSize + cellSize * 0.1,
            cellSize * 0.8,
            cellSize * 0.8
        );
    }
}

function draw() {
    background(220);
    
    // vẽ trạng thái hiện tại
    drawState(currentState);

    // vẽ điểm số của người chơi và AI
    // nằm dưới cùng của canvas
    // cách lề dưới 10px
    fill(0);
    textSize(12);
    textAlign(LEFT);
    text(`Human: ${currentState.players[0].score}`, 10, height - 10);
    textAlign(RIGHT);
    text(`AI: ${currentState.players[1].score}`, width - 10, height - 10);

    // Nếu trạng thái hiện tại là trạng thái kết thúc
    // thì hiển thị thông báo kết thúc trò chơi
    if (currentState.isGameOver()){
        let winner = currentState.players[0].score > currentState.players[1].score ? "Human" : "AI";
        fill(0, 255, 0);
        stroke(0);
        textSize(12);
        textAlign(CENTER);
        text(`Game Over! Winner: ${winner}`, width / 2, height - 10 );
    }
}

function movePlayer(dx, dy) {
    // Di chuyển người chơi
    let newX = currentState.players[0].x + dx;
    let newY = currentState.players[0].y + dy;

    // Kiểm tra xem nước đi có hợp lệ không
    if (newX >= 0 && newX < boardSize && newY >= 0 && newY < boardSize) {
        // Cập nhật vị trí của người chơi
        currentState.players[0].x = newX;
        currentState.players[0].y = newY;

        // Kiểm tra xem người chơi có ăn được viên kim cương không
        for (let i = currentState.board.diamonds.length - 1; i >= 0; i--) {
            let diamond = currentState.board.diamonds[i];
            if (diamond.x === currentState.players[0].x && diamond.y === currentState.players[0].y) {
                // Cập nhật điểm số của người chơi
                currentState.players[0].score++;
                // Xóa viên kim cương khỏi bàn cờ
                currentState.board.diamonds.splice(i, 1);
            }
        }
        
        // Chuyển lượt cho AI
        currentState.currentPlayerIndex = 1;
        // AI sẽ tự động di chuyển
        let aiMove = minimax(currentState, depth); 
        // Nếu AI tìm được nước đi hợp lệ
        if (aiMove.move) {
            // cập nhật trạng thái hiện tại
            currentState = aiMove.move;

            // Nếu AI ăn được viên kim cương
            for (let i = currentState.board.diamonds.length - 1; i >= 0; i--) {
                let diamond = currentState.board.diamonds[i];
                if (diamond.x === currentState.players[1].x && diamond.y === currentState.players[1].y) {
                    // Cập nhật điểm số của AI
                    currentState.players[1].score++;
                    // Xóa viên kim cương khỏi bàn cờ
                    currentState.board.diamonds.splice(i, 1);
                }
            }

            // Chuyển lượt cho người chơi
            currentState.currentPlayerIndex = 0;
        } 
    }
}

function keyPressed() {
    // Nếu trạng thái hiện tại là trạng thái kết thúc thì không làm gì cả
    if (currentState.isGameOver()) {
        return;
    }
    // Nếu người chơi nhấn phím mũi tên lên, xuống, trái, phải
    // thì di chuyển người chơi tương ứng
    if (keyCode === UP_ARROW) {
        movePlayer(0, -1);
    } else if (keyCode === DOWN_ARROW) {
        movePlayer(0, 1);
    } else if (keyCode === LEFT_ARROW) {
        movePlayer(-1, 0);
    } else if (keyCode === RIGHT_ARROW) {
        movePlayer(1, 0);
    }
}

function minimax(state, depth) {
    // nếu độ sâu bằng 0 hoặc trạng thái hiện tại là trạng thái kết thúc thì trả về điểm số
    // và nước đi là null
    if (depth === 0 || state.isGameOver()) {
        return { score: state.evaluate(), move: null };
    }

    let bestMove = null;
    let bestScore;

    if (state.currentPlayerIndex === 1) { // AI (Max player)
        bestScore = -Infinity;
        const nextStates = state.generateNextStates();
        for (let nextState of nextStates) {
            const result = minimax(nextState, depth - 1);
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = nextState; 
            }
        }
    } else { // Human (Min player)
        bestScore = Infinity;
        const nextStates = state.generateNextStates();
        for (let nextState of nextStates) {
            const result = minimax(nextState, depth - 1);
            if (result.score < bestScore) {
                bestScore = result.score;
                bestMove = result.move; 
            }
        }
    }

    return { score: bestScore, move: bestMove };
}
