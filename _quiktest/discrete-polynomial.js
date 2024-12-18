class Field {
    constructor(p) {
        this.p = p;
    }

    add(a, b) {
        let s = a + b;
        s = s > 0 ? s % this.p : this.minv(-s);
        return s;
    }

    minus(a, b) {        
        return this.add(a, this.ainv(b));
    }

    mul(a, b) {
        let s = a * b;
        s = s > 0 ? s % this.p : this.ainv(-s);
        return s;
    }

    div(a, b) {
        return this.mul(a, this.minv(b));
    }   

    // additive inverse of a
    // is b such that a + b = 0 mod p
    // b = -a mod p = (-1)*a mod p = (p-1)*a mod p
    ainv(a) {
        return ((this.p - 1) * a) % this.p;
    }

    // multiplicative inverse of a in the field F_p
    // is b such that a * b = 1 mod p
    // b = a^(p-2) mod p
    minv(a) {
        return this.pow(a, this.p - 2);
    }


    // power a to the n-th power mod p
    // continuously square a and reduce mod p
    pow(a, n) {
        let result = 1;
        while (n > 0) {
            if (n % 2 === 1) {
                result = this.mul(result, a);
            }
            a = this.mul(a, a);
            n = Math.floor(n / 2);
        }
        return result;
    }

    // evaluate polynomial p at x
    polyEval(p, x) {
        let result = 0;
        for (let i = 0; i < p.length; i++) {
            result = this.add(result, this.mul(p[i], this.pow(x, i)));
        }
        return result;
    }

    // add two polynomials
    polyAdd(p1, p2) {
        let result = [];
        for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
            result.push(this.add(i < p1.length ? p1[i] : 0, i < p2.length ? p2[i] : 0));
        }
        return result;
    }

    // subtract two polynomials
    polyMinus(p1, p2) {
        let result = [];
        for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
            result.push(this.minus(i < p1.length ? p1[i] : 0, i < p2.length ? p2[i] : 0));
        }
        return result;
    }

    // multiply two polynomials
    polyMul(p1, p2) {
        let product = Array(p1.length + p2.length - 1).fill(0);
        for (let i = 0; i < p1.length; i++) {
            for (let j = 0; j < p2.length; j++) {
                product[i + j] = this.add(product[i + j], this.mul(p1[i], p2[j]));
            }
        }
        return product;
    }

    // divide two polynomials
    polyDiv(p1, p2) {
        let quotient = [];
        let remainder = p1.slice();

        while (remainder.length >= p2.length) {
            let leadCoeff = this.div(remainder[remainder.length - 1], p2[p2.length - 1]);
            let degreeDiff = remainder.length - p2.length;
            let term = Array(degreeDiff).fill(0).concat(leadCoeff);

            quotient = this.polyAdd(quotient, term);
            remainder = this.polyMinus(remainder, this.polyMul(term, p2));
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

    // polynomial power
    polyPow(p, n) {
        let result = [1];
        while (n > 0) {
            if (n % 2 === 1) {
                result = this.polyMul(result, p);
            }
            p = this.polyMul(p, p);
            n = Math.floor(n / 2);
        }
        return result;
    }
}