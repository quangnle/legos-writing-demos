class State {
    constructor(board, players) {
        this.board = board; // Bàn cờ
        this.players = players; // Danh sách người chơi, mỗi người chơi là một đối tượng có thuộc tính x, y
        this.currentPlayerIndex = 0; // Chỉ số của người chơi hiện tại
    }    

    evaluate() {
        let currentPlayer = this.players[this.currentPlayerIndex];
        let opponentPlayer = this.players[1 - this.currentPlayerIndex];

        // Nếu người chơi hiện tại di chuyển vào ô người chơi khác thì người chơi này sẽ thắng ngay lập tức
        // đánh giá điểm số là 1000000
        if (currentPlayer.x === opponentPlayer.x && currentPlayer.y === opponentPlayer.y) {
            return 1000000;
        }

        // Nếu người chơi hiện tại di chuyển vào ô cách ô người chơi khác 1 ô thì người chơi này sẽ bất lợi
        // đánh giá điểm số là -1000000
        if (Math.abs(currentPlayer.x - opponentPlayer.x) <= 1 && Math.abs(currentPlayer.y - opponentPlayer.y) <= 1) {
            return -1000000;
        }

        // Điểm số sẽ được tính dựa trên khoảng cách từ người chơi hiện tại đến viên kim cương gần nhất
        // khoảng cách này là khoảng cách Manhattan và điểm sẽ tính theo công thức (100 - distance)^2        
        
        // Tìm viên kim cương gần nhất với người chơi hiện tại
        let closestDistance = Infinity;
        for (let diamond of this.board.diamonds) {
            let distance = Math.abs(currentPlayer.x - diamond.x) + Math.abs(currentPlayer.y - diamond.y);
            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        // Trả về điểm số
        return (100 - closestDistance)**2;
    }

    generateNextStates() {
        // tìm tất cả các nước đi có thể của người chơi hiện tại
        let nextStates = [];
        let currentPlayer = this.players[this.currentPlayerIndex];
        let directions = [
            { dx: 0, dy: -1 }, // Lên
            { dx: 0, dy: 1 }, // Xuống
            { dx: -1, dy: 0 }, // Trái
            { dx: 1, dy: 0 } // Phải
        ];

        for (let dir of directions) {
            let newX = currentPlayer.x + dir.dx;
            let newY = currentPlayer.y + dir.dy;

            // Kiểm tra xem nước đi có hợp lệ không
            if (newX >= 0 && newX < this.board.size && newY >= 0 && newY < this.board.size) {
                // Tạo bản sao của bàn cờ và người chơi
                let newBoard = this.board.clone();
                let newPlayers = this.players.map(p => ({ x: p.x, y: p.y, score: p.score }));

                // Di chuyển người chơi hiện tại đến vị trí mới
                newPlayers[this.currentPlayerIndex].x = newX;
                newPlayers[this.currentPlayerIndex].y = newY;

                // Tạo trạng thái mới
                let nextState = new State(newBoard, newPlayers);

                // lưu trạng thái mới vào danh sách
                nextStates.push(nextState);
            }
        }

        return nextStates;
    }

    // Hàm kiểm tra xem trạng thái hiện tại có phải là trạng thái kết thúc không
    isGameOver() {
        // Nếu không còn viên kim cương nào thì kết thúc trò chơi
        if (this.board.diamonds.length === 0) {
            return true;
        }

        // Nếu  hai người chơi ở cùng một ô thì kết thúc trò chơi
        // điều đó nghĩa là có một người đã thua
        if (this.players[0].x === this.players[1].x && this.players[0].y === this.players[1].y) {
            return true;
        }
    }
    
}