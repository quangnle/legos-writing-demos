/**
 * dRNG Demo - Elliptic Curve Utilities
 * Curve: y^2 = x^3 + 2x + 3 (mod 47)
 */
function modPow(base, exp, mod) {
    let result = 1;
    base = base % mod;
    while (exp > 0) {
        if (exp % 2 === 1) result = (result * base) % mod;
        exp = Math.floor(exp / 2);
        base = (base * base) % mod;
    }
    return result;
}

function modInverse(a, p) {
    let x0 = 0, x1 = 1;
    if (p === 1) return 0;
    let currentA = ((a % p) + p) % p;
    if (currentA === 0) return null;
    let currentP = p;
    while (currentA > 1) {
        if (currentP === 0) return null;
        const q = Math.floor(currentA / currentP);
        const temp_t = currentP;
        currentP = currentA % currentP;
        currentA = temp_t;
        const temp_x0 = x0;
        x0 = x1 - q * x0;
        x1 = temp_x0;
    }
    if (currentA !== 1) return null;
    if (x1 < 0) x1 += p;
    return x1;
}

function modSqrt(a, p) {
    if (a % p === 0) return 0;
    const legendre = modPow(a, (p - 1) / 2, p);
    if (legendre !== 1) return null;
    let s = 0, q = p - 1;
    while (q % 2 === 0) { s++; q /= 2; }
    let z = 2;
    for (; z < p; z++) if (modPow(z, (p - 1) / 2, p) !== 1) break;
    if (z >= p) return null;
    let m = s, c = modPow(z, q, p), t = modPow(a, q, p);
    let r = modPow(a, (q + 1) / 2, p);
    while (t !== 0 && t !== 1) {
        let i = 0; let temp_t = t;
        while (temp_t !== 1 && i < m) { temp_t = (temp_t * temp_t) % p; i++; }
        const b = modPow(c, Math.pow(2, m - i - 1), p);
        m = i; r = (r * b) % p; c = (b * b) % p; t = (t * b * b) % p;
    }
    return t === 0 ? 0 : r;
}

function pointsEqual(P, Q) {
    if (!P || !Q) return false;
    if (P.x === Infinity || Q.x === Infinity) return P.x === Q.x;
    return P.x === Q.x && P.y === Q.y;
}

function pointToNum(P, p) {
    if (!P || P.x === Infinity) return 0;
    return P.x * p + P.y;
}

function discreteLog(ec, P, G) {
    const N = getOrder(ec, G);
    for (let x = 0; x < N; x++) {
        const Q = ec.multiply(x, G);
        if (pointsEqual(P, Q)) return x;
        if (Q && Q.x === Infinity && P && P.x === Infinity) return x;
    }
    return null;
}

function getOrder(ec, G) {
    return ec.getSubGroup(G).length + 1;
}

class FiniteEC {
    constructor(a, b, p) {
        this.a = a; this.b = b; this.p = p;
        this.points = this.generatePoints();
    }

    generatePoints() {
        const points = [];
        for (let x = 0; x < this.p; x++) {
            const y2 = (x * x * x + this.a * x + this.b) % this.p;
            const y = modSqrt(y2, this.p);
            if (y !== null) {
                points.push({ x: x, y: y });
                if (y !== 0) points.push({ x: x, y: this.p - y });
            }
        }
        return points;
    }

    add(P, Q) {
        if (P.x === Q.x && P.y !== Q.y) return { x: Infinity, y: Infinity };
        if (P.x === Infinity) return Q;
        if (Q.x === Infinity) return P;
        let lambda;
        if (P.x === Q.x && P.y === Q.y) {
            const denom = (2 * P.y) % this.p;
            if (denom === 0) return { x: Infinity, y: Infinity };
            lambda = (3 * P.x * P.x + this.a) * modInverse(denom, this.p);
        } else {
            const denom = ((Q.x - P.x) % this.p + this.p) % this.p;
            if (denom === 0) return { x: Infinity, y: Infinity };
            lambda = (Q.y - P.y) * modInverse(denom, this.p);
        }
        let xr = (lambda * lambda - P.x - Q.x) % this.p;
        let yr = (lambda * (P.x - xr) - P.y) % this.p;
        if (xr < 0) xr += this.p;
        if (yr < 0) yr += this.p;
        return { x: xr % this.p, y: yr % this.p };
    }

    multiply(k, P) {
        if (k === 0 || !P || P.x === Infinity) return { x: Infinity, y: Infinity };
        let R = null, Q = P;
        k = ((k % (this.p * 2)) + (this.p * 2)) % (this.p * 2);
        while (k > 0) {
            if (k % 2 === 1) R = R === null ? Q : this.add(R, Q);
            Q = this.add(Q, Q);
            k = Math.floor(k / 2);
        }
        return R || { x: Infinity, y: Infinity };
    }

    getSubGroup(P) {
        const subgroup = [P];
        let current = P;
        for (let i = 1; i < this.p * 2; i++) {
            current = this.add(current, P);
            if (current.x === Infinity) break;
            subgroup.push(current);
        }
        return subgroup;
    }

    negate(P) {
        if (!P || P.x === Infinity) return P;
        return { x: P.x, y: (this.p - P.y) % this.p };
    }
}
