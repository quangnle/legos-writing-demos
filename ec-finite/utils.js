/* Tính căn bậc hai modulo p bằng thuật toán Tonelli-Shanks https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm
/* @param {number} a - Số cần tính căn bậc hai
/* @param {number} p - Modulo p */
/* @returns {number} - Căn bậc hai của a modulo p */
function modSqrt(a, p) {
    // trường hợp a = 0 đặc biệt
    if (a % p === 0) {
        return 0; // Trivial solution
    }

    // Kiểm tra xem n có phải là số chính phương đồng dư không (Tiêu chuẩn Euler) ---
    const legendre = modPow(a, (p - 1) / 2, p);
    if (legendre !== 1) {
        // n không phải là số chính phương đồng dư mod p
        return null; // Không có nghiệm
    }

    // Tonelli-Shanks algorithm cho căn bậc hai modulo p
    let s = 0;
    let q = p - 1;
    while (q % 2 === 0) {
        s++;
        q /= 2;
    }
    
    const z = findQuadraticNonResidue(p); // Tìm số không phải là bình phương modulo p
    if (z === null) {
        return null; // Không tìm thấy số không phải là bình phương
    }

    let m = s; // M <- S
    let c = modPow(z, q, p); // c <- z^Q mod P
    let t = modPow(a, q, p); // t <- a^Q mod P
    let r = modPow(a, (q + 1) / 2, p); // r <- a^((Q+1)/2) mod P

    while (t!==0 && t !== 1) {
        // Tìm i nhỏ nhất (0 < i < m) sao cho t^(2^i) ≡ 1 (mod p)
        let i = 0;
        let temp_t = t;
        while (temp_t !== 1 && i < m) {
            temp_t = (temp_t * temp_t) % p;
            i += 1;
        }

        const b = modPow(c, Math.pow(2, m - i - 1), p); // B <- C^(2^(M-i-1)) mod P
        m = i; // M <- I
        r = (r * b) % p; // R <- R * B mod P
        c = (b * b) % p; // C <- B^2 mod P
        t = (t * b * b) % p; // T <- T * C mod P
    }

    if (t === 0) {
        return 0; // Trivial solution
    }
    return r; // Trả về nghiệm
}

/* Tìm số không phải là bình phương modulo p bằng cách kiểm tra từng số từ 2 đến p-1 */
/* @param {number} p - Modulo p */
/* @returns {number} - Số không phải là bình phương modulo p */
function findQuadraticNonResidue(p) {
    for (let z = 2; z < p; z++) {
        if (modPow(z, (p - 1) / 2, p) !== 1) {
            return z;
        }
    }
    return null; // No quadratic non-residue found
}

/* Tính toán lũy thừa modulo p bằng thuật toán nhanh https://en.wikipedia.org/wiki/Exponentiation_by_squaring
/* @param {number} base - Cơ số
/* @param {number} exp - Số mũ */
/* @param {number} mod - Modulo p */
/* @returns {number} - Kết quả của base^exp mod p */
function modPow(base, exp, mod) {
    let result = 1;
    base = base % mod;
    while (exp > 0) {
        if (exp % 2 === 1) {
            result = (result * base) % mod;
        }
        exp = Math.floor(exp / 2);
        base = (base * base) % mod;
    }
    return result;
}    

/* Tính toán nghịch đảo modulo p */
/* Tính toán nghịch đảo modulo p bằng thuật toán Euclid mở rộng https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm#Modular_inversion
/* @param {number} a - Số cần tính nghịch đảo
/* @param {number} p - Modulo p */
/* @returns {number} - Nghịch đảo của a modulo p */
function modInverse(a, p) {

    let temp_t, q;
    let x0 = 0, x1 = 1;
    if (p === 1) return 0;
    let currentA = ((a % p) + p) % p; // Đảm bảo a là dương
    if (currentA === 0) return null; // Trường hợp đặc biệt

    let currentP = p; // Đảm bảo p là dương
    while (currentA > 1) {   
        
        if (currentP === 0) return null; // Trường hợp không có nghịch đảo

        q = Math.floor(currentA / currentP);
        temp_t = currentP;
        currentP = currentA % currentP;
        currentA = temp_t;
        let temp_x0 = x0;
        x0 = x1 - q * x0;
        x1 = temp_x0;
    }
    if (currentA !== 1) return null; // Không có nghịch đảo
    
    if (x1 < 0) x1 += p; // Đảm bảo x1 là dương
    return x1;
}