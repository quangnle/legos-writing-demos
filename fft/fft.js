// Description: Fast Fourier Transform (FFT) and Inverse Fast Fourier Transform (IFFT) algorithms.
function fft(p){
    if (p.length == 1) {
        return p;
    }

    // find the smallest power of 2 that is greater than or equal to the length of the polynomial
    const n = 2**Math.ceil(Math.log2(p.length));

    // calculate the nth root of unity via Euler's formula
    const re = Math.cos(-2 * Math.PI / n);
    const im = Math.sin(-2 * Math.PI / n);
    let w = new ComplexNumber(re, im);
    
    // pad the polynomial with zeros to make its length a power of 2
    const p_ = p.concat(Array(n - p.length).fill(0));
    const p_even = p_.filter((_, i) => i % 2 == 0);
    const p_odd = p_.filter((_, i) => i % 2 == 1);
    const y_even = fft(p_even);
    const y_odd = fft(p_odd);

    // combine the results of the subproblems
    const y = Array(n);
    let wj = new ComplexNumber(1, 0);
    for (let i = 0; i < n / 2; i++) {
        // combine the results of the subproblems
        // y[j] = y_even[j] + w^j * y_odd[j]
        y[i] = y_even[i].add(wj.mul(y_odd[i]));
        // y[j + n/2] = y_even[j] - w^j * y_odd[j]
        y[i + n / 2] = y_even[i].sub(wj.mul(y_odd[i]));

        // update the nth root of unity w^j
        wj = wj.mul(w);      
    }    
    
    return y;
}

// inverse FFT
function ifft(y){
    const n = y.length;
    const w = new ComplexNumber(Math.cos(2 * Math.PI / n), Math.sin(2 * Math.PI / n));
    const y_ = y.map(c => c.conj());
    const p_ = fft(y_).map(c => c.div(n));
    return p_;
}

function polyMul(p1, p2){
    const n = 2**Math.ceil(Math.log2(p1.length + p2.length));
    const y1 = fft(p1.concat(Array(n - p1.length).fill(0)).map(c => new ComplexNumber(c, 0)));
    const y2 = fft(p2.concat(Array(n - p2.length).fill(0)).map(c => new ComplexNumber(c, 0)));
    const y = y1.map((c, i) => c.mul(y2[i]));
    const p = ifft(y);
    return p;
}

const p1 = [1, 1, 3, 5, 9];
const p2 = [1, 2, 3, 4];
let p = polyMul(p1, p2);
console.log(p);