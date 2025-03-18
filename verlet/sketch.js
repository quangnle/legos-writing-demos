// Khai báo các biến toàn cục
let particles = []; // Mảng chứa các điểm (particles)
let constraints = []; // Mảng chứa các ràng buộc (constraints)
let gridSize = 5; // Kích thước ô lưới
let clothWidth = 80; // Chiều rộng của tấm vải (số điểm)
let clothHeight = 40; // Chiều cao của tấm vải (số điểm)
let gravity = 0.1; // Gia tốc trọng lực
let stiffness = 0.7; // Độ cứng của ràng buộc
let friction = 0.95; // Hệ số ma sát
let selectedParticle = null; // Điểm được chọn

let stringToDraw = "Legos"; // Chuỗi cần vẽ
let textPoints = []; // Mảng chứa các điểm của chữ

function preload() {
    // Load a font (you can replace 'Arial' with a custom font if hosted)
    font = loadFont(
        "https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf"
    );
}

function setup() {
    createCanvas(600, 400); // Tạo canvas 400x400   

    // tạo các điểm cuả chữ
    textPoints = font.textToPoints(stringToDraw, 0, 0, 12, {
        sampleFactor: 1.0
    });

    let minTextX = Infinity;
    let minTextY = Infinity;
    for (let p of textPoints) {
        minTextX = min(minTextX, p.x);
        minTextY = min(minTextY, p.y);
    }

    // Tạo các điểm và ràng buộc
    // Tạo các particles
    for (let y = 0; y < clothHeight; y++) {
        for (let x = 0; x < clothWidth; x++) {            
            let p = {
                x: x * gridSize + width / 2 - (clothWidth * gridSize) / 2, // Vị trí x ban đầu
                y: y * gridSize + 50, // Vị trí y ban đầu
                oldX: x * gridSize + width / 2 - (clothWidth * gridSize) / 2, // Vị trí x trước đó
                oldY: y * gridSize + 50, // Vị trí y trước đó
                pinned: (y === 0) && ((x === 0) || (x % 10 == 0) || (x === clothWidth-1)), // Ghim cố định điểm đầu, điểm giữa và điểm cuối hàng đầu tiên    
                color: "#009F9F"
            };
            particles.push(p);
        }
    }

    // Đặt màu đen cho các điểm của chữ
    for (let p of textPoints) {
        // hàng 10, cột 20
        p.x = Math.round(p.x-minTextX) + 20 + clothWidth * 10;
        p.y = Math.round(p.y-minTextY);
        // set màu đen cho các particles có vị trí x = p.x và y = p.y        
        let index = p.x + p.y * clothWidth;
        if (index >= 0 && index < particles.length) {
            particles[index].color = "#000000";
        }
    }

    // Tạo các constraints (ràng buộc giữa các điểm)
    for (let y = 0; y < clothHeight; y++) {
        for (let x = 0; x < clothWidth; x++) {
            let index = x + y * clothWidth;
            // Kết nối với điểm bên phải (nếu có)
            if (x < clothWidth - 1) {
                constraints.push([index, index + 1]);
            }
            // Kết nối với điểm bên dưới (nếu có)
            if (y < clothHeight - 1) {
                constraints.push([index, index + clothWidth]);
            }
        }
    }
}

function draw() {
    background(220); // Xóa nền mỗi frame

    // Cập nhật vị trí particles bằng Verlet integration
    for (let p of particles) {
        if (!p.pinned) { // Chỉ cập nhật các điểm không bị ghim
            let vx = (p.x - p.oldX) * friction; // Vận tốc x với ma sát
            let vy = (p.y - p.oldY) * friction; // Vận tốc y với ma sát
            p.oldX = p.x; // Lưu vị trí hiện tại thành vị trí trước đó
            p.oldY = p.y;
            p.x += vx; // Cập nhật vị trí x
            p.y += vy + gravity; // Cập nhật vị trí y với trọng lực
        }
    }

    // Áp dụng constraints để duy trì khoảng cách giữa các điểm
    for (let i = 0; i < 5; i++) { // Lặp nhiều lần để tăng độ ổn định
        for (let c of constraints) {
            let p1 = particles[c[0]]; // Điểm 1
            let p2 = particles[c[1]]; // Điểm 2
            let dx = p2.x - p1.x; // Khoảng cách x giữa 2 điểm
            let dy = p2.y - p1.y; // Khoảng cách y giữa 2 điểm
            let distance = sqrt(dx * dx + dy * dy); // Khoảng cách thực tế
            let difference = (distance - gridSize) / distance; // Sai số so với khoảng cách mong muốn
            let offsetX = dx * difference * 0.5; // Điều chỉnh x
            let offsetY = dy * difference * 0.5; // Điều chỉnh y
            // Điều chỉnh vị trí nếu điểm không bị ghim
            if (!p1.pinned) {
                p1.x += offsetX * stiffness;
                p1.y += offsetY * stiffness;
            }
            if (!p2.pinned) {
                p2.x -= offsetX * stiffness;
                p2.y -= offsetY * stiffness;
            }
        }
    }

    // Vẽ lưới vải
    noStroke(); // Không vẽ đường viền
    //fill(0, 150, 50, 50); 
    for (let y = 0; y < clothHeight - 1; y++) {
        for (let x = 0; x < clothWidth - 1; x++) {
            let index = x + y * clothWidth;
            let p1 = particles[index];
            let p2 = particles[index + 1];
            let p3 = particles[index + clothWidth];
            let p4 = particles[index + clothWidth + 1];

            // lấy màu trung bình của p1,p2,p3,p4
            let c1 = color(p1.color);
            let c2 = color(p2.color);
            let c3 = color(p3.color);
            let c4 = color(p4.color);
            let r = (red(c1) + red(c2) + red(c3) + red(c4)) / 4;
            let g = (green(c1) + green(c2) + green(c3) + green(c4)) / 4;
            let b = (blue(c1) + blue(c2) + blue(c3) + blue(c4)) / 4;
            
            fill(r, g, b);
            // Vẽ một tứ giác cho mỗi ô lưới
            beginShape();
            vertex(p1.x, p1.y);
            vertex(p2.x, p2.y);
            vertex(p4.x, p4.y);
            vertex(p3.x, p3.y);
            endShape(CLOSE);
        }
    }
}

// tạo gió thổi khi nhấn phím space
function keyPressed() {
    if (key === ' ') {
        for (let p of particles) {
            if (!p.pinned) {
                p.x += random(-10, 10);
                p.y += random(-10, 10);
            }
        }
    }
}

function mousePressed() {
    // kiểm tra chuột có nằm trong vùng canvas không
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }
    // Khi click chuột, chọn điểm gần nhất với chuột
    let minDist = Infinity;
    let closest = null;
    for (let p of particles) {
        let d = dist(p.x, p.y, mouseX, mouseY);
        if (d < minDist) {
            minDist = d;
            closest = p;
        }
    }
    selectedParticle = closest;
}

function mouseDragged() {
    // Kéo điểm đã chọn
    if (selectedParticle) {
        selectedParticle.x = mouseX;
        selectedParticle.y = mouseY;
    }
}

function mouseReleased() {
    // Khi thả chuột, bỏ chọn điểm
    selectedParticle = null;
}