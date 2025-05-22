class Track {
    constructor(carWidth) { // Nhận CAR_WIDTH làm tham số
        // 1. Định nghĩa kích thước cơ bản
        this.centerline = {
            TL: createVector(0, 0),
            TR: createVector(canvasWidth - 100, 0),
            BR: createVector(canvasWidth - 100, canvasHeight - 100),
            BL: createVector(0, canvasHeight - 100)
        };
        this.carWidth = carWidth;
        this.laneWidth = 4 * this.carWidth;
        this.halfLaneWidth = this.laneWidth / 2;

        // 2. Vị trí và hướng xuất phát
        this.startPosition = createVector(50, 0); // Trên đoạn trên, gần bên trái
        this.startAngle = 0; // Hướng sang phải (theo chiều kim đồng hồ)

        // 3. Vạch đích thực tế (tại 0, 150 trên đoạn trái)
        let finishLinePos = createVector(0, 100);
        let finishLineTrackSegmentAngle = -PI / 2; // Xe chạy lên trên dọc đoạn trái
        let actualFinishLineOrientation = finishLineTrackSegmentAngle + PI / 2; // Vạch đích nằm ngang

        this.actualFinishLine = {
            pos: finishLinePos,
            angle: actualFinishLineOrientation, // Góc của chính vạch đích (0 rad - ngang)
            trackSegmentAngle: finishLineTrackSegmentAngle,
            check_p1: createVector(finishLinePos.x - this.halfLaneWidth, finishLinePos.y),
            check_p2: createVector(finishLinePos.x + this.halfLaneWidth, finishLinePos.y)
        };

        // 4. Ranh giới chống chạy ngược (tại y=50 trên đoạn trái)
        // Xe chạy lên (angle -PI/2). Chạy ngược là chạy xuống (angle PI/2).
        // Ranh giới này ngăn xe chạy xuống qua y=50. Normal của nó hướng lên.
        let antiReverseY = 50;
        this.antiReverseBoundary = {
            p1: createVector(this.centerline.BL.x - this.halfLaneWidth, antiReverseY),
            p2: createVector(this.centerline.BL.x + this.halfLaneWidth, antiReverseY),
            // Normal vector chỉ về phía "an toàn" (phía trên của y=50, ngược chiều y tăng)
            normal: createVector(0, -1) 
        };
        
        // 5. Tạo các điểm waypoints cho đường tâm
        this.centerlineWaypoints = [];
        this.totalCenterlineLength = 0;
        this.generateCenterlineWaypoints();

        // 6. Tính toán các điểm vẽ biên ngoài và biên trong của đường đua
        // Các điểm này giả định (0,0) của tim đường là gốc tọa độ canvas
        // Biên ngoài
        this.outerBoundaryPoints = [
            createVector(this.centerline.TL.x - this.halfLaneWidth, this.centerline.TL.y - this.halfLaneWidth), // Outer TL
            createVector(this.centerline.TR.x + this.halfLaneWidth, this.centerline.TR.y - this.halfLaneWidth), // Outer TR
            createVector(this.centerline.BR.x + this.halfLaneWidth, this.centerline.BR.y + this.halfLaneWidth), // Outer BR
            createVector(this.centerline.BL.x - this.halfLaneWidth, this.centerline.BL.y + this.halfLaneWidth)  // Outer BL
        ];
        // Biên trong (lỗ)
        this.innerBoundaryPoints = [
            createVector(this.centerline.TL.x + this.halfLaneWidth, this.centerline.TL.y + this.halfLaneWidth), // Inner TL
            createVector(this.centerline.TR.x - this.halfLaneWidth, this.centerline.TR.y + this.halfLaneWidth), // Inner TR
            createVector(this.centerline.BR.x - this.halfLaneWidth, this.centerline.BR.y - this.halfLaneWidth), // Inner BR
            createVector(this.centerline.BL.x + this.halfLaneWidth, this.centerline.BL.y - this.halfLaneWidth)  // Inner BL
        ];

        // Kiểm tra xem "lỗ" có hợp lệ không (các cạnh của tim đường phải lớn hơn độ rộng lòng đường)
        if (this.centerline.TR.x - this.centerline.TL.x < this.laneWidth ||
            this.centerline.BL.y - this.centerline.TL.y < this.laneWidth) {
            console.warn("Kích thước tim đường quá nhỏ so với độ rộng lòng đường! Đường đua có thể không hiển thị đúng.");
            // Có thể cần điều chỉnh this.innerBoundaryPoints để tránh tự giao cắt
            this.innerBoundaryPoints = []; // Không vẽ lỗ nếu không hợp lệ
        }

    }

    generateCenterlineWaypoints(pointsPerPixel = 0.1) {
        this.centerlineWaypoints = [];
        let cumulativeDistance = 0;
        const cl = this.centerline; // shorthand

        const addSegmentPoints = (p1, p2) => {
            let segmentVector = p5.Vector.sub(p2, p1);
            let segmentLength = segmentVector.mag();
            let numPoints = max(2, floor(segmentLength * pointsPerPixel)); // Ít nhất 2 điểm (đầu, cuối)

            for (let i = 0; i < numPoints; i++) { // Dùng < numPoints để điểm cuối của đoạn này không trùng điểm đầu đoạn sau (trừ đoạn cuối cùng)
                let t = i / (numPoints -1); // Đảm bảo t đi từ 0 đến 1
                if (i === numPoints -1 && p2 !== cl.TL) t = 1; // Đảm bảo điểm cuối được thêm (trừ khi là điểm cuối cùng của vòng)
                
                let pos = p5.Vector.lerp(p1, p2, t);
                let distFromPrev = 0;
                if (this.centerlineWaypoints.length > 0) {
                    const prevPoint = this.centerlineWaypoints[this.centerlineWaypoints.length - 1].pos;
                    if (pos.dist(prevPoint) < 0.1) continue; // Bỏ qua nếu quá gần
                    distFromPrev = p5.Vector.dist(prevPoint, pos);
                }
                cumulativeDistance += distFromPrev;
                this.centerlineWaypoints.push({ pos: pos, cumulativeDistance: cumulativeDistance, distToNext: 0 });
                if (this.centerlineWaypoints.length > 1) {
                    this.centerlineWaypoints[this.centerlineWaypoints.length - 2].distToNext = distFromPrev;
                }
            }
        };

        // Thêm điểm xuất phát vào waypoints nếu nó không trùng với điểm đầu tiên của tim đường
        // và nếu nó nằm trên đoạn đầu tiên (TL -> TR)
        if (this.startPosition.y === cl.TL.y && this.startPosition.x > cl.TL.x && this.startPosition.x < cl.TR.x) {
            addSegmentPoints(cl.TL, this.startPosition); // Từ TL đến startPosition
            addSegmentPoints(this.startPosition, cl.TR); // Từ startPosition đến TR
        } else {
            addSegmentPoints(cl.TL, cl.TR); // Mặc định: TL -> TR
        }
        addSegmentPoints(cl.TR, cl.BR);
        addSegmentPoints(cl.BR, cl.BL);
        addSegmentPoints(cl.BL, cl.TL); // Hoàn thành vòng

        // Tính distToNext cho điểm cuối cùng
        if (this.centerlineWaypoints.length > 1) {
            this.centerlineWaypoints[this.centerlineWaypoints.length - 1].distToNext = p5.Vector.dist(
                this.centerlineWaypoints[this.centerlineWaypoints.length - 1].pos,
                this.centerlineWaypoints[0].pos
            );
        }
        if (this.centerlineWaypoints.length > 0) {
            this.totalCenterlineLength = this.centerlineWaypoints[this.centerlineWaypoints.length - 1].cumulativeDistance;
        } else {
            this.totalCenterlineLength = 0;
        }
    }

    display() {
        push(); // Trạng thái vẽ cho toàn bộ đường đua

        // 1. Vẽ nền đường đua (màu xám nhạt)
        fill(TRACK_COLOR); // Nên định nghĩa TRACK_COLOR trong constants.js, ví dụ [150,150,150]
        noStroke();
        beginShape();
        for (let pt of this.outerBoundaryPoints) {
            vertex(pt.x, pt.y);
        }
        endShape(CLOSE);

        // 2. Vẽ "lỗ" ở giữa (màu nền canvas)
        if (this.innerBoundaryPoints.length > 0) {
            fill(51); // Màu nền canvas (giả sử)
            beginShape();
            for (let pt of this.innerBoundaryPoints) {
                vertex(pt.x, pt.y);
            }
            endShape(CLOSE);
        }
        
        // 3. Vẽ VẠCH ĐÍCH THỰC TẾ 
        if (this.actualFinishLine) {
            push(); 
            translate(this.actualFinishLine.pos.x, this.actualFinishLine.pos.y);
            rotate(this.actualFinishLine.angle); 
            rectMode(CENTER); 
            noStroke();
            let finishLineVisualWidth = this.laneWidth; 
            let finishLineVisualDepth = max(this.carWidth * 0.75, 10); 
            let numCheckersAcross = 6; // Giảm số ô cờ cho rõ hơn trên làn hẹp hơn
            let numCheckersDeep = 2;
            let checkerWidth = finishLineVisualWidth / numCheckersAcross;
            let checkerHeight = finishLineVisualDepth / numCheckersDeep;
            for (let i = 0; i < numCheckersAcross; i++) {
                for (let j = 0; j < numCheckersDeep; j++) {
                    if ((i + j) % 2 === 0) {
                        fill(FINISH_LINE_COLOR); // Màu trắng
                    } else {
                        fill(0, 200, 0, 200); // Màu xanh lá cây cho ô cờ
                    }
                    let checkerX = -finishLineVisualWidth / 2 + checkerWidth / 2 + i * checkerWidth;
                    let checkerY = -finishLineVisualDepth / 2 + checkerHeight / 2 + j * checkerHeight;
                    rect(checkerX, checkerY, checkerWidth, checkerHeight);
                }
            }
            pop(); 
        }
        
        // 4. VẼ MỘT MŨI TÊN DUY NHẤT TẠI ĐIỂM XUẤT PHÁT CHỈ HƯỚNG
        const START_ARROW_LENGTH = this.laneWidth * 0.5; // Tăng chiều dài một chút
        const START_ARROW_HEAD_SIZE = this.laneWidth * 0.2;
        const START_ARROW_COLOR_VAL = color(250, 250, 50, 220); 
        const START_ARROW_STROKE_WEIGHT_VAL = max(2, this.laneWidth * 0.03);

        push();
        translate(this.startPosition.x + 50, this.startPosition.y);
        rotate(this.startAngle); 
        stroke(START_ARROW_COLOR_VAL);
        strokeWeight(START_ARROW_STROKE_WEIGHT_VAL);
        fill(START_ARROW_COLOR_VAL);
        const arrowBodyOffset = START_ARROW_LENGTH * 0.2; 
        line(-arrowBodyOffset, 0, START_ARROW_LENGTH - arrowBodyOffset, 0);
        let headTipX = START_ARROW_LENGTH - arrowBodyOffset;
        triangle(headTipX, 0, headTipX - START_ARROW_HEAD_SIZE, -START_ARROW_HEAD_SIZE / 2, headTipX - START_ARROW_HEAD_SIZE, START_ARROW_HEAD_SIZE / 2);
        pop();

        // 5. Vẽ vạch xuất phát giống vạch đích (tại startPosition)
        if (this.startPosition) {
            push(); 
            translate(this.startPosition.x + this.carWidth, this.startPosition.y);
            rotate(this.startAngle - PI / 2); // Vạch xuất phát nằm ngang
            rectMode(CENTER); 
            noStroke();
            let startLineVisualWidth = this.laneWidth; 
            let startLineVisualDepth = max(this.carWidth * 0.75, 10); 
            let numCheckersAcross = 6; // Giảm số ô cờ cho rõ hơn trên làn hẹp hơn
            let numCheckersDeep = 2;
            let checkerWidth = startLineVisualWidth / numCheckersAcross;
            let checkerHeight = startLineVisualDepth / numCheckersDeep;
            for (let i = 0; i < numCheckersAcross; i++) {
                for (let j = 0; j < numCheckersDeep; j++) {
                    if ((i + j) % 2 === 0) {
                        fill(FINISH_LINE_COLOR); // Màu trắng
                    } else {
                        fill(0, 200, 0, 200); // Màu xanh lá cây cho ô cờ
                    }
                    let checkerX = -startLineVisualWidth / 2 + checkerWidth / 2 + i * checkerWidth;
                    let checkerY = -startLineVisualDepth / 2 + checkerHeight / 2 + j * checkerHeight;
                    rect(checkerX, checkerY, checkerWidth, checkerHeight);
                }
            }
            pop(); 
        }

        // 6. Vẽ các đoạn tâm đường đua màu trắng (để dễ nhìn hơn)
        stroke(255); // Màu trắng
        strokeWeight(2); // Độ dày đường vẽ
        for (let i = 5; i < this.centerlineWaypoints.length - 11; i++) {
            const p1 = this.centerlineWaypoints[i].pos;
            const p2 = this.centerlineWaypoints[i + 1].pos;
            line(p1.x, p1.y, p2.x, p2.y);
            i++;
        }       
        
        // 7. Vẽ ranh giới chạy ngược để debug
        if (this.antiReverseBoundary) {
            push();
            stroke(255, 0, 0, 150); // Màu đỏ mờ
            strokeWeight(4);
            line(this.antiReverseBoundary.p1.x, this.antiReverseBoundary.p1.y, this.antiReverseBoundary.p2.x, this.antiReverseBoundary.p2.y);
            pop();
        }

        pop(); // Kết thúc trạng thái vẽ cho toàn bộ đường đua
    }

    isPointOffTrack(point) {
        // Kiểm tra xem điểm có nằm ngoài hình chữ nhật ngoài không
        if (point.x < this.outerBoundaryPoints[0].x || 
            point.x > this.outerBoundaryPoints[1].x || 
            point.y < this.outerBoundaryPoints[0].y || 
            point.y > this.outerBoundaryPoints[3].y) {
            return true; // Ngoài biên ngoài cùng
        }

        // Nếu có "lỗ" (innerBoundaryPoints được định nghĩa)
        if (this.innerBoundaryPoints.length > 0) {
            // Kiểm tra xem điểm có nằm trong "lỗ" không
            if (point.x > this.innerBoundaryPoints[0].x && 
                point.x < this.innerBoundaryPoints[1].x && 
                point.y > this.innerBoundaryPoints[0].y && 
                point.y < this.innerBoundaryPoints[3].y) {
                return true; // Trong lỗ
            }
        }
        return false; // Nằm trên đường đua
    }

    // getTrackBoundaries() có thể không cần thiết với track đơn giản này,
    // isPointOffTrack đã đủ. Nếu sensor cần, sẽ trả về các đoạn thẳng biên.
    getTrackBoundaries() {
        const boundaries = [];
        // Outer boundaries
        for(let i=0; i<this.outerBoundaryPoints.length; i++){
            boundaries.push({
                p1: this.outerBoundaryPoints[i],
                p2: this.outerBoundaryPoints[(i+1)%this.outerBoundaryPoints.length]
            });
        }
        // Inner boundaries
        if (this.innerBoundaryPoints.length > 0) {
            for(let i=0; i<this.innerBoundaryPoints.length; i++){
                boundaries.push({
                    p1: this.innerBoundaryPoints[i],
                    p2: this.innerBoundaryPoints[(i+1)%this.innerBoundaryPoints.length]
                });
            }
        }
        return boundaries;
    }
}