/**
 * dRNG Demo - Protocol Logic
 * VRF, El-Gamal, PoE, Homomorphic Tallying
 */

/** Simple hash for Schnorr proof */
function simpleHash(...args) {
    let s = args.map(a => String(a)).join('|');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/**
 * VRF_Prove: y_i = nonce^sk_i mod N, Schnorr-style proof
 */
function vrfProve(ec, G, N, sk_i, pk_i, nonce, T) {
    const nonceNum = typeof nonce === 'string'
        ? (nonce.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % N) || 1
        : (Math.abs(nonce) % N) || 1;
    const y_i = modPow(nonceNum, sk_i, N);

    const r = Math.floor(Math.random() * (N - 1)) + 1;
    const B0 = ec.multiply(r, G);
    const t = modPow(nonceNum, r, N);
    const c = simpleHash(pointToNum(pk_i, ec.p), T, y_i, pointToNum(B0, ec.p), t) % N;
    if (c === 0) return vrfProve(ec, G, N, sk_i, pk_i, nonce, T);
    const z = (r + c * sk_i) % N;
    const pi_i = { c, z, t };

    return { y_i, pi_i };
}

/**
 * VRF_Verify: check y_i and pi_i
 * Verifies: z*G - c*pk = B0' and nonce^z = t * y_i^c
 */
function vrfVerify(ec, G, N, pk_i, nonce, T, y_i, pi_i) {
    const nonceNum = typeof nonce === 'string'
        ? (nonce.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % N) || 1
        : (Math.abs(nonce) % N) || 1;
    const { c, z, t } = pi_i;

    const zG = ec.multiply(z, G);
    const cPk = ec.multiply(c, pk_i);
    const B0_prime = ec.add(zG, ec.negate(cPk));

    const invY = modInverse(y_i, N);
    if (!invY) return false;
    const tExpected = (modPow(nonceNum, z, N) * modPow(invY, c, N)) % N;

    const c_prime = simpleHash(pointToNum(pk_i, ec.p), T, y_i, pointToNum(B0_prime, ec.p), t) % N;
    return c_prime === c && tExpected === t;
}

/**
 * El-Gamal Encrypt: (C, D) = (k*G, k*Y + M)
 */
function elGamalEncrypt(ec, G, Y, k, M) {
    const C = ec.multiply(k, G);
    const kY = ec.multiply(k, Y);
    const D = ec.add(kY, M);
    return { C, D };
}

/**
 * El-Gamal Decrypt: M = D - x*C
 */
function elGamalDecrypt(ec, x, C, D) {
    const xC = ec.multiply(x, C);
    return ec.add(D, ec.negate(xC));
}

/**
 * Sum ciphertexts homomorphically
 */
function sumCiphertexts(ec, ciphertexts) {
    let C = null;
    let D = null;
    for (const { C: Ci, D: Di } of ciphertexts) {
        C = C === null ? Ci : ec.add(C, Ci);
        D = D === null ? Di : ec.add(D, Di);
    }
    return {
        C: C || { x: Infinity, y: Infinity },
        D: D || { x: Infinity, y: Infinity }
    };
}

/**
 * Compute ticket for node: nonce^pk mod p (simplified per user request)
 */
function computeTicket(nonce, pk, p) {
    const pkNum = typeof pk === 'object' ? pointToNum(pk, p) : pk;
    const nonceNum = typeof nonce === 'string'
        ? (nonce.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % p) || 1
        : (Math.abs(nonce) % p) || 1;
    return modPow(nonceNum, pkNum % p, p);
}

/**
 * Compute session ticket T from nonce and Requester PK
 */
function computeSessionTicket(nonce, Y, p) {
    const yNum = pointToNum(Y, p);
    const nonceNum = typeof nonce === 'string'
        ? (nonce.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % p) || 1
        : (Math.abs(nonce) % p) || 1;
    return modPow(nonceNum, yNum % p, p);
}
