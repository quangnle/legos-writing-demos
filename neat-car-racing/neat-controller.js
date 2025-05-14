class NeatController {
    constructor(populationSize, inputNodes, outputNodes) {
        this.populationSize = populationSize;
        this.inputNodes = inputNodes;
        this.outputNodes = outputNodes;

        this.neat = new neataptic.Neat(
            this.inputNodes,
            this.outputNodes,
            null, // fitness function (chúng ta tự đặt score)
            {
                popsize: this.populationSize,
                elitism: Math.round(0.75 * this.populationSize), // Giữ lại 50% cá thể tốt nhất
                mutationRate: 0.3, // Tỷ lệ một genome sẽ bị đột biến
                //mutationAmount: 3, // Số lần một phương thức đột biến được áp dụng (thường để Neataptic tự quản lý hoặc đặt là 1 và dùng nhiều mutation methods)
                
                // Cấu trúc mạng ban đầu: kết nối trực tiếp input tới output.
                // N.E.A.T. sẽ tự thêm node và kết nối.
                // network: new neataptic.Network(this.inputNodes, this.outputNodes),
                network: new neataptic.architect.Random(this.inputNodes, 10, 10, 10, this.outputNodes),

                // Sử dụng bộ phương thức đột biến tiêu chuẩn cho mạng truyền thẳng (Feed-Forward)
                // Đây là cách khuyến nghị và ít lỗi hơn là liệt kê thủ công.
                mutation: [ // Các phương thức đột biến
                    neataptic.methods.mutation.ADD_NODE, // Thêm node mới
                    neataptic.methods.mutation.ADD_CONN,  // Thêm kết nối mới
                    neataptic.methods.mutation.MOD_WEIGHT, // Thay đổi trọng số
                    neataptic.methods.mutation.SUB_NODE, // Xóa node
                    neataptic.methods.mutation.SUB_CONN, // Xóa kết nối
                ],
                //selection: neataptic.methods.selection.POWER // Phương thức chọn lọc POWER thường cho kết quả tốt
            }
        );
        // console.log("Neataptic Initialized with FFW mutations: ", this.neat);
    }

    // Lấy danh sách các bộ não (genomes) cho thế hệ hiện tại
    getGenomes() {
        return this.neat.population;
    }

    // Hàm này được gọi sau khi tất cả các xe trong một thế hệ đã chạy xong
    // và điểm fitness của chúng đã được tính toán và gán vào car.brain.score
    evaluateAndEvolve() {
        // Neataptic sẽ tự động sử dụng các giá trị 'score' đã được gán cho mỗi genome.
        // Hàm neat.evolve() bao gồm việc sắp xếp, chọn lọc, lai ghép và đột biến.
        this.neat.evolve();
        // neat.generation được tự động tăng bởi evolve()
    }

    // (Tùy chọn) Lấy bộ não tốt nhất của thế hệ hiện tại
    getFittestGenome() {
        if (this.neat.population && this.neat.population.length > 0) {
            // neat.getFittest() hoạt động trên quần thể đã được sắp xếp (evolve() làm điều này)
            return this.neat.getFittest();
        }
        return null;
    }

    // (Tùy chọn) Tải một bộ não từ JSON
    loadBrain(json) {
        if (this.neat && json) {
            const newPop = [];
            for (let i = 0; i < this.neat.popsize; i++) {
                newPop.push(neataptic.Network.fromJSON(json));
            }
            this.neat.population = newPop;
            // Bạn có thể muốn reset neat.generation hoặc tải nó từ file nếu có
            this.neat.generation = 0; 
            console.log("Brain loaded into population from JSON.");
        }
    }
}