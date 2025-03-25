class TreeNode {
    constructor(hashValue, content = null, left = null, right = null) {
        this.hashValue = hashValue;
        this.content = content;
        this.left = left;
        this.right = right;
        this.selected = false;
        this.highlited = false;
    }

    countChildren() {
        if (this.left == null && this.right == null) {
            return 1;
        }
        return this.left.countChildren() + this.right.countChildren();
    }

    clearHighlited() {
        this.highlited = false;
        if (this.left != null && this.right != null) {
            this.left.clearHighlited();
            this.right.clearHighlited();
        }
    }

    draw(x, y){
        this.x = x;
        this.y = y;

        const halfWidth = 22;
        const halfHeight = 10;   

        // draw left and right children
        const gapX = 5;
        const gapY = 50;
        // won't be a case where only left or right is null
        if (this.left != null && this.right != null) {            
            const nChild = max(this.left.countChildren(), this.right.countChildren());
            // draw line
            line(x, y, x - nChild * (gapX + halfWidth*2) / 2, y + gapY);
            // draw node
            this.left.draw(x - nChild * (gapX + halfWidth*2) / 2, y + gapY);
            
            // draw line
            line(x, y, x + nChild * (gapX + halfWidth*2) / 2, y + gapY);
            // draw node
            this.right.draw(x + nChild * (gapX + halfWidth*2) / 2, y + gapY);
        }

        // draw node
        if (this.highlited) {
            fill(255, 255, 0);
        } else if (this.selected) {
            fill(100, 100, 255);
        } else {
            if (this.left == null && this.right == null) {
                fill(0, 255, 0);
            } else {
                fill(255);
            }
        }

        stroke(0);
        rect(x - halfWidth, y - halfHeight, halfWidth * 2, halfHeight * 2);
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(9);
        text(this.hashValue.toString(16), x, y);
        if (this.content != null) {
            text(this.content, x, y + 16);
        }
    }
}