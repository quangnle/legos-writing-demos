class ComplexNumber {
    constructor(real, imaginary) {
        this.re = real;
        this.im = imaginary;
    }
    add(c) {
        if (typeof c == 'number') {
            return new ComplexNumber(this.re + c, this.im);
        }
        return new ComplexNumber(this.re + c.re, this.im + c.im);
    }
    sub(c) {
        if (typeof c == 'number') {
            return new ComplexNumber(this.re - c, this.im);
        }
        return new ComplexNumber(this.re - c.re, this.im - c.im);
    }
    mul(c) {
        if (typeof c == 'number') {
            return new ComplexNumber(this.re * c, this.im * c);
        }
        return new ComplexNumber(this.re * c.re - this.im * c.im, this.re * c.im + this.im * c.re);
    }    
    div(c) {
        if (typeof c == 'number') {
            return new ComplexNumber(this.re / c, this.im / c);
        }
        const d = c.re ** 2 + c.im ** 2;
        return new ComplexNumber((this.re * c.re + this.im * c.im) / d, (this.im * c.re - this.re * c.im) / d);
    }
    conj() {
        return new ComplexNumber(this.re, -this.im);
    }

    intDetect(n) {
        // convert a real number to the nearest integer if the it is within 10e-6 of the integer
        if (Math.abs(n - Math.round(n)) < 10e-6) {
            n = Math.round(n);
        }
        return n;
    }

    toString() {
        let re = Math.abs(this.re) >= 10e-6 ? this.re : 0.0;   
        re = this.intDetect(re);     
        let im = Math.abs(this.im) >= 10e-6 ? this.im : 0.0;
        im = this.intDetect(im);
        return `${re} + ${im}i`;
    }
}