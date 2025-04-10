
/**
 * Tính khoảng cách ngắn nhất từ một điểm đến một đoạn thẳng.
 * @param {p5.Vector} p Điểm cần tính khoảng cách
 * @param {p5.Vector} a Điểm đầu của đoạn thẳng
 * @param {p5.Vector} b Điểm cuối của đoạn thẳng
 * @returns {number} Khoảng cách ngắn nhất.
 */
function distPointLineSegment(p, a, b) {
    let v_ab = p5.Vector.sub(b, a); // Vector từ a đến b
    let v_ap = p5.Vector.sub(p, a); // Vector từ a đến p
    let lenSq = v_ab.magSq();      // Bình phương độ dài đoạn ab

    // Trường hợp đoạn thẳng chỉ là một điểm (a trùng b)
    if (lenSq < 1e-10) { // Sử dụng giá trị rất nhỏ để tránh lỗi chia cho 0
        return p5.Vector.dist(p, a);
    }

    // Tính tham số t của hình chiếu điểm p lên đường thẳng chứa ab
    // t = dot(AP, AB) / dot(AB, AB)
    let t = v_ap.dot(v_ab) / lenSq;

    // Giới hạn t trong khoảng [0, 1] để điểm chiếu nằm trên ĐOẠN thẳng ab
    // Nếu t < 0, điểm gần nhất là a. Nếu t > 1, điểm gần nhất là b.
    t = constrain(t, 0, 1); // Hàm constrain của p5.js

    // Tính tọa độ điểm gần nhất trên đoạn thẳng ab
    // closestPoint = A + t * AB
    // Sử dụng p5.Vector.mult tĩnh để không thay đổi v_ab gốc
    let closestPoint = p5.Vector.add(a, p5.Vector.mult(v_ab, t));

    // Trả về khoảng cách từ p đến điểm gần nhất này
    return p5.Vector.dist(p, closestPoint);
}

/**
 * Tìm điểm giao gần nhất giữa một đoạn thẳng và một hình tròn.
 * @param {p5.Vector} p1 Điểm bắt đầu đoạn thẳng
 * @param {p5.Vector} p2 Điểm kết thúc đoạn thẳng
 * @param {p5.Vector} circleCenter Tâm hình tròn
 * @param {number} radius Bán kính hình tròn
 * @returns {object|null} { point: p5.Vector, dist: number } hoặc null
 */
function intersectLineSegmentCircle(p1, p2, circleCenter, radius) {
    let vRay = p5.Vector.sub(p2, p1);
    let dStartCenter = p5.Vector.sub(p1, circleCenter);

    let a = vRay.dot(vRay);
    let b = 2 * dStartCenter.dot(vRay);
    let c = dStartCenter.dot(dStartCenter) - radius * radius;

    if (abs(a) < 1e-5) return null; // Tia quá ngắn

    let delta = b * b - 4 * a * c;
    if (delta < 0) return null; // Không cắt

    let sqrtDelta = sqrt(delta);
    let t1 = (-b - sqrtDelta) / (2 * a);
    let t2 = (-b + sqrtDelta) / (2 * a);

    let valid_t = [];
    const epsilon = 1e-5;
    if (t1 >= -epsilon && t1 <= 1 + epsilon) valid_t.push(t1);
    if (t2 >= -epsilon && t2 <= 1 + epsilon) valid_t.push(t2);

    if (valid_t.length === 0) return null; // Không cắt trên đoạn thẳng

    let best_t = min(valid_t);
    best_t = max(0, best_t); // Đảm bảo t >= 0

    let intersectPoint = p5.Vector.add(p1, vRay.mult(best_t)); // Tái sử dụng vRay sẽ bị thay đổi, cần copy hoặc tính lại
    vRay = p5.Vector.sub(p2, p1); // Tính lại vRay
    intersectPoint = p5.Vector.add(p1, vRay.mult(best_t));
    let intersectDist = p5.Vector.dist(p1, intersectPoint);

    return { point: intersectPoint, dist: intersectDist };
}

// Hàm giao điểm 2 đoạn thẳng
function lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
        ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
        ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return createVector(x1 + ua * (x2 - x1), y1 + ua * (y2 - y1));
    }
    return null;
}

// Hàm resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    startYPosition = height - 60;
    createEnvironment(startYPosition); // Tạo lại môi trường
}