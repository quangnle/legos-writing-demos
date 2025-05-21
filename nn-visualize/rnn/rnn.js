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
    const stateValuesInfoDiv = document.getElementById('state-values-info'); // Đổi từ gate-values
    const gradientAccumulationInfoDiv = document.getElementById('gradient-accumulation-info');

    // --- Canvas Setup ---
    const canvas = document.getElementById('rnn-canvas');
    const ctx = canvas.getContext('2d');
    const cellWidth = 200; 
    const cellHeight = 200; // RNN cell đơn giản hơn, chiều cao nhỏ hơn
    const cellPadding = 20;
    const startY = 30;

    // --- Biến trạng thái và mô hình ---
    let sequenceLength = 0;
    let unrolledCellStates = []; // { x_val, h_prev, net_h, h_curr, error_h }

    function initializeSharedWeights() {
        return {
            W_xh: parseFloat((Math.random() * 0.6 - 0.3).toFixed(3)), // Input to hidden
            W_hh: parseFloat((Math.random() * 0.6 - 0.3).toFixed(3)), // Hidden to hidden
            b_h: parseFloat((Math.random() * 0.2 - 0.1).toFixed(3)),   // Bias for hidden
            // Trọng số cho lớp output tuyến tính đơn giản từ h_T
            W_hy: parseFloat((Math.random() * 0.6 - 0.3).toFixed(3)), // Last hidden to output
            b_y: parseFloat((Math.random() * 0.2 - 0.1).toFixed(3))    // Bias for output
        };
    }
    let sharedWeights = initializeSharedWeights();
    let accumulatedGradients = {};
    
    let finalCalculatedOutput = 0;
    let targetOutputForBptt = 1.0;
    let learningRate = 0.1;
    let iterationCount = 0;

    function tanh(x) {
        const val = Math.tanh(x);
        return parseFloat(val.toFixed(3));
    }
    // Đạo hàm của tanh(x) là 1 - tanh(x)^2
    function dtanh(tanh_x_val) { 
        return 1 - Math.pow(tanh_x_val, 2);
    }


    function displaySharedWeights() {
        let weightsText = '<ul>';
        for (const key in sharedWeights) {
            weightsText += `<li>${key}: ${sharedWeights[key].toFixed(4)}</li>`;
        }
        weightsText += '</ul>';
        sharedWeightsInfoDiv.innerHTML = weightsText;
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawRNNCell(x_coord, y_coord, timeStep, cellState, isActiveForward = false, isActiveBPTT = false) {
        ctx.strokeStyle = '#28a745'; // Màu xanh lá cho RNN
        ctx.fillStyle = '#fff';
        if (isActiveForward) {
            ctx.fillStyle = '#e2f0e9'; 
        }
        if (isActiveBPTT) {
            ctx.fillStyle = '#ffeeba'; 
            ctx.strokeStyle = '#ffc107';
        }

        ctx.beginPath();
        ctx.rect(x_coord, y_coord, cellWidth, cellHeight);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#333';

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`RNN Cell t=${timeStep + 1}`, x_coord + cellWidth / 2, y_coord + 20);

        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        let y_text = y_coord + 45;
        const lineSpacing = 20;

        ctx.fillText(`x: ${cellState.x_val !== null ? cellState.x_val.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        ctx.fillText(`h_prev: ${cellState.h_prev !== null ? cellState.h_prev.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        
        ctx.fillStyle = '#0056b3';
        ctx.fillText(`net_h = Wxh*x + Whh*h_prev + bh`, x_coord + 5, y_text); y_text += lineSpacing;
        ctx.fillText(`  Value: ${cellState.net_h !== null ? cellState.net_h.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing*1.2;

        ctx.fillStyle = '#dc3545';
        ctx.fillText(`h_curr = tanh(net_h)`, x_coord + 5, y_text); y_text += lineSpacing;
        ctx.fillText(`  Value: ${cellState.h_curr !== null ? cellState.h_curr.toFixed(3) : '?'}`, x_coord + 10, y_text); y_text += lineSpacing;
        
        if (isActiveBPTT || (cellState.error_h !== 0) ) {
            ctx.fillStyle = '#6c757d';
            y_text += lineSpacing * 0.5;
            ctx.fillText(`dL/dh: ${cellState.error_h !== null ? cellState.error_h.toFixed(3) : '0'}`, x_coord + 10, y_text);
        }
        ctx.fillStyle = '#333';
    }

    function drawConnections() {
        if (unrolledCellStates.length < 2) return;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        const arrowSize = 8;

        for (let i = 0; i < sequenceLength - 1; i++) {
            const x_start_cell = (i * (cellWidth + cellPadding)) + cellPadding + cellWidth;
            const x_end_cell = ((i + 1) * (cellWidth + cellPadding)) + cellPadding;

            const y_h_connect = startY + cellHeight * 0.5; // Nối ở giữa cell
            ctx.beginPath();
            ctx.moveTo(x_start_cell, y_h_connect);
            ctx.lineTo(x_end_cell, y_h_connect);
            ctx.stroke();
            // Mũi tên
            ctx.beginPath();
            ctx.moveTo(x_end_cell - arrowSize, y_h_connect - arrowSize / 2);
            ctx.lineTo(x_end_cell, y_h_connect);
            ctx.lineTo(x_end_cell - arrowSize, y_h_connect + arrowSize / 2);
            ctx.stroke();
        }
        ctx.lineWidth = 1;
    }
    
    function redrawAllCanvas(activeForwardStep = -1, activeBPTTStep = -1) {
        clearCanvas();
        for (let i = 0; i < sequenceLength; i++) {
            const x = cellPadding + i * (cellWidth + cellPadding);
            drawRNNCell(x, startY, i, unrolledCellStates[i] || createEmptyCellState(), i === activeForwardStep, i === activeBPTTStep);
        }
        drawConnections();
    }

    function createEmptyCellState() {
        return {
            x_val: null, h_prev: 0, net_h: null, h_curr: null,
            error_h: 0 // dL/dh_t
        };
    }

    drawStructureBtn.addEventListener('click', () => {
        sequenceLength = parseInt(sequenceLengthInput.value);
        if (isNaN(sequenceLength) || sequenceLength < 1 || sequenceLength > 5) {
            infoMessageDiv.textContent = "Sequence length không hợp lệ.";
            return;
        }
        
        unrolledCellStates = [];
        for (let i = 0; i < sequenceLength; i++) {
            unrolledCellStates.push(createEmptyCellState());
        }
        if (unrolledCellStates.length > 0) {
            unrolledCellStates[0].h_prev = 0; // h_0 là 0
        }

        finalOutputDiv.textContent = 'Chưa có';
        stateValuesInfoDiv.textContent = ''; // Clear state info
        gradientAccumulationInfoDiv.textContent = '';
        targetOutputInput.disabled = false;
        inputValuesInput.disabled = false;
        learningRateInput.disabled = false;
        
        sharedWeights = initializeSharedWeights();
        displaySharedWeights();
        iterationCount = 0;
        iterationCountDiv.textContent = iterationCount;

        redrawAllCanvas(); 

        runIterationBtn.disabled = false;
        infoMessageDiv.textContent = `Đã vẽ ${sequenceLength} RNN cell(s). Nhập input, target, LR và bắt đầu huấn luyện.`;
    });

    async function runForwardPassLogicAndDraw() {
        let h_prev_t = 0;
        // Đảm bảo unrolledCellStates có đúng số lượng phần tử
        if (unrolledCellStates.length !== sequenceLength) {
             unrolledCellStates = [];
             for (let i = 0; i < sequenceLength; i++) {
                unrolledCellStates.push(createEmptyCellState());
             }
             if (unrolledCellStates.length > 0) unrolledCellStates[0].h_prev = 0;
        }


        for (let t = 0; t < sequenceLength; t++) {
            const cellState = unrolledCellStates[t];

            cellState.x_val = inputSequence[t]; 
            cellState.h_prev = h_prev_t;

            cellState.net_h = sharedWeights.W_xh * cellState.x_val + sharedWeights.W_hh * cellState.h_prev + sharedWeights.b_h;
            cellState.h_curr = tanh(cellState.net_h);
            
            h_prev_t = cellState.h_curr;
            if (t < sequenceLength - 1) {
                unrolledCellStates[t+1].h_prev = h_prev_t;
            }

            redrawAllCanvas(t); 
            await new Promise(resolve => setTimeout(resolve, 600)); 
        }
        // Tính final output từ h_T (hidden state cuối cùng)
        const h_T = h_prev_t; // or unrolledCellStates[sequenceLength - 1].h_curr;
        finalCalculatedOutput = sharedWeights.W_hy * h_T + sharedWeights.b_y;
        // finalCalculatedOutput = tanh(sharedWeights.W_hy * h_T + sharedWeights.b_y); // Nếu muốn giới hạn output
        
        finalOutputDiv.textContent = finalCalculatedOutput.toFixed(3);
        redrawAllCanvas(); 
    }

    function runFullBPTT_logicAndDraw() {
        for (const key in sharedWeights) {
            accumulatedGradients[key] = 0; // Reset gradients
        }
        let latestStateValuesText = "";

        // 1. Tính lỗi ban đầu tại output (dL/dy_T)
        const dL_dy_T = finalCalculatedOutput - targetOutputForBptt;

        // 2. Tính gradient cho lớp output (W_hy, b_y)
        // Chỉ tính một lần vì output chỉ dựa vào h_T
        if (sequenceLength > 0) {
            const h_T_state = unrolledCellStates[sequenceLength - 1];
            accumulatedGradients.W_hy = dL_dy_T * h_T_state.h_curr;
            accumulatedGradients.b_y = dL_dy_T;
        }


        // 3. Lan truyền lỗi ngược qua các bước thời gian (từ T-1 về 0)
        // và tính gradient cho W_hh, W_xh, b_h
        let error_h_next = 0; // dL/dh_{t+1}

        for (let t = sequenceLength - 1; t >= 0; t--) {
            const cellState = unrolledCellStates[t];
            redrawAllCanvas(-1, t); // Highlight BPTT step

            // Tính dL/dh_t
            // dL/dh_t = (dL/dy_t * dy_t/dh_t) + (dL/dh_{t+1} * dh_{t+1}/dh_t)
            // Trong trường hợp này, dy_t/dh_t chỉ có ở bước cuối T (W_hy)
            // dh_{t+1}/dh_t = W_hh * dtanh(net_h_{t+1})
            
            let dL_dh_t_output_contribution = 0;
            if (t === sequenceLength - 1) {
                dL_dh_t_output_contribution = dL_dy_T * sharedWeights.W_hy; // dL/dy_T * dy_T/dh_T
            }

            let dL_dh_t_recurrent_contribution = 0;
            if (t < sequenceLength - 1) { // Nếu không phải cell cuối cùng của unroll
                 const nextCellState = unrolledCellStates[t+1];
                 // error_h_next là dL/dh_{t+1}
                 // dtanh_next_h_curr là đạo hàm của tanh(net_h_{t+1})
                 const dtanh_next_h_curr = dtanh(nextCellState.h_curr); // 1 - tanh^2(h_{t+1})
                 dL_dh_t_recurrent_contribution = error_h_next * sharedWeights.W_hh * dtanh_next_h_curr;

            }
            
            cellState.error_h = dL_dh_t_output_contribution + dL_dh_t_recurrent_contribution;
            if(isNaN(cellState.error_h)) cellState.error_h = 0;

            // Tính gradient cho W_hh, W_xh, b_h tại bước t
            const dtanh_h_curr = dtanh(cellState.h_curr); // 1 - tanh^2(h_t)
            
            accumulatedGradients.W_hh += cellState.error_h * dtanh_h_curr * cellState.h_prev;
            accumulatedGradients.W_xh += cellState.error_h * dtanh_h_curr * cellState.x_val;
            accumulatedGradients.b_h += cellState.error_h * dtanh_h_curr;

            error_h_next = cellState.error_h; // Cập nhật lỗi cho bước lan truyền tiếp theo

            // Cập nhật canvas để thấy error_h mới
            redrawAllCanvas(-1, t);
            if (t === 0) { 
                latestStateValuesText = `RNN Cell t=${t + 1} (BPTT details):<br> x: ${cellState.x_val.toFixed(3)}, h_prev: ${cellState.h_prev.toFixed(3)}, h_curr: ${cellState.h_curr.toFixed(3)} <br> dL/dh: ${cellState.error_h.toFixed(3)}`;
            }
        }

        for (const key in accumulatedGradients) {
            if(isNaN(accumulatedGradients[key])) accumulatedGradients[key] = 0;
            accumulatedGradients[key] = parseFloat(accumulatedGradients[key].toFixed(4));
        }
        stateValuesInfoDiv.innerHTML = latestStateValuesText || "BPTT details...";
        updateGradientAccumulationDisplay();
        redrawAllCanvas();
    }

    function updateSharedWeights() {
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
        
        runFullBPTT_logicAndDraw(); 
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

    function updateGradientAccumulationDisplay() {
        let gradText = '<ul>';
        for (const key in accumulatedGradients) {
            if (sharedWeights.hasOwnProperty(key)) {
                gradText += `<li>Gradient cho ${key}: ${(accumulatedGradients[key] || 0).toFixed(4)}</li>`;
            }
        }
        gradText += '</ul>';
        gradientAccumulationInfoDiv.innerHTML = gradText;
    }

    // Khởi tạo
    drawStructureBtn.click();
});