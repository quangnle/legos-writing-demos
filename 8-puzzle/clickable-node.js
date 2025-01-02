class ClickableNode {
    constructor(node) {
        this.node = node;
        this.x = 0;
        this.y = 0;
        this.size = 30;
    }

    draw(x, y) {
        this.x = x;
        this.y = y;
        drawBlock(x, y, this.size, this.node);
    }

    mousePressed(mx, my) {
        if (
            mx > this.x &&
            mx < this.x + 90 &&
            my > this.y &&
            my < this.y + 90
        ) {
            let zeroIndex = this.node.arr.indexOf(0);
            let clickedIndex =
                Math.floor((my - this.y) / this.size) * 3 +
                Math.floor((mx - this.x) / this.size);
            // check if the clicked block is a neighbor of the zero block
            let zeroRow = Math.floor(zeroIndex / 3);
            let zeroCol = zeroIndex % 3;
            let clickedRow = Math.floor(clickedIndex / 3);
            let clickedCol = clickedIndex % 3;
            // if the clicked block is a neighbor, swap it with the zero block
            if (Math.abs(zeroRow - clickedRow) + Math.abs(zeroCol - clickedCol) === 1) {
                let newArr = [...this.node.arr];
                newArr[zeroIndex] = newArr[clickedIndex];
                newArr[clickedIndex] = 0;
                this.node = new Node(newArr);
            }
        }
    }
}