// --- Cài đặt Game ---
const boardSize = 11;
const diamondCount = 20; // Tổng số kim cương (phải là số chẵn)
let cellSize = 35; // Kích thước ô, sẽ được tính toán

let players = {};
let diamonds = [];
let currentPlayerId;
let humanPlayerId = 1;
let aiPlayerId = 2;
let gameOver = false;
let winner = null; // null: chưa có, 1: người chơi 1, 2: người chơi 2, 3: hòa
let message = "";

// --- Cài đặt AI (Minimax) ---
let aiThinking = false;
const minimaxDepth = 12; // Độ sâu tìm kiếm (tăng để AI mạnh hơn, nhưng chậm hơn)

function setup() {
    // Tính toán kích thước canvas và ô
    let canvas = createCanvas(cellSize * boardSize + 1, cellSize * boardSize + 1 + 25); // +1 để vẽ đường viền cuối
    canvas.parent('canvas-container'); // Gắn canvas vào phần tử có id 'canvas-holder'
    initializeGame();
    updateMessage();
}

function draw() {
    background(245);
    drawGrid();
    drawDiamonds();
    drawPlayers();
    displayInfo();

    if (gameOver) {
        displayGameOver();
    } else if (currentPlayerId === aiPlayerId && !aiThinking) {
        // Trigger AI move
        aiThinking = true;
        // Dùng setTimeout để tránh block luồng vẽ và cho người dùng thấy lượt đi trước khi AI tính toán
        setTimeout(triggerAIMove, 100); // Delay nhỏ
    }
}

function keyPressed() {
    if (!gameOver && currentPlayerId === humanPlayerId && !aiThinking) {
        handleHumanInput();
    }
}

// --- Khởi tạo Game ---

function initializeGame() {
    // Người chơi
    players = {
        1: { id: 1, x: 0, y: 0, score: 0, color: color(0, 0, 255) }, // Blue
        2: { id: 2, x: boardSize - 1, y: boardSize - 1, score: 0, color: color(255, 0, 0) } // Red (AI)
    };

    // Kim cương (đối xứng qua tâm)
    generateSymmetricDiamonds();

    // Trạng thái game
    currentPlayerId = humanPlayerId; // Người chơi bắt đầu
    gameOver = false;
    winner = null;
    aiThinking = false;
    updateMessage();
}

function generateSymmetricDiamonds() {
    diamonds = [];
    let center = (boardSize - 1) / 2;
    let occupied = new Set();
    occupied.add(`${players[1].x},${players[1].y}`); // Vị trí người chơi 1
    occupied.add(`${players[2].x},${players[2].y}`); // Vị trí người chơi 2

    if (boardSize % 2 !== 0) {
        occupied.add(`${center},${center}`); // Tâm bàn cờ lẻ không thể có kim cương đối xứng
    }

    while (diamonds.length < diamondCount) {
        let x = floor(random(boardSize));
        let y = floor(random(boardSize));
        let symX = boardSize - 1 - x;
        let symY = boardSize - 1 - y;

        let posStr = `${x},${y}`;
        let symPosStr = `${symX},${symY}`;

        // Đảm bảo không trùng vị trí người chơi, tâm, và kim cương đã có
        // Đảm bảo không đặt kim cương lên chính nó (x,y) == (symX, symY) -> tâm
        if (!occupied.has(posStr) && !occupied.has(symPosStr) && posStr !== symPosStr) {
            let diamondPos = { x: x, y: y };
            let symDiamondPos = { x: symX, y: symY };

            diamonds.push(diamondPos);
            diamonds.push(symDiamondPos);
            occupied.add(posStr);
            occupied.add(symPosStr);
        }
    }
    // Đảm bảo số lượng chính xác nếu có lỗi logic (hiếm khi)
    if (diamonds.length > diamondCount) {
         diamonds = diamonds.slice(0, diamondCount);
    }
}


// Phần vẽ vời

function drawGrid() {
    stroke(200);
    strokeWeight(1);
    for (let i = 0; i <= boardSize; i++) {
        line(i * cellSize, 0, i * cellSize, cellSize * boardSize);
        line(0, i * cellSize, cellSize * boardSize, i * cellSize);
    }
}

function drawDiamonds() {
    fill(0, 255, 0); // Green
    noStroke();
    let diamondSize = cellSize * 0.5;
    for (let diamond of diamonds) {
        // Hình thoi đơn giản
        let centerX = diamond.x * cellSize + cellSize / 2;
        let centerY = diamond.y * cellSize + cellSize / 2;
        quad(centerX, centerY - diamondSize / 2, // Top point
             centerX + diamondSize / 2, centerY, // Right point
             centerX, centerY + diamondSize / 2, // Bottom point
             centerX - diamondSize / 2, centerY); // Left point
    }
}

function drawPlayers() {
    noStroke();
    textSize(cellSize * 0.6);
    textAlign(CENTER, CENTER);
    for (let id in players) {
        let p = players[id];        
        if (id == humanPlayerId) {
            text("🙂", p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2);
        } else {
            text("🤖", p.x * cellSize + cellSize / 2, p.y * cellSize + cellSize / 2);
        }
    }
}

function displayInfo() {
    let bot = cellSize * boardSize + 1;
    fill(0);
    textSize(12);
    textAlign(LEFT, TOP);
    text(`🙂: ${players[1].score}`, 10, bot + 8);
    text(`🤖: ${players[2].score}`, cellSize * boardSize - 40, bot + 8);
}

function displayGameOver() {
    fill(0, 0, 0, 180); // Semi-transparent black background
    rect(0, height / 2 - 50, width, 100);

    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    let winText = "";
    if (winner === 3) {
        winText = "Hòa!";
    } else if (winner === humanPlayerId) {
        winText = "HUMAN Thắng!";
    } else if (winner === aiPlayerId) {
        winText = "AI Thắng!";
    }
    text(winText, width / 2, height / 2 - 10);
    textSize(16);
    text("Nhấn F5 để chơi lại", width / 2, height / 2 + 20);
}

// --- Xử lý Logic Game ---

function handleHumanInput() {
    let p = players[humanPlayerId];
    let nx = p.x;
    let ny = p.y;

    if (keyCode === UP_ARROW) ny--;
    else if (keyCode === DOWN_ARROW) ny++;
    else if (keyCode === LEFT_ARROW) nx--;
    else if (keyCode === RIGHT_ARROW) nx++;
    else return; // Không phải phím di chuyển

    if (isValidMove(nx, ny)) {
        makeMove(humanPlayerId, nx, ny);
    }
}

function isValidMove(x, y) {
    return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}

function makeMove(playerId, nx, ny) {
    if (gameOver) return;

    let player = players[playerId];
    let opponentId = (playerId === 1) ? 2 : 1;
    let opponent = players[opponentId];

    // 1. Kiểm tra ăn đối phương
    if (nx === opponent.x && ny === opponent.y) {
        player.x = nx;
        player.y = ny;
        gameOver = true;
        winner = playerId;
        updateMessage();
        return;
    }

    // 2. Di chuyển
    player.x = nx;
    player.y = ny;

    // 3. Kiểm tra ăn kim cương
    let foundDiamondIndex = -1;
    for (let i = 0; i < diamonds.length; i++) {
        if (diamonds[i].x === nx && diamonds[i].y === ny) {
            foundDiamondIndex = i;
            break;
        }
    }

    if (foundDiamondIndex !== -1) {
        player.score++;
        diamonds.splice(foundDiamondIndex, 1); // Xóa kim cương
    }

    // 4. Kiểm tra hết kim cương -> Tính điểm thắng
    if (diamonds.length === 0) {
        gameOver = true;
        if (players[1].score > players[2].score) {
            winner = 1;
        } else if (players[2].score > players[1].score) {
            winner = 2;
        } else {
            winner = 3; // Hòa
        }
        updateMessage();
        return;
    }

    // 5. Chuyển lượt
    currentPlayerId = opponentId;
    updateMessage();
}

function updateMessage() {
    if (gameOver) {
         if (winner === 3) message = "Trò chơi kết thúc - Hòa!";
         else message = `Trò chơi kết thúc - Người chơi ${winner} thắng!`;
    } else {
        message = `Lượt của: Player ${currentPlayerId} ${currentPlayerId === aiPlayerId ? 'AI' : 'HUMAN'}`;
    }
}


// --- AI Logic (Minimax) ---

// Hàm này sẽ được gọi khi AI cần thực hiện nước đi 
// chủ yếu là để debugging và theo dõi quá trình AI suy nghĩ
// Có thể bỏ qua nếu không cần thiết
function triggerAIMove() {
    console.log("AI thinking...");
    let bestMove = findBestMove();
    if (bestMove) {
        console.log("AI moves to:", bestMove);
        makeMove(aiPlayerId, bestMove.x, bestMove.y);
    } else {
        console.warn("AI cannot find a valid move!");
        // Xử lý trường hợp AI không có nước đi hợp lệ (ví dụ: bị chặn hoàn toàn)
        // Có thể cho qua lượt hoặc xử lý khác tùy luật chơi mong muốn
        currentPlayerId = humanPlayerId; // Cho người chơi đi lại
    }
    aiThinking = false;
     updateMessage(); // Cập nhật lại thông báo sau khi AI đi
}

function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    let currentState = getCurrentGameState(); // Lấy trạng thái hiện tại
    let possibleMoves = getValidMovesForPlayer(aiPlayerId, currentState);

    console.log(`AI evaluating ${possibleMoves.length} moves...`);

    for (let move of possibleMoves) {
        // Quan trọng: Tạo trạng thái mới từ nước đi thử nghiệm
        let nextState = simulateMove(currentState, aiPlayerId, move.x, move.y);
        // Gọi minimax cho lượt của đối thủ (false = minimizing player)
        let score = minimax(nextState, minimaxDepth -1, -Infinity, Infinity, false); // Bắt đầu độ sâu mới
        console.log(`  Move (${move.x},${move.y}) evaluated score: ${score}`);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        // Có thể thêm random nhỏ để AI không đi giống hệt nhau nếu nhiều nước đi cùng điểm
        else if (score === bestScore && random() > 0.5) {
             bestMove = move;
        }

    }
    console.log(`Best score found: ${bestScore}`);
    return bestMove;
}

// Minimax với Alpha-Beta Pruning
function minimax(state, depth, alpha, beta, isMaximizingPlayer) {
    // Điều kiện dừng: hết độ sâu hoặc game kết thúc trong trạng thái mô phỏng
    if (depth === 0 || state.gameOver) {
        return evaluateStateWithGameOverCheck(state, aiPlayerId); // Đánh giá từ góc nhìn AI
    }

    let playerToMoveId = state.currentPlayer;
    let possibleMoves = getValidMovesForPlayer(playerToMoveId, state);

     // Xử lý nếu không có nước đi nào hợp lệ trong trạng thái mô phỏng
     if (possibleMoves.length === 0) {
         return evaluateStateWithGameOverCheck(state, aiPlayerId);
     }


    if (isMaximizingPlayer) { // Lượt AI trong mô phỏng (muốn tối đa điểm)
        let maxEval = -Infinity;
        for (let move of possibleMoves) {
            let nextState = simulateMove(state, playerToMoveId, move.x, move.y);
            let eval = minimax(nextState, depth - 1, alpha, beta, false); // Lượt đối thủ
            maxEval = max(maxEval, eval);
            alpha = max(alpha, eval); // Cập nhật alpha
            if (beta <= alpha) {
                break; // Cắt tỉa Beta
            }
        }
        return maxEval;
    } else { // Lượt đối thủ trong mô phỏng (muốn tối thiểu điểm của AI)
        let minEval = Infinity;
        for (let move of possibleMoves) {
            let nextState = simulateMove(state, playerToMoveId, move.x, move.y);
            let eval = minimax(nextState, depth - 1, alpha, beta, true); // Lượt AI
            minEval = min(minEval, eval);
            beta = min(beta, eval); // Cập nhật beta
            if (beta <= alpha) {
                break; // Cắt tỉa Alpha
            }
        }
        return minEval;
    }
}

// --- Hàm Heuristic và các hàm hỗ trợ AI ---

// Hàm đánh giá trạng thái cuối cùng hoặc tại giới hạn độ sâu
// perspectivePlayerId: ID của người chơi mà ta đang đánh giá (thường là AI)
// Hàm này sẽ trả về giá trị đánh giá cho trạng thái hiện tại
// Bạn có thể download code về và customize hàm này theo ý muốn
// Để AI hoạt động tốt hơn, bạn có thể sử dụng các thuật toán heuristic khác nhau
function evaluateStateWithGameOverCheck(state, perspectivePlayerId) {
    if (state.gameOver) {
        if (state.winner === perspectivePlayerId) return 10000000; // Thắng tuyệt đối
        if (state.winner === null || state.winner === 3) return 0;   // Hòa
        return -10000000; // Thua tuyệt đối
    }
    // Nếu game chưa kết thúc, dùng hàm heuristic
    return heuristic(state, perspectivePlayerId);
}


// Hàm Heuristic theo yêu cầu
// perspectivePlayerId: ID của người chơi mà ta đang đánh giá (thường là AI)
function heuristic(state, perspectivePlayerId) {
    const aiPlayer = state.players[perspectivePlayerId];
    const opponentId = (perspectivePlayerId === 1) ? 2 : 1;
    const opponent = state.players[opponentId];
    const n = boardSize; // 11

    // Luật 1: Kiểm tra nếu có thể ăn đối phương ngay lập tức (đã được xử lý bởi điểm game over)
    // Luật 2: Kiểm tra nếu đang đứng cạnh đối phương
    let distOpponent = abs(aiPlayer.x - opponent.x) + abs(aiPlayer.y - opponent.y);
    if (distOpponent === 1) {
        return -1000000; // Điểm phạt rất lớn khi đứng cạnh đối thủ (theo yêu cầu)
    }

    // Luật 3: Tính điểm theo công thức s = (2n - d) + cs^2
    let currentScore = aiPlayer.score; // cs là điểm số đạt được của người chơi hiện tại (AI)
    let nearestDiamondDist = Infinity;

    if (state.diamonds.length > 0) {
        let minDist = Infinity;
        for (let diamond of state.diamonds) {
            let d = abs(aiPlayer.x - diamond.x) + abs(aiPlayer.y - diamond.y);
            minDist = min(minDist, d);
        }
         // Nếu đứng ngay trên vị trí kim cương (d=0), coi như khoảng cách là 1 để tránh lỗi tính toán hoặc giá trị quá lớn
        nearestDiamondDist = (minDist === 0) ? 1 : minDist;
    } else {
        // Nếu hết kim cương, thành phần khoảng cách không còn ý nghĩa nhiều.
        // Đặt d = 2n để (2n - d) = 0.
        nearestDiamondDist = 2 * n;
    }

    // Công thức: s = (2n - d) + cs^2
    let heuristicValue = (2 * n - nearestDiamondDist) + (currentScore * currentScore);

    // Cân nhắc thêm: Có thể cộng thêm điểm chênh lệch để AI ưu tiên dẫn điểm
    // heuristicValue += (aiPlayer.score - opponent.score) * weight; // Ví dụ: weight = 10

    return heuristicValue;
}

// Lấy các nước đi hợp lệ cho một người chơi từ một trạng thái nhất định
function getValidMovesForPlayer(playerId, state) {
    let player = state.players[playerId];
    // let opponent = state.players[(playerId === 1) ? 2 : 1]; // Không cần opponent ở đây
    let moves = [];
    let dx = [0, 0, 1, -1]; // Phải, Trái, Xuống, Lên
    let dy = [1, -1, 0, 0]; // Phải, Trái, Xuống, Lên (tương ứng y tăng/giảm)

    for (let i = 0; i < 4; i++) {
        let nx = player.x + dx[i];
        let ny = player.y + dy[i];

        if (isValidMove(nx, ny)) {
             // Không cần kiểm tra va chạm đối thủ ở đây, simulateMove sẽ xử lý
            moves.push({ x: nx, y: ny });
        }
    }
    return moves;
}

// Tạo một bản sao sâu của trạng thái game để mô phỏng
function getCurrentGameState() {
    // JSON parse/stringify là cách đơn giản để deep copy object không chứa function, Date, etc.
    return JSON.parse(JSON.stringify({
        players: players,
        diamonds: diamonds,
        currentPlayer: currentPlayerId,
        gameOver: gameOver,
        winner: winner
    }));
}

// Mô phỏng một nước đi và trả về trạng thái MỚI (không thay đổi trạng thái gốc)
function simulateMove(currentState, playerId, nx, ny) {
    // Tạo bản sao sâu của trạng thái hiện tại
    let newState = JSON.parse(JSON.stringify(currentState));
    let player = newState.players[playerId];
    let opponentId = (playerId === 1) ? 2 : 1;
    let opponent = newState.players[opponentId];

    // 1. Kiểm tra ăn đối phương
    if (nx === opponent.x && ny === opponent.y) {
        player.x = nx;
        player.y = ny;
        newState.gameOver = true;
        newState.winner = playerId;
        // Không cần đổi lượt vì game kết thúc
        return newState;
    }

    // 2. Di chuyển
    player.x = nx;
    player.y = ny;

    // 3. Kiểm tra ăn kim cương
    let foundDiamondIndex = newState.diamonds.findIndex(d => d.x === nx && d.y === ny);
    if (foundDiamondIndex !== -1) {
        player.score++;
        newState.diamonds.splice(foundDiamondIndex, 1); // Xóa kim cương khỏi trạng thái mới
    }

    // 4. Kiểm tra hết kim cương -> Tính điểm thắng
    if (newState.diamonds.length === 0) {
        newState.gameOver = true;
        if (newState.players[1].score > newState.players[2].score) {
            newState.winner = 1;
        } else if (newState.players[2].score > newState.players[1].score) {
            newState.winner = 2;
        } else {
            newState.winner = 3; // Hòa
        }
        // Không cần đổi lượt vì game kết thúc
        return newState;
    }

    // 5. Chuyển lượt cho trạng thái tiếp theo
    newState.currentPlayer = opponentId;

    return newState; // Trả về trạng thái đã được cập nhật sau nước đi
}