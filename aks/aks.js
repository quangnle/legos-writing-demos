function AKSTest(n) {
    if (n < 2) return false;
    if (n === 2 || n == 3) return true;
    // clean the easy cases
    if (n % 2 === 0 || n % 3 === 0) return false;


    // step 1: if n is a perfect power, return false
    console.log(`Checking if ${n} is a perfect power ...`);
    if (checkIfNIsAPerfectPower(n)) return false;

    // step 2: find the smallest r such that Ord_r(n) > log2(n)^2
    console.log(`Finding the smallest r such that Ord_r(n) > log2(n)^2 ...`);
    let r = findSmallestR(n);
    console.log(`r = ${r}`);

    // I do a little tweak here to swap step 3 with step 4, if r is greater than n, return true
    //step 4: if (n <= r) return true
    console.log(`Checking if ${n} <= ${r} ...`);
    if (n <= r) return true;    

    // step 3: if 1 < gcd(a, n) < n for some a <= r, return false
    console.log(`Checking if 1 < gcd(a, n) < n for some a <= ${r} ...`);
    if (!checkIfGCDIsOne(r, n)) return false;

    // step 5: AKS check for a: 1 ... sqrt(φ(r)) * log2(n)
    // that (x - a)^n ≡ (x^n - a) (mod x^r - 1, n)
    console.log(`AKS check for a: 1 ... sqrt(φ(${r})) * log2(${n}) ...`);
    let totientR = totient(r);
    let upperBound = Math.floor(Math.sqrt(totientR) * Math.log2(n));
    
    // create the polynomial x^r - 1
    let polyR = createXrMinusOne(r);
    
    for (let a = 1; a <= upperBound; a++) {
        console.log(`Checking a = ${a} / ${upperBound} ...`);
        const lhs = polynomialModPow([a, 1], n, polyR);
        const rhs = computeXnPlusAModXrMinusOne(n, a, r);
        if (!polynomialEqual(lhs, rhs)) {
            return false;
        }
    }

    // step 6: return True
    return true;
}

// console.log(AKSTest(3214567)); // true