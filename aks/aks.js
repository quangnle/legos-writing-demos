async function AKSTest(n, logger = () => {}) {
    if (n < 2) return false;
    if (n === 2 || n == 3) return true;
    
    // clean the easy cases
    if (n % 2 === 0 || n % 3 === 0) {
        logger(`It's easy to see that $n = ${n}$ is divisible by $2$ or $3$, so it is composite.`, true);
        return false;
    }

    // step 1: if n is a perfect power, return false
    logger(`Step 1: Check if $n = ${n}$ is a perfect power...`, true);
    if (checkIfNIsAPerfectPower(n)) {
        logger(`$n = a^b$ with $b > 1$, so $n$ is composite.`, true);
        return false;
    }

    // step 2: find the smallest r such that Ord_r(n) > log2(n)^2
    logger(`Step 2: Find the smallest $r$ such that the order of $n \\pmod r > (\\log_2 n)^2$...`, true);
    let r = findSmallestR(n);
    logger(`Found $r = ${r}$.`, true);

    // I do a little tweak here to swap step 3 with step 4, if r is greater than n, return true
    //step 4: if (n <= r) return true
    logger(`Step 3: Compare $n$ with $r$ ($n=${n}, r=${r}$)...`, true);
    if (n <= r) {
        logger(`$n \\le r$, according to the AKS algorithm, $n = ${n}$ is prime.`, true);
        return true;
    }

    // step 3: if 1 < gcd(a, n) < n for some a <= r, return false
    logger(`Step 4: Check $\\gcd(a, n)$ for all $1 < a \\le r$...`, true);
    if (!checkIfGCDIsOne(r, n)) {
        logger(`Found a divisor of $n$, so $n = ${n}$ is composite.`, true);
        return false;
    }

    // step 5: AKS check for a: 1 ... sqrt(φ(r)) * log2(n)
    // that (x - a)^n ≡ (x^n - a) (mod x^r - 1, n)
    let totientR = totient(r);
    let upperBound = Math.floor(Math.sqrt(totientR) * Math.log2(n));
    logger(`Step 5: Check the polynomial congruence for $a \\in [1, ${upperBound}]$...`, true);
    logger(`$(x - a)^n \\equiv (x^n - a) \\pmod{x^r - 1, n}$`, true);

    // create the polynomial x^r - 1
    let polyR = createXrMinusOne(r);
    
    for (let a = 1; a <= upperBound; a++) {
        logger(`Checking $a = ${a}$ / ${upperBound}...`, true);
        
        // Yield to UI
        await new Promise(resolve => setTimeout(resolve, 0));
        
        const lhs = polynomialModPow([a, 1], n, polyR, n); // polyModPow needs n for coefficient mod
        const rhs = computeXnPlusAModXrMinusOne(n, a, r);
        
        if (!polynomialEqual(lhs, rhs)) {
            logger(`Congruence failed at $a = ${a}$. $n = ${n}$ is composite.`, true);
            return false;
        }
    }

    // step 6: return True
    logger(`All checks passed! According to the AKS algorithm, $n = ${n}$ is prime.`, true);
    return true;
}