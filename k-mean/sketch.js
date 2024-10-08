const samples = [];
const sampleSize = 300;
let clusters = [];

function setup() {
    createCanvas(700, 600);
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
    // Initialize clusters with the first k samples
    for (let i = 0; i < k; i++) {
        let cluster = {
            centroid: samples[i],
            points: [],
        };
        clusters.push(cluster);
    }

    let changed = true;
    // Repeat until no change
    while (changed) {
        changed = false;
        // Assign each sample to the nearest cluster
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

            // If the sample is not in the best cluster, move it
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

        // Update the centroid of each cluster
        for (let cluster of clusters) {
            let sum = createVector(0, 0);
            for (let point of cluster.points) {
                sum.add(point);
            }

            // If the cluster has points, update the centroid
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