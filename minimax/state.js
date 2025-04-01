class State {
    constructor(board, players) {
        this.board = board; // Bàn cờ
        this.players = players; // Danh sách người chơi, mỗi người chơi là một đối tượng có thuộc tính x, y
        this.currentPlayerIndex = 0; // Chỉ số của người chơi hiện tại
        this.winner = null; // Người chơi thắng cuộc
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
        
        // Tìm viên kim cương gần nhất với người chơi hiện tại
        let closestDistance = Infinity;
        for (let diamond of this.board.diamonds) {
            let distance = Math.abs(currentPlayer.x - diamond.x) + Math.abs(currentPlayer.y - diamond.y);
            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }

        // Công thức tính điểm số là
        // (kích thước bàn cờ * 2 - khoảng cách gần nhất giữa người chơi và viên kim cương)**2 + điểm số của người chơi hiện tại * 100
        return (this.board.size * 2 - closestDistance) + currentPlayer.score * 100;
    }

    generateNextStates() {
        // tìm tất cả các nước đi có thể của người chơi ở bước tiếp theo
        let nextStates = [];        
        // đổi lượt người chơi
        let nextPlayerIndex = 1 - this.currentPlayerIndex;
        // các phương hướng di chuyển
        let directions = [
            { dx: -1, dy: 0 }, // trái
            { dx: 1, dy: 0 }, // phải
            { dx: 0, dy: -1 }, // lên
            { dx: 0, dy: 1 } // xuống
        ];
        // lặp qua tất cả các phương hướng di chuyển
        for (let dir of directions) {
            // tạo bản sao của trạng thái hiện tại
            let newState = this.clone();
            // di chuyển người chơi hiện tại theo phương hướng di chuyển
            newState.players[nextPlayerIndex].x += dir.dx;
            newState.players[nextPlayerIndex].y += dir.dy;
            // kiểm tra xem người chơi có đi ra ngoài bàn cờ không
            if (newState.players[nextPlayerIndex].x < 0 || newState.players[nextPlayerIndex].x >= this.board.size ||
                newState.players[nextPlayerIndex].y < 0 || newState.players[nextPlayerIndex].y >= this.board.size) {
                continue; // nếu đi ra ngoài bàn cờ thì bỏ qua nước đi này
            }
            // kiểm tra xem người chơi có ăn được viên kim cương không
            for (let i = newState.board.diamonds.length - 1; i >= 0; i--) {
                let diamond = newState.board.diamonds[i];
                if (diamond.x === newState.players[nextPlayerIndex].x && diamond.y === newState.players[nextPlayerIndex].y) {
                    // nếu ăn được viên kim cương thì tăng điểm số của người chơi
                    newState.players[nextPlayerIndex].score++;
                    // xóa viên kim cương khỏi bàn cờ
                    newState.board.diamonds.splice(i, 1);
                }
            }

            newState.currentPlayerIndex = nextPlayerIndex; // cập nhật chỉ số người chơi hiện tại
            // thêm trạng thái mới vào danh sách các trạng thái tiếp theo
            nextStates.push(newState);
        }

        return nextStates; // trả về danh sách các trạng thái tiếp theo
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

    clone() {
        // Tạo bản sao của trạng thái hiện tại
        let newBoard = this.board.clone();
        let newPlayers = this.players.map(p => ({ x: p.x, y: p.y, score: p.score }));
        return new State(newBoard, newPlayers);
    }
    
}