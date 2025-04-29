function initializeGameData() {
    // Tạo mảng 2 chiều chứa trạng thái đường ngang (false = chưa vẽ)
    hLines = Array(m).fill(null).map(() => Array(n - 1).fill(false));
    // Tạo mảng 2 chiều chứa trạng thái đường dọc
    vLines = Array(m - 1).fill(null).map(() => Array(n).fill(false));
    // Tạo mảng 2 chiều chứa trạng thái ô vuông (0 = trống, 1 = P1, 2 = P2)
    boxes = Array(m - 1).fill(null).map(() => Array(n - 1).fill(0));
    console.log("Game data initialized.");
}

function mousePressed() {
    // 1. Xử lý click để chơi lại khi game đã kết thúc
    if (gameOver) {
        console.log("Restarting game by click.");
        setup(); // Gọi lại setup để reset mọi thứ
        return; // Dừng, không xử lý click cho lượt chơi nữa
    }
  
    // 2. Không cho phép click khi đến lượt AI hoặc AI đang nghĩ
    if (currentPlayer === aiPlayer || aiThinking) {
      console.log("Ignoring click: Not human turn or AI is thinking.");
      return;
    }
  
    // 3. Tìm đường kẻ người chơi muốn vẽ
    let mx = mouseX - spacing; // Tọa độ chuột tương đối
    let my = mouseY - spacing;
    let bestDist = Infinity;
    let lineToDraw = null; // Lưu đường được chọn {r, c, type}
  
    // Tìm đường ngang gần nhất (logic tương tự highlight)
    for (let r = 0; r < m; r++) { for (let c = 0; c < n - 1; c++) { if (!hLines[r][c]) { let x1 = c * spacing; let y1 = r * spacing; let x2 = (c + 1) * spacing; let midX = (x1 + x2) / 2; let midY = y1; let d = dist(mx, my, midX, midY); if (d < clickThreshold && d < bestDist && abs(my - midY) < clickThreshold && mx > x1 - clickThreshold && mx < x2 + clickThreshold) { bestDist = d; lineToDraw = { r: r, c: c, type: 'h' }; } } } }
    // Tìm đường dọc gần nhất
    for (let r = 0; r < m - 1; r++) { for (let c = 0; c < n; c++) { if (!vLines[r][c]) { let x1 = c * spacing; let y1 = r * spacing; let y2 = (r + 1) * spacing; let midX = x1; let midY = (y1 + y2) / 2; let d = dist(mx, my, midX, midY); if (d < clickThreshold && d < bestDist && abs(mx - midX) < clickThreshold && my > y1 - clickThreshold && my < y2 + clickThreshold) { bestDist = d; lineToDraw = { r: r, c: c, type: 'v' }; } } } }
  
  
    // 4. Nếu tìm thấy đường hợp lệ để vẽ
    if (lineToDraw) {
      console.log(`Human clicked near line: ${lineToDraw.type}[${lineToDraw.r}][${lineToDraw.c}]`);
      let boxesCompleted = 0;
      let alreadyDrawn = false;
  
      // Thực hiện vẽ đường trên trạng thái game thật
      if (lineToDraw.type === 'h') {
        if (!hLines[lineToDraw.r][lineToDraw.c]) {
           hLines[lineToDraw.r][lineToDraw.c] = true; // Đánh dấu đã vẽ
        } else { alreadyDrawn = true; } // Đường này đã được vẽ rồi
      } else { // type === 'v'
         if (!vLines[lineToDraw.r][lineToDraw.c]) {
            vLines[lineToDraw.r][lineToDraw.c] = true; // Đánh dấu đã vẽ
         } else { alreadyDrawn = true; }
      }
  
      // 5. Chỉ xử lý tiếp nếu đó là nước đi mới
      if (!alreadyDrawn) {
          // Kiểm tra và cập nhật ô vuông hoàn thành, cập nhật điểm
          boxesCompleted = checkAndUpdateBoxes(lineToDraw.r, lineToDraw.c, lineToDraw.type, currentPlayer);
          drawnLines++; // Tăng số đường đã vẽ
          console.log(`Line drawn. Boxes completed this move: ${boxesCompleted}`);
  
          if (boxesCompleted > 0) {
            scores[currentPlayer] += boxesCompleted; // Cộng điểm
            // Người chơi được đi tiếp, không đổi lượt
            console.log(`Player ${currentPlayer} scores! Gets another turn.`);
            // currentPlayer giữ nguyên
          } else {
            // Không hoàn thành ô nào, đổi lượt sang AI
            currentPlayer = aiPlayer;
            console.log(`Turn switched to AI (Player ${aiPlayer})`);
          }
  
          // 6. Kiểm tra game kết thúc
          if (drawnLines === totalLines) {
            console.log("All lines drawn. Game Over!");
            gameOver = true;
          }
      } else {
          console.log("Clicked on an existing line.");
      }
    } else {
        console.log("Click was not near any valid line.");
    }
  }
  
  // --- Hàm kiểm tra và *CẬP NHẬT* ô vuông cho trạng thái game THẬT ---
  // Được gọi sau khi người hoặc AI đã vẽ 1 đường hợp lệ.
  // Trả về số ô vuông vừa được hoàn thành bởi nước đi này.
  function checkAndUpdateBoxes(r, c, type, player) {
    let completedCount = 0;
  
    // Logic kiểm tra 4 cạnh của các ô liền kề với đường vừa vẽ (type[r][c])
    if (type === 'h') { // Đường ngang vừa vẽ là hLines[r][c]
        // Kiểm tra ô phía trên (nếu có và chưa hoàn thành)
        if (r > 0 && boxes[r - 1][c] === 0) {
            // Cần hLines[r-1][c], vLines[r-1][c], vLines[r-1][c+1] và đường vừa vẽ hLines[r][c]
            if (hLines[r - 1]?.[c] && vLines[r - 1]?.[c] && vLines[r-1]?.[c+1]) { // Dùng optional chaining ?. cho an toàn
               boxes[r - 1][c] = player; // Đánh dấu ô thuộc về người chơi
               completedCount++;
            }
        }
        // Kiểm tra ô phía dưới (nếu có và chưa hoàn thành)
        if (r < m - 1 && boxes[r][c] === 0) {
            // Cần hLines[r+1][c], vLines[r][c], vLines[r][c+1] và đường vừa vẽ hLines[r][c]
             if (hLines[r + 1]?.[c] && vLines[r]?.[c] && vLines[r]?.[c+1]) {
               boxes[r][c] = player;
               completedCount++;
            }
        }
    } else { // type === 'v' // Đường dọc vừa vẽ là vLines[r][c]
        // Kiểm tra ô bên trái (nếu có và chưa hoàn thành)
        if (c > 0 && boxes[r][c - 1] === 0) {
           // Cần vLines[r][c-1], hLines[r][c-1], hLines[r+1][c-1] và đường vừa vẽ vLines[r][c]
           if (vLines[r]?.[c-1] && hLines[r]?.[c-1] && hLines[r+1]?.[c-1]) {
               boxes[r][c - 1] = player;
               completedCount++;
           }
        }
       // Kiểm tra ô bên phải (nếu có và chưa hoàn thành)
       if (c < n - 1 && boxes[r][c] === 0) {
           // Cần vLines[r][c+1], hLines[r][c], hLines[r+1][c] và đường vừa vẽ vLines[r][c]
            if (vLines[r]?.[c+1] && hLines[r]?.[c] && hLines[r+1]?.[c]) {
               boxes[r][c] = player;
               completedCount++;
           }
       }
    }
    return completedCount;
  }
  