class TreeNode {
    constructor(hashValue, content = null, left = null, right = null) {
        this.hashValue = hashValue;
        this.content = content;
        this.left = left;
        this.right = right;
    }

    toHTMLString() {
        if(this.left == null && this.right == null) {
            return `<li>${this.hashValue.toString(16)} [${this.id}] ${this.content === null ? "" : "(" + this.content + ")"}</li>`;
        } else {
            return `<li><span class="caret">${this.hashValue.toString(16)} [${this.id}]</span>
                <ul class="nested">
                    ${this.left.toHTMLString()}
                    ${this.right.toHTMLString()}
                </ul></li>`;

        }
    }
}