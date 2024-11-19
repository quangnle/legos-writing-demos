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
        // if the person is male then the ellipse is blue else pink
        if (this.gender === 'male') {
            fill(0, 100, 255); // blue color
        } else {
            fill(255, 192, 203); // pink color
        }

        const size = this.toString().length * 7;
        rect(this.x - size/2, this.y - 15, size, 30);

        fill(0);
        stroke(0);
        textAlign(CENTER, CENTER);
        text(this.toString(), this.x, this.y);
    }

    toString(){
        return `${this.name} (${this.preferences.map(p => p.name)})`;
    }
}