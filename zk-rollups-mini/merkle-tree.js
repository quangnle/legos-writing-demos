class MerkleTree {
    constructor (leaves, hashFunction) {
        this.leaves = leaves;
        this.f = hashFunction;
        this.root = this.build();
        this.index();        
    }

    build () {
        if (this.leaves.length == 0) return null;
        
        // generate all nodes from leaves
        const nodes = this.leaves.map(leaf => new TreeNode(this.f.hash(leaf), leaf));
        // turn leaves into nodes
        this.leaves = [...nodes];

        // build tree
        while (nodes.length > 1) {
            const left = nodes.shift();
            const right = nodes.shift();
            const newNode = new TreeNode(this.f.hash(left.hashValue + right.hashValue + ''), left.content + right.content, left, right);
            left.parent = newNode;
            right.parent = newNode;
            nodes.push(newNode);
        }

        // root node
        return nodes[0];
    }

    index() {
        this.root.id = '0';
        let queue = [this.root];        
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.left != null) {
                node.left.id = node.id + '0';
                queue.push(node.left);
                node.right.id = node.id + '1';
                queue.push(node.right);
            }
        }
    }

    getMerklePath (leafNode) {
        console.log(`Getting Merkle path for leaf ${leafNode.id}`);
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

    getCombinedMerklePath(leaves) {
        const path = [];
        const checked = [];
        const queue = [...leaves];
        while (queue.length > 0) {
            const node = queue.shift();
            checked.push(node);
            if (node.parent != null) {  
                if (node.parent.left.hashValue == node.hashValue) {
                    // check if right node is already in the queue, if not add it to the path
                    if (queue.findIndex(n => n.hashValue == node.parent.right.hashValue) == -1) {
                        // check if right node is checked, if not add it to the path
                        if (checked.findIndex(n => n.hashValue == node.parent.right.hashValue) == -1) {
                            path.push(node.parent.right);
                        }
                    }
                } else {
                    // check if left node is already in the queue, if not add it to the path
                    if (queue.findIndex(n => n.hashValue == node.parent.left.hashValue) == -1) {
                        // check if left node is already in the path, if not add it to the path
                        if (checked.findIndex(n => n.hashValue == node.parent.left.hashValue) == -1) {
                            path.push(node.parent.left);
                        }
                    }
                }

                // check if parent is already in the queue, if not add it to the path
                if (queue.findIndex(n => n.hashValue == node.parent.hashValue) == -1) {
                    queue.push(node.parent);
                }
            }
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

    verifyBundle(leaves, path) {
        let allNodes = [...leaves, ...path];
        while (allNodes.length > 1) {
            // current node
            const curNode = allNodes.shift();
            // search for the sibling of the current node based on the current node's id
            const sibling = allNodes.find(n => n.id == curNode.id.slice(0, -1) + (curNode.id[curNode.id.length - 1] == '0' ? '1' : '0'));
            // if sibling is not found, return false
            if (sibling == undefined) {
                return false;
            }
            // calculate the parent node
            let parent = null;
            // if the current node is left node
            if (curNode.id[curNode.id.length - 1] == '0') {
                parent = new TreeNode(this.f.hash(curNode.hashValue + sibling.hashValue + ''), curNode.content + sibling.content, curNode, sibling);
            } else {
                parent = new TreeNode(this.f.hash(sibling.hashValue + curNode.hashValue + ''), sibling.content + curNode.content, sibling, curNode);
            }
            parent.id = curNode.id.slice(0, -1);
            // add parent node to the list of nodes
            allNodes.push(parent);                        
            //remove sibling node from the list of nodes
            allNodes = allNodes.filter(n => n.hashValue != sibling.hashValue);
        }
        return allNodes[0].hashValue == this.root.hashValue;
    }

    toHTMLString() {
        return `<ul id="treeView">${this.root.toHTMLString()}</ul>`;
    }
}