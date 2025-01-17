function setup(){
    createCanvas(800, 800);   
}

function draw(){
    background(255);
    if (sinePanels.length > 0){
        sinePanels.forEach(panel => panel.draw());
        combinedPanel.draw();
    }
}