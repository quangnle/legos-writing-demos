class DrawingPanel{
    constructor(x,y,w,h){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.values = new Array(w).fill(0);
    }

    draw(){
        background(255);
        push();
        translate(this.x,this.y);                
        rect(0, 0, this.w, this.h);
        stroke(0);
        for(let i = 0; i < this.values.length - 1; i++){
            line(i, this.values[i], i + 1, this.values[i + 1]);
        }
        pop();
    }

    mouseDragged(mx ,my){
        if (mx > this.x+3 && mx < this.x + this.w-3 && my > this.y && my < this.y + this.h){
            let x = mx - this.x;
            let y = my - this.y;
            
            // the reason for the -3 and +3 is to improve the performance of the drawing
            this.values[x-3] = y;            
            this.values[x-2] = y;            
            this.values[x-1] = y;            
            this.values[x] = y;            
            this.values[x+1] = y;            
            this.values[x+2] = y;            
            this.values[x+3] = y;            
        }
    }    
}