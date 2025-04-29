// --- Hàm tiện ích cho AI ---

// Tạo bản sao sâu của trạng thái game (quan trọng cho mô phỏng)
function copyState(stateData) {
    // JSON parse/stringify là cách đơn giản và hiệu quả cho cấu trúc này
    return JSON.parse(JSON.stringify(stateData));
}

// Lấy danh sách các nước đi có thể (các đường chưa vẽ) từ một trạng thái
function getPossibleMoves(state) {
    let moves = [];
    // Ngang
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n - 1; c++) {
            if (!state.hLines[r][c]) {
                moves.push({ r: r, c: c, type: 'h' });
            }
        }
    }
    // Dọc
    for (let r = 0; r < m - 1; r++) {
        for (let c = 0; c < n; c++) {
            if (!state.vLines[r][c]) {
                moves.push({ r: r, c: c, type: 'v' });
            }
        }
    }
    return moves;
}

// Kiểm tra game kết thúc trong trạng thái mô phỏng
function isGameOverState(state) {
    // Tổng số đường trong trạng thái mô phỏng có bằng tổng số đường tối đa không
    return state.drawnLines === state.totalLines;
}

// --- Hàm Tính toán Tiềm năng Điểm trong Lượt (Heuristic phụ) ---
// Tính toán đệ quy số điểm tối đa một người chơi có thể ghi được
// bắt đầu từ 'state' và tiếp tục đi nếu ăn được ô.
function calculateMaxGainForTurn(state, player) {
    let maxGainFound = 0;
    let possibleMoves = getPossibleMoves(state); // Các nước đi từ trạng thái hiện tại

    for (let move of possibleMoves) {
        let currentPathGain = 0;
        // *** Mô phỏng nước đi trên bản sao ***
        let simResult = applyMove(state, move, player); // applyMove trả về { newState, boxesCompleted, nextTurnPlayer }

        if (simResult && simResult.boxesCompleted > 0) {
            // Nếu ăn ô: cộng điểm và gọi đệ quy trên trạng thái mới (newState) cho cùng người chơi
            currentPathGain = simResult.boxesCompleted + calculateMaxGainForTurn(simResult.newState, player);
        } else {
            // Nếu không ăn ô, chuỗi kết thúc, không cộng thêm điểm từ nước này
            currentPathGain = 0;
        }
        // Lưu lại số điểm lớn nhất tìm được từ mọi chuỗi có thể
        maxGainFound = max(maxGainFound, currentPathGain);
    }
    return maxGainFound;
}


// --- Hàm Đánh giá Trạng thái (Heuristic chính cho Minimax) ---
// Được sử dụng khi đạt độ sâu tối đa hoặc game kết thúc trong mô phỏng.
// Kết hợp điểm số hiện tại và tiềm năng ăn điểm tức thời.
function evaluateState(state) {
    // 1. Điểm số hiện tại (góc nhìn của AI)
    let currentScoreDiff = state.scores[aiPlayer] - state.scores[humanPlayer];

    // Nếu game thực sự kết thúc trong trạng thái này, trả về hiệu điểm cuối cùng
    if (isGameOverState(state)) {
        // Nhân với một số lớn để ưu tiên trạng thái kết thúc game
        // (Thắng > Hòa > Thua)
        if (currentScoreDiff > 0) return 1000 + currentScoreDiff; // AI thắng
        if (currentScoreDiff < 0) return -1000 + currentScoreDiff; // AI thua
        return 0; // Hòa
    }

    // 2. Nếu chưa kết thúc (chỉ hết độ sâu tìm kiếm), tính heuristic
    let aiPotentialGain = calculateMaxGainForTurn(state, aiPlayer);
    let humanPotentialGain = calculateMaxGainForTurn(state, humanPlayer);

    // Kết hợp: Điểm hiện tại + Lợi thế tiềm năng của AI - Nguy cơ tiềm năng từ Người
    // Có thể điều chỉnh trọng số nếu muốn
    let heuristicValue = currentScoreDiff * 10 + aiPotentialGain - humanPotentialGain;
    return heuristicValue;
}


// --- Mô phỏng Nước đi (Không thay đổi trạng thái gốc) ---
// Áp dụng 'move' cho 'player' trên bản sao của 'originalState'.
// Trả về object: { newState, boxesCompleted, nextTurnPlayer } hoặc null nếu lỗi.
function applyMove(originalState, move, player) {
    let state = copyState(originalState); // Luôn làm việc trên bản sao
    let boxesCompleted = 0;

    // Vẽ đường trong state bản sao, kiểm tra hợp lệ
    if (move.type === 'h') {
        if (!state.hLines[move.r][move.c]) {
             state.hLines[move.r][move.c] = true;
        } else { console.error("Sim Error: Apply move on existing H line", move); return null; }
    } else { // type === 'v'
        if (!state.vLines[move.r][move.c]) {
            state.vLines[move.r][move.c] = true;
        } else { console.error("Sim Error: Apply move on existing V line", move); return null; }
    }
    state.drawnLines++; // Cập nhật số đường đã vẽ trong bản sao

    // --- Kiểm tra ô vuông mới trong state bản sao ---
    let completedCount = 0;
    let r = move.r;
    let c = move.c;
    if (move.type === 'h') { // Đường ngang hLines[r][c]
        if (r > 0 && state.boxes[r - 1][c] === 0) { // Check ô trên
            if (state.hLines[r - 1]?.[c] && state.vLines[r - 1]?.[c] && state.vLines[r-1]?.[c+1]) {
               state.boxes[r - 1][c] = player; completedCount++;
            }
        }
        if (r < m - 1 && state.boxes[r][c] === 0) { // Check ô dưới
             if (state.hLines[r + 1]?.[c] && state.vLines[r]?.[c] && state.vLines[r]?.[c+1]) {
               state.boxes[r][c] = player; completedCount++;
            }
        }
    } else { // type === 'v' // Đường dọc vLines[r][c]
        if (c > 0 && state.boxes[r][c - 1] === 0) { // Check ô trái
           if (state.vLines[r]?.[c-1] && state.hLines[r]?.[c-1] && state.hLines[r+1]?.[c-1]) {
               state.boxes[r][c - 1] = player; completedCount++;
           }
        }
       if (c < n - 1 && state.boxes[r][c] === 0) { // Check ô phải
           if (state.vLines[r]?.[c+1] && state.hLines[r]?.[c] && state.hLines[r+1]?.[c]) {
               state.boxes[r][c] = player; completedCount++;
           }
       }
    }
    // --- Kết thúc kiểm tra ô vuông ---

    boxesCompleted = completedCount;
    if (boxesCompleted > 0) {
        state.scores[player] += boxesCompleted; // Cập nhật điểm trong bản sao
    }

    // Xác định lượt chơi tiếp theo cho trạng thái mô phỏng
    let nextTurnPlayer;
    if (boxesCompleted > 0) {
        nextTurnPlayer = player; // Được đi tiếp
    } else {
        nextTurnPlayer = (player === humanPlayer) ? aiPlayer : humanPlayer; // Đổi lượt
    }

    // Trả về trạng thái mới và thông tin lượt đi
    return { newState: state, boxesCompleted: boxesCompleted, nextTurnPlayer: nextTurnPlayer };
}

// --- Hàm Minimax với Cắt tỉa Alpha-Beta ---
function minimax(state, depth, alpha, beta, maximizingPlayer, turnPlayer) {

    // --- Điều kiện dừng đệ quy ---
    if (depth === 0 || isGameOverState(state)) {
        // Trả về giá trị heuristic của trạng thái lá
        return evaluateState(state);
    }
    // --- Kết thúc điều kiện dừng ---

    let possibleMoves = getPossibleMoves(state);

    if (maximizingPlayer) { // Lượt của AI (Max) trong cây tìm kiếm
        let maxEval = -Infinity;
        for (let move of possibleMoves) {
            // Mô phỏng nước đi cho người chơi có lượt ('turnPlayer') trong state này
            let simResult = applyMove(state, move, turnPlayer);
            if (!simResult) continue; // Bỏ qua nếu mô phỏng lỗi

            let nextState = simResult.newState;
            let nextTurn = simResult.nextTurnPlayer; // Ai sẽ đi ở nút con?
            // Nút con là Max hay Min phụ thuộc vào lượt đi *tiếp theo* (nextTurn)
            let nextIsMaximizing = (nextTurn === aiPlayer);

            // Gọi đệ quy cho nút con
            let evalScore = minimax(nextState, depth - 1, alpha, beta, nextIsMaximizing, nextTurn);
            maxEval = max(maxEval, evalScore); // Cập nhật điểm tốt nhất cho Max
            alpha = max(alpha, evalScore);     // Cập nhật alpha
            if (beta <= alpha) {
                break; // Cắt tỉa Beta (Min sẽ không chọn nhánh này)
            }
        }
        return maxEval;
    } else { // Lượt của Người (Min) trong cây tìm kiếm
        let minEval = Infinity;
        for (let move of possibleMoves) {
            // Mô phỏng nước đi cho người chơi có lượt ('turnPlayer')
           let simResult = applyMove(state, move, turnPlayer);
            if (!simResult) continue;

            let nextState = simResult.newState;
            let nextTurn = simResult.nextTurnPlayer;
            let nextIsMaximizing = (nextTurn === aiPlayer);

            // Gọi đệ quy cho nút con
            let evalScore = minimax(nextState, depth - 1, alpha, beta, nextIsMaximizing, nextTurn);
            minEval = min(minEval, evalScore); // Cập nhật điểm tốt nhất cho Min
            beta = min(beta, evalScore);      // Cập nhật beta
            if (beta <= alpha) {
                break; // Cắt tỉa Alpha (Max sẽ không chọn nhánh này)
            }
        }
        return minEval;
    }
}


// --- Hàm Chính điều khiển AI ---
// Tìm và thực hiện nước đi tốt nhất cho AI
function aiMakeMove() {
    console.log("AI thinking...");
    let bestScore = -Infinity; // AI muốn điểm cao nhất
    let bestMove = null;       // Lưu nước đi tốt nhất {r, c, type}
    let currentAlpha = -Infinity; // Alpha ban đầu
    let currentBeta = Infinity;  // Beta ban đầu

    // Chuẩn bị dữ liệu trạng thái hiện tại cho mô phỏng
    let currentStateData = {
        hLines: hLines,
        vLines: vLines,
        boxes: boxes,
        scores: scores,
        drawnLines: drawnLines,
        totalLines: totalLines,
    };
    // Tạo bản sao sâu ngay từ đầu để đảm bảo an toàn
    let initialSimState = copyState(currentStateData);

    let possibleMoves = getPossibleMoves(initialSimState); // Lấy các nước đi từ trạng thái thật
    shuffle(possibleMoves, true); // Xáo trộn để tránh AI đi giống hệt nhau nếu nhiều nước bằng điểm

    // Duyệt qua tất cả các nước đi có thể ở cấp độ gốc
    for (let move of possibleMoves) {
        // Mô phỏng nước đi đầu tiên của AI trên bản sao
        let simResult = applyMove(initialSimState, move, aiPlayer);
        if (!simResult) {
             console.warn("AI Skipping invalid simulation for move:", move);
             continue; // Bỏ qua nếu mô phỏng lỗi
        }

        let nextState = simResult.newState; // Trạng thái sau nước đi mô phỏng
        let nextTurn = simResult.nextTurnPlayer; // Ai đi tiếp trong mô phỏng?
        // Lượt tiếp theo trong cây là Max hay Min?
        let nextIsMaximizing = (nextTurn === aiPlayer);

        // Gọi minimax cho trạng thái sau nước đi đầu tiên này
        // Độ sâu giảm 1 vì đã đi 1 nước ở cấp độ gốc
        let score = minimax(nextState, aiSearchDepth - 1, currentAlpha, currentBeta, nextIsMaximizing, nextTurn);

        // console.log("Move:", move, "Evaluated Score:", score); // Debug

        // Cập nhật nước đi tốt nhất nếu tìm thấy điểm cao hơn
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
        // Cập nhật alpha ở cấp độ gốc (không cần cắt tỉa ở đây, chỉ trong minimax)
        currentAlpha = max(currentAlpha, score);
    }

    // --- Thực hiện nước đi tốt nhất đã tìm được trên bàn cờ THẬT ---
    if (bestMove) {
         console.log(`AI chose move: ${bestMove.type}[${bestMove.r}][${bestMove.c}] with heuristic score: ${bestScore}`);
         let boxesCompleted = 0;

         // Vẽ đường đã chọn lên bàn cờ thật, kiểm tra lại tính hợp lệ lần cuối
         if (bestMove.type === 'h') {
             if (!hLines[bestMove.r][bestMove.c]) {
                 hLines[bestMove.r][bestMove.c] = true;
             } else { console.error("FATAL AI Error: Chose existing H line!", bestMove); bestMove = null; }
         } else { // type 'v'
              if (!vLines[bestMove.r][bestMove.c]) {
                  vLines[bestMove.r][bestMove.c] = true;
              } else { console.error("FATAL AI Error: Chose existing V line!", bestMove); bestMove = null; }
         }

         // Chỉ xử lý tiếp nếu nước đi AI chọn là hợp lệ
         if (bestMove) {
             drawnLines++; // Tăng số đường đã vẽ
             // Kiểm tra và cập nhật ô vuông, điểm số trên bàn cờ thật
             boxesCompleted = checkAndUpdateBoxes(bestMove.r, bestMove.c, bestMove.type, aiPlayer);
             console.log(`AI move completed ${boxesCompleted} boxes.`);

             if (boxesCompleted > 0) {
                 scores[aiPlayer] += boxesCompleted; // Cộng điểm cho AI
                 currentPlayer = aiPlayer; // AI được đi tiếp
                 console.log("AI scores! Gets another turn.");
             } else {
                 currentPlayer = humanPlayer; // Chuyển lượt cho người
                 console.log(`Turn switched to Human (Player ${humanPlayer})`);
             }

             // Kiểm tra game kết thúc sau nước đi của AI
             if (drawnLines === totalLines) {
                  console.log("All lines drawn after AI move. Game Over!");
                 gameOver = true;
             }
         } else {
              // Nếu nước đi AI chọn bị lỗi (đã tồn tại), chuyển lượt cho người
              console.warn("AI failed to make a valid move (line existed?), switching to human.");
              currentPlayer = humanPlayer;
         }

    } else {
        // Trường hợp cực hiếm: AI không tìm thấy nước đi nào (có thể do lỗi logic)
        console.error("AI could not find any valid move! Switching to human.");
        currentPlayer = humanPlayer;
    }

    aiThinking = false; // AI đã tính xong, cho phép người chơi tương tác lại
    console.log("AI finished thinking.");
}