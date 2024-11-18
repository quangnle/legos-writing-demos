class Processor {
    constructor(males=null, females=null) {
        this.males = males;
        this.females = females;
        //this.allPersons = [...males, ...females];
    }

    permutate(persons) {
        const indices = Array.from({length: persons.length}, (_, i) => i);
        // shuffle the indices
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const result = indices.map(i => persons[i]);
    }

    generate(n){
        for (let i = 0; i < n; i++){
            const male = new Person('M' + i, 'male');
            const female = new Person('F' + i, 'female');
            this.males.push(male);
            this.females.push(female);
        }                                
    }

    proposeOnce() {
        // execute one round of proposing
        for (let i = 0; i < this.males.length; i++) {
            let male = this.males[i];
            // is free
            if (male.partner == null) {
                const female = male.propose(); 
                const accept = female.receive(male);

                if (accept) {
                    // update new partner
                    male.partner = female;

                    // free the old partner
                    female.partner.gotRejected();

                    // update the new partner
                    female.partner = male;
                }
            }
        }
    }

    process() {
        // execute the proposing until all are engaged
        let allEngaged = false;
        while (!allEngaged) {
            this.proposeOnce();
            allEngaged = this.males.every(m => m.partner != null);
        }
    }
}