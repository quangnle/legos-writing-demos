/*
Calculates the modular inverse of a number.

Args:
    a: The number to find the inverse of.
    mod: The modulus.

Returns:
    The modular inverse of a.
*/
// Using Extended Euclidean Algorithm
function modInverse(a, mod) {
    let t = 0,
        newt = 1;
    let r = mod,
        newr = a;
    while (newr !== 0) {
        let quotient = Math.floor(r / newr);
        [t, newt] = [newt, t - quotient * newt];
        [r, newr] = [newr, r - quotient * newr];
    }
    if (r > 1) {
        return null; // a is not invertible
    }
    if (t < 0) {
        t += mod;
    }
    return t;
}

/*
Performs polynomial division on a finite field.

Args:
    p: The dividend polynomial as an array of coefficients (highest degree first).
    q: The divisor polynomial as an array of coefficients (highest degree first).
    mod: The modulus for the finite field.

Returns:
    An array [quotient, remainder] where both are arrays of coefficients.
*/
function fdiv(p, q, mod) {
    if (q.length > p.length) {
        return [[0], p]; // If divisor degree is higher, return 0 quotient and dividend as remainder
    }

    const quotient = new Array(p.length - q.length + 1).fill(0);
    const remainder = [...p]; // Create a copy of p

    for (let i = 0; i < quotient.length; i++) {
        let leadingCoeff = (remainder[i] * modInverse(q[0], mod)) % mod;
        quotient[i] = leadingCoeff;

        for (let j = 0; j < q.length; j++) {
            remainder[i + j] = (remainder[i + j] - leadingCoeff * q[j]) % mod;
        }
    }

    while (remainder.length > 0 && remainder[0] === 0) {
        remainder.shift(); // Remove leading zeros from remainder
    }

    return [quotient, remainder];
}

/*
Performs polynomial multiplication on a finite field.

Args:
    p: The first polynomial as an array of coefficients (highest degree first).
    q: The second polynomial as an array of coefficients (highest degree first).
    mod: The modulus for the finite field.

Returns:
    The product polynomial as an array of coefficients.
*/
function fmul(p, q, mod) {
    const result = new Array(p.length + q.length - 1).fill(0);

    for (let i = 0; i < p.length; i++) {
        for (let j = 0; j < q.length; j++) {
            result[i + j] = (result[i + j] + p[i] * q[j]) % mod;
        }
    }

    return result;
}

// generate display string for polynomial
function polynomialString(p){
    let str = '';
    // handle constant term
    if (p[0] !== 0) {
        str += p[0];
    }

    // handle other terms
    for(let i = 1; i < p.length; i++){
        // skip if coefficient is 0
        if (p[i] !== 0) {
            // add sign if needed
            if (str !== '') {
                str += ' + ';
            }
            // handle coefficient 1 and -1
            if (p[i] == 1) {
                str += 'x^' + i;
            } else if (p[i] == -1) {
                str += '-x^' + i;            
            } else { // handle other coefficients
                str += p[i] + 'x^' + i;
            }                    
        }
    }
    return str;
}