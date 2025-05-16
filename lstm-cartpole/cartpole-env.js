class CartPoleEnv {
    constructor() {
        // Các hằng số vật lý, gần với giá trị chuẩn của OpenAI Gym
        this.gravity = 9.8; // Gia tốc trọng trường
        this.massCart = 1.0; // Khối lượng xe
        this.massPole = 0.1; // Khối lượng sào
        this.totalMass = this.massCart + this.massPole; // Tổng khối lượng
        this.length = 0.5; // Thực tế là một nửa chiều dài của sào (khoảng cách từ khớp đến trọng tâm sào)
        this.poleMassLength = this.massPole * this.length; // Tích khối lượng sào và chiều dài
        this.forceMag = 10.0; // Độ lớn lực tác động lên xe
        this.tau = 0.02; // Khoảng thời gian của mỗi bước mô phỏng (giây)

        // Ngưỡng kết thúc một lượt chơi (episode)
        this.thetaThresholdRadians = 12 * Math.PI / 180; // Góc nghiêng tối đa (12 độ)
        this.xThreshold = 2.4; // Vị trí tối đa của xe so với điểm gốc

        this.state = null; // Trạng thái hiện tại của môi trường [vị trí xe, vận tốc xe, góc sào, vận tốc góc sào]
        this.actionSpaceSize = 2; // Số lượng hành động: 0 (đẩy sang trái), 1 (đẩy sang phải)
        this.observationSpaceSize = 4; // Kích thước không gian quan sát (số chiều của trạng thái)
    }

    /**
     * Thiết lập lại môi trường về trạng thái ban đầu.
     * @returns {Array<number>} Trạng thái ban đầu.
     */
    reset() {
        // Khởi tạo trạng thái với một chút nhiễu ngẫu nhiên nhỏ để tăng tính đa dạng
        this.state = [
            Math.random() * 0.1 - 0.05, // Vị trí xe (x)
            Math.random() * 0.1 - 0.05, // Vận tốc xe (x_dot)
            Math.random() * 0.1 - 0.05, // Góc sào (theta, tính bằng radian)
            Math.random() * 0.1 - 0.05  // Vận tốc góc sào (theta_dot)
        ];
        return this.state.slice(); // Trả về một bản sao của trạng thái
    }

    /**
     * Thực hiện một hành động trong môi trường và chuyển sang trạng thái tiếp theo.
     * @param {number} action Hành động được thực hiện (0 hoặc 1).
     * @returns {[Array<number>, number, boolean, object]} Mảng chứa [trạng thái_mới, phần_thưởng, kết_thúc_lượt, thông_tin_phụ].
     */
    step(action) {
        if (this.state === null) {
            console.error("Trạng thái chưa được khởi tạo. Hãy gọi reset() trước.");
            return [null, 0, true, {}];
        }

        let [x, x_dot, theta, theta_dot] = this.state;
        let force = (action === 1) ? this.forceMag : -this.forceMag; // Áp dụng lực dựa trên hành động

        let cosTheta = Math.cos(theta);
        let sinTheta = Math.sin(theta);

        // Phương trình động lực học (tham khảo từ mã nguồn của OpenAI Gym, có thể đơn giản hóa)
        let temp = (force + this.poleMassLength * theta_dot * theta_dot * sinTheta) / this.totalMass;
        let thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
            (this.length * (4.0 / 3.0 - this.massPole * cosTheta * cosTheta / this.totalMass));
        let xAcc = temp - this.poleMassLength * thetaAcc * cosTheta / this.totalMass;

        // Cập nhật trạng thái bằng phương pháp Euler (xấp xỉ tích phân)
        x = x + this.tau * x_dot;
        x_dot = x_dot + this.tau * xAcc;
        theta = theta + this.tau * theta_dot;
        theta_dot = theta_dot + this.tau * thetaAcc;

        this.state = [x, x_dot, theta, theta_dot];

        // Kiểm tra điều kiện kết thúc lượt chơi
        let done = x < -this.xThreshold ||
            x > this.xThreshold ||
            theta < -this.thetaThresholdRadians ||
            theta > this.thetaThresholdRadians;

        done = Boolean(done);

        let reward = 0;
        if (!done) {
            reward = 1.0; // Phần thưởng là +1 cho mỗi bước sào còn đứng vững
        } else {
            reward = 0; // Không có phần thưởng khi lượt chơi kết thúc (hoặc có thể là phần thưởng âm)
        }
        return [this.state.slice(), reward, done, {}]; // Trả về trạng thái mới, phần thưởng, cờ kết thúc, và thông tin phụ (rỗng)
    }

    /**
     * Hiển thị môi trường CartPole lên canvas của p5.js.
     * @param {p5} p Đối tượng p5.js để vẽ.
     */
    render(p) {
        if (!this.state) return; // Nếu chưa có trạng thái thì không vẽ gì

        let [x_state, _x_dot, theta_state, _theta_dot] = this.state;

        // Các thông số để vẽ
        let cartWidth = 60;
        let cartHeight = 30;
        let poleLengthPixels = 120; // Chiều dài sào khi vẽ (pixels)
        let worldWidthPixels = this.xThreshold * 100; // Độ rộng của "thế giới" game khi vẽ

        p.push(); // Lưu trạng thái vẽ hiện tại
        p.translate(p.width / 2, p.height * 0.7); // Đặt gốc tọa độ ở giữa và gần đáy canvas

        // Vẽ đường ray
        p.stroke(50);
        p.strokeWeight(2);
        p.line(-worldWidthPixels, cartHeight / 2 + 5, worldWidthPixels, cartHeight / 2 + 5);

        // Vẽ xe
        let cartXPixels = x_state * 50; // Chuyển đổi vị trí x từ không gian trạng thái sang pixels
        p.fill(100, 100, 200); // Màu xanh cho xe
        p.stroke(50);
        p.rectMode(p.CENTER); // Vẽ hình chữ nhật từ tâm
        p.rect(cartXPixels, 0, cartWidth, cartHeight, 5); // Vẽ xe với góc bo tròn

        // Vẽ sào
        p.strokeWeight(6);
        p.stroke(200, 100, 50); // Màu cam cho sào
        p.translate(cartXPixels, 0); // Di chuyển gốc tọa độ đến vị trí của xe để vẽ sào
        p.rotate(theta_state); // Xoay theo góc của sào
        p.line(0, 0, 0, -poleLengthPixels); // Vẽ sào hướng lên trên (tọa độ y âm)

        p.pop(); // Khôi phục trạng thái vẽ trước đó
    }
}