const samples = [];
const sampleSize = 100;
let clusters = [];

function setup() {
    createCanvas(800, 600);
    for (let i = 0; i < sampleSize; i++) {
        let x = random(width);
        let y = random(height);
        let sample = createVector(x, y);
        samples.push(sample);
    }

    clusters = createClusters(samples, 1);
}

function createClusters(samples, k) {
    let clusters = [];
    for (let i = 0; i < k; i++) {
        let cluster = {
            centroid: samples[i],
            points: [],
        };
        clusters.push(cluster);
    }

    let changed = true;
    while (changed) {
        changed = false;

        for (let sample of samples) {
            let bestDist = Infinity;
            let bestCluster = null;
            for (let cluster of clusters) {
                let dist = p5.Vector.dist(sample, cluster.centroid);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestCluster = cluster;
                }
            }

            if (!bestCluster.points.includes(sample)) {
                changed = true;
                for (let cluster of clusters) {
                    let index = cluster.points.indexOf(sample);
                    if (index > -1) {
                        cluster.points.splice(index, 1);
                    }
                }
                bestCluster.points.push(sample);
            }
        }

        for (let cluster of clusters) {
            let sum = createVector(0, 0);
            for (let point of cluster.points) {
                sum.add(point);
            }
            if (cluster.points.length > 0) {
                sum.div(cluster.points.length);
                cluster.centroid = sum;
            }
        }
    }

    return clusters;
}

function clusterIt() {
    let slider = document.getElementById('slider');
    let numClusters = slider.value;
    clusters = createClusters(samples, numClusters);
}

function draw() {
    background(255);
    fill(255);
    rect(0, 0, width, height);
    const colors = ["#f00", "#0f0", "#00f", "#ff0", "#f0f", "#0ff", "#000", "#fff", "#888", "#444"];
    for (let i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];
        fill(colors[i]);
        for (let point of cluster.points) {
            ellipse(point.x, point.y, 8, 8);
        }
    }
}

function mousePressed() {
    let sample = createVector(mouseX, mouseY);
    let bestDist = Infinity;
    let bestCluster = null;
    for (let cluster of clusters) {
        let dist = p5.Vector.dist(sample, cluster.centroid);
        if (dist < bestDist) {
            bestDist = dist;
            bestCluster = cluster;
        }
    }
    bestCluster.points.push(sample);
    samples.push(sample);
}