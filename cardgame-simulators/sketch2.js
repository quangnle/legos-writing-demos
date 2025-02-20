const MaxHeight = 250;
function setup() {
    let cvs = createCanvas(720, 300);
    cvs.parent('canvas-container');
}

function drawAValue(x, y, value, totalMatches) {
    let nWins = stats[value+"-win"] ? stats[value+"-win"] : 0;
    let nLosses = stats[value+"-bust"] ? stats[value+"-bust"] : 0;
    let n5C = stats[value+"-5C"] ? stats[value+"-5C"] : 0;
    let total = nWins + nLosses;
    let percentage = totalMatches > 0 ? (total / totalMatches)  * 100 : 0;
    let percentageWins = total > 0 ? (nWins / total) * 100 : 0;
    let percentage5C = total > 0 ? (n5C / total) * 100 : 0;
    
    fill(0);
    let colHeight = map(total, 0, totalMatches, 0, MaxHeight);
    let winHeight = map(nWins, 0, totalMatches, 0, MaxHeight);

    fill(255, 0, 0);
    rect(x, y, 30, -colHeight * 5);
    fill(0, 255, 0);
    rect(x, y, 30, -winHeight * 5);

    let label = "";
    if (value <= 21) {
        label = value;
    } else if (value === 50) {
        label = "5C";
    } else if (value === 100) {
        label = "BJ";
    } else if (value === 200) {
        label = "AA";
    }

    fill(0);
    textAlign(CENTER);
    text(label, x + 15, y + 12);    

    fill(0);
    textSize(9);
    textAlign(CENTER);
    text(percentage.toFixed(1) + "%", x + 15, height - colHeight * 5 - 45);

    fill(0,255,0);    
    text(percentageWins.toFixed(1) + "%", x + 15, height - colHeight * 5 - 35);

    fill(0,0,255);
    text(percentage5C.toFixed(2) + "%", x + 15, height - colHeight * 5 - 25);
}

function draw() {
    background(255);
    let x = 20;
    let y = height - 20;
    let totalMatches = 0;
    if (!stats) return;

    for (let key in stats) {
        totalMatches += stats[key];
    }
    
    let values = [200,100];
    for (let i = 20; i >= 4; i--) {
        values.push(i);
    }

    for (let value of values) {
        drawAValue(x, y, value, totalMatches);
        x += 35;
    }
}