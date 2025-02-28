class Box {
    constructor(id, value) {
        this.id = id;
        this.value = value;
        this.isOpen = false;
    }

    toString() {
        return `Box(${this.id + 1}, ${this.value})`;
    }

    draw() {
        this.x = this.id % 10 * 40;
        this.y = Math.floor(this.id / 10) * 40;
        this.w = 40;
        this.h = 40;

        if (this.isOpen) {
            fill(100, 100, 255);
            rect(this.x, this.y, this.w, this.h);
            fill(0);
            textSize(16);
            textAlign(CENTER, CENTER);
            text(this.value, this.x + 20, this.y + 20);
        } else {
            fill(255);
            rect(this.x, this.y, this.w, this.h);
            fill(0);
            textSize(16);
            textAlign(CENTER, CENTER);
            text(this.id + 1, this.x + 20, this.y + 20);
        }
    }

    onMousePressed() {
        if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
            this.isOpen = true;
        }
    }
}