class Layer2 {
    constructor() {
        this.addresses = ['0x0'];
        this.balances = [0];
        this.transactions = [];
    }
    
    mint(address, amount) {
        // check if account exists        
        const index = this.addresses.findIndex(a => a == address);
        if (index == -1) {
            this.addresses.push(address);
            this.balances.push(amount);
        } else {
            this.balances[index] += amount;
        }
        this.transactions.push(this.createNewTransaction('0x0', address, amount));
    }

    createNewTransaction(from, to, amount) {
        return new Transaction(this.transactions.length, from, to, amount);
    }

    transfer(from, to, amount) {
        // check if account exists        
        const fromIndex = this.addresses.findIndex(a => a == from);
        const toIndex = this.addresses.findIndex(a => a == to);
        if (fromIndex == -1) {
            throw new Error(`Account ${from} does not exist`);
        } 
        if (toIndex == -1) {
            throw new Error(`Account ${to} does not exist`);
        } 
        if (this.balances[fromIndex] < amount) {
            throw new Error(`Insufficient balance in account ${from}`);
        }
        this.balances[fromIndex] -= amount;
        this.balances[toIndex] += amount;
        const newTx = this.createNewTransaction(from, to, amount);

        this.transactions.push(newTx);
    }
}