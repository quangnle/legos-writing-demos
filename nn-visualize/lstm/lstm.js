document.addEventListener('DOMContentLoaded', () => {
    // --- Lấy các phần tử DOM ---
    const sequenceLengthInput = document.getElementById('sequence-length');
    const drawStructureBtn = document.getElementById('draw-structure-btn');
    const inputValuesInput = document.getElementById('input-values');
    const targetOutputInput = document.getElementById('target-output-input');
    const learningRateInput = document.getElementById('learning-rate-input');
    const runIterationBtn = document.getElementById('run-iteration-btn');

    const finalOutputDiv = document.getElementById('final-output');
    const iterationCountDiv = document.getElementById('iteration-count');
    const sharedWeightsInfoDiv = document.getElementById('shared-weights-info');
    const infoMessageDiv = document.getElementById('info-message');
    const gateValuesInfoDiv = document.getElementById('gate-values-info');
    const gradientAccumulationInfoDiv = document.getElementById('gradient-accumulation-info');

    // --- Canvas Setup ---
    const canvas = document.getElementById('lstm-canvas');
    const ctx = canvas.getContext('2d');
    const cellWidth = 160; // Chiều rộng mỗi LSTM cell trên canvas
    const cellHeight = 270; // Chiều cao mỗi LSTM cell
    const cellPadding = 20; // Khoảng cách giữa các cell
    const startY = 20; // Vị trí bắt đầu vẽ theo chiều Y

    // --- Biến trạng thái và mô hình ---
    let sequenceLength = 0;
    // unrolledCellStates sẽ lưu trạng thái tính toán để vẽ lên canvas
    let unrolledCellStates = []; // { x_val, h_prev, c_prev, f_gate, i_gate, c_tilde, c_curr, o_gate, h_curr, error_h, error_c }

    function initializeSharedWeights() { // (Giữ nguyên hàm này)
        return {
            W_i: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), U_i: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), b_i: parseFloat((Math.random() * 0.2 - 0.1).toFixed(3)),
            W_f: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), U_f: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), b_f: parseFloat((Math.random() * 0.2 - 0.1).toFixed(3)),
            W_c: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), U_c: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), b_c: parseFloat((Math.random() * 0.2 - 0.1).toFixed(3)),
            W_o: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), U_o: parseFloat((Math.random() * 0.5 - 0.25).toFixed(3)), b_o: parseFloat((Math.random() * 0.2 - 0.1).toFixed(3)),
        };
    }
    let sharedWeights = initializeSharedWeights();
    let accumulatedGradients = {};
    
    let finalCalculatedOutput = 0;
    let targetOutputForBptt = 1.0;
    let learningRate = 0.1;
    let iterationCount = 0;

    // --- Các hàm tính toán LSTM (sigmoid, tanh) --- (Giữ nguyên)
    function sigmoid(x) {
        const val = 1 / (1 + Math.exp(-x));
        return parseFloat(val.toFixed(3));
    }
    function tanh(x) {
        const val = Math.tanh(x);
        return parseFloat(val.toFixed(3));
    }

    // --- Các hàm vẽ trên Canvas ---
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawLSTMCell(x_coord, y_coord, timeStep, cellState, isActiveForward = false, isActiveBPTT = false) {
        ctx.strokeStyle = '#007bff';
        ctx.fillStyle = '#fff';
        if (isActiveForward) {
            ctx.fillStyle = '#d1e7ff'; // Màu xanh nhạt
        }
        if (isActiveBPTT) {
            ctx.fillStyle = '#ffeeba'; // Màu vàng nhạt
             ctx.strokeStyle = '#ffc107';
        }

        ctx.beginPath();
        ctx.rect(x_coord, y_coord, cellWidth, cellHeight);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333'; // Màu chữ mặc định

        // Tên Time Step
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Time Step t=${timeStep + 1}`, x_coord + cellWidth / 2, y_coord + 20);

        // Hiển thị các giá trị (đơn giản hóa)
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        let y_text = y_coord + 45;
        const lineSpacing = 18;

        ctx.fillText(`x: ${cellState.x_val !== null ? cellState.x_val.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        ctx.fillText(`h_prev: ${cellState.h_prev !== null ? cellState.h_prev.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        ctx.fillText(`C_prev: ${cellState.c_prev !== null ? cellState.c_prev.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing*1.5;

        ctx.strokeStyle = '#ccc'; // Đường kẻ ngang mỏng
        ctx.beginPath();
        ctx.moveTo(x_coord + 5, y_text - lineSpacing*0.75);
        ctx.lineTo(x_coord + cellWidth - 5, y_text - lineSpacing*0.75);
        ctx.stroke();


        ctx.fillStyle = '#0056b3'; // Màu chữ cho cổng
        ctx.fillText(`Forget Gate (f): ${cellState.f_gate !== null ? cellState.f_gate.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        ctx.fillText(`Input Gate (i): ${cellState.i_gate !== null ? cellState.i_gate.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        ctx.fillText(`Candidate (C̃): ${cellState.c_tilde !== null ? cellState.c_tilde.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        
        ctx.fillStyle = '#28a745'; // Màu xanh lá cho trạng thái
        ctx.fillText(`Cell State (C): ${cellState.c_curr !== null ? cellState.c_curr.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing*1.5;
        
        ctx.strokeStyle = '#ccc';
        ctx.beginPath();
        ctx.moveTo(x_coord + 5, y_text - lineSpacing*0.75);
        ctx.lineTo(x_coord + cellWidth - 5, y_text - lineSpacing*0.75);
        ctx.stroke();

        ctx.fillStyle = '#dc3545'; // Màu đỏ cho output gate và hidden state
        ctx.fillText(`Output Gate (o): ${cellState.o_gate !== null ? cellState.o_gate.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        ctx.fillText(`Hidden State (h): ${cellState.h_curr !== null ? cellState.h_curr.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        
        // Hiển thị lỗi cho BPTT (nếu có)
        if (isActiveBPTT || (cellState.error_h !== 0 || cellState.error_c !==0) ) { // Hiển thị nếu đang active hoặc đã có lỗi
            ctx.fillStyle = '#6c757d'; // Màu xám cho lỗi
            y_text += lineSpacing * 0.5;
            ctx.fillText(`dL/dh: ${cellState.error_h !== null ? cellState.error_h.toFixed(3) : '0'}`, x_coord + 10, y_text); y_text += lineSpacing;
            ctx.fillText(`dL/dC: ${cellState.error_c !== null ? cellState.error_c.toFixed(3) : '0'}`, x_coord + 10, y_text);
        }
         ctx.fillStyle = '#333'; // Reset màu chữ
    }

    function drawConnections() {
        if (unrolledCellStates.length < 2) return;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        const arrowSize = 8;

        for (let i = 0; i < sequenceLength - 1; i++) {
            const x_start_cell = (i * (cellWidth + cellPadding)) + cellPadding + cellWidth;
            const x_end_cell = ((i + 1) * (cellWidth + cellPadding)) + cellPadding;

            // Kết nối cho h_state (ví dụ: ở dưới)
            const y_h_connect = startY + cellHeight * 0.85;
            ctx.beginPath();
            ctx.moveTo(x_start_cell, y_h_connect);
            ctx.lineTo(x_end_cell, y_h_connect);
            ctx.stroke();
            // Mũi tên cho h
            ctx.beginPath();
            ctx.moveTo(x_end_cell - arrowSize, y_h_connect - arrowSize / 2);
            ctx.lineTo(x_end_cell, y_h_connect);
            ctx.lineTo(x_end_cell - arrowSize, y_h_connect + arrowSize / 2);
            ctx.stroke();


            // Kết nối cho C_state (ví dụ: ở giữa)
            const y_c_connect = startY + cellHeight * 0.5;
            ctx.beginPath();
            ctx.moveTo(x_start_cell, y_c_connect);
            ctx.lineTo(x_end_cell, y_c_connect);
            ctx.stroke();
            // Mũi tên cho C
            ctx.beginPath();
            ctx.moveTo(x_end_cell - arrowSize, y_c_connect - arrowSize / 2);
            ctx.lineTo(x_end_cell, y_c_connect);
            ctx.lineTo(x_end_cell - arrowSize, y_c_connect + arrowSize / 2);
            ctx.stroke();
        }
        ctx.lineWidth = 1; // Reset line width
    }
    
    function redrawAllCanvas(activeForwardStep = -1, activeBPTTStep = -1) {
        clearCanvas();
        for (let i = 0; i < sequenceLength; i++) {
            const x = cellPadding + i * (cellWidth + cellPadding);
            drawLSTMCell(x, startY, i, unrolledCellStates[i] || createEmptyCellState(), i === activeForwardStep, i === activeBPTTStep);
        }
        drawConnections();
    }

    function createEmptyCellState() {
        return {
            x_val: null, h_prev: 0, c_prev: 0,
            f_gate: null, i_gate: null, c_tilde: null,
            c_curr: null, o_gate: null, h_curr: null,
            error_h: 0, error_c: 0
        };
    }


    // --- Cập nhật hiển thị khác (HTML) ---
    function displaySharedWeights() { /* (Giữ nguyên) */
        let weightsText = '<ul>';
        for (const key in sharedWeights) {
            weightsText += `<li>${key}: ${sharedWeights[key].toFixed(4)}</li>`;
        }
        weightsText += '</ul>';
        sharedWeightsInfoDiv.innerHTML = weightsText;
    }
    function updateGradientAccumulationDisplay() { /* (Giữ nguyên) */
        let gradText = '<ul>';
        for (const key in accumulatedGradients) {
            if (sharedWeights.hasOwnProperty(key)) {
                gradText += `<li>Gradient cho ${key}: ${(accumulatedGradients[key] || 0).toFixed(4)}</li>`;
            }
        }
        gradText += '</ul>';
        gradientAccumulationInfoDiv.innerHTML = gradText;
    }

    // --- Logic xử lý chính ---
    drawStructureBtn.addEventListener('click', () => {
        sequenceLength = parseInt(sequenceLengthInput.value);
        if (isNaN(sequenceLength) || sequenceLength < 1 || sequenceLength > 5) {
            infoMessageDiv.textContent = "Sequence length không hợp lệ (phải từ 1 đến 5).";
            return;
        }
        
        // Khởi tạo unrolledCellStates với cấu trúc dữ liệu trống
        unrolledCellStates = [];
        for (let i = 0; i < sequenceLength; i++) {
            unrolledCellStates.push(createEmptyCellState());
        }
        // Set h_prev, c_prev cho cell đầu tiên là 0 (hoặc giá trị mặc định)
        if (unrolledCellStates.length > 0) {
            unrolledCellStates[0].h_prev = 0;
            unrolledCellStates[0].c_prev = 0;
        }


        finalOutputDiv.textContent = 'Chưa có';
        gateValuesInfoDiv.textContent = '';
        gradientAccumulationInfoDiv.textContent = '';
        targetOutputInput.disabled = false;
        inputValuesInput.disabled = false;
        learningRateInput.disabled = false;
        
        sharedWeights = initializeSharedWeights();
        displaySharedWeights();
        iterationCount = 0;
        iterationCountDiv.textContent = iterationCount;

        redrawAllCanvas(); // Vẽ cấu trúc lên canvas

        runIterationBtn.disabled = false;
        infoMessageDiv.textContent = `Đã vẽ ${sequenceLength} LSTM cell(s). Nhập input, target và learning rate, sau đó bắt đầu huấn luyện.`;
    });

    async function runForwardPassLogicAndDraw() {
        let h_prev_t = 0;
        let c_prev_t = 0;

        for (let t = 0; t < sequenceLength; t++) {
            const cellState = unrolledCellStates[t]; // Lấy đối tượng state của cell hiện tại

            cellState.input = inputSequence[t]; // Dùng inputSequence toàn cục
            cellState.x_val = inputSequence[t]; // Lưu lại để vẽ
            cellState.h_prev = h_prev_t;
            cellState.c_prev = c_prev_t;

            cellState.f_gate = sigmoid(sharedWeights.W_f * cellState.input + sharedWeights.U_f * cellState.h_prev + sharedWeights.b_f);
            cellState.i_gate = sigmoid(sharedWeights.W_i * cellState.input + sharedWeights.U_i * cellState.h_prev + sharedWeights.b_i);
            cellState.c_tilde = tanh(sharedWeights.W_c * cellState.input + sharedWeights.U_c * cellState.h_prev + sharedWeights.b_c);
            cellState.c_curr = parseFloat((cellState.f_gate * cellState.c_prev + cellState.i_gate * cellState.c_tilde).toFixed(3));
            cellState.o_gate = sigmoid(sharedWeights.W_o * cellState.input + sharedWeights.U_o * cellState.h_prev + sharedWeights.b_o);
            cellState.h_curr = parseFloat((cellState.o_gate * tanh(cellState.c_curr)).toFixed(3));

            // Cập nhật h_prev, c_prev cho cell tiếp theo
            h_prev_t = cellState.h_curr;
            c_prev_t = cellState.c_curr;
            if (t < sequenceLength - 1) {
                unrolledCellStates[t+1].h_prev = h_prev_t;
                unrolledCellStates[t+1].c_prev = c_prev_t;
            }

            redrawAllCanvas(t); // Vẽ lại canvas, highlight cell hiện tại
            await new Promise(resolve => setTimeout(resolve, 700)); // Delay để xem
        }
        finalCalculatedOutput = h_prev_t;
        finalOutputDiv.textContent = finalCalculatedOutput.toFixed(3);
        redrawAllCanvas(); // Vẽ lại lần cuối không highlight forward
    }

    function runFullBPTT_logicAndDraw() {
        for (const key in sharedWeights) {
            accumulatedGradients[key] = 0;
        }
        let latestGateValuesText = "";

        for (let step = sequenceLength - 1; step >= 0; step--) {
            const cellState = unrolledCellStates[step];
             // Đánh dấu cell đang xử lý BPTT để vẽ lại
            redrawAllCanvas(-1, step); // -1 để không highlight forward, step cho BPTT
            // await new Promise(resolve => setTimeout(resolve, 500)); // Delay nhỏ để xem BPTT

            let dL_dh_t = 0;
            if (step === sequenceLength - 1) {
                dL_dh_t = finalCalculatedOutput - targetOutputForBptt;
            } else {
                const nextCellState = unrolledCellStates[step + 1];
                // Logic lan truyền lỗi dL_dh_t (giữ nguyên như bản trước, vẫn là đơn giản hóa)
                let error_from_h_next_weighted_by_U = 0;
                error_from_h_next_weighted_by_U += nextCellState.error_signal_h * sharedWeights.U_f * nextCellState.f_gate * (1 - nextCellState.f_gate);
                error_from_h_next_weighted_by_U += nextCellState.error_signal_h * sharedWeights.U_i * nextCellState.i_gate * (1 - nextCellState.i_gate);
                error_from_h_next_weighted_by_U += nextCellState.error_signal_h * sharedWeights.U_c * (1 - Math.pow(nextCellState.c_tilde, 2));
                error_from_h_next_weighted_by_U += nextCellState.error_signal_h * sharedWeights.U_o * nextCellState.o_gate * (1 - nextCellState.o_gate);
                
                let error_from_c_next_to_h = nextCellState.error_signal_c * nextCellState.f_gate;

                dL_dh_t = (error_from_h_next_weighted_by_U + error_from_c_next_to_h) * 0.1; // Giữ hệ số giảm
            }
            cellState.error_h = parseFloat(dL_dh_t.toFixed(3));
            if(isNaN(cellState.error_h)) cellState.error_h = 0;

            let dL_dC_t = cellState.error_h * cellState.o_gate * (1 - Math.pow(tanh(cellState.c_curr), 2));
            if (step < sequenceLength - 1) {
                dL_dC_t += unrolledCellStates[step + 1].error_c * unrolledCellStates[step + 1].f_gate;
            }
            cellState.error_c = parseFloat(dL_dC_t.toFixed(3));
            if(isNaN(cellState.error_c)) cellState.error_c = 0;

            // Tính gradient (giữ nguyên logic tính, chỉ là lưu vào cellState.gradients_step nếu cần)
            let currentGradients = {}; // Tính toán tương tự như bản trước
            currentGradients.W_o = cellState.error_h * tanh(cellState.c_curr) * cellState.o_gate * (1 - cellState.o_gate) * cellState.x_val;
            currentGradients.U_o = cellState.error_h * tanh(cellState.c_curr) * cellState.o_gate * (1 - cellState.o_gate) * cellState.h_prev;
            currentGradients.b_o = cellState.error_h * tanh(cellState.c_curr) * cellState.o_gate * (1 - cellState.o_gate);

            let d_C_curr_term_for_grad = cellState.error_h * cellState.o_gate * (1 - Math.pow(tanh(cellState.c_curr), 2)) + cellState.error_c;

            currentGradients.W_i = d_C_curr_term_for_grad * cellState.c_tilde * cellState.i_gate * (1 - cellState.i_gate) * cellState.x_val;
            currentGradients.U_i = d_C_curr_term_for_grad * cellState.c_tilde * cellState.i_gate * (1 - cellState.i_gate) * cellState.h_prev;
            currentGradients.b_i = d_C_curr_term_for_grad * cellState.c_tilde * cellState.i_gate * (1 - cellState.i_gate);

            currentGradients.W_f = d_C_curr_term_for_grad * cellState.c_prev * cellState.f_gate * (1 - cellState.f_gate) * cellState.x_val;
            currentGradients.U_f = d_C_curr_term_for_grad * cellState.c_prev * cellState.f_gate * (1 - cellState.f_gate) * cellState.h_prev;
            currentGradients.b_f = d_C_curr_term_for_grad * cellState.c_prev * cellState.f_gate * (1 - cellState.f_gate);

            currentGradients.W_c = d_C_curr_term_for_grad * cellState.i_gate * (1 - Math.pow(cellState.c_tilde, 2)) * cellState.x_val;
            currentGradients.U_c = d_C_curr_term_for_grad * cellState.i_gate * (1 - Math.pow(cellState.c_tilde, 2)) * cellState.h_prev;
            currentGradients.b_c = d_C_curr_term_for_grad * cellState.i_gate * (1 - Math.pow(cellState.c_tilde, 2));
            
            for (const key in currentGradients) {
                if (isNaN(currentGradients[key])) currentGradients[key] = 0;
                accumulatedGradients[key] = (accumulatedGradients[key] || 0) + currentGradients[key];
            }
             // Cập nhật lại canvas để hiển thị error_h, error_c mới tính
            redrawAllCanvas(-1, step);
             if (step === 0) { // Hiển thị thông tin BPTT chi tiết cho cell đầu tiên (cuối cùng trong BPTT)
                latestGateValuesText = `Cell t=${step + 1} (BPTT details):<br> ... error_h: ${cellState.error_h.toFixed(3)}, error_c: ${cellState.error_c.toFixed(3)}`;
            }
        }
        // Làm tròn accumulatedGradients
        for (const key in accumulatedGradients) {
            accumulatedGradients[key] = parseFloat(accumulatedGradients[key].toFixed(4));
        }
        gateValuesInfoDiv.innerHTML = latestGateValuesText || "BPTT details...";
        updateGradientAccumulationDisplay();
        redrawAllCanvas(); // Xóa highlight BPTT
    }

    function updateSharedWeights() { /* (Giữ nguyên) */
        for (const key in sharedWeights) {
            if (accumulatedGradients.hasOwnProperty(key) && !isNaN(accumulatedGradients[key])) {
                sharedWeights[key] -= learningRate * accumulatedGradients[key];
                sharedWeights[key] = parseFloat(sharedWeights[key].toFixed(4));
            }
        }
    }
    
    runIterationBtn.addEventListener('click', async () => {
        const valuesStr = inputValuesInput.value;
        inputSequence = valuesStr.split(',').map(s => parseFloat(s.trim()));
        if (inputSequence.some(isNaN) || inputSequence.length !== sequenceLength) {
            infoMessageDiv.textContent = `Vui lòng nhập đúng ${sequenceLength} giá trị số cho input.`;
            return;
        }
        const targetStr = targetOutputInput.value;
        const parsedTarget = parseFloat(targetStr);
        if (isNaN(parsedTarget)) {
            infoMessageDiv.textContent = "Target Output không hợp lệ.";
            return;
        }
        targetOutputForBptt = parsedTarget;
        const lrStr = learningRateInput.value;
        const parsedLr = parseFloat(lrStr);
        if (isNaN(parsedLr) || parsedLr <= 0) {
            infoMessageDiv.textContent = "Learning Rate không hợp lệ.";
            return;
        }
        learningRate = parsedLr;

        runIterationBtn.disabled = true;
        inputValuesInput.disabled = true;
        targetOutputInput.disabled = true;
        learningRateInput.disabled = true;
        drawStructureBtn.disabled = true;

        iterationCount++;
        iterationCountDiv.textContent = iterationCount;
        infoMessageDiv.textContent = `Đang chạy Iteration ${iterationCount}... (Forward Pass)`;

        await runForwardPassLogicAndDraw();
        infoMessageDiv.textContent = `Iteration ${iterationCount}: Forward Pass xong. Đang chạy BPTT...`;
        
        // Chạy BPTT và vẽ (nếu muốn có delay trong BPTT thì cần async/await bên trong nó)
        runFullBPTT_logicAndDraw(); // Hàm này cần được điều chỉnh nếu muốn có delay từng bước BPTT
        infoMessageDiv.textContent = `Iteration ${iterationCount}: BPTT xong. Đang cập nhật trọng số...`;

        updateSharedWeights();
        displaySharedWeights();

        infoMessageDiv.textContent = `Iteration ${iterationCount} hoàn thành. Output: ${finalCalculatedOutput.toFixed(3)}.`;

        runIterationBtn.disabled = false;
        inputValuesInput.disabled = false;
        targetOutputInput.disabled = false;
        learningRateInput.disabled = false;
        drawStructureBtn.disabled = false;
    });

    // Khởi tạo
    drawStructureBtn.click();
});