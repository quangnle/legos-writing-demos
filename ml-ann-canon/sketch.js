let model;
let trainingData = [];
const g = .5;
const sampleSize = 3000;
const MaxEpochs = 50;
let trainTimes = 0;

// given target (x,y), calculate the angle and force required to hit the target
function simulateProjectile(x, y) {
    // calculate time of flight
    const T = 30;

    // calculate angle theta and force f
    // knowing x = f * cos(theta) * t and y = f * sin(theta) * t - 0.5 * g * t^2
    // we can solve for f and theta
    const A = x / T;
    const B = y / T + 0.5 * g * T;    
    const cosTheta = A / Math.sqrt(A**2 + B**2);
    const angle = Math.acos(cosTheta) * 180 / Math.PI;
    const force = A / cosTheta;

    // test the prediction
    // testSimulateProjectile(x, y, T, angle, force);
    
    return [T, angle, force];
}

function testSimulateProjectile(x,y,t,angle,force) {
    const angleRad = angle * Math.PI / 180;
    const x1 = force * cos(angleRad) * t;
    const y1 = force * sin(angleRad) * t - (0.5 * g * t ** 2);
    const error = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
    console.log(`Time:${t} Target: ${x}, ${y}, Predicted: ${x1}, ${y1} Error: ${error}`);
}

// Generate training data
function generateTrainingData() {
  for (let i = 0; i < sampleSize; i++) {
    let [x, y] = [random(0, width), random(0, height)];
    let [_, angle, force] = simulateProjectile(x, y);
    console.log(`Generating... Target: ${x}, ${y}, Angle: ${angle}, Force: ${force}`);
    trainingData.push({ input: [x, y], output: [angle, force] });
  }
}

// Setup neural network
function setupNN() {
    let options = {
        inputs: 2, // Target (x, y)
        outputs: 2, // Angle and Force
        task: 'regression',
        debug: true
    };
    model = ml5.neuralNetwork(options);

    // Add data to the model
    trainingData.forEach(data => {
        model.addData(data.input, data.output);
    });

    model.normalizeData();
}

// Train the neural network
function trainNN() {
    trainTimes += MaxEpochs;
    let options = {
        epochs: MaxEpochs,
    };
    model.train(options, () => {
        console.log("Model trained!");
    });    
}

// Predict force and angle for a target (x, y)
function predict() {
  sTime = 0;
  [_, sAngle, sForce] = simulateProjectile(target.x, height - target.y);
  console.log(`Accurate angle: ${sAngle} and force: ${sForce}`);
  if (trainTimes === 0) return;
  model.predict([target.x, height - target.y], (err, results) => {
    if (err) console.error(err);
    else {        
        time = 0;
        angle = results[0].value;
        force = results[1].value;
        console.log(`Making prediction for target: ${target.x}, ${height - target.y}`); 
        console.log(`===> Predicted angle: ${results[0].value} and force: ${results[1].value}`);
    }
  });
}

let target = { x: 400, y: 150 };
// ANN projectile
let projectile = { x: 0, y: 0 };
let time = 0;
let force = 0;
let angle = 0;

// Accurate Simulated projectile 
let projectile2 = { x: 0, y: 0 };
let sTime = 0;
let sForce = 0;
let sAngle = 0;

// Setup buttons and event listeners
function setup() {
    createCanvas(800, 500);
    generateTrainingData();
    setupNN();

    document.getElementById("train").addEventListener("click", () => {
        trainNN();
    });
}

function draw() {
    background(220);   

    // update projectile position with origin at (0, height)
    let angleRad = angle * Math.PI / 180;
    projectile.x = force * cos(angleRad) * time;
    projectile.y = height - (force * sin(angleRad) * time - (0.5 * g * time ** 2));
    // draw ANN's projectile
    fill("green");
    ellipse(projectile.x, projectile.y, 10, 10);

    // update simulated projectile position with origin at (0, height)
    let sAngleRad = sAngle * Math.PI / 180;
    projectile2.x = sForce * cos(sAngleRad) * sTime;
    projectile2.y = height - (sForce * sin(sAngleRad) * sTime - (0.5 * g * sTime ** 2));        
    // draw simulated projectile
    fill("blue");
    ellipse(projectile2.x, projectile2.y, 10, 10);

    // ===============================================================

    // draw target
    fill("red");
    ellipse(target.x, target.y, 10, 10);

    // legendary text
    fill(0);
    text(`Target: ${target.x}, ${target.y}`, 10, 15);
    fill("green");
    text(`[GREEN] ANN's Projectile --- Predicted Angle: ${angle.toFixed(2)} Predicted Force: ${force.toFixed(2)}`, 10, 30);
    fill("blue");
    text(`[BLUE] Simulated Projectile --- Accurate Angle: ${sAngle.toFixed(2)} Accurate Force: ${sForce.toFixed(2)}`, 10, 45);

    // update time
    time += 0.3;
    sTime += 0.3;
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
    target.x = mouseX;
    target.y = mouseY;
    console.log(`Target is set at: ${target.x}, ${target.y}`);

    //sTime = 0;
    predict();
    
}