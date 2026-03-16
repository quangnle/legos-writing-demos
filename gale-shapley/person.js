class Person{
    constructor(name, gender, preferences = null, x = 0, y = 0){
        this.name = name;
        this.preferences = preferences;
        this.partner = null;
        this.x = x;
        this.y = y;
        this.gender = gender;
    }

    propose(){
        // return the most preferred
        const target = this.preferences.shift();
        return target;
    }

    accept(propose){
        // check if the person is free
        if (this.partner == null){
            return true;
        }

        // check if the propose is more preferred
        const index = this.preferences.indexOf(propose);
        const partnerIndex = this.preferences.indexOf(this.partner);
        if (index < partnerIndex) {            
            return true;
        }

        return false;        
    }

    reject(){
        // free the partner
        if (this.partner != null){
            this.partner.partner = null;
        }        
    }

    draw() {
        const boxW = 130;
        const boxH = 56;

        if (this.gender === 'male') {
            fill(59, 130, 246);
            stroke(96, 165, 250);
        } else {
            fill(236, 72, 153);
            stroke(244, 114, 182);
        }
        strokeWeight(2);
        rect(this.x - boxW/2, this.y - boxH/2, boxW, boxH, 8);

        noStroke();
        fill(255);

        // Line 1: 👦 [A]ndy — emoji + first letter bold
        const emoji = this.gender === 'male' ? '👦' : '👧';
        const firstChar = this.name.charAt(0);
        const restName = this.name.slice(1);
        const line1Prefix = emoji + ' [';
        const line1Suffix = ']' + restName;

        textSize(18);
        textAlign(LEFT, CENTER);
        push();
        translate(this.x, this.y - 10);
        textStyle(NORMAL);
        const w1 = textWidth(line1Prefix);
        textStyle(BOLD);
        const w2 = textWidth(firstChar);
        textStyle(NORMAL);
        const w3 = textWidth(line1Suffix);
        let xOff = -(w1 + w2 + w3) / 2;
        textStyle(NORMAL);
        text(line1Prefix, xOff, 0);
        xOff += w1;
        textStyle(BOLD);
        text(firstChar, xOff, 0);
        xOff += w2;
        textStyle(NORMAL);
        text(line1Suffix, xOff, 0);
        pop();

        // Line 2: first letters of candidates (e.g. B, C, D, E)
        fill(230);
        textSize(10);
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        const candidateLetters = this.preferences.map(p => p.name.charAt(0)).join(', ');
        text(candidateLetters || '—', this.x, this.y + 12);
    }

    toString(){
        return `${this.name} (${this.preferences.map(p => p.name)})`;
    }
}