const leftMargin = 15;
const bottomMargin = 15;
let xStep = 0; // Bước nhảy trên trục x
let yStep = 0; // Bước nhảy trên trục y

let hoveringIndex = -1; // Chỉ số của điểm đang hover
let selectedIndex = -1; // Chỉ số của điểm được chọn

function setup() {
    const cvs = createCanvas(350, 350);
    cvs.parent('canvas-container');
    background(255);
    //noLoop();
}

function draw() {
    background(255);
    drawNumberPlane(ec.p-1, ec.p-1);
    drawEllipticCurve();
}

/* Vẽ mặt phẳng số từ 0 đến xMax và từ 0 đến yMax, với bước nhảy là step
/* Nhãn trên trục x và y sẽ được vẽ bên ngoài lề vùng mặt phẳng số
/* @param {number} xMax - Giá trị lớn nhất trên trục x
/* @param {number} yMax - Giá trị lớn nhất trên trục y 
/* @param {number} step - Bước nhảy giữa các giá trị trên trục x và y */
function drawNumberPlane(xMax, yMax) {
    const step = 5;
    
    xStep = Math.floor((width - leftMargin) / xMax);
    yStep = Math.floor((height - bottomMargin) / yMax);
    stroke(200);
    strokeWeight(1);
    for (let x = 0; x <= xMax; x += step) {
        const xPos = x * xStep + leftMargin;
        line(xPos, height - bottomMargin, xPos, 0);
        strokeWeight(0.5);
        textAlign(CENTER, CENTER);
        textSize(8);
        fill(0);
        text(x, xPos, height - bottomMargin + 10);
    }
    for (let y = 0; y <= yMax; y += step) {
        const yPos = height - bottomMargin - y * yStep;
        line(leftMargin, yPos, width, yPos);
        strokeWeight(0.5);
        textAlign(RIGHT, CENTER);
        textSize(8);
        fill(0);
        text(y, leftMargin - 2, yPos);
    }
}

/* vẽ đường cong elliptic với các điểm đã cho */
function drawEllipticCurve() {    
    const points = ec.points;
    fill(0, 255, 0);
    for (const p of points) {
        let x = p.x * xStep;
        let y = p.y * yStep;
        ellipse(x + leftMargin, height - y - bottomMargin ,5);        
    }

    // vẽ điểm được hover chuột
    if (hoveringIndex !== -1) {
        drawECPoint(hoveringIndex, color(100, 100, 100), true); // Vẽ điểm được hover
    }

    // vẽ điểm được chọn
    if (selectedIndex !== -1) {
        drawECPoint(selectedIndex, color(255, 0, 0)); // Vẽ điểm được chọn
        const subGroup = ec.getSubGroup(ec.points[selectedIndex]); // Lấy nhóm con từ điểm được chọn
    }
}

function drawECPoint(index, color, drawLabel = false) {
    const p = ec.points[index];
    let x = p.x * xStep;
    let y = p.y * yStep;
    fill(color);
    ellipse(x + leftMargin, height - y - bottomMargin, 5);        
    if (drawLabel) {
        stroke(0);
        strokeWeight(0.5);
        fill(0);
        textAlign(LEFT, CENTER);
        textSize(8);
        let xText = x + leftMargin > (width - 35) ? x + leftMargin - 30 : x + leftMargin + 5;
        let yText = height - y - bottomMargin - 10;
        text(`(${p.x}, ${p.y})`, xText, yText);
    }
}

function mouseMoved() {
    const x = mouseX - leftMargin; // Tọa độ chuột trên mặt phẳng số
    const y = height - mouseY - bottomMargin; // Tọa độ chuột trên mặt phẳng số

    let minDist = Infinity; // Khởi tạo khoảng cách nhỏ nhất
    let minIndex = -1; // Khởi tạo chỉ số nhỏ nhất
    for (let i=0; i<ec.points.length; i++){
        const p = ec.points[i];
        const xVal = p.x * xStep;
        const yVal = p.y * yStep;
        const d = dist(xVal, yVal, x, y); // Tính khoảng cách giữa điểm và chuột
        //console.log(x,y,xVal,yVal,d);

        if (d < minDist) {
            minDist = d; // Cập nhật khoảng cách nhỏ nhất
            minIndex = i; // Cập nhật chỉ số nhỏ nhất
        }
    }

    if (minDist < 5) { // Nếu khoảng cách nhỏ hơn 5 pixel
        hoveringIndex = minIndex; // Lưu chỉ số của điểm đang hover
    } else {
        hoveringIndex = -1; // Không tìm thấy điểm nào
    }
}

function mousePressed() {
    // kiểm tra xem tọa độ chuột có nằm trong vùng vẽ không
    if (mouseX < leftMargin || mouseX > width - leftMargin || mouseY < 0 || mouseY > height - bottomMargin) {
        return; // Không làm gì cả
    }
    // kiểm tra xem có điểm nào được hover không
    if (hoveringIndex !== -1) {
        selectedIndex = hoveringIndex; // Lưu chỉ số của điểm được chọn
        const subGroup = ec.getSubGroup(ec.points[selectedIndex]);
        const displayText = subGroup.map(p => `(${p.x},${p.y})`).join(' => '); // Lấy nhóm con từ điểm được chọn
        document.getElementById("subGroupPoints").innerHTML = `Generated Sub-Group [${subGroup.length} points]: ${displayText}`; // Cập nhật các phần tử của nhóm con
        document.getElementById("gPoint").innerHTML = `G = (${ec.points[selectedIndex].x},${ec.points[selectedIndex].y})`; // Hiện phần tử nhóm con
    } else {
        selectedIndex = -1; // Không tìm thấy điểm nào        
    }
}