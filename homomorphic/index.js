// BigInt utility functions
function power(base, exp, mod) {
    base = BigInt(base); exp = BigInt(exp); mod = BigInt(mod);
    let res = 1n;
    base = base % mod; // Ensure base is within mod before starting
    while (exp > 0n) {
        if (exp % 2n === 1n) res = (res * base) % mod;
        base = (base * base) % mod;
        exp = exp / 2n;
    }
    return res;
}

function extendedGCD(a, b) {
    a = BigInt(a); b = BigInt(b);
    if (a === 0n) return [b, 0n, 1n];
    const [gcdVal, x1, y1] = extendedGCD(b % a, a);
    const x = y1 - (b / a) * x1;
    const y = x1;
    return [gcdVal, x, y];
}

function modInverse(e, phi) {
    e = BigInt(e); phi = BigInt(phi);
    const [gcdVal, x] = extendedGCD(e, phi);
    if (gcdVal !== 1n) throw new Error(`Giá trị ${e} không có nghịch đảo modular với ${phi}`);
    return (x % phi + phi) % phi; // Ensure result is positive
}

function gcd(a, b) {
    a = BigInt(a); b = BigInt(b);
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

// Global RSA variables
let rsaN, rsaE_val, rsaD, rsaPhi;
// Global Paillier variables
let paillierN, paillierG, paillierLambda, paillierMu, paillierNsquare;

// --- Gemini API Helper ---
const GEMINI_API_KEY = ""; // Leave empty, will be handled by the environment
const GEMINI_API_URL_TEXT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGeminiApi(promptText, outputElementId) {
    const outputElement = document.getElementById(outputElementId);
    if (!outputElement) {
        console.error("Gemini output element not found:", outputElementId);
        return;
    }
    outputElement.innerHTML = '<span class="loading-indicator">Đang tải giải thích từ Gemini...</span>';

    const payload = {
        contents: [{ role: "user", parts: [{ text: promptText }] }]
    };

    try {
        const response = await fetch(GEMINI_API_URL_TEXT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error Response:", errorData);
            throw new Error(`Lỗi API Gemini: ${response.status} ${response.statusText}. Chi tiết: ${JSON.stringify(errorData.error?.message || errorData)}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const markdownText = result.candidates[0].content.parts[0].text;
            // SỬ DỤNG MARKED.JS ĐỂ PHÂN TÍCH MARKDOWN
            outputElement.innerHTML = marked.parse(markdownText);
        } else {
            console.error("Unexpected Gemini API response structure:", result);
            outputElement.innerHTML = "Không nhận được phản hồi hợp lệ từ Gemini.";
        }
    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        outputElement.innerHTML = `Lỗi: ${error.message}`;
    }
}

function explainConcept(concept) {
    let prompt = "";
    let outputId = "";
    if (concept === 'RSA') {
        prompt = "Giải thích ngắn gọn và đơn giản (khoảng 3-5 đoạn văn ngắn) về mã hóa RSA và tính đồng cấu nhân của nó là gì, dành cho người mới bắt đầu tìm hiểu về mật mã. Hãy dùng markdown để định dạng câu trả lời cho dễ đọc, có thể dùng tiêu đề nhỏ, danh sách nếu cần. Tập trung vào ý tưởng chính.";
        outputId = "rsaConceptExplanation";
    } else if (concept === 'Paillier') {
        prompt = "Giải thích ngắn gọn và đơn giản (khoảng 3-5 đoạn văn ngắn) về mã hóa Paillier và tính đồng cấu cộng của nó là gì, dành cho người mới bắt đầu tìm hiểu về mật mã. Hãy dùng markdown để định dạng câu trả lời cho dễ đọc, có thể dùng tiêu đề nhỏ, danh sách nếu cần. Tập trung vào ý tưởng chính.";
        outputId = "paillierConceptExplanation";
    }
    if (prompt && outputId) {
        callGeminiApi(prompt, outputId);
    }
}

function interpretRsaResult() {
    const resultText = document.getElementById('rsaDecryptedResult').textContent;
    const errorText = document.getElementById('rsaError').textContent;
    const s_orig = document.getElementById('secretS').value;
    
    let prompt = `Trong một demo về mã hóa đồng cấu RSA, kết quả giải mã nhận được là: "${resultText}". Số bí mật ban đầu người dùng nhập là ${s_orig}. `;
    if (errorText) {
        prompt += `Ngoài ra, có một cảnh báo lỗi hiển thị: "${errorText}". `;
    }
    prompt += "Dựa trên thông tin này, hãy diễn giải kết quả một cách thân thiện cho người dùng. Nếu kết quả có vẻ khớp với số ban đầu (sau khi xem xét modulo n), hãy chúc mừng và giải thích ngắn gọn ý nghĩa của việc này trong demo. Nếu có lỗi hoặc không khớp, hãy đưa ra một nhận xét nhẹ nhàng và có thể gợi ý kiểm tra lại các bước. Giữ câu trả lời ngắn gọn (2-3 câu) và tập trung vào ý nghĩa của demo mã hóa đồng cấu.";
    callGeminiApi(prompt, "rsaResultInterpretation");
}

function interpretPaillierResult() {
    const resultText = document.getElementById('paillierDecryptedResult').textContent;
    const errorText = document.getElementById('paillierError').textContent;
    const s_orig = document.getElementById('secretS').value;

    let prompt = `Trong một demo về mã hóa đồng cấu Paillier, kết quả giải mã nhận được là: "${resultText}". Số bí mật ban đầu người dùng nhập là ${s_orig}. `;
    if (errorText) {
        prompt += `Ngoài ra, có một cảnh báo lỗi hiển thị: "${errorText}". `;
    }
    prompt += "Dựa trên thông tin này, hãy diễn giải kết quả một cách thân thiện cho người dùng. Nếu kết quả có vẻ khớp với số ban đầu (sau khi xem xét modulo n), hãy chúc mừng và giải thích ngắn gọn ý nghĩa của việc này trong demo. Nếu có lỗi hoặc không khớp, hãy đưa ra một nhận xét nhẹ nhàng và có thể gợi ý kiểm tra lại các bước. Giữ câu trả lời ngắn gọn (2-3 câu) và tập trung vào ý nghĩa của demo mã hóa đồng cấu.";
    callGeminiApi(prompt, "paillierResultInterpretation");
}


function clearInputError(inputElement) {
    inputElement.classList.remove('error-input');
    const statusEl = document.getElementById(inputElement.id + 'Status');
    if (statusEl) {
        statusEl.textContent = '';
    }
}

function setInputError(inputElement, message) {
    inputElement.classList.add('error-input');
    const statusEl = document.getElementById(inputElement.id + 'Status');
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// Tab switching
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tabbuttons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    if (tabName === 'rsaTab' && document.getElementById('rsaPartsContainer').children.length === 0) {
        addRsaPartInput(false); 
        addRsaPartInput(true);  
    } else if (tabName === 'paillierTab' && document.getElementById('paillierPartsContainer').children.length === 0) {
        addPaillierPartInput(false); 
        addPaillierPartInput(true); 
    }
    updateActiveTabCalculatedPart();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.tab-button').click(); 
    document.getElementById('secretS').oninput = updateActiveTabCalculatedPart;
    ['rsaP', 'rsaQ', 'rsaE'].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).oninput = () => { rsaN = undefined; document.getElementById('rsaParamsDisplay').textContent = "Tham số đã thay đổi, vui lòng tạo lại khóa."; clearRsaResults(); };
    });
    ['paillierP', 'paillierQ'].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).oninput = () => { paillierN = undefined; document.getElementById('paillierParamsDisplay').textContent = "Tham số đã thay đổi, vui lòng tạo lại khóa."; clearPaillierResults(); };
    });
});

function updateActiveTabCalculatedPart() {
    if (document.getElementById('rsaTab').classList.contains('active')) {
        updateRsaCalculatedPart();
    } else if (document.getElementById('paillierTab').classList.contains('active')) {
        updatePaillierCalculatedPart();
    }
}

function createPartDOM(partIndex, typePrefix, isCalculated = false) {
    const div = document.createElement('div');
    div.className = 'part-input-container';
    div.id = `${typePrefix}PartDiv${partIndex}`;

    const rowDiv = document.createElement('div');
    rowDiv.className = 'part-input-row';
    
    const label = document.createElement('label');
    label.id = `${typePrefix}Label${partIndex}`;
    label.htmlFor = `${typePrefix}Part${partIndex}`;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `${typePrefix}Part${partIndex}`;
    
    if (isCalculated) {
        label.textContent = `s${partIndex} (tính tự động):`;
        input.placeholder = `Phần s${partIndex} (tính tự động)`;
        input.readOnly = true;
        input.style.fontStyle = 'italic';
    } else {
        label.textContent = `s${partIndex}:`;
        input.placeholder = `Phần s${partIndex}`;
        input.oninput = (typePrefix === 'rsa') ? updateRsaCalculatedPart : updatePaillierCalculatedPart;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '–'; 
        removeButton.className = 'remove-part-button';
        removeButton.title = 'Xóa phần này';
        removeButton.onclick = function() { removePart(this, typePrefix); };
        rowDiv.appendChild(removeButton); 
    }
    
    rowDiv.insertBefore(input, rowDiv.firstChild); 
    rowDiv.insertBefore(label, input); 
    div.appendChild(rowDiv);

    const statusDiv = document.createElement('div');
    statusDiv.id = input.id + 'Status';
    statusDiv.className = 'part-status-message';
    div.appendChild(statusDiv);

    return div;
}

function reindexParts(containerId, typePrefix) {
    const container = document.getElementById(containerId);
    const parts = Array.from(container.children);
    const updateFn = (typePrefix === 'rsa') ? updateRsaCalculatedPart : updatePaillierCalculatedPart;

    parts.forEach((partDiv, index) => {
        const partIndex = index + 1;
        const input = partDiv.querySelector('input[type="number"]');
        const label = partDiv.querySelector('label');
        const statusDiv = partDiv.querySelector('.part-status-message');
        const removeButton = partDiv.querySelector('.remove-part-button');

        input.id = `${typePrefix}Part${partIndex}`;
        label.htmlFor = input.id;
        label.id = `${typePrefix}Label${partIndex}`;
        if (statusDiv) statusDiv.id = input.id + 'Status';

        if (input.readOnly) {
            label.textContent = `s${partIndex} (tính tự động):`;
            input.placeholder = `Phần s${partIndex} (tính tự động)`;
        } else {
            label.textContent = `s${partIndex}:`;
            input.placeholder = `Phần s${partIndex}`;
            input.oninput = updateFn; 
            if (removeButton) { 
                removeButton.onclick = function() { removePart(this, typePrefix); };
            }
        }
    });
    updateRemoveButtonVisibility(containerId, typePrefix);
}

function updateRemoveButtonVisibility(containerId, typePrefix) {
    const container = document.getElementById(containerId);
    const parts = Array.from(container.children);
    
    parts.forEach((partDiv, index) => {
        const input = partDiv.querySelector('input[type="number"]');
        const removeButton = partDiv.querySelector('.remove-part-button');
        if (removeButton) {
            if (!input.readOnly && parts.length > 2) {
                    removeButton.style.display = 'inline-block';
            } else {
                removeButton.style.display = 'none';
            }
        }
    });
}


function removePart(buttonElement, typePrefix) {
    const partDivToRemove = buttonElement.closest('.part-input-container');
    const containerId = (typePrefix === 'rsa') ? 'rsaPartsContainer' : 'paillierPartsContainer';
    const container = document.getElementById(containerId);
    
    if (container.children.length <= 2) {
        alert("Không thể xóa thêm, cần ít nhất 2 phần.");
        return;
    }
    
    partDivToRemove.remove();
    reindexParts(containerId, typePrefix); 
    
    if (typePrefix === 'rsa') {
        updateRsaCalculatedPart();
    } else {
        updatePaillierCalculatedPart();
    }
}


// --- RSA Specific Functions ---
function generateRsaKeys() {
    clearRsaResults();
    document.getElementById('rsaPartsContainer').querySelectorAll('input').forEach(inp => clearInputError(inp));
    document.getElementById('rsaConceptExplanation').textContent = 'Hãy nhấn nút "Giải thích" để tìm hiểu về RSA!';
    document.getElementById('rsaResultInterpretation').textContent = 'Kết quả giải mã và diễn giải sẽ xuất hiện ở đây.';
    try {
        const p = BigInt(document.getElementById('rsaP').value);
        const q = BigInt(document.getElementById('rsaQ').value);
        rsaE_val = BigInt(document.getElementById('rsaE').value);

        if (p <= 1n || q <= 1n) throw new Error("p và q phải là số nguyên tố lớn hơn 1.");
        if (p === q) throw new Error("p và q phải khác nhau.");

        rsaN = p * q;
        rsaPhi = (p - 1n) * (q - 1n);

        if (rsaE_val <= 1n || rsaE_val >= rsaPhi) throw new Error(`e (${rsaE_val}) phải lớn hơn 1 và nhỏ hơn phi (${rsaPhi}).`);
        if (gcd(rsaE_val, rsaPhi) !== 1n) {
            throw new Error(`e (${rsaE_val}) không nguyên tố cùng nhau với phi (${rsaPhi}). Vui lòng chọn e khác.`);
        }
        rsaD = modInverse(rsaE_val, rsaPhi);
        document.getElementById('rsaParamsDisplay').textContent = 
            `n = p*q = ${rsaN}\nphi(n) = (p-1)(q-1) = ${rsaPhi}\ne = ${rsaE_val}\nd = ${rsaD} (khóa bí mật)`;
        document.getElementById('rsaError').textContent = "";
        updateRsaCalculatedPart(); 
    } catch (error) {
        document.getElementById('rsaParamsDisplay').textContent = "Lỗi tạo khóa.";
        document.getElementById('rsaError').textContent = "Lỗi tạo khóa RSA: " + error.message;
        rsaN = undefined; 
    }
}

function handleAddRsaPart() {
    const container = document.getElementById('rsaPartsContainer');
    const parts = Array.from(container.children);
    if (parts.length > 0) {
        const lastPartDiv = parts[parts.length - 1];
        const lastInput = lastPartDiv.querySelector('input[type="number"]');
        const lastLabel = lastPartDiv.querySelector('label');
        const lastRemoveButton = lastPartDiv.querySelector('.remove-part-button');

        if (lastInput.readOnly) { 
            lastInput.readOnly = false;
            lastInput.style.fontStyle = 'normal';
            lastLabel.textContent = `s${parts.length}:`;
            lastInput.placeholder = `Phần s${parts.length}`;
            lastInput.oninput = updateRsaCalculatedPart; 
            
            if (!lastRemoveButton) {
                const newRemoveButton = document.createElement('button');
                newRemoveButton.textContent = '–';
                newRemoveButton.className = 'remove-part-button';
                newRemoveButton.title = 'Xóa phần này';
                newRemoveButton.onclick = function() { removePart(this, 'rsa'); };
                lastPartDiv.querySelector('.part-input-row').appendChild(newRemoveButton);
            }
        }
    }
    addRsaPartInput(true); 
    updateRemoveButtonVisibility('rsaPartsContainer', 'rsa');
}

function addRsaPartInput(isCalculated = false) {
    const container = document.getElementById('rsaPartsContainer');
    const partIndex = container.children.length + 1;
    const partDOM = createPartDOM(partIndex, 'rsa', isCalculated);
    container.appendChild(partDOM);
    updateRsaCalculatedPart();
    updateRemoveButtonVisibility('rsaPartsContainer', 'rsa');
}

function updateRsaCalculatedPart() {
    const calculatedDisplay = document.getElementById('rsaPartsContainer').querySelector('input[readonly]');
    if (!calculatedDisplay) return;

    const partsContainer = document.getElementById('rsaPartsContainer');
    const allInputs = Array.from(partsContainer.querySelectorAll('input[type="number"]'));
    allInputs.forEach(inp => clearInputError(inp)); 

    if (!rsaN) { 
        calculatedDisplay.value = 'Cần tạo khóa RSA';
        return; 
    }
    const s_val_orig = BigInt(document.getElementById('secretS').value);
    const s_val = (s_val_orig % rsaN + rsaN) % rsaN; // s_val is now in Z_N

    if (s_val_orig < 0n) { 
        calculatedDisplay.value = 's phải >= 0';
        setInputError(document.getElementById('secretS'), 's phải là số không âm.');
        return;
    } else {
        clearInputError(document.getElementById('secretS'));
    }
    
    const userInputs = allInputs.filter(inp => !inp.readOnly);
    let productOfUserParts = 1n; // This will be the product of user parts, all in Z_N
    let allUserPartsFilled = true;
    let firstEmptyInput = null;

    for (const inp of userInputs) {
        if (!inp.value) {
            allUserPartsFilled = false;
            if(!firstEmptyInput) firstEmptyInput = inp;
            // continue; // Don't process empty inputs for product
        }
        const partVal_orig = inp.value ? BigInt(inp.value) : 1n ; // Default to 1 if empty for product calculation continuity
        
        if (inp.value && partVal_orig < 0n) { 
            calculatedDisplay.value = "Lỗi";
            setInputError(inp, "Phần phải >= 0.");
            return; 
        }
        if (inp.value) {
            // Ensure each part is within Z_N before multiplying
            const partVal_mod_n = (partVal_orig % rsaN + rsaN) % rsaN;
            productOfUserParts = (productOfUserParts * partVal_mod_n) % rsaN;
        }
    }

    if (!allUserPartsFilled) {
        calculatedDisplay.value = "Chờ nhập liệu...";
        return;
    }
    // productOfUserParts is now product of user_parts_mod_n, itself mod_n

    if (productOfUserParts === 0n) {
        if (s_val === 0n) { // s_val is already s_orig % rsaN
            calculatedDisplay.value = "1"; 
        } else { 
            calculatedDisplay.value = "Lỗi";
            userInputs.forEach(ui => {
                const currentPartVal = ui.value ? BigInt(ui.value) : 0n;
                if ((currentPartVal % rsaN + rsaN) % rsaN === 0n) { 
                        setInputError(ui, "Phần này là 0 (mod n), gây lỗi tính toán.");
                } else {
                        setInputError(ui, "Tích các phần là 0 (mod n), không thể tìm nghịch đảo cho s khác 0.");
                }
            });
        }
        return;
    }
    
    try {
        // productOfUserParts is already in Z_N and non-zero
        const productInverse = modInverse(productOfUserParts, rsaN); 
        const calculatedValue = (s_val * productInverse) % rsaN; // s_val is also in Z_N
        calculatedDisplay.value = calculatedValue.toString();
    } catch (e) { 
        calculatedDisplay.value = "Lỗi";
        userInputs.forEach(ui => setInputError(ui, "Tổ hợp các giá trị không có nghịch đảo mod n."));
        console.error("RSA update calculated part error: ", e.message);
    }
}

function calculateRsaHomomorphic() {
    clearRsaResults();
    document.getElementById('rsaResultInterpretation').textContent = 'Kết quả giải mã và diễn giải sẽ xuất hiện ở đây.';
    try {
        if (!rsaN || !rsaE_val || !rsaD) {
            throw new Error("Vui lòng tạo khóa RSA trước khi tính toán.");
        }
        const s_orig = BigInt(document.getElementById('secretS').value);
            const s_orig_mod_n = (s_orig % rsaN + rsaN) % rsaN;

        if (s_orig < 0n) throw new Error("Số bí mật s phải là số không âm.");

        const partsContainer = document.getElementById('rsaPartsContainer');
        const inputs = Array.from(partsContainer.querySelectorAll('input[type="number"]'));
        
        let productOfPartsForCheck = 1n;
        const s_parts_values = [];
        let allPartsValid = true;

        for (const inp of inputs) {
            if (!inp.value) {
                setInputError(inp, `Phần ${inp.id.replace('rsaPart','')} chưa có giá trị.`);
                allPartsValid = false;
            }
            const partVal = inp.value ? BigInt(inp.value) : 0n; 
            if (partVal < 0n) {
                setInputError(inp, `Giá trị phần ${inp.id.replace('rsaPart','')} (${partVal}) phải là số không âm.`);
                allPartsValid = false;
            }
            s_parts_values.push(partVal); 
            if (inp.value) productOfPartsForCheck = (productOfPartsForCheck * ((partVal % rsaN + rsaN)%rsaN) ) % rsaN; 
        }
            if (!allPartsValid) throw new Error("Một hoặc nhiều phần không hợp lệ hoặc chưa được nhập.");


        if (productOfPartsForCheck !== s_orig_mod_n ) {
                console.warn(`Kiểm tra tích các phần mod n: ${productOfPartsForCheck}, s gốc mod n: ${s_orig_mod_n}.`);
                document.getElementById('rsaError').textContent = "Cảnh báo: Tích các phần đã nhập không bằng s (mod n). Kết quả giải mã có thể không chính xác.";
        } else {
                document.getElementById('rsaError').textContent = "";
        }

        let encryptedPartsStr = "";
        let combinedCiphertext = 1n;
        
        for (let i = 0; i < s_parts_values.length; i++) {
            const original_part_val = s_parts_values[i];
            const msg_to_encrypt = (original_part_val % rsaN + rsaN) % rsaN; 
            const encryptedPart = power(msg_to_encrypt, rsaE_val, rsaN);
            encryptedPartsStr += `Enc(s${i+1}=${original_part_val} (mod n: ${msg_to_encrypt})) = ${msg_to_encrypt}^${rsaE_val} mod ${rsaN} = ${encryptedPart}\n`;
            combinedCiphertext = (combinedCiphertext * encryptedPart) % rsaN;
        }

        document.getElementById('rsaEncryptedParts').value = encryptedPartsStr;
        document.getElementById('rsaCombinedCiphertext').value = `C = ${combinedCiphertext}`;

        const decryptedResult = power(combinedCiphertext, rsaD, rsaN);
        document.getElementById('rsaDecryptedResult').textContent = `s' = C^d mod n = ${combinedCiphertext}^${rsaD} mod ${rsaN} = ${decryptedResult.toString()} (Giá trị gốc s = ${s_orig})`;
        
        let currentError = document.getElementById('rsaError').textContent;
        if (decryptedResult !== s_orig_mod_n && !currentError.includes("Kết quả giải mã không khớp")) {
                document.getElementById('rsaError').textContent += (currentError ? " " : "") + "Lỗi: Kết quả giải mã không khớp hoàn toàn với s mod n.";
        }

    } catch (error) {
        document.getElementById('rsaError').textContent = "Lỗi tính toán RSA: " + error.message;
        console.error(error);
    }
}
function clearRsaResults() {
    document.getElementById('rsaEncryptedParts').value = "";
    document.getElementById('rsaCombinedCiphertext').value = "";
    document.getElementById('rsaDecryptedResult').textContent = "";
    document.getElementById('rsaError').textContent = "";
}


// --- Paillier Specific Functions ---
function generatePaillierKeys() {
    clearPaillierResults();
    document.getElementById('paillierPartsContainer').querySelectorAll('input').forEach(inp => clearInputError(inp));
    document.getElementById('paillierConceptExplanation').textContent = 'Hãy nhấn nút "Giải thích" để tìm hiểu về Paillier!';
    document.getElementById('paillierResultInterpretation').textContent = 'Kết quả giải mã và diễn giải sẽ xuất hiện ở đây.';
    try {
        const p = BigInt(document.getElementById('paillierP').value);
        const q = BigInt(document.getElementById('paillierQ').value);

        if (p <= 1n || q <= 1n) throw new Error("p và q phải là số nguyên tố lớn hơn 1.");
        if (p === q) throw new Error("p và q phải khác nhau.");

        paillierN = p * q;
        paillierNsquare = paillierN * paillierN;
        paillierLambda = (p - 1n) * (q - 1n);
        
        paillierG = paillierN + 1n; 
        
        if (gcd(paillierLambda, paillierN) !== 1n) {
            throw new Error(`lambda (${paillierLambda}) không nguyên tố cùng nhau với n (${paillierN}). Không thể tính mu. Thử p, q khác.`);
        }
        paillierMu = modInverse(paillierLambda, paillierN);

        document.getElementById('paillierParamsDisplay').textContent = 
            `n = p*q = ${paillierN}\nn^2 = ${paillierNsquare}\nlambda = (p-1)(q-1) = ${paillierLambda}\ng = n+1 = ${paillierG}\nmu = lambda^-1 mod n = ${paillierMu} (khóa bí mật)`;
        document.getElementById('paillierError').textContent = "";
        updatePaillierCalculatedPart();
    } catch (error) {
        document.getElementById('paillierParamsDisplay').textContent = "Lỗi tạo khóa.";
        document.getElementById('paillierError').textContent = "Lỗi tạo khóa Paillier: " + error.message;
        paillierN = undefined; 
        console.error(error);
    }
}

function handleAddPaillierPart() {
    const container = document.getElementById('paillierPartsContainer');
    const parts = Array.from(container.children);
    if (parts.length > 0) {
        const lastPartDiv = parts[parts.length - 1];
        const lastInput = lastPartDiv.querySelector('input[type="number"]');
        const lastLabel = lastPartDiv.querySelector('label');
        const lastRemoveButton = lastPartDiv.querySelector('.remove-part-button');

        if (lastInput.readOnly) { 
            lastInput.readOnly = false;
            lastInput.style.fontStyle = 'normal';
            lastLabel.textContent = `s${parts.length}:`;
            lastInput.placeholder = `Phần s${parts.length}`;
            lastInput.oninput = updatePaillierCalculatedPart;

            if (!lastRemoveButton) {
                const newRemoveButton = document.createElement('button');
                newRemoveButton.textContent = '–';
                newRemoveButton.className = 'remove-part-button';
                newRemoveButton.title = 'Xóa phần này';
                newRemoveButton.onclick = function() { removePart(this, 'paillier'); };
                lastPartDiv.querySelector('.part-input-row').appendChild(newRemoveButton);
            }
        }
    }
    addPaillierPartInput(true);
    updateRemoveButtonVisibility('paillierPartsContainer', 'paillier');
}

function addPaillierPartInput(isCalculated = false) {
    const container = document.getElementById('paillierPartsContainer');
    const partIndex = container.children.length + 1;
    const partDOM = createPartDOM(partIndex, 'paillier', isCalculated);
    container.appendChild(partDOM);
    updatePaillierCalculatedPart();
    updateRemoveButtonVisibility('paillierPartsContainer', 'paillier');
}

function updatePaillierCalculatedPart() {
    const calculatedDisplay = document.getElementById('paillierPartsContainer').querySelector('input[readonly]');
    if (!calculatedDisplay) return;

    const partsContainer = document.getElementById('paillierPartsContainer');
    const allInputs = Array.from(partsContainer.querySelectorAll('input[type="number"]'));
    allInputs.forEach(inp => clearInputError(inp));

    if (!paillierN) {
        calculatedDisplay.value = 'Cần tạo khóa Paillier';
        return;
    }
    const s_val_orig = BigInt(document.getElementById('secretS').value);
    const s_val = (s_val_orig % paillierN + paillierN) % paillierN; // s_val is now in Z_N
    
    const userInputs = allInputs.filter(inp => !inp.readOnly);
    let sumOfUserParts = 0n; // This will be the sum of user parts, all in Z_N
    let allUserPartsFilled = true;
    let firstEmptyInput = null;

    for (const inp of userInputs) {
        if (!inp.value) {
            allUserPartsFilled = false;
            if(!firstEmptyInput) firstEmptyInput = inp;
        }
        if(inp.value) {
            // Ensure each part is reduced modulo N before summing
            const partVal_mod_n = (BigInt(inp.value) % paillierN + paillierN) % paillierN;
            sumOfUserParts = (sumOfUserParts + partVal_mod_n) % paillierN;
        }
    }
    // sumOfUserParts is now sum_of_user_parts_mod_n, itself mod_n (and positive)

    if (!allUserPartsFilled) {
        calculatedDisplay.value = "Chờ nhập liệu...";
        return;
    }
    
    let calculatedValue = s_val - sumOfUserParts;
    calculatedValue = (calculatedValue % paillierN + paillierN) % paillierN; 
    calculatedDisplay.value = calculatedValue.toString();
}

function paillierEncrypt(message) { 
    message = BigInt(message);
    message = (message % paillierN + paillierN) % paillierN; 
    return power(paillierG, message, paillierNsquare);
}

function paillierDecrypt(ciphertext) {
    ciphertext = BigInt(ciphertext);
    const cLambdaModNsquare = power(ciphertext, paillierLambda, paillierNsquare);
    if (paillierN === 0n) throw new Error("Paillier N is zero, cannot divide by zero.");
    const l_cLambda = (cLambdaModNsquare - 1n) / paillierN;
    let decryptedMessage = (l_cLambda * paillierMu) % paillierN;
    return (decryptedMessage % paillierN + paillierN) % paillierN; 
}

function calculatePaillierHomomorphic() {
    clearPaillierResults();
    document.getElementById('paillierResultInterpretation').textContent = 'Kết quả giải mã và diễn giải sẽ xuất hiện ở đây.';
    try {
        if (!paillierN || !paillierG || !paillierLambda || !paillierMu) {
            throw new Error("Vui lòng tạo khóa Paillier trước khi tính toán.");
        }
        const s_orig = BigInt(document.getElementById('secretS').value);
        const s_orig_mod_n = (s_orig % paillierN + paillierN) % paillierN;

        const partsContainer = document.getElementById('paillierPartsContainer');
        const inputs = Array.from(partsContainer.querySelectorAll('input[type="number"]'));
        
        let sumOfPartsForCheck = 0n;
        const s_parts_values = []; // Store original entered values for display
        let allPartsValid = true;

        for (const inp of inputs) {
            if (!inp.value) {
                setInputError(inp, `Phần ${inp.id.replace('paillierPart','')} chưa có giá trị.`);
                allPartsValid = false;
            }
            const partVal = inp.value ? BigInt(inp.value) : 0n;
            s_parts_values.push(partVal); 
            if (inp.value) sumOfPartsForCheck = (sumOfPartsForCheck + ((partVal % paillierN + paillierN) % paillierN) ) % paillierN;
        }
        if (!allPartsValid) throw new Error("Một hoặc nhiều phần không hợp lệ hoặc chưa được nhập.");

        sumOfPartsForCheck = (sumOfPartsForCheck + paillierN) % paillierN; 


        if (sumOfPartsForCheck !== s_orig_mod_n) {
            console.warn(`Kiểm tra tổng các phần mod n: ${sumOfPartsForCheck}, s gốc mod n: ${s_orig_mod_n}.`);
                document.getElementById('paillierError').textContent = "Cảnh báo: Tổng các phần đã nhập không bằng s (mod n). Kết quả giải mã có thể không chính xác.";
        } else {
            document.getElementById('paillierError').textContent = "";
        }
        
        let encryptedPartsStr = "";
        let combinedCiphertext = 1n; 

        for (let i = 0; i < s_parts_values.length; i++) {
            const original_part_val = s_parts_values[i];
            const part_val_mod_n = (original_part_val % paillierN + paillierN) % paillierN;
            const encryptedPart = paillierEncrypt(part_val_mod_n);
            encryptedPartsStr += `Enc(s${i+1}=${original_part_val} (mod n: ${part_val_mod_n})) = g^${part_val_mod_n} mod ${paillierNsquare} = ${encryptedPart}\n`;
            combinedCiphertext = (combinedCiphertext * encryptedPart) % paillierNsquare;
        }

        document.getElementById('paillierEncryptedParts').value = encryptedPartsStr;
        document.getElementById('paillierCombinedCiphertext').value = `C = ${combinedCiphertext}`;
        
        const decryptedResult = paillierDecrypt(combinedCiphertext);
        document.getElementById('paillierDecryptedResult').textContent = `s' = L(C^lambda * mu) mod n = ${decryptedResult.toString()} (Giá trị gốc s = ${s_orig})`;
        
        let currentError = document.getElementById('paillierError').textContent;
        if (decryptedResult !== s_orig_mod_n && !currentError.includes("Kết quả giải mã không khớp")) {
                document.getElementById('paillierError').textContent += (currentError ? " " : "") + "Lỗi: Kết quả giải mã không khớp hoàn toàn với s mod n.";
        }

    } catch (error) {
        document.getElementById('paillierError').textContent = "Lỗi tính toán Paillier: " + error.message;
        console.error(error);
    }
}
function clearPaillierResults() {
    document.getElementById('paillierEncryptedParts').value = "";
    document.getElementById('paillierCombinedCiphertext').value = "";
    document.getElementById('paillierDecryptedResult').textContent = "";
    document.getElementById('paillierError').textContent = "";
}