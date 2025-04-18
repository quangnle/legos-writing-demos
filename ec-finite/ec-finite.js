class FiniteEC {
    constructor(a,b,p) {
        this.a = a;
        this.b = b;
        this.p = p;
        this.points = this.generatePoints();
    }

    /* Sinh ra các điểm trên đường cong elliptic
    /* @returns {Array} - Mảng các điểm trên đường cong elliptic */    
    generatePoints() {
        const points = [];
        for (let x = 0; x < this.p; x++) {
            const y2 = (x * x * x + this.a * x + this.b) % this.p;
            const y = modSqrt(y2, this.p); // Tính căn bậc hai của y2 modulo p sử dụng hàm modSqrt dùng thuật toán Tonelli-Shanks
            if (y !== null) {
                points.push({ x: x, y: y });
                if (y !== 0) {
                    points.push({ x: x, y: this.p - y });
                }
            }
        }
        return points;
    }

    // Cộng hai điểm P và Q trên đường cong elliptic
    // @param {Object} P - Điểm P trên đường cong elliptic
    // @param {Object} Q - Điểm Q trên đường cong elliptic
    // @returns {Object} - Điểm R = P + Q trên đường cong elliptic
    add(P, Q) {
        let lambda;
        // Kiểm tra trường hợp P + Q là điểm vô cực (điểm tại vô cực)
        if (P.x === Q.x && P.y !== Q.y) {
            return {x: Infinity, y: Infinity}; // Điểm vô cực
        }
        // Kiểm tra trường hợp P = Q
		if (P.x == Q.x && P.y == Q.y) {
            lambda = (3*P.x*P.x + this.a)*modInverse((2*P.y) % this.p, this.p);
        } else { // P != Q
            lambda = (P.y - Q.y)*modInverse(P.x - Q.x, this.p);
        }

		let xr = lambda*lambda - P.x - Q.x;
		if (xr < 0 && xr > -Infinity) xr = this.p - (-xr % this.p);
		xr = xr % this.p;
		let yr = lambda*(P.x - xr) - P.y;
		if (yr < 0 && yr > -Infinity) yr = this.p - (-yr % this.p);
		yr = yr % this.p;
		return {x: xr, y: yr};
    }

    /* Nhân một số nguyên k với điểm P trên đường cong elliptic sử dụng thuật toán nhân đôi
    /* @param {number} k - Số nguyên k */
    /* @param {Object} P - Điểm P trên đường cong elliptic */
    /* @returns {Object} - Điểm R = k * P trên đường cong elliptic */
    multiply(k, P) {
        let R = null;
        let Q = P;
        while (k > 0) {
            if (k % 2 === 1) {
                R = R === null ? Q : this.add(R, Q);
            }
            Q = this.doublePoint(Q);
            k = Math.floor(k / 2);
        }
        return R;
    }

    /* Nhân đôi một điểm P trên đường cong elliptic
    /* @param {Object} P - Điểm P trên đường cong elliptic */
    /* @returns {Object} - Điểm R = 2 * P trên đường cong elliptic */
    doublePoint(P) {
        return this.add(P, P);
    }

    /* Kiểm tra xem một điểm P có nằm trên đường cong elliptic hay không
    /* @param {Object} P - Điểm P trên đường cong elliptic */
    /* @returns {boolean} - true nếu P nằm trên đường cong, false nếu không */
    isPointOnCurve(P) {
        const left = (P.y * P.y) % this.p;
        const right = (P.x * P.x * P.x + this.a * P.x + this.b) % this.p;
        return left === right;
    }

    /* Tìm nhóm con của một điểm P trên đường cong elliptic
    /* @param {Object} P - Điểm P trên đường cong elliptic */
    /* @returns {Array} - Mảng các điểm trong nhóm con của P */
    getSubGroup(P) {
        const subgroup = [P];
        let currentPoint = P;
        for (let i = 1; i < this.p; i++) {
            currentPoint = this.add(currentPoint, P);
            if (currentPoint.x === Infinity) {
                break; // Điểm vô cực, dừng lại
            }
            subgroup.push(currentPoint);
        }
        return subgroup;
    }

    /* Tạo chữ ký cho một giá trị duy nhất v trên đường cong elliptic 
    /* Lý do là vì mình đang thể hiện trong demo là hàm số cho đường cong elliptic đơn giản
    /* Vì thế mình sẽ không sử dụng hàm băm cho giá trị v
    /* Chữ ký sẽ được tạo ra từ khóa riêng d và một giá trị ngẫu nhiên k    
    /* @param {number} v - Giá trị cần ký */
    /* @param {number} d - Khóa riêng */
    /* @returns {Object} - Chữ ký bao gồm r và s */
    signSingleValue(v, d) {
        let desc = "Private key d: " + d + "\n";
        const subGroup = this.getSubGroup(this.points[selectedIndex]); // Lấy nhóm con từ điểm được chọn
        const n = subGroup.length + 1; // Số lượng điểm trong nhóm con
        desc += `Subgroup of G(${this.points[selectedIndex].x}, ${this.points[selectedIndex].y}) size n: ${n}\n`;
        const z = v % n; // Giá trị băm của v và normalize nó về [0, n-1]
        desc += `Compute z = v mod n ==> ${z} --- this is to make sure z will be in the range [0, n-1]\n`;
        let tempDesc = "";
        do {
            tempDesc = ""; // Khởi tạo biến tạm để lưu trữ mô tả
            const k = Math.floor(Math.random() * (n - 2)) + 1; // Tạo số ngẫu nhiên k trong khoảng [1, n-1]
            tempDesc += `Choose a random k at [1, n-1]: ${k}\n`;
            const kG = this.multiply(k, this.points[selectedIndex]); // Nhân k với điểm sinh G
            tempDesc += `Compute kG = k * G(${this.points[selectedIndex].x}, ${this.points[selectedIndex].y}) ==> (${kG.x}, ${kG.y})\n`;
            if (kG.x === Infinity || kG.x === 0) continue;
            const r = kG.x % n; // Tính toán r từ hoành độ của kG
            tempDesc += `Compute r = kG.x mod n ==> ${r}\n`;
            if (r === 0) continue; // Nếu r = 0, chọn lại k
            const s = (modInverse(k, n) * (z + d * r)) % n; // Tính toán s từ k, z và d
            tempDesc += `Compute s = k^(-1) * (z + d * r) mod n ==> ${s}\n`;
            if (s === 0) continue; // Nếu s = 0, chọn lại k
            desc += tempDesc; // Thêm mô tả tạm vào mô tả chính
            desc += `Signature: (r, s) = (${r}, ${s})\n`;
            return { r: r, s: s, description: desc }; // Trả về chữ ký bao gồm r và s
        } while (true); // Lặp lại cho đến khi tìm được giá trị k hợp lệ
    }

    /* Xác thực chữ ký cho một giá trị duy nhất v trên đường cong elliptic
    /* Lý do là vì mình đang thể hiện trong demo là hàm số cho đường cong elliptic đơn giản
    /* Vì thế mình sẽ không sử dụng hàm băm cho giá trị v
    /* Chữ ký sẽ được tạo ra từ khóa riêng d và một giá trị ngẫu nhiên k
    /* @param {number} v - Giá trị cần ký */
    /* @param {Object} sig - Chữ ký bao gồm r và s */
    /* @param {Object} Q - Điểm công khai */
    /* @returns {boolean} - Kết quả xác thực chữ ký */
    verifySingleValueSignature(v, sig, Q) {
        let desc = `Public key Q: (${Q.x}, ${Q.y})\n`;
        const subGroup = this.getSubGroup(this.points[selectedIndex]); // Lấy nhóm con từ điểm được chọn
        const n = subGroup.length + 1; // Số lượng điểm trong nhóm con
        desc += `Subgroup of G(${this.points[selectedIndex].x}, ${this.points[selectedIndex].y}) size n: ${n}\n`;
        const z = v % n; // Giá trị băm của v và normalize nó về [0, n-1]
        desc += `Compute z = v mod n ==> ${z} --- this is to make sure z will be in the range [0, n-1]\n`;
        const w = modInverse(sig.s, n); // Tính toán w từ s
        desc += `Compute w = s^(-1) mod n ==> ${w}\n`;
        const u1 = (z * w) % n; // Tính toán u1 từ z và w
        desc += `Compute u1 = z * w mod n ==> ${u1}\n`;
        const u2 = (sig.r * w) % n; // Tính toán u2 từ r và w
        desc += `Compute u2 = r * w mod n ==> ${u2}\n`;
        const u1G = this.multiply(u1, this.points[selectedIndex]); // Nhân u1 với điểm sinh G
        desc += `Compute u1G = u1 * G(${this.points[selectedIndex].x}, ${this.points[selectedIndex].y}) ==> (${u1G.x}, ${u1G.y})\n`;
        const u2Q = this.multiply(u2, Q); // Nhân u2 với điểm công khai Q
        desc += `Compute u2Q = u2 * Q(${Q.x}, ${Q.y}) ==> (${u2Q.x}, ${u2Q.y})\n`;
        const S = this.add(u1G, u2Q); // Cộng hai điểm u1G và u2Q
        desc += `Compute S = u1G + u2Q ==> (${S.x}, ${S.y})\n`;
        
        if (S.x % n === sig.r) { // Kiểm tra xem hoành độ của S có bằng r không
            desc += `Signature is VALID. [S.x mod n = ${S.x % n} === r = ${sig.r}]\n`;
            return { valid: true, description: desc}; // Chữ ký hợp lệ
        }

        desc += `Signature is INVALID. [S.x mod n = ${S.x % n} !== r = ${sig.r}]\n`;
        return { valid: false, description: desc}; // Chữ ký không hợp lệ
    }
}