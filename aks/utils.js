//
function gcd(a, b) {
    while (b !== 0) {
        let temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

//////////////////////////////////////////////////////////////////////
// step 1
function checkIfNIsAPerfectPower(n) {
    for (let i = 2; i <= Math.sqrt(n); i++) {
        let x = Math.round(Math.log(n) / Math.log(i));
        if (Math.pow(i, x) === n) {
            return true;
        }
    }
    return false;
}

//////////////////////////////////////////////////////////////////////
// step 2
function multiplicativeOrder(n, r) {
    if (gcd(n, r) !== 1) return -1; // n and r must be coprime

    let k = 1;
    let mod = n % r;
    
    while (mod !== 1) {
        mod = (mod * n) % r;
        k += 1;

        // If k exceeds r, return -1 as order does not exist within limit
        if (k > r) return -1;
    }
    
    return k;
}

// find smallest r such that o_r(n) > log^2(n)
function findSmallestR(n) {
    // Calculate log^2(n)
    const logSquaredN = Math.pow(Math.log(n), 2);
    
    let r = 2;
    while (true) {
        // Check if r is coprime to n
        if (gcd(n, r) === 1) {
            const order = multiplicativeOrder(n, r);
            
            // If order is greater than log^2(n), return r
            if (order > logSquaredN) {
                return r;
            }
        }
        
        // Increment r for next candidate
        r += 1;
    }
}

//////////////////////////////////////////////////////////////////////
// step 3
// check if 2<= a <=r, gcd(a,n) = 1
function checkIfGCDIsOne(r, n) {
    for (let i = 2; i <= r; i++) {
        if (gcd(i, n) !== 1) {
            return false;
        }
    }
    return true;
}

//////////////////////////////////////////////////////////////////////
// polynomial functions support for step 5
// polynomial defined by array of coefficients
// [a, b, c] represents a + bx + cx^2

// calculate the totient of r, phi(r)
function totient(r) {
    let count = 0;
    for (let i = 1; i < r; i++) {
        if (gcd(i, r) === 1) {
            count++;
        }
    }
    return count;
}

function polynomialAdd(p1, p2) {
    let length = Math.max(p1.length, p2.length);
    let result = Array(length).fill(0);

    for (let i = 0; i < length; i++) {
        if (i < p1.length) result[i] += p1[i];
        if (i < p2.length) result[i] += p2[i];
    }

    return result;
}

function polynomialSubtract(p1, p2) {
    let length = Math.max(p1.length, p2.length);
    let result = Array(length).fill(0);

    for (let i = 0; i < length; i++) {
        if (i < p1.length) result[i] += p1[i];
        if (i < p2.length) result[i] -= p2[i];
    }

    return result;
}

function polynomialMultiply(p, q) {
    // Initialize the product as an array of zeros
    let product = Array(p.length + q.length - 1).fill(0);

    // Multiply the polynomials
    for (let i = 0; i < p.length; i++) {
        for (let j = 0; j < q.length; j++) {
            product[i + j] += p[i] * q[j];
        }
    }

    return product;
}

function polynomialDivide(p1, p2) {
    let quotient = [];
    let remainder = p1.slice();

    while (remainder.length >= p2.length) {
        let leadCoeff = remainder[remainder.length - 1] / p2[p2.length - 1];
        let degreeDiff = remainder.length - p2.length;
        let term = Array(degreeDiff).fill(0).concat(leadCoeff);

        quotient = polynomialAdd(quotient, term);
        remainder = polynomialSubtract(remainder, polynomialMultiply(term, p2));
        remainder.pop();
    }

    // Remove leading zeros from the quotient
    while (quotient.length > 1 && quotient[quotient.length - 1] === 0) {
        quotient.pop();
    }

    // Remove leading zeros from the remainder
    while (remainder.length > 1 && remainder[remainder.length - 1] === 0) {
        remainder.pop();
    }

    return { quotient, remainder };
}

// calculate p^n mod q by repeated squaring
function polynomialModPow(p, n, q) {
    // Initialize the result as the identity element
    let result = [1];
    let order = n;

    // While n is greater than 0
    while (n > 0) {
        // If the least significant bit of n is 1
        if (n & 1) {
            // Multiply the result by p modulo q
            result = polynomialDivide(polynomialMultiply(result, p), q).remainder;

            // modulo n for all terms
            for (let i = 0; i < result.length; i++) {
                result[i] = result[i] % order;
            }
        }

        // Square p modulo q
        p = polynomialDivide(polynomialMultiply(p, p), q).remainder;        

        // modulo n for all terms
        for (let i = 0; i < p.length; i++) {
            p[i] = p[i] % order;
        }

        // Divide n by 2
        n >>= 1;
    }
    
    // remove leading zeros
    while (result.length > 1 && result[result.length - 1] === 0) {
        result.pop();
    }
    return result;
}

function polynomialEqual(p1, p2) {
    if (p1.length !== p2.length) return false;

    for (let i = 0; i < p1.length; i++) {
        if (p1[i] !== p2[i]) return false;
    }

    return true;
}

// generate polynomial x^r - 1
function createXrMinusOne(r) {
    let result = Array(r + 1).fill(0);
    result[0] = -1;
    result[r] = 1;
    return result;
}

// calculate x^n+a in Z[x]/(x^r-1)
function computeXnPlusAModXrMinusOne(n, a, r) {
    let remainder = n %r
    if (remainder === 0) {
        return [a + 1];
    } else {        
        let result = Array(remainder).fill(0);
        result[0] = a;
        result.push(1);
        return result;
    }
}