let tree;
let pathDisplayEl;
let viewOffset = { x: 0, y: 0 };
let dragStart = null;
let isDragging = false;
const DRAG_THRESHOLD = 6;

function setup() {
    const holder = document.getElementById('sketch-holder');
    const w = Math.min(920, holder && holder.offsetWidth ? holder.offsetWidth : 920);
    const c = createCanvas(w, 420);
    if (holder) c.parent('sketch-holder');

    const leaves = generateLeaves(16);
    tree = new MerkleTree(leaves);
}

function draw() {
    const t = typeof MERKLE_THEME !== 'undefined' ? MERKLE_THEME : { bg: [30, 30, 30] };
    background(t.bg[0], t.bg[1], t.bg[2]);

    push();
    translate(viewOffset.x, viewOffset.y);

    noFill();
    stroke(t.border[0], t.border[1], t.border[2]);
    strokeWeight(1.5);

    if (tree) {
        tree.draw(width / 2, 50);
    }
    pop();
}

function mousePressed() {
    dragStart = { x: mouseX, y: mouseY };
    isDragging = false;
}

function mouseDragged() {
    if (dragStart && dist(mouseX, mouseY, dragStart.x, dragStart.y) > DRAG_THRESHOLD) {
        isDragging = true;
    }
    if (isDragging) {
        viewOffset.x += mouseX - pmouseX;
        viewOffset.y += mouseY - pmouseY;
    }
}

function mouseReleased() {
    if (!tree) {
        dragStart = null;
        return;
    }
    if (!isDragging) {
        const localX = mouseX - viewOffset.x;
        const localY = mouseY - viewOffset.y;
        tree.onClicked(localX, localY);
        const selectedNode = tree.getSelectedNode();

        pathDisplayEl = pathDisplayEl || document.getElementById('pathDisplay');
        if (pathDisplayEl) {
            if (selectedNode) {
                const path = tree.getMerklePath(selectedNode);
                path.forEach(node => { node.highlited = true; });

                const pathStrs = path.map(n => n.hashValue.toString(16));
                const fullPath = pathStrs.join(' → ');
                pathDisplayEl.textContent = `Leaf "${selectedNode.content}" [${selectedNode.hashValue.toString(16)}]: ${fullPath}`;
                pathDisplayEl.className = 'path-value';
            } else {
                pathDisplayEl.textContent = 'Click on a leaf node to get its Merkle path';
                pathDisplayEl.className = 'path-value empty';
            }
        }
    }
    dragStart = null;
}

function windowResized() {
    const holder = document.getElementById('sketch-holder');
    if (holder && holder.offsetWidth > 0) {
        resizeCanvas(Math.min(920, holder.offsetWidth), 420);
    }
}

function generateLeaves(nLeaves) {
    const leaves = [];
    for (let i = 0; i < nLeaves; i++) {
        leaves.push(String.fromCharCode(65 + (i % 26)));
    }
    return leaves;
}
