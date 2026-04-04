(function () {
    const BG = [11, 15, 25];

    const shared = {
        drawing: [],
        fourierX: null,
        fourierY: null,
        time: 0,
        path: [],
        playing: false,
    };

    function epiCycles(p, x, y, rotation, fourier, t) {
        if (!fourier || fourier.length === 0) {
            return p.createVector(x, y);
        }
        for (let i = 0; i < fourier.length; i++) {
            const prevx = x;
            const prevy = y;
            const freq = fourier[i].freq;
            const radius = fourier[i].amp;
            const phase = fourier[i].phase;
            x += radius * p.cos(freq * t + phase + rotation);
            y += radius * p.sin(freq * t + phase + rotation);

            p.stroke(255, 100);
            p.noFill();
            p.ellipse(prevx, prevy, radius * 2, radius * 2);
            p.stroke(255);
            p.line(prevx, prevy, x, y);
        }
        return p.createVector(x, y);
    }

    function readHostSize(host) {
        const w = Math.max(260, host.clientWidth || 320);
        const h = Math.max(260, host.clientHeight || 320);
        return { w, h };
    }

    new p5(function (p) {
        let origX;
        let origY;
        let innerW;
        let innerH;

        p.setup = function () {
            const host = document.getElementById('dft-draw-host');
            const { w, h } = readHostSize(host);
            const c = p.createCanvas(w, h);
            c.parent('dft-draw-host');
            origX = p.width / 2;
            origY = p.height / 2;
            innerW = p.width * 0.88;
            innerH = p.height * 0.88;
        };

        function inDrawable(px, py) {
            return (
                Math.abs(px - origX) <= innerW / 2 &&
                Math.abs(py - origY) <= innerH / 2
            );
        }

        p.draw = function () {
            p.background(BG[0], BG[1], BG[2]);
            const rx = origX - innerW / 2;
            const ry = origY - innerH / 2;
            p.stroke(55, 65, 81);
            p.strokeWeight(1);
            p.noFill();
            p.rect(rx, ry, innerW, innerH, 4);
            p.noStroke();
            p.fill(248, 113, 113);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(13);
            p.text('Click and drag to draw inside the frame', origX, ry + 10);

            if (shared.drawing.length > 0) {
                p.stroke(243, 244, 246);
                p.strokeWeight(2);
                p.noFill();
                p.beginShape();
                for (let i = 0; i < shared.drawing.length; i++) {
                    const v = shared.drawing[i];
                    p.vertex(v.x + origX, v.y + origY);
                }
                p.endShape();
            }
        };

        p.mousePressed = function () {
            if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
                return;
            }
            if (!inDrawable(p.mouseX, p.mouseY)) {
                return;
            }
            shared.drawing = [];
            shared.path = [];
            shared.time = 0;
            shared.playing = false;
            shared.fourierX = null;
            shared.fourierY = null;
        };

        p.mouseDragged = function () {
            if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) {
                return;
            }
            const lx = p.mouseX;
            const ly = p.mouseY;
            if (!inDrawable(lx, ly)) {
                return;
            }
            shared.drawing.push(p.createVector(lx - origX, ly - origY));
        };

        p.mouseReleased = function () {
            if (shared.drawing.length < 2) {
                shared.fourierX = null;
                shared.fourierY = null;
                shared.playing = false;
                return;
            }
            const xs = [];
            const ys = [];
            const skip = 1;
            for (let i = 0; i < shared.drawing.length; i += skip) {
                xs.push(shared.drawing[i].x);
                ys.push(shared.drawing[i].y);
            }
            shared.fourierX = dft(xs);
            shared.fourierY = dft(ys);
            shared.fourierX.sort((a, b) => b.amp - a.amp);
            shared.fourierY.sort((a, b) => b.amp - a.amp);
            shared.time = 0;
            shared.path = [];
            shared.playing = true;
        };

        p.windowResized = function () {
            const host = document.getElementById('dft-draw-host');
            const { w, h } = readHostSize(host);
            p.resizeCanvas(w, h);
            origX = p.width / 2;
            origY = p.height / 2;
            innerW = p.width * 0.88;
            innerH = p.height * 0.88;
        };
    });

    new p5(function (p) {
        p.setup = function () {
            const host = document.getElementById('dft-play-host');
            const { w, h } = readHostSize(host);
            const c = p.createCanvas(w, h);
            c.parent('dft-play-host');
        };

        p.draw = function () {
            p.background(BG[0], BG[1], BG[2]);

            if (
                !shared.playing ||
                !shared.fourierX ||
                !shared.fourierY ||
                shared.fourierX.length === 0 ||
                shared.fourierY.length === 0
            ) {
                p.fill(156, 163, 175);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.text(
                    'Fourier reconstruction appears here.\nDraw in the left panel, then release the mouse.',
                    p.width / 2,
                    p.height / 2
                );
                return;
            }

            const startX = p.width * 0.52;
            const startY = p.height * 0.5;
            const topY = p.height * 0.18;
            const leftX = p.width * 0.14;

            const vx = epiCycles(p, startX, topY, 0, shared.fourierX, shared.time);
            const vy = epiCycles(p, leftX, startY, p.HALF_PI, shared.fourierY, shared.time);
            const v = p.createVector(vx.x, vy.y);
            shared.path.unshift(v);

            p.stroke(96, 165, 250, 180);
            p.strokeWeight(1);
            p.line(vx.x, vx.y, v.x, v.y);
            p.line(vy.x, vy.y, v.x, v.y);

            p.stroke(251, 191, 36);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            for (let i = 0; i < shared.path.length; i++) {
                p.vertex(shared.path[i].x, shared.path[i].y);
            }
            p.endShape();

            const n = Math.max(1, shared.fourierY.length);
            const dt = p.TWO_PI / n;
            shared.time += dt;

            if (shared.time > p.TWO_PI) {
                shared.time = 0;
                shared.path = [];
            }
        };

        p.windowResized = function () {
            const host = document.getElementById('dft-play-host');
            const { w, h } = readHostSize(host);
            p.resizeCanvas(w, h);
        };
    });
})();
