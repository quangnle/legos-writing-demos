const dist = (p1, p2) => {
    return Math.sqrt(
        (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
    );
};

class EllipticCurve {
    constructor(x, y, w, h, a, b) {
        this.x = x;
        this.y = y;
        this.xc = x - w / 2;
        this.yc = y - h / 2;
        this.w = w;
        this.h = h;
        this.a = a;
        this.b = b;
        this.points = [];
        // points for drawing
        this.drPoints = [];
        //this.mouseDown = false;
        
        this.scale = 50;
        const step = 0.01;

        // calculate points
        for (let i = -this.w; i < this.w; i++) {
            const x = i * step;
            let y = x * x * x + this.a * x + this.b;
            if (Math.sqrt(y) * this.scale > this.h >> 1 || y < 0) continue;
            if (Math.abs(y) < 0.1) y = 0;
            const p = {
                x: x * this.scale,
                y1: Math.sqrt(y) * this.scale,
                y2: -Math.sqrt(y) * this.scale,
            };            
            this.drPoints.push(p);
            this.points.push({ x: p.x, y: p.y1 });
            this.points.push({ x: p.x, y: p.y2 });
        }

        this.pA = this.points[0];
        this.pB = this.points[300];
    }

    draw() {
        fill(255);
        stroke(0);
        push();        
        translate(this.xc, this.yc);
        // draw border
        rect(-(this.w >> 1), -(this.h >> 1), this.w, this.h);
        
        // draw axis
        // x-axis
        line(-this.w >> 1, 0, this.w >> 1, 0);
        // y-axis
        line(0, -this.h >> 1, 0, this.h >> 1);
        // origin
        ellipse(0, 0, 3, 3);

        // draw curve
        stroke("#00f");
        for (let i = 0; i < this.drPoints.length - 1; i++) {
            line(this.drPoints[i].x, this.drPoints[i].y1, this.drPoints[i + 1].x, this.drPoints[i + 1].y1);
            line(this.drPoints[i].x, this.drPoints[i].y2, this.drPoints[i + 1].x, this.drPoints[i + 1].y2);
        }

        // intersection point
        const iPoint = this.intersectionPoint(this.pA, this.pB);
        // draw connecting lines
        stroke("#0f0");
        line(this.pA.x, this.pA.y, this.pB.x, this.pB.y);
        line(this.pA.x, this.pA.y, iPoint.x, iPoint.y);
        line(this.pB.x, this.pB.y, iPoint.x, iPoint.y);
        stroke("#f00");
        line(iPoint.x, iPoint.y, iPoint.x, -iPoint.y);

        // draw points A and B
        noStroke();
        fill(0);
        fill("#0f0");
        ellipse(this.pA.x, this.pA.y, 6, 6);
        textSize(9);
        fill(0);
        text(`A (${(this.pA.x/this.scale).toFixed(1)},${(this.pA.y/this.scale).toFixed(1)})`, this.pA.x + 10, this.pA.y);
        
        fill("#0f0");
        ellipse(this.pB.x, this.pB.y, 6, 6);
        textSize(9);
        fill(0);
        text(`B (${(this.pB.x/this.scale).toFixed(1)},${(this.pB.y/this.scale).toFixed(1)})`, this.pB.x + 10, this.pB.y);

        // draw intersection points
        fill("#00f");
        ellipse(iPoint.x, iPoint.y, 6, 6);
        textSize(9);
        fill(0);
        text(`C (${(iPoint.x/this.scale).toFixed(1)},${(iPoint.y/this.scale).toFixed(1)})`, iPoint.x + 10, iPoint.y);

        // draw result
        fill("#f00");
        ellipse(iPoint.x, -iPoint.y, 8, 8);
        text(`A+B=D(${(iPoint.x/this.scale).toFixed(1)},${(-iPoint.y/this.scale).toFixed(1)})`, iPoint.x + 10, -iPoint.y);

        pop();
    }

    onMousePressed(mx, my) {
        const x = mx - this.xc;
        const y = my - this.yc;
        const p = this.findNearestPoint(x, y);
        const d1 = dist(this.pA, p);
        const d2 = dist(this.pB, p);
        if (d1 < d2) {
            this.pA.selected = d1 < 15;
        } else {
            this.pB.selected = d2 < 15;
        }
        
    }

    onMouseDragged(mx, my){
        const x = mx - this.xc;
        const y = my - this.yc;
        const p = this.findNearestPoint(x, y);
        if (this.pA.selected) {
            this.pA.x = p.x;
            this.pA.y = p.y;
        } else if (this.pB.selected) {
            this.pB.x = p.x;
            this.pB.y = p.y;
        }
    }

    onMouseReleased() {
        this.pA.selected = false;
        this.pB.selected = false;
    }

    // hàm tính giao điểm của hai điểm trên đường cong
    intersectionPoint(p1, p2) {
        let s = 0;
        const epsilon = 0.00001; // tránh chia cho 0
        // chuyển zoom rate cho phù hợp với toạ độ hiển thị đồ hoạ
        const xP = p1.x / this.scale; 
        const yP = p1.y / this.scale;
        const xQ = p2.x / this.scale;
        const yQ = p2.y / this.scale;

        // tính giao điểm của hai diểm trên đường cong y^2 = x^3 + ax + b
        
        // nếu hai điểm trùng nhau thì s = (3 * xP * xP + a) / (2 * yP)
        // nếu không thì s = (yP - yQ) / (xP - xQ + epsilon)
        if (p1.x == p2.x && p1.y == p2.y) {
            s = (3 * xP * xP + this.a) / (2 * yP);
        } else {
            s = (yP - yQ) / (xP - xQ + epsilon);
        }

        // tính toạ độ giao điểm từ s đã tính ở trên
        const xR = s * s - xP - xQ;
        const yR = yP + s * (xR - xP);

        return { x: xR * this.scale, y: yR * this.scale };
    }

    findNearestPoint(x, y) {
        // tìm điểm gần nhất với vị trí (x, y)
        // trong mảng this.points để xác định điểm nào đang được chọn
        let min = Infinity; // khoảng cách nhỏ nhất ban đầu được đặt là vô cực
        let nearestPoint = null; 

        this.points.forEach((p) => {
            const d = dist(p, { x: x, y: y });
            if (d < min) { // nếu khoảng cách hiện tại nhỏ hơn khoảng cách nhỏ nhất
                min = d; // cập nhật khoảng cách nhỏ nhất
                nearestPoint = p; // cập nhật điểm gần nhất
            }
        });
        
        // nearestPoint là điểm gần nhất với (x, y)
        return nearestPoint;
    }
}
