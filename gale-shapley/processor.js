class Processor {
    constructor(n=0, males=null, females=null) {
        this.n = n;
        this.males = males;
        this.females = females;   
        this.content = "";
    }

    permutate(persons) {
        // generate the indices from 0 to n-1
        const indices = Array.from({length: persons.length}, (_, i) => i);
        // shuffle the indices
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        // map the indices to the persons
        const result = indices.map(i => persons[i]);
        return result;
    }

    generate(n){
        this.n = n;
        // generate n persons for each gender
        this.males = [];
        this.females = [];
        for (let i = 0; i < n; i++){
            const male = new Person('M' + i, 'male');
            const female = new Person('F' + i, 'female');
            this.males.push(male);
            this.females.push(female);
        }    
        
        // generate random the preferences for each person
        for (let i = 0; i < n; i++){
            this.males[i].preferences = this.permutate(this.females);
            this.females[i].preferences = this.permutate(this.males);
        }
    }

    proposeOnce() {
        //console.log('---------- New Round ----------');        
        this.content += '---------- New Round ----------\n';
        // execute one round of proposing
        for (let i = 0; i < this.males.length; i++) {
            let male = this.males[i];
            // is free
            if (male.partner == null) {                
                const female = male.propose(); 

                //console.log(`${male.toString()} proposed to ${female.toString()}`);  
                this.content += `${male.toString()} proposed to ${female.toString()}\n`;

                const isAccepted = female.accept(male);                

                if (isAccepted) {
                    //console.log(`accepted`);
                    this.content += `accepted\n`;

                    // update new partner
                    male.partner = female;

                    // add the content
                    if (female.partner != null){
                        this.content += `${female.partner.toString()} is rejected\n`;
                    }
                    // rejects the current partner
                    female.reject();

                    // update the new partner
                    female.partner = male;
                    this.content += `${female.toString()} is engaged to ${male.toString()}\n`;
                }
            }
        }               

        // print the result
        //console.log('Current engagement');
        this.content += 'Current engagement\n';
        for (let i = 0; i < this.males.length; i++){
            if (this.males[i].partner != null){
                //console.log(`${this.males[i].name} is engaged to ${this.males[i].partner.name}`);

                // update the content
                this.content += `${this.males[i].name} is engaged to ${this.males[i].partner.name}\n`;
            }
        }
    }

    run() {
        console.log('Gale-Shapley Algorithm');
        console.log('----------------------');
        // print the result
        for (let i = 0; i < this.males.length; i++){
            console.log(`${this.males[i].toString()}`);
            console.log(`${this.females[i].toString()}`);
        }

        // execute the proposing until all are engaged
        let allEngaged = false;
        while (!allEngaged) {
            this.proposeOnce();
            allEngaged = this.males.every(m => m.partner != null);
        }

        // print the result
        console.log('----------------------');
        console.log('Final engagement');
        for (let i = 0; i < this.males.length; i++){
            console.log(`${this.males[i].name} is engaged to ${this.males[i].partner.name}`);
        }
    }

    draw() {
        // initialize the position
        const size = this.n*30;
        for (let i = 0; i < this.n; i++){
            this.males[i].x = size*i + 70;
            this.males[i].y = 30;
            this.females[i].x = size*i + 70;
            this.females[i].y = 300;
        }
        
        // draw the connections
        for (let i = 0; i < this.n; i++){
            if (this.males[i].partner != null){
                // draw the line
                stroke(0);
                line(this.males[i].x, this.males[i].y, this.males[i].partner.x, this.males[i].partner.y);
            }
        }

        // draw the persons
        for (let i = 0; i < this.n; i++){
            this.males[i].draw();
            this.females[i].draw();
        }
    }
}