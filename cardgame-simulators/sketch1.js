const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF", "#00D0FF", "#00AA93", "#FF69B4"];

function setup() {   
    let cvs = createCanvas(700, 300);
    cvs.parent('canvas-container');
}

function drawPieChart(results) {
    let total = results.reduce((acc, val) => acc + val, 0);
    let start = 0;
    for (let i = 0; i < results.length; i++) {
        let angle = (results[i] / total) * TWO_PI;
        fill(colors[i]);
        arc(width / 2, height / 2, 300, 300, start, start + angle);
        start += angle;
    }
}

function drawBarChart(results) {
    let max = Math.max(...results);
    let barWidth = width / results.length;
    let barHeight = (height-100) / max;
    let total = results.reduce((acc, val) => acc + val, 0);
    
    for (let i=0; i< Object.keys(result_stats).length; i++) {
        const name = Object.keys(result_stats)[i];
        const value = Object.values(result_stats)[i];
        const percentage = value / total * 100;
        
        fill(colors[i]);
        rect(i * barWidth, height - value * barHeight, barWidth, results[i] * barHeight);
        fill(0);
        textAlign(CENTER);
        textSize(10);
        text(`${percentage.toFixed(3)} %`, i * barWidth + barWidth / 2, height - results[i] * barHeight - 10);        
        push();
        translate(i * barWidth + barWidth / 2, height - results[i] * barHeight - 10);
        rotate(HALF_PI);
        textAlign(RIGHT);
        text(name.toUpperCase(), -20, 0);
        pop();
    }
}

function draw() {
    background(255);    
    //drawPieChart(Object.values(result_stats));
    drawBarChart(Object.values(result_stats));
}