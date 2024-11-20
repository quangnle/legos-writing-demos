let tree; 
let merklePath = "";
function setup() {
    createCanvas(800, 300); 
    tree = new MerkleTree(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']);
}

function draw() {
    background(220);
    tree.draw(width / 2, 50);

    // display merkle path
    fill(0);
    textSize(10);    
    text(`Merkle Path: ${merklePath}`, width/2, 10);    
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
    }
}