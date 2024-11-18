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

    receive(propose){
        // check if the person is free
        if (this.partner == null){
            this.partner = propose;
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

    gotRejected(){
        // remove the propose from the preferences
        const index = this.preferences.indexOf(this.partner);
        this.preferences.splice(index, 1);

        // if the person is rejected then the person is free
        this.partner = null;
    }

    draw() {
        fill(0);
        
        // if the person is male then the ellipse is blue else pink
        if (this.gender === 'male') {
            fill(0, 0, 255); // blue color
        } else {
            fill(255, 192, 203); // pink color
        }

        rect(this.x - 50, this.y - 25, 100, 50);
        fill(0);
        textAlign(CENTER, CENTER);
        text(this.name, this.x, this.y);
    }
}