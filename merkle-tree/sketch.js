let tree; 
let merklePath = "Click on a node to get Merkle Path";

function setup() {
    createCanvas(800, 300); 
    let leaves = generateLeaves(16);
    tree = new MerkleTree(leaves);
}

function draw() {
    background(220);
    strokeWeight(0.5);
    stroke(0);
    tree.draw(width / 2, 50);    

    if (merklePath != "") {
        fill(0);
        textSize(10);
        text(merklePath, width / 2 , 15);
    }
}

function mousePressed(){
    tree.onClicked(mouseX, mouseY);
    let selectedNode = tree.getSelectedNode();
    if (selectedNode != null) {
        const path = tree.getMerkePath(selectedNode);
        for (let i = 0; i < path.length; i++) {
            path[i].highlited = true;
        }

        // update Merkle path
        merklePath = path.map(node => node.hashValue.toString(16)).join(' -> ');
        merklePath = `Merkle Path of the node "${selectedNode.content}" [${selectedNode.hashValue.toString(16)}]: ${merklePath}`;
    } else {
        merklePath = "Click on a node to get Merkle Path";
    }
}

function generateLeaves(nLeaves) {
    let leaves = [];
    for (let i = 0; i < nLeaves; i++) {
        // from 'a' to 'z'
        const content = String.fromCharCode(65 + i);
        leaves.push(content);
    }
    return leaves;
}