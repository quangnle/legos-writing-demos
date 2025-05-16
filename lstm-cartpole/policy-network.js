class PolicyNetwork {
    /**
     * Khởi tạo mạng chính sách.
     * @param {number} sequenceLength Độ dài chuỗi trạng thái đầu vào cho LSTM.
     * @param {number} numFeatures Số lượng đặc trưng trong mỗi trạng thái (ví dụ: 4 cho CartPole).
     * @param {number} numActions Số lượng hành động có thể (ví dụ: 2 cho CartPole).
     * @param {number} learningRate Tốc độ học cho optimizer.
     */
    constructor(sequenceLength, numFeatures, numActions, learningRate = 0.001) {
        this.sequenceLength = sequenceLength;
        this.numFeatures = numFeatures;
        this.numActions = numActions;
        this.learningRate = learningRate;
        this.model = this._buildModel(); // Xây dựng mô hình TensorFlow.js
        this.optimizer = tf.train.adam(this.learningRate); // Sử dụng Adam optimizer
        this.logEpsilon = tf.scalar(1e-8); // Epsilon nhỏ để tránh log(0)

        // Các bộ đệm để lưu trữ dữ liệu của một lượt chơi (episode) cho thuật toán REINFORCE
        this.episodeStateSequences = []; // Lưu các chuỗi trạng thái
        this.episodeActions = [];        // Lưu các hành động đã chọn
        this.episodeRewards = [];        // Lưu các phần thưởng nhận được
    }

    /**
     * Xây dựng mô hình mạng LSTM.
     * @returns {tf.Sequential} Mô hình TensorFlow.js.
     * @private
     */
    _buildModel() {
        const model = tf.sequential();
        model.add(tf.layers.lstm({
            units: 64, // Có thể thử nghiệm với 64
            inputShape: [this.sequenceLength, this.numFeatures],
            returnSequences: false
        }));
        model.add(tf.layers.dense({
            units: this.numActions,
            activation: 'softmax'
        }));
        model.summary();
        return model;
    }

    /**
     * Dự đoán hành động dựa trên một chuỗi các trạng thái.
     * @param {Array<Array<number>>} stateSequence Chuỗi các trạng thái đầu vào.
     * @returns {Promise<{action: number, logProb: tf.Tensor}>} Một object chứa hành động được chọn và log(xác suất) của hành động đó.
     */
    async predictAction(stateSequence) {
        return tf.tidy(() => {
            if (stateSequence.length !== this.sequenceLength) {
                console.error(`Độ dài chuỗi trạng thái (${stateSequence.length}) không khớp với yêu cầu (${this.sequenceLength}).`);
                const randomAction = Math.floor(Math.random() * this.numActions);
                const logProbFallback = tf.log(tf.scalar(1.0 / this.numActions).add(this.logEpsilon));
                return { action: randomAction, logProb: logProbFallback };
            }

            const inputTensor = tf.tensor3d([stateSequence], [1, this.sequenceLength, this.numFeatures]);
            const probs = this.model.predict(inputTensor);
            const actionTensor = tf.multinomial(probs, 1).squeeze();
            const action = actionTensor.dataSync()[0];
            const actionProbs = probs.squeeze();
            // Thêm epsilon nhỏ trước khi lấy log để tránh log(0)
            const logProb = tf.log(actionProbs.gather(tf.scalar(action, 'int32')).add(this.logEpsilon));
            return { action, logProb };
        });
    }

    /**
     * Ghi lại một bước chuyển (transition) trong lượt chơi hiện tại.
     * @param {Array<Array<number>>} stateSequence Chuỗi trạng thái dẫn đến hành động.
     * @param {number} action Hành động đã thực hiện.
     * @param {number} reward Phần thưởng nhận được.
     */
    record(stateSequence, action, reward) {
        this.episodeStateSequences.push(stateSequence);
        this.episodeActions.push(action);
        this.episodeRewards.push(reward);
    }

    /**
     * Tính toán phần thưởng chiết khấu (discounted rewards hay returns) từ cuối lượt chơi về đầu.
     * @param {number} gamma Yếu tố chiết khấu (discount factor).
     * @returns {Array<number>} Mảng các phần thưởng chiết khấu đã được chuẩn hóa.
     * @private
     */
    _calculateDiscountedRewards(gamma = 0.99) {
        const discountedRewards = [];
        let runningAdd = 0;
        for (let i = this.episodeRewards.length - 1; i >= 0; i--) {
            runningAdd = this.episodeRewards[i] + gamma * runningAdd;
            discountedRewards.unshift(runningAdd);
        }

        if (discountedRewards.length === 0) return []; // Tránh lỗi nếu không có rewards

        const rewardsTensor = tf.tensor1d(discountedRewards);
        const mean = tf.mean(rewardsTensor);
        const variance = tf.moments(rewardsTensor).variance;
        // Sử dụng epsilon lớn hơn một chút cho std để tăng tính ổn định
        const std = variance.sqrt().add(tf.scalar(1e-7)); // Tăng epsilon cho std

        // Kiểm tra nếu std quá nhỏ (gần bằng 0) thì không chuẩn hóa hoặc trả về mảng 0
        if (std.dataSync()[0] < 1e-6) {
            console.warn("Độ lệch chuẩn của rewards quá nhỏ, không thực hiện chuẩn hóa rewards.");
            rewardsTensor.dispose();
            mean.dispose();
            variance.dispose();
            std.dispose();
            // Trả về mảng 0 hoặc mảng rewards chưa chuẩn hóa tùy theo chiến lược
            // Ở đây, trả về mảng 0 để tránh giá trị lớn không mong muốn
            return discountedRewards.map(() => 0);
        }

        const standardizedRewards = rewardsTensor.sub(mean).div(std);
        const finalRewards = standardizedRewards.arraySync();

        rewardsTensor.dispose();
        mean.dispose();
        variance.dispose();
        std.dispose();
        standardizedRewards.dispose();
        return finalRewards;
    }

    /**
     * Huấn luyện mạng chính sách sau khi một lượt chơi kết thúc, sử dụng thuật toán REINFORCE.
     * @returns {Promise<{loss: number, rewards: number}>} Một object chứa giá trị loss và tổng phần thưởng của lượt chơi.
     */
    async trainEpisode() {
        if (this.episodeActions.length === 0) {
            this.episodeStateSequences = [];
            this.episodeActions = [];
            this.episodeRewards = [];
            return { loss: 0, rewards: 0 };
        }

        const discountedRewardsArray = this._calculateDiscountedRewards();
        if (discountedRewardsArray.length === 0 && this.episodeActions.length > 0) {
            // Xảy ra nếu _calculateDiscountedRewards trả về mảng rỗng do std quá nhỏ và không có actions
            // Điều này không nên xảy ra nếu episodeActions có phần tử, nhưng là một biện pháp phòng ngừa
            console.warn("Không có discounted rewards hợp lệ để huấn luyện.");
            this.episodeStateSequences = [];
            this.episodeActions = [];
            this.episodeRewards = [];
            return { loss: 0, rewards: this.episodeRewards.reduce((sum, r) => sum + r, 0) };
        }

        const totalEpisodeReward = this.episodeRewards.reduce((sum, r) => sum + r, 0);
        const stateSequencesForTraining = this.episodeStateSequences.slice();
        const actionsForTraining = this.episodeActions.slice();

        const loss = this.optimizer.minimize(() => {
            return tf.tidy(() => {
                const currentEpisodeLogProbsList = [];
                for (let i = 0; i < stateSequencesForTraining.length; i++) {
                    const stateSequence = stateSequencesForTraining[i];
                    const actionTaken = actionsForTraining[i];
                    const inputTensor = tf.tensor3d([stateSequence], [1, this.sequenceLength, this.numFeatures]);
                    const allActionProbs = this.model.apply(inputTensor).squeeze();
                    const probOfTakenAction = allActionProbs.gather(tf.scalar(actionTaken, 'int32'));
                    // Thêm epsilon nhỏ trước khi lấy log
                    const logProbOfTakenAction = tf.log(probOfTakenAction.add(this.logEpsilon));
                    currentEpisodeLogProbsList.push(logProbOfTakenAction);
                }

                if (currentEpisodeLogProbsList.length === 0) {
                    // Trường hợp không có logProbs nào được tính (ví dụ: episode quá ngắn)
                    return tf.scalar(0); // Trả về loss là 0
                }

                const logProbsTensor = tf.stack(currentEpisodeLogProbsList);
                const discountedRewardsTensor = tf.tensor1d(discountedRewardsArray);

                if (logProbsTensor.shape[0] !== discountedRewardsTensor.shape[0]) {
                    console.error("Lỗi kích thước giữa logProbs và discountedRewards:", logProbsTensor.shape, discountedRewardsTensor.shape);
                    // Xử lý lỗi này, có thể bằng cách không tính loss hoặc trả về loss 0
                    return tf.scalar(0); // Trả về loss 0 nếu có lỗi kích thước
                }

                let episodeLoss = logProbsTensor.mul(discountedRewardsTensor).mul(tf.scalar(-1)).sum();
                return episodeLoss;
            });
        }, /* returnCost */ true);

        this.episodeStateSequences = [];
        this.episodeActions = [];
        this.episodeRewards = [];

        const lossValue = loss ? (await loss.data())[0] : 0;
        if (loss) loss.dispose();

        if (isNaN(lossValue)) {
            console.error("Loss is NaN! Kiểm tra lại quá trình tính toán.");
            // Có thể thêm logic để reset optimizer hoặc giảm learning rate ở đây
        }

        return { loss: lossValue, rewards: totalEpisodeReward };
    }
}