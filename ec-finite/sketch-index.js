const leftMargin = 15;
const bottomMargin = 15;
let xStep = 0; // Bước nhảy trên trục x
let yStep = 0; // Bước nhảy trên trục y

let hoveringIndex = -1; // Chỉ số của điểm đang hover
let selectedIndex = -1; // Chỉ số của điểm được chọn

function setup() {
    const cvs = createCanvas(600, 600);
    cvs.parent('canvas-container');
    background(30, 30, 46); // Dark theme background
}

function draw() {
    background(30, 30, 46);
    drawNumberPlane(ec.p-1, ec.p-1);
    drawEllipticCurve();
}

/* Chuyển điểm (x,y) sang tọa độ pixel */
function pointToPixel(p) {
    return {
        x: p.x * xStep + leftMargin,
        y: height - p.y * yStep - bottomMargin
    };
}

/* Vẽ mặt phẳng số từ 0 đến xMax và từ 0 đến yMax */
function drawNumberPlane(xMax, yMax) {
    const step = 5;
    xStep = Math.floor((width - leftMargin) / xMax);
    yStep = Math.floor((height - bottomMargin) / yMax);
    stroke(57, 72, 103);
    strokeWeight(1);
    for (let x = 0; x <= xMax; x += step) {
        const xPos = x * xStep + leftMargin;
        line(xPos, height - bottomMargin, xPos, 0);
        strokeWeight(0.5);
        textAlign(CENTER, CENTER);
        textSize(8);
        fill(184, 184, 184);
        text(x, xPos, height - bottomMargin + 10);
    }
    for (let y = 0; y <= yMax; y += step) {
        const yPos = height - bottomMargin - y * yStep;
        line(leftMargin, yPos, width, yPos);
        strokeWeight(0.5);
        textAlign(RIGHT, CENTER);
        textSize(8);
        fill(184, 184, 184);
        text(y, leftMargin - 2, yPos);
    }
}

/* Vẽ đường cong elliptic: điểm trong subgroup màu xanh dương, vẽ polyline G -> 2G -> 3G -> ... */
function drawEllipticCurve() {    
    const points = ec.points;
    let subGroup = [];
    let subGroupSet = {}; // Map "x,y" -> true để kiểm tra nhanh điểm có trong subgroup

    if (selectedIndex !== -1) {
        subGroup = ec.getSubGroup(ec.points[selectedIndex]);
        for (const p of subGroup) {
            if (p.x !== Infinity) subGroupSet[`${p.x},${p.y}`] = true;
        }
    }

    // Vẽ đường gấp khúc G -> 2G -> 3G -> ... (mờ, stroke 0.5)
    if (subGroup.length >= 2) {
        noFill();
        stroke(100, 150, 200, 128); // opacity 0.5
        strokeWeight(0.5);
        beginShape();
        for (let i = 0; i < subGroup.length; i++) {
            const p = subGroup[i];
            if (p.x === Infinity) break;
            const pos = pointToPixel(p);
            vertex(pos.x, pos.y);
        }
        endShape();
        strokeWeight(1);
    }

    // Vẽ các điểm: không trong subgroup = xanh lá, trong subgroup = xanh dương
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const key = `${p.x},${p.y}`;
        if (subGroupSet[key]) {
            fill(70, 130, 255); // Xanh dương
        } else {
            fill(80, 200, 120); // Xanh lá
        }
        const pos = pointToPixel(p);
        ellipse(pos.x, pos.y, 6);
    }

    // Vẽ điểm được chọn G (màu đỏ, nổi bật)
    if (selectedIndex !== -1) {
        drawECPoint(selectedIndex, color(255, 80, 80), false);
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(7);
        const pos = pointToPixel(ec.points[selectedIndex]);
        text('G', pos.x, pos.y - 12);
    }

    // Vẽ điểm được hover chuột
    if (hoveringIndex !== -1) {
        drawECPoint(hoveringIndex, color(200, 200, 200), true);
    }
}

function drawECPoint(index, col, drawLabel = false) {
    const p = ec.points[index];
    const pos = pointToPixel(p);
    fill(col);
    noStroke();
    ellipse(pos.x, pos.y, 6);
    if (drawLabel) {
        stroke(184, 184, 184);
        strokeWeight(0.5);
        fill(184, 184, 184);
        textAlign(LEFT, CENTER);
        textSize(8);
        let xText = pos.x > (width - 35) ? pos.x - 30 : pos.x + 6;
        let yText = pos.y - 10;
        text(`(${p.x}, ${p.y})`, xText, yText);
    }
}

function mouseMoved() {
    const x = mouseX - leftMargin;
    const y = height - mouseY - bottomMargin;

    let minDist = Infinity;
    let minIndex = -1;
    for (let i = 0; i < ec.points.length; i++) {
        const p = ec.points[i];
        const xVal = p.x * xStep;
        const yVal = p.y * yStep;
        const d = dist(xVal, yVal, x, y);
        if (d < minDist) {
            minDist = d;
            minIndex = i;
        }
    }

    hoveringIndex = (minDist < 8) ? minIndex : -1;
}

function mousePressed() {
    if (mouseX < leftMargin || mouseX > width - leftMargin || mouseY < 0 || mouseY > height - bottomMargin) {
        return;
    }
    if (hoveringIndex !== -1) {
        selectedIndex = hoveringIndex;
        const subGroup = ec.getSubGroup(ec.points[selectedIndex]);
        const displayText = subGroup.map(p => `(${p.x},${p.y})`).join(' => ');
        const el = document.getElementById("subGroupPoints");
        if (el) el.value = `Sub-Group [${subGroup.length} points]: ${displayText}`;
        const gEl = document.getElementById("gPoint");
        if (gEl) gEl.textContent = `G = (${ec.points[selectedIndex].x}, ${ec.points[selectedIndex].y})`;
    } else {
        selectedIndex = -1;
        const el = document.getElementById("subGroupPoints");
        if (el) el.value = '';
        const gEl = document.getElementById("gPoint");
        if (gEl) gEl.textContent = 'G = (Inf, Inf)';
    }
}
