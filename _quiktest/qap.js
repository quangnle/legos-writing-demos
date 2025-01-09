const leftArr = [
    [0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 1, 0],
    [5, 0, 0, 0, 0, 1]
];

const rightArr = [
    [0, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0]
];

const outArr = [
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
    [0, 0, 1, 0, 0, 0]
];

function interPoly(arr) {
    const ps = [];
    for (let i = 0; i < arr.length; i++) {
        let p = [1];
        for (let j = 0; j < arr.length; j++) {
            if (i != j) {
                p = polyMul(p, [-(j + 1), 1]);
            }
        }
        const val = polyEval(p, i + 1);
        if (val == 0) {
            continue;
        }
        const lambda = arr[i] / val;
        p = p.map((x) => x * lambda);
        ps.push(p);
    }
    let result = new Array(ps[0].length).fill(0);
    for (let i = 0; i < ps.length; i++) {
        result = polyAdd(result, ps[i]);
    }

    return result;
}

function interPolyMatrix(arr) {
    const nCols = arr[0].length;
    const nRows = arr.length;
    const result = [];

    for (let i = 0; i < nCols; i++) {
        const p = [];
        for (let j = 0; j < nRows; j++) {
            p.push(arr[j][i]);
        }
        result.push(interPoly(p));
    }

    return result;
}

function computePoly(m, witness) {
    const result = new Array(m[0].length).fill(0);
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < m.length; j++) {
            result[i] += m[j][i] * witness[j];
        }
    }

    return result;
}

function generateT(nPoints) {
    let p = [1];
    for (let i = 1; i <= nPoints; i++) {
        p = polyMul(p, [-i, 1]);
    }
    return p;
}

// z = 3x^2y + 5xy - x - 2y + 3
// R1CS:
// v1 = 3xx
// v2 = v1y
// -v2 + x + 2y - 3 + z = 5xy

// witness {1,z,x,y,v1,v2}
const witness = [1, 3, 35, 9, 27, 30];

const lps = interPolyMatrix(leftArr);
const lp = computePoly(lps, witness);
console.log(`lp(x)= ${lp}`);

const rps = interPolyMatrix(rightArr);
const rp = computePoly(rps, witness);
console.log(`rp(x)= ${rp}`);

const ops = interPolyMatrix(outArr);
const op = computePoly(ops, witness);
console.log(`op(x)= ${op}`);

const lr = polyMul(lp, rp);
const lro = polyMinus(lr, op);
console.log(`lro(x)= ${lro}`);

const t = generateT(leftArr.length);
console.log(`t(x)= ${t}`);

const h = polyDiv(lro, t);
console.log(`h(x)= ${h.quotient}`);
console.log(`remainder = ${h.remainder}`);
