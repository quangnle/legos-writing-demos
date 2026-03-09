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
        if (this.left == null && this.right == null) return 1;
        return this.left.countChildren() + this.right.countChildren();
    }

    getLayoutHalfWidth() {
        return 14;
    }

    clearHighlited() {
        this.highlited = false;
        if (this.left != null && this.right != null) {
            this.left.clearHighlited();
            this.right.clearHighlited();
        }
    }

    draw(x, y, isRoot = false) {
        this.x = x;
        this.y = y;

        const t = typeof MERKLE_THEME !== 'undefined' ? MERKLE_THEME : {
            surfaceAlt: [40, 40, 40], border: [80, 80, 80],
            leaf: [34, 197, 94], selected: [99, 102, 241], highlight: [251, 191, 36],
            text: [244, 244, 245]
        };

        const isLeaf = this.left == null && this.right == null;
        const gapX = 8;
        const gapY = 67;

        if (this.left != null && this.right != null) {
            const nChild = max(this.left.countChildren(), this.right.countChildren());
            const childW = this.left.getLayoutHalfWidth() * 2;
            const childOffset = nChild * (gapX + childW) / 2;

            stroke(t.border[0], t.border[1], t.border[2]);
            strokeWeight(1.5);
            line(x, y, x - childOffset, y + gapY);
            line(x, y, x + childOffset, y + gapY);

            this.left.draw(x - childOffset, y + gapY, false);
            this.right.draw(x + childOffset, y + gapY, false);
        }

        noStroke();
        if (this.highlited) {
            fill(t.highlight[0], t.highlight[1], t.highlight[2], 220);
            stroke(t.highlight[0], t.highlight[1], t.highlight[2]);
        } else if (this.selected) {
            fill(t.selected[0], t.selected[1], t.selected[2], 220);
            stroke(t.selected[0], t.selected[1], t.selected[2]);
        } else if (isLeaf) {
            fill(t.leaf[0], t.leaf[1], t.leaf[2], 200);
            stroke(t.leaf[0], t.leaf[1], t.leaf[2]);
        } else {
            fill(t.surfaceAlt[0], t.surfaceAlt[1], t.surfaceAlt[2]);
            stroke(t.border[0], t.border[1], t.border[2]);
        }
        strokeWeight(1);

        rectMode(CENTER);
        if (isRoot) {
            rect(x, y, 56, 28, 6);
            fill(t.text[0], t.text[1], t.text[2]);
            textAlign(CENTER, CENTER);
            textSize(10);
            text(this.hashValue.toString(16), x, y);
        } else {
            rect(x, y, 28, 56, 6);
            fill(t.text[0], t.text[1], t.text[2]);
            textAlign(CENTER, CENTER);
            textSize(9);
            push();
            translate(x, y);
            rotate(-HALF_PI);
            text(this.hashValue.toString(16).slice(0, 8), 0, 0);
            pop();

            if (isLeaf && this.content != null) {
                fill(t.text[0], t.text[1], t.text[2]);
                textSize(12);
                text(this.content, x, y + 36);
            }
        }
    }
}
