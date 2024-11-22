class MerkleTree {
    constructor (leaves) {
        this.leaves = leaves;
        this.f = new Murmur();
        this.root = this.build();        
    }

    build () {
        // generate all nodes from leaves
        const nodes = this.leaves.map(leaf => new TreeNode(this.f.hash(leaf), leaf));
        // turn leaves into nodes
        this.leaves = [...nodes];

        // build tree
        while (nodes.length > 1) {
            const left = nodes.shift();
            const right = nodes.shift();
            const newNode = new TreeNode(this.f.hash(left.hashValue + right.hashValue + ''), null, left, right);
            left.parent = newNode;
            right.parent = newNode;
            nodes.push(newNode);
        }

        // root node
        return nodes[0];
    }

    draw (x, y) {
        this.root.draw(x, y);        
    }

    getMerkePath (leafNode) {
        const path = [];
        let current = leafNode;
        while (current.parent != null) {
            if (current.parent.left.hashValue == current.hashValue) {
                path.push(current.parent.right);
            } else {
                path.push(current.parent.left);
            }
            
            current = current.parent;
        }

        return path;
    }

    verify(hashValue, path) {
        let current = hashValue;
        for (let i = 0; i < path.length; i++) {
            current = this.f.hash(current + path[i].hashValue + '');
        }

        return current == this.root.hashValue;        
    }

    getSelectedNode () {
        for (let i = 0; i < this.leaves.length; i++) {
            if (this.leaves[i].selected) {
                return this.leaves[i];
            }
        }

        return null;
    }

    onClicked(x, y) {
        // clear all highlited
        this.root.clearHighlited();

        // clear all selected
        for (let i = 0; i < this.leaves.length; i++) {
            this.leaves[i].selected = false;
        }

        // check if any leaf is clicked        
        for (let i = 0; i < this.leaves.length; i++) {
            if (x > this.leaves[i].x - 22 && x < this.leaves[i].x + 22 && y > this.leaves[i].y - 10 && y < this.leaves[i].y + 10) {                
                this.leaves[i].selected = true;
            }
        }
    }
}