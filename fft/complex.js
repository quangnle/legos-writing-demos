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
    toString() {
        return `${this.re} + ${this.im}i`;
    }
}