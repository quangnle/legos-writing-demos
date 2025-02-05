function dft(xs) {
    const N = xs.length;
    const result = new Array(N);
    for (let k = 0; k < N; k++) {
        let sumRe = 0;
        let sumIm = 0;
        for (let n = 0; n < N; n++) {
            const angle = (2 * Math.PI * k * n) / N;
            sumRe += xs[n] * Math.cos(angle);
            sumIm -= xs[n] * Math.sin(angle);
        }

        sumRe /= N;
        sumIm /= N;

        const freq = k;
        const amp = Math.sqrt(sumRe * sumRe + sumIm * sumIm);
        const phase = Math.atan2(sumIm, sumRe);

        result[k] = { freq, amp, phase };
    }
    return result;
}