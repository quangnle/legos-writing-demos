/**
 * K-Means metrics: WCSS (Elbow), Silhouette, Gap Statistic
 * Uses window.samples (from sketch.js), createClusters (sketch)
 */

function getSamples() {
    return window.samples || [];
}

const CHART_COLORS = {
    bg: '#16161a',
    grid: '#2a2a32',
    text: '#a1a1aa',
    accent: '#6366f1',
    best: '#22c55e',
    line: '#818cf8'
};

function dist2(a, b) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function distPoints(a, b) {
    return Math.sqrt(dist2(a, b));
}

function computeWCSS(clusters) {
    let wcss = 0;
    for (const cluster of clusters) {
        for (const pt of cluster.points) {
            wcss += dist2(pt, cluster.centroid);
        }
    }
    return wcss;
}

function computeSilhouette(points, clusters) {
    const n = points.length;
    if (n < 2) return 0;

    // Build labels by index (đảm bảo khớp với points từ createClustersPlain)
    const labels = new Array(n).fill(-1);
    for (let ci = 0; ci < clusters.length; ci++) {
        for (const pt of clusters[ci].points) {
            const idx = points.indexOf(pt);
            if (idx >= 0) labels[idx] = ci;
        }
    }

    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
        const ci = labels[i];
        if (ci < 0) continue;
        count++;
        const pt = points[i];

        const sameCluster = clusters[ci].points.filter(p => p !== pt);
        let a = 0;
        if (sameCluster.length > 0) {
            for (const p of sameCluster) a += distPoints(pt, p);
            a /= sameCluster.length;
        }

        let b = Infinity;
        for (let cj = 0; cj < clusters.length; cj++) {
            if (cj === ci) continue;
            const other = clusters[cj].points;
            if (other.length === 0) continue;
            let avg = 0;
            for (const p of other) avg += distPoints(pt, p);
            avg /= other.length;
            b = Math.min(b, avg);
        }
        if (b === Infinity) b = a;

        const s = (b - a) / Math.max(a, b, 1e-9);
        sum += s;
    }
    return count > 0 ? sum / count : 0;
}

function getBoundingBox(samples) {
    if (samples.length === 0) return { minX: 0, maxX: 700, minY: 0, maxY: 600 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of samples) {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    return { minX, maxX, minY, maxY };
}

function generateReferenceData(samples, box) {
    const ref = [];
    for (let i = 0; i < samples.length; i++) {
        const x = box.minX + Math.random() * (box.maxX - box.minX || 1);
        const y = box.minY + Math.random() * (box.maxY - box.minY || 1);
        ref.push({ x, y });
    }
    return ref;
}

function createClustersPlain(points, k) {
    const n = points.length;
    if (k >= n) k = n;
    const clusters = [];
    for (let i = 0; i < k; i++) {
        clusters.push({
            centroid: { ...points[i] },
            points: []
        });
    }

    let changed = true;
    while (changed) {
        changed = false;
        for (const cluster of clusters) cluster.points = [];

        for (const pt of points) {
            let bestDist = Infinity;
            let bestIdx = 0;
            for (let i = 0; i < clusters.length; i++) {
                const d = distPoints(pt, clusters[i].centroid);
                if (d < bestDist) { bestDist = d; bestIdx = i; }
            }
            clusters[bestIdx].points.push(pt);
        }

        for (const cluster of clusters) {
            if (cluster.points.length === 0) continue;
            let sx = 0, sy = 0;
            for (const p of cluster.points) { sx += p.x; sy += p.y; }
            const cx = sx / cluster.points.length;
            const cy = sy / cluster.points.length;
            if (Math.abs(cluster.centroid.x - cx) > 1e-6 || Math.abs(cluster.centroid.y - cy) > 1e-6) changed = true;
            cluster.centroid = { x: cx, y: cy };
        }
    }
    return clusters;
}

function computeWCSSPlain(clusters) {
    let wcss = 0;
    for (const cluster of clusters) {
        for (const pt of cluster.points) {
            wcss += dist2(pt, cluster.centroid);
        }
    }
    return wcss;
}

function computeGapStatistic(samples, B = 10) {
    const points = samples.map(s => ({ x: s.x, y: s.y }));
    const box = getBoundingBox(points);

    const ks = [];
    const gaps = [];
    const sdk = [];

    for (let k = 1; k <= 10; k++) {
        const clusters = createClustersPlain(points, k);
        const logW = Math.log(computeWCSSPlain(clusters) + 1e-10);

        const refLogW = [];
        for (let b = 0; b < B; b++) {
            const ref = generateReferenceData(points, box);
            const refClusters = createClustersPlain(ref, k);
            refLogW.push(Math.log(computeWCSSPlain(refClusters) + 1e-10));
        }
        const ELogW = refLogW.reduce((a, v) => a + v, 0) / B;
        const sd = Math.sqrt(refLogW.reduce((a, v) => a + (v - ELogW) ** 2, 0) / B) * Math.sqrt(1 + 1 / B);

        ks.push(k);
        gaps.push(ELogW - logW);
        sdk.push(sd);
    }
    return { ks, gaps, sdk };
}

function elbowBestK(wcssValues) {
    const n = wcssValues.length;
    if (n < 3) return 1;
    let bestIdx = 1;
    let minAngle = Infinity;
    for (let i = 1; i < n - 1; i++) {
        // Vector TỪ đỉnh k HƯỚNG VỀ (k-1): v1 = (k-1 - k, W(k-1) - W(k))
        const v1x = -1;
        const v1y = wcssValues[i - 1] - wcssValues[i];
        // Vector TỪ đỉnh k HƯỚNG VỀ (k+1): v2 = (k+1 - k, W(k+1) - W(k))
        const v2x = 1;
        const v2y = wcssValues[i + 1] - wcssValues[i];
        // Góc tại đỉnh k: cos(θ) = (v1·v2) / (|v1||v2|)
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
        const cosTheta = mag1 > 1e-10 && mag2 > 1e-10 ? dot / (mag1 * mag2) : 1;
        const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
        // Khuỷu tay = góc nhỏ nhất (độ gập cao nhất)
        if (theta < minAngle) {
            minAngle = theta;
            bestIdx = i;
        }
    }
    // bestIdx = index đỉnh; k = bestIdx + 1
    return bestIdx + 1;
}

function gapBestK(gaps, sdk) {
    // globalmax: chọn k có Gap(k) lớn nhất
    let maxIdx = 0;
    for (let i = 1; i < gaps.length; i++) {
        if (gaps[i] > gaps[maxIdx]) maxIdx = i;
    }
    return maxIdx + 1;
}

function destroyChart(chart) {
    if (chart) chart.destroy();
}

function renderWCSSChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    destroyChart(window._chartWCSS);
    const wcssValues = [];
    for (let k = 1; k <= 10; k++) {
        const clusters = createClusters(getSamples(), k);
        wcssValues.push(computeWCSS(clusters));
    }
    const bestK = elbowBestK(wcssValues);

    window._chartWCSS = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            datasets: [{
                label: 'WCSS',
                data: wcssValues,
                borderColor: CHART_COLORS.accent,
                backgroundColor: CHART_COLORS.accent + '20',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: CHART_COLORS.text } }
            },
            scales: {
                x: {
                    ticks: { color: CHART_COLORS.text },
                    grid: { color: CHART_COLORS.grid }
                },
                y: {
                    ticks: { color: CHART_COLORS.text },
                    grid: { color: CHART_COLORS.grid }
                }
            }
        }
    });

    document.getElementById('wcss-best').textContent = bestK;
    return bestK;
}

function renderSilhouetteChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    destroyChart(window._chartSilhouette);

    const samples = getSamples();
    if (!samples || samples.length < 10) {
        document.getElementById('sil-best').textContent = '—';
        return;
    }
    const points = samples.map(s => ({ x: s.x, y: s.y }));

    const silValues = [];
    try {
        for (let k = 1; k <= 10; k++) {
            const clusters = createClustersPlain(points, k);
            const s = computeSilhouette(points, clusters);
            silValues.push(Number.isFinite(s) ? s : 0);
        }
    } catch (e) {
        console.error('Silhouette error:', e);
        document.getElementById('sil-best').textContent = '—';
        return;
    }
    if (silValues.length === 0) return;
    const maxVal = Math.max(...silValues);
    const bestK = Math.max(1, silValues.indexOf(maxVal) + 1);

    window._chartSilhouette = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            datasets: [{
                label: 'Silhouette Score',
                data: silValues,
                borderColor: CHART_COLORS.accent,
                backgroundColor: CHART_COLORS.accent + '20',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: CHART_COLORS.text } }
            },
            scales: {
                x: {
                    ticks: { color: CHART_COLORS.text },
                    grid: { color: CHART_COLORS.grid }
                },
                y: {
                    ticks: { color: CHART_COLORS.text },
                    grid: { color: CHART_COLORS.grid },
                    suggestedMin: -0.2,
                    suggestedMax: 1
                }
            }
        }
    });

    document.getElementById('sil-best').textContent = Math.max(1, bestK);
    return bestK;
}

function renderGapChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    destroyChart(window._chartGap);
    const { ks, gaps, sdk } = computeGapStatistic(getSamples(), 10);
    const bestK = gapBestK(gaps, sdk);

    window._chartGap = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ks,
            datasets: [{
                label: 'Gap(k)',
                data: gaps,
                borderColor: CHART_COLORS.accent,
                backgroundColor: CHART_COLORS.accent + '20',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: CHART_COLORS.text } }
            },
            scales: {
                x: {
                    ticks: { color: CHART_COLORS.text },
                    grid: { color: CHART_COLORS.grid }
                },
                y: {
                    ticks: { color: CHART_COLORS.text },
                    grid: { color: CHART_COLORS.grid }
                }
            }
        }
    });

    document.getElementById('gap-best').textContent = bestK;
    return bestK;
}

function openMetricsModal() {
    document.getElementById('metrics-modal').classList.add('active');
    document.getElementById('tab-wcss').click();
}

function closeMetricsModal() {
    document.getElementById('metrics-modal').classList.remove('active');
    destroyChart(window._chartWCSS);
    destroyChart(window._chartSilhouette);
    destroyChart(window._chartGap);
}

function switchTab(tabId) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('panel-' + tabId).classList.add('active');

    if (tabId === 'wcss') renderWCSSChart('chart-wcss');
    if (tabId === 'silhouette') {
        setTimeout(() => renderSilhouetteChart('chart-silhouette'), 50);
    }
    if (tabId === 'gap') setTimeout(() => renderGapChart('chart-gap'), 50);
}
