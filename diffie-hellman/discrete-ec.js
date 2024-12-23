class DiscreteEC {
    // p is the prime number of F_p
    // a and b are the coefficients of the elliptic curve y^2 = x^3 + ax + b    
    constructor(p, a, b) {
        this.p = p;
        this.a = a;
        this.b = b;
    }

    // is the point (x, y) on the curve?
    isPoint(x, y) {
        return (y * y) % this.p == (x * x * x + this.a * x + this.b) % this.p;
    }

    // get all points
    points() {
        let points = [];
        for (let x = 0; x < this.p; x++) {            
            for (let y = 0; y < this.p; y++) {
                if (this.isPoint(x, y)) {
                    points.push([x, y]);
                }
            }
        }
        return points;
    }

    // mod inverse of F_p
    modInverse(a) {      
        a = a < 0 ? ((this.p-1) * -a)%this.p : a % this.p;   
        for (let x = 1; x < this.p; x++) {
            if ((a * x) % this.p == 1) {
                return x;
            }
        }
        return undefined;
    }

    // add two points
    add(p1, p2) {
        let [x1, y1] = p1;
        let [x2, y2] = p2;
        let m;
        if (x1 == x2 && y1 == y2) {
            m = (3 * x1 * x1 + this.a) * this.modInverse(2 * y1);
        } else {
            m = (y2 - y1) * this.modInverse(x2 - x1);
        }
        let x = (m * m - x1 - x2) % this.p;
        let y = (m * (x1 - x) - y1) % this.p;
        return (isNaN(x) || isNaN(y)) ? undefined : [x, y];
    }

    // multiply a point by a scalar 
    multiply(p, n) {
        // continuously doubling and adding
        let result = [undefined, undefined];
        let addend = p;
        while (n > 0) {
            if (n % 2 == 1) {
                if (result[0] == undefined) {
                    result = addend;
                } else {
                    result = this.add(result, addend);
                }
            }
            addend = this.add(addend, addend);
            n = Math.floor(n / 2);
        }
        return result;
    }

    // get subgroup order of point p
    order(p) {
        let order = 1;
        let result = p;
        while (result != undefined) {
            result = this.add(result, p);
            order++;
        }
        return order;
    }
}