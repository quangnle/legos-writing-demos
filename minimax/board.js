class Board {
    constructor(size, cellSize) {
        this.size = size;
        this.cellSize = cellSize;        
        
        // Mảng lưu trữ vị trí của các viên kim cương
        // Mỗi viên kim cương được lưu trữ dưới dạng một đối tượng với thuộc tính x và y
        this.diamonds = [];        
    }    

    generateDiamonds(rate) {        
        // Số lượng viên kim cương
        let numDiamonds = Math.floor((this.size * this.size) * rate / 2);        
        for (let i = 0; i < numDiamonds; i++) {   
            // Tạo viên kim cương ở vị trí ngẫu nhiên
            // trong bàn cờ, không nằm ở vị trí (0, 0) vì đó là vị trí của người chơi
            // và không nằm ở vị trí đã có viên kim cương khác
            let x = Math.floor(Math.random() * this.size);
            let y = Math.floor(Math.random() * this.size);            
            // Đảm bảo viên kim cương không nằm ở vị trí (0, 0)
            // và không nằm ở vị trí đã có viên kim cương khác
            while ((x === 0 && y === 0) || (x === this.size - 1 && y === this.size - 1) || this.diamonds.some(d => d.x === x && d.y === y)) {
                x = Math.floor(Math.random() * this.size);
                y = Math.floor(Math.random() * this.size);                
            }
            let diamond = { x: x, y: y };
            this.diamonds.push(diamond);

            // Tạo viên kim cương đối xứng qua tâm bàn cờ 
            // không cần phải kiểm tra vì vị trí của viên kim cương đối xứng
            // sẽ không nằm ở vị trí (0, 0) và không nằm ở vị trí đã có viên kim cương khác
            let xSymmetric = this.size - x - 1;
            let ySymmetric = this.size - y - 1;
            let diamondSymmetric = { x: xSymmetric, y: ySymmetric };
            this.diamonds.push(diamondSymmetric);
        }
    }

    /// Tạo bản sao của bàn cờ    
    clone() {
        let newBoard = new Board(this.size, this.cellSize);
        newBoard.diamonds = this.diamonds.map(d => ({ x: d.x, y: d.y }));
        return newBoard;
    }
}