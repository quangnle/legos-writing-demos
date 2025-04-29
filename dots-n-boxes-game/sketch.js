// ============================================
// Dots and Boxes Game with Minimax AI (P5.js)
// ============================================

// --- Cài đặt cơ bản ---
let m = 4; // Số hàng chấm (4x4 dots = 3x3 boxes)
let n = 4; // Số cột chấm
let spacing = 80; // Khoảng cách giữa các chấm
let dotSize = 10; // Kích thước chấm
let lineThickness = 4; // Độ dày đường nối
let clickThreshold; // Ngưỡng khoảng cách để nhận diện click gần đường nối

// --- Dữ liệu Trạng thái Game ---
let hLines; // Mảng lưu trạng thái các đường ngang [hàng][cột] (true = đã vẽ)
let vLines; // Mảng lưu trạng thái các đường dọc [hàng][cột] (true = đã vẽ)
let boxes; // Mảng lưu trạng thái các ô vuông [hàng][cột] (0: chưa xong, 1: P1, 2: P2)
let scores = {
    1: 0,
    2: 0
}; // Điểm người chơi 1 và 2
let totalLines; // Tổng số đường có thể vẽ
let drawnLines = 0; // Số đường đã vẽ
let gameOver = false; // Trạng thái kết thúc game

// --- Người chơi & AI ---
let humanPlayer = 1; // ID người chơi
let aiPlayer = 2; // ID máy (AI)
let currentPlayer = 1; // Bắt đầu với người chơi 1
let aiSearchDepth = 2; // Độ sâu tìm kiếm của Minimax (tăng để khó hơn, giảm để nhanh hơn)
let aiThinking = false; // Cờ báo AI đang tính toán

// --- Màu sắc ---
let playerColors = {
    1: '#FF6347', // Tomato Red (Human)
    2: '#4682B4' // Steel Blue (AI)
};
let dotColor = '#333333'; // Dark Gray
let lineColor = '#AAAAAA'; // Light Gray
let boxBackgroundColor = '#F0F0F0'; // Very Light Gray
let thinkingColor = '#DDDDDD'; // Màu nền khi AI đang nghĩ
let highlightColorAlpha = '80'; // Độ trong suốt cho highlight

function setup() {
    let canvasWidth = (n - 1) * spacing + spacing * 2; // Thêm padding 2 bên
    let canvasHeight = (m - 1) * spacing + spacing * 2; // Thêm padding trên dưới
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container'); // Gán canvas vào div chứa game

    clickThreshold = spacing / 4; // Ngưỡng click hợp lý
    initializeGameData(); // Reset trạng thái game

    totalLines = m * (n - 1) + (m - 1) * n; // Tổng số đường có thể vẽ
    drawnLines = 0;
    gameOver = false;
    currentPlayer = humanPlayer; // Người chơi bắt đầu
    scores = {
        1: 0,
        2: 0
    };
    aiThinking = false;

    textAlign(CENTER, CENTER);
    textSize(12);
    console.log(`Game Start! Human (P${humanPlayer}) vs AI (P${aiPlayer}). Search Depth: ${aiSearchDepth}`);
}

function draw() {
    // Vẽ nền, chuyển màu nếu AI đang nghĩ
    background(aiThinking ? thinkingColor : 250);
    // Dịch chuyển gốc tọa độ để có padding và dễ vẽ
    translate(spacing, spacing);

    // Vẽ các thành phần game
    drawBoxes();
    drawLines();
    drawDots();
    drawScores();
    drawCurrentPlayerTurn();

    // Chỉ highlight đường tiềm năng khi đến lượt người và game chưa kết thúc
    if (!gameOver && currentPlayer === humanPlayer && !aiThinking) {
        highlightPotentialLine();
    }

    // === AI Logic Trigger ===
    // Nếu đến lượt AI và AI chưa tính toán thì bắt đầu
    if (!gameOver && currentPlayer === aiPlayer && !aiThinking) {
        aiThinking = true;
        // Dùng setTimeout để canvas kịp vẽ lại trước khi AI bắt đầu tính toán nặng
        // Giúp hiển thị chữ "Máy đang suy nghĩ..."
        setTimeout(aiMakeMove, 50); // Delay nhỏ
    }

    // === Game Over Display ===
    if (gameOver) {
        drawGameOver();
        // Không dùng noLoop() vì cần giữ tương tác click để chơi lại
    }
}

// ============================================
// Drawing Helper Functions
// ============================================

function drawDots() {
    fill(dotColor);
    noStroke();
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            ellipse(c * spacing, r * spacing, dotSize, dotSize);
        }
    }
}

function drawLines() {
    strokeWeight(lineThickness);
    stroke(lineColor);
    // Vẽ đường ngang đã có
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n - 1; c++) {
            if (hLines[r][c]) {
                line(c * spacing, r * spacing, (c + 1) * spacing, r * spacing);
            }
        }
    }
    // Vẽ đường dọc đã có
    for (let r = 0; r < m - 1; r++) {
        for (let c = 0; c < n; c++) {
            if (vLines[r][c]) {
                line(c * spacing, r * spacing, c * spacing, (r + 1) * spacing);
            }
        }
    }
}

function drawBoxes() {
    noStroke();
    for (let r = 0; r < m - 1; r++) {
        for (let c = 0; c < n - 1; c++) {
            if (boxes[r][c] !== 0) {
                // Tô màu ô vuông theo người chơi đã hoàn thành, thêm độ trong suốt
                fill(color(playerColors[boxes[r][c]] + '99')); // '99' là mã hex cho alpha ~60%
                rect(c * spacing + lineThickness / 2,
                    r * spacing + lineThickness / 2,
                    spacing - lineThickness,
                    spacing - lineThickness);
            } else {
                // Vẽ nền nhạt cho ô chưa hoàn thành
                fill(boxBackgroundColor);
                rect(c * spacing + lineThickness / 2,
                    r * spacing + lineThickness / 2,
                    spacing - lineThickness,
                    spacing - lineThickness);
            }
        }
    }
}

function drawScores() {
    textSize(12);
    // Hiển thị điểm người chơi 1 (Human)
    fill(playerColors[humanPlayer]);
    text(`HUMAN: ${scores[humanPlayer]}`, -spacing * 0.2, -spacing / 2);
    // Hiển thị điểm người chơi 2 (AI)
    fill(playerColors[aiPlayer]);
    text(`COMPUTER: ${scores[aiPlayer]}`, (n - 1) * spacing + spacing * 0.2, -spacing / 2);
}

function drawCurrentPlayerTurn() {
    textSize(12);
    // Hiển thị lượt chơi hiện tại
    let turnText = `Current turn: ${currentPlayer === humanPlayer ? 'HUMAN' : 'COMPUTER'}`;
    fill(playerColors[currentPlayer]);
    text(turnText, (n - 1) * spacing / 2, -spacing / 2);
    // Hiển thị thông báo nếu AI đang suy nghĩ
    if (aiThinking) {
        fill(0); // Màu đen
        text("Computer is thinking...", (n - 1) * spacing / 2, (m - 1) * spacing + spacing * 0.8);
    }
}

function highlightPotentialLine() {
    // Không highlight nếu game kết thúc hoặc AI đang nghĩ
    if (gameOver || aiThinking) return;

    let mx = mouseX - spacing; // Tọa độ chuột tương đối với gốc vẽ (đã translate)
    let my = mouseY - spacing;

    let closestDist = Infinity;
    let closestLine = null; // Lưu thông tin đường gần nhất {r, c, type}

    // Tìm đường ngang gần nhất chưa vẽ
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n - 1; c++) {
            if (!hLines[r][c]) { // Chỉ xét đường chưa vẽ
                let x1 = c * spacing;
                let y1 = r * spacing;
                let x2 = (c + 1) * spacing;
                // Điểm giữa đường kẻ
                let midX = (x1 + x2) / 2;
                let midY = y1;
                let d = dist(mx, my, midX, midY);

                // Kiểm tra khoảng cách và chuột có nằm trong vùng ảnh hưởng của đường kẻ không
                if (d < clickThreshold && d < closestDist && abs(my - midY) < clickThreshold && mx > x1 - clickThreshold && mx < x2 + clickThreshold) {
                    closestDist = d;
                    closestLine = {
                        r: r,
                        c: c,
                        type: 'h'
                    };
                }
            }
        }
    }

    // Tìm đường dọc gần nhất chưa vẽ
    for (let r = 0; r < m - 1; r++) {
        for (let c = 0; c < n; c++) {
            if (!vLines[r][c]) { // Chỉ xét đường chưa vẽ
                let x1 = c * spacing;
                let y1 = r * spacing;
                let y2 = (r + 1) * spacing;
                // Điểm giữa đường kẻ
                let midX = x1;
                let midY = (y1 + y2) / 2;
                let d = dist(mx, my, midX, midY);

                // Kiểm tra khoảng cách và vùng ảnh hưởng
                if (d < clickThreshold && d < closestDist && abs(mx - midX) < clickThreshold && my > y1 - clickThreshold && my < y2 + clickThreshold) {
                    closestDist = d;
                    closestLine = {
                        r: r,
                        c: c,
                        type: 'v'
                    };
                }
            }
        }
    }

    // Nếu tìm thấy đường hợp lệ gần chuột, vẽ highlight
    if (closestLine) {
        strokeWeight(lineThickness + 2); // Dày hơn một chút
        // Màu của người chơi hiện tại với độ trong suốt
        stroke(color(playerColors[currentPlayer] + highlightColorAlpha));

        if (closestLine.type === 'h') {
            line(closestLine.c * spacing, closestLine.r * spacing, (closestLine.c + 1) * spacing, closestLine.r * spacing);
        } else { // type === 'v'
            line(closestLine.c * spacing, closestLine.r * spacing, closestLine.c * spacing, (closestLine.r + 1) * spacing);
        }
    }
}

function drawGameOver() {
    // Vẽ lớp phủ mờ lên trên để làm nổi bật text
    fill(255, 255, 255, 200); // Màu trắng hơi trong suốt
    rect(-spacing, -spacing, width, height); // Vẽ lên toàn bộ canvas

    // Xác định người thắng và chọn màu chữ
    let winnerText;
    fill(0); // Màu chữ mặc định
    if (scores[humanPlayer] > scores[aiPlayer]) {
        winnerText = "Chúc mừng, bạn đã thắng!";
        fill(playerColors[humanPlayer]);
    } else if (scores[aiPlayer] > scores[humanPlayer]) {
        winnerText = "Máy thắng!";
        fill(playerColors[aiPlayer]);
    } else {
        winnerText = "Hòa!";
    }

    // Hiển thị kết quả
    textSize(32);
    text(winnerText, (n - 1) * spacing / 2, (m - 1) * spacing / 2 - 20);
    textSize(16);
    fill(0); // Reset màu chữ
    text("Click để chơi lại", (n - 1) * spacing / 2, (m - 1) * spacing / 2 + 20);
    // Logic chơi lại được xử lý trong mousePressed()
}