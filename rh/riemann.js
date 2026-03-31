/**
 * Riemann Hypothesis Math Logic
 */

// Sieve of Eratosthenes to find primes up to MAX_N
function sieve(n) {
    const isPrime = new Array(n + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    for (let p = 2; p * p <= n; p++) {
        if (isPrime[p]) {
            for (let i = p * p; i <= n; i += p)
                isPrime[i] = false;
        }
    }
    const primes = [];
    for (let i = 2; i <= n; i++) {
        if (isPrime[i]) primes.push(i);
    }
    return primes;
}

// Actual Prime Counting Function pi(x)
function piActual(x, primes) {
    let count = 0;
    for (let p of primes) {
        if (p <= x) count++;
        else break;
    }
    return count;
}

// Actual Prime-Power Counting Function J(x)
// J(x) = pi(x) + 1/2 pi(x^1/2) + 1/3 pi(x^1/3) + ...
function jActual(x, primes) {
    let total = 0;
    let n = 1;
    while (true) {
        let rootX = Math.pow(x, 1 / n);
        if (rootX < 2) break;
        total += (1 / n) * piActual(rootX, primes);
        n++;
    }
    return total;
}

// Logarithmic Integral li(x) = integral from 0 to x of dt/ln(t)
// We calculate from 2 to x and add li(2) approx 1.04516
// Or just integrate from 2 to x for the approximation relative to pi(x)
function li(x) {
    if (x < 2) return 0;
    const steps = 1000;
    const dt = (x - 2) / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
        let t = 2 + (i + 0.5) * dt;
        sum += 1 / Math.log(t);
    }
    return sum * dt + 1.0451637801; // li(2)
}

// Contribution of a pair of non-trivial zeros rho, rho_bar = 1/2 +/- i*gamma
// 2 * Re( li(x^rho) ) = 2 * integral from 2 to x of t^(-1/2) * cos(gamma * ln(t)) / ln(t) dt
function liRhoPair(x, gamma) {
    if (x < 2) return 0;
    // Frequency of cos(gamma * ln(t)) increases with gamma.
    // To avoid aliasing, we need steps proportional to gamma * ln(x).
    const lnx = Math.log(x);
    const steps = Math.max(1000, Math.ceil(gamma * lnx * 2)); 
    const dt = (x - 2) / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
        let t = 2 + (i + 0.5) * dt;
        let lnt = Math.log(t);
        sum += (Math.pow(t, -0.5) * Math.cos(gamma * lnt)) / lnt;
    }
    return 2 * sum * dt;
}

// Riemann's explicit formula for J(x)
function jRiemann(x, numZeros) {
    if (x < 2) return 0;
    let val = li(x);
    for (let i = 0; i < numZeros && i < ZETA_ZEROS.length; i++) {
        val -= liRhoPair(x, ZETA_ZEROS[i]);
    }
    val -= Math.log(2); // The constant term
    // The integral term is very small for x > 2
    // integral from x to inf of dt / (t * (t^2-1) * ln t)
    return val;
}

// Mobius Function mu(n)
function mu(n) {
    if (n === 1) return 1;
    let count = 0;
    let temp = n;
    for (let i = 2; i * i <= temp; i++) {
        if (temp % i === 0) {
            count++;
            temp /= i;
            if (temp % i === 0) return 0;
        }
    }
    if (temp > 1) count++;
    return (count % 2 === 0) ? 1 : -1;
}

// pi(x) from J(x) via Mobius Inversion
// pi(x) = sum_{n=1}^inf mu(n)/n * J(x^1/n)
function piRiemann(x, numZeros) {
    let total = 0;
    let n = 1;
    while (true) {
        let rootX = Math.pow(x, 1 / n);
        if (rootX < 2) break;
        total += (mu(n) / n) * jRiemann(rootX, numZeros);
        n++;
    }
    return total;
}
