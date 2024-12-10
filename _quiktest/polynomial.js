function polyAdd(p1, p2) {
    let length = Math.max(p1.length, p2.length);
    let result = Array(length).fill(0);

    for (let i = 0; i < length; i++) {
        if (i < p1.length) result[i] += p1[i];
        if (i < p2.length) result[i] += p2[i];
    }

    return result;
}

function polyMinus(p1, p2) {
    let length = Math.max(p1.length, p2.length);
    let result = Array(length).fill(0);

    for (let i = 0; i < length; i++) {
        if (i < p1.length) result[i] += p1[i];
        if (i < p2.length) result[i] -= p2[i];
    }

    return result;
}

function polyMul(p, q) {
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

function polyDiv(p1, p2) {
    let quotient = [];
    let remainder = p1.slice();

    while (remainder.length >= p2.length) {
        let leadCoeff = remainder[remainder.length - 1] / p2[p2.length - 1];
        let degreeDiff = remainder.length - p2.length;
        let term = Array(degreeDiff).fill(0).concat(leadCoeff);

        quotient = polyAdd(quotient, term);
        remainder = polyMinus(remainder, polyMul(term, p2));
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

function polyPow(p, n) {
    let result = [1];
    for (let i = 0; i < n; i++) {
        result = polyMul(result, p);
    }
    return result;
}

function polyEval(p, x) {
    let result = 0;
    for (let i = 0; i < p.length; i++) {
        result += p[i] * Math.pow(x, i);
    }
    return result;
}