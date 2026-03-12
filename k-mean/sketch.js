window.samples = window.samples || [];
const samples = window.samples;
const sampleSize = 300;
let clusters = [];

const CLUSTER_COLORS = [
    "#ef4444", "#22c55e", "#3b82f6", "#eab308",
    "#ec4899", "#06b6d4", "#f97316", "#8b5cf6",
    "#84cc16", "#14b8a6"
];

function setup() {
    const cnv = createCanvas(700, 600);
    cnv.parent('canvas-container');
    samples.length = 0; // reset nếu gọi lại
    for (let i = 0; i < sampleSize; i++) {
        let x = random(width);
        let y = random(height);
        let sample = createVector(x, y);
        samples.push(sample);
    }
    window.samples = samples;
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

const CANVAS_BG = [22, 22, 26];  // #16161a

function draw() {
    background(CANVAS_BG[0], CANVAS_BG[1], CANVAS_BG[2]);
    noStroke();

    for (let i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];
        fill(CLUSTER_COLORS[i]);
        for (let point of cluster.points) {
            ellipse(point.x, point.y, 10, 10);
        }
        // Draw centroid
        let c = cluster.centroid;
        stroke(CLUSTER_COLORS[i]);
        strokeWeight(2);
        noFill();
        ellipse(c.x, c.y, 20, 20);
        line(c.x - 8, c.y, c.x + 8, c.y);
        line(c.x, c.y - 8, c.x, c.y + 8);
        noStroke();
    }
}

function mousePressed() {
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
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
    if (bestCluster) {
        bestCluster.points.push(sample);
        samples.push(sample);
    }
}