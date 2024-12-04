class Transaction {
    constructor(from, to, amount) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    hash() {
        return HashFunction.hash(this.id + this.from + this.to + this.amount);
    }

    toString() {
        return `[Tx ${this.id}]: from=${this.from}, to=${this.to}, amount=${this.amount}`;
    }
}