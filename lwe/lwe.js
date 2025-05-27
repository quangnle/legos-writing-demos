let q_val_num, n_val_num, m_val_num; // Renamed to avoid conflict with DOM elements
let s, A, e, b; // Key generation
let M;
let u_col_vec, c1, c2; // Encryption (u_col_vec is the m x 1 column vector for u)
let decryptedMessage; // Decryption

function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i = i + 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomVector(dim, mod_q_val) {
    const vec = [];
    for (let i = 0; i < dim; i++) {
        vec.push([getRandomInt(0, mod_q_val - 1)]);
    }
    return math.matrix(vec);
}

function generateRandomMatrix(rows, cols, mod_q_val) {
    const mat = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(getRandomInt(0, mod_q_val - 1));
        }
        mat.push(row);
    }
    return math.matrix(mat);
}

function generateErrorVector(dim) {
    const vec = [];
    const errorValues = [-1, 0, 1];
    for (let i = 0; i < dim; i++) {
        vec.push([errorValues[getRandomInt(0, 2)]]);
    }
    return math.matrix(vec);
}

function generateBinaryVector(dim) {
    const vec = [];
    for (let i = 0; i < dim; i++) {
        vec.push([getRandomInt(0, 1)]);
    }
    return math.matrix(vec);
}

function formatMatrixForDisplay(matrix) {
    if (!matrix) return "N/A";
    let str = "";
    const data = matrix.toArray();

    if (!Array.isArray(data)) { // Scalar
        return math.format(data, {notation: 'fixed'});
    }
    
    if (data.length > 0 && !Array.isArray(data[0])) { // 1D array (e.g. from c1)
            str += "[";
            data.forEach((val, index) => {
                str += val + (index < data.length - 1 ? ", " : "");
            });
            str += "]";
            return str;
    }

    // Check if it's a column vector displayed as [[v1], [v2], ...]
    if (data.length > 0 && Array.isArray(data[0]) && data[0].length === 1) {
        str += "[";
        data.forEach((val, index) => {
            str += val[0] + (index < data.length - 1 ? "; " : "");
        });
        str += "]<sup>T</sup>"; // Indicate transpose for column vector display
        return str;
    }
    
    // General 2D matrix
    data.forEach(row => {
        str += "[";
        if (Array.isArray(row)) {
            row.forEach((val, index) => {
                str += val + (index < row.length - 1 ? ", " : "");
            });
        } else { // Should not happen with math.js matrices
            str += row;
        }
        str += "]\n";
    });
    return str.trim();
}

function toggleCustomInput(type) {
    const checkbox = document.getElementById(`custom_${type}_toggle`);
    const inputArea = document.getElementById(`custom_${type}_input_area`);
    inputArea.style.display = checkbox.checked ? 'block' : 'none';
}

function updateCustomInputPlaceholders() {
    const n_dim = parseInt(document.getElementById('n_val').value) || 4;
    const m_dim = parseInt(document.getElementById('m_val').value) || 10;

    document.getElementById('custom_s_val').placeholder = `vd: ${Array(n_dim).fill(0).map((_,i) => getRandomInt(1,20)).join(',')}`;
    let A_placeholder = "";
    for(let i=0; i<Math.min(m_dim,3); i++){ // Show example for up to 3 rows
        A_placeholder += Array(n_dim).fill(0).map((_,j)=> getRandomInt(1,20)).join(',');
        if(i < Math.min(m_dim,3)-1) A_placeholder += "\n";
    }
    if(m_dim > 3) A_placeholder += "\n...";
    document.getElementById('custom_A_val').placeholder = `vd: \n${A_placeholder} (${m_dim} hàng, ${n_dim} cột)`;
    document.getElementById('custom_e_val').placeholder = `vd: ${Array(m_dim).fill(0).map(() => getRandomInt(-1,1)).join(',')}`;
    document.getElementById('custom_u_val').placeholder = `vd: ${Array(m_dim).fill(0).map(() => getRandomInt(0,1)).join(',')}`;
}


// Parses "1,2,3" into math.matrix([[1],[2],[3]]) (column vector)
function parseVectorString(str, dim, type = "general", mod_q_val = null) {
    const parts = str.split(',').map(x => x.trim());
    if (parts.length !== dim) {
        throw new Error(`Vector phải có ${dim} phần tử. Tìm thấy: ${parts.length}.`);
    }
    const vecValues = [];
    for (const part of parts) {
        const num = parseInt(part);
        if (isNaN(num)) {
            throw new Error(`Giá trị vector không hợp lệ: "${part}". Phải là số nguyên.`);
        }
        if (type === "error" && ![-1, 0, 1].includes(num)) {
            throw new Error(`Vector nhiễu e chỉ chấp nhận các giá trị -1, 0, hoặc 1. Tìm thấy: ${num}.`);
        }
        if (type === "binary" && ![0, 1].includes(num)) {
            throw new Error(`Vector u chỉ chấp nhận các giá trị 0 hoặc 1. Tìm thấy: ${num}.`);
        }
        if (type === "secret_or_A_element" && mod_q_val !== null) {
                vecValues.push([( (num % mod_q_val) + mod_q_val) % mod_q_val]); // Ensure positive mod q
        } else {
                vecValues.push([num]);
        }
    }
    return math.matrix(vecValues);
}

// Parses "1,2;3,4" into math.matrix([[1,2],[3,4]])
function parseMatrixString(str, rows, cols, mod_q_val) {
    const rowStrings = str.split('\n').map(r => r.trim());
    if (rowStrings.length !== rows) {
        throw new Error(`Ma trận A phải có ${rows} hàng. Tìm thấy: ${rowStrings.length}.`);
    }
    const matValues = [];
    for (const rowStr of rowStrings) {
        const colParts = rowStr.split(',').map(x => x.trim());
        if (colParts.length !== cols) {
            throw new Error(`Mỗi hàng của ma trận A phải có ${cols} cột. Hàng "${rowStr}" có ${colParts.length} cột.`);
        }
        const rowValues = [];
        for (const part of colParts) {
            const num = parseInt(part);
            if (isNaN(num)) {
                throw new Error(`Giá trị ma trận không hợp lệ: "${part}". Phải là số nguyên.`);
            }
            rowValues.push(((num % mod_q_val) + mod_q_val) % mod_q_val); // Ensure positive mod q
        }
        matValues.push(rowValues);
    }
    return math.matrix(matValues);
}


function generateKeys() {
    document.getElementById('keyGenError').innerText = "";
    try {
        q_val_num = parseInt(document.getElementById('q_val').value);
        n_val_num = parseInt(document.getElementById('n_val').value);
        m_val_num = parseInt(document.getElementById('m_val').value);

        if (!isPrime(q_val_num)) {
            throw new Error("q phải là số nguyên tố!");
        }
        if (n_val_num <= 0 || m_val_num <= 0) {
            throw new Error("n và m phải là số dương!");
        }
        // Optional: if (m_val_num < n_val_num) { alert("m nên >= n."); }

        // 1. Vector bí mật s
        if (document.getElementById('custom_s_toggle').checked) {
            const s_str = document.getElementById('custom_s_val').value;
            s = parseVectorString(s_str, n_val_num, "secret_or_A_element", q_val_num);
        } else {
            s = generateRandomVector(n_val_num, q_val_num);
        }

        // 2. Ma trận A
        if (document.getElementById('custom_A_toggle').checked) {
            const A_str = document.getElementById('custom_A_val').value;
            A = parseMatrixString(A_str, m_val_num, n_val_num, q_val_num);
        } else {
            A = generateRandomMatrix(m_val_num, n_val_num, q_val_num);
        }

        // 3. Vector nhiễu e
        if (document.getElementById('custom_e_toggle').checked) {
            const e_str = document.getElementById('custom_e_val').value;
            e = parseVectorString(e_str, m_val_num, "error");
        } else {
            e = generateErrorVector(m_val_num);
        }

        // 4. Tính b = (A.s + e) mod q
        let As = math.multiply(A, s);
        let As_plus_e = math.add(As, e);
        b = math.map(As_plus_e, x => ((x % q_val_num) + q_val_num) % q_val_num);

        document.getElementById('secret_s').innerHTML = formatMatrixForDisplay(s);
        document.getElementById('matrix_A').innerHTML = formatMatrixForDisplay(A);
        document.getElementById('vector_e').innerHTML = formatMatrixForDisplay(e);
        document.getElementById('vector_b').innerHTML = formatMatrixForDisplay(b);

        document.getElementById('keyGenerationOutput').style.display = 'block';
        document.getElementById('encryptBtn').disabled = false;
        document.getElementById('decryptBtn').disabled = true;
        document.getElementById('encryptionOutput').style.display = 'none';
        document.getElementById('decryptionOutput').style.display = 'none';

    } catch (err) {
        document.getElementById('keyGenError').innerText = "Lỗi tạo khóa: " + err.message;
        document.getElementById('keyGenerationOutput').style.display = 'none';
        document.getElementById('encryptBtn').disabled = true;
    }
}

function encryptMessage() {
    document.getElementById('encryptError').innerText = "";
    try {
        if (!A || !b) {
            throw new Error("Vui lòng tạo khóa trước!");
        }

        M = parseInt(document.getElementById('message_M').value);

        // Vector u (m x 1 column vector)
        if (document.getElementById('custom_u_toggle').checked) {
            const u_str = document.getElementById('custom_u_val').value;
            u_col_vec = parseVectorString(u_str, m_val_num, "binary");
        } else {
            u_col_vec = generateBinaryVector(m_val_num);
        }
        let u_transpose = math.transpose(u_col_vec); // u_transpose is 1 x m

        // c1 = (u^T . A) mod q
        let uA = math.multiply(u_transpose, A);
        c1 = math.map(uA, x => ((x % q_val_num) + q_val_num) % q_val_num);

        // c2 = (u^T . b + M * floor(q/2)) mod q
        let ub = math.multiply(u_transpose, b);
        let M_scaled = M * Math.floor(q_val_num / 2);
        let c2_val = math.add(ub.get([0, 0]), M_scaled);
        c2 = ((c2_val % q_val_num) + q_val_num) % q_val_num;

        document.getElementById('vector_u_display').innerHTML = formatMatrixForDisplay(u_col_vec);
        document.getElementById('cipher_c1').innerHTML = formatMatrixForDisplay(c1);
        document.getElementById('cipher_c2').innerHTML = c2;

        document.getElementById('encryptionOutput').style.display = 'block';
        document.getElementById('decryptBtn').disabled = false;
        document.getElementById('decryptionOutput').style.display = 'none';

    } catch (err) {
        document.getElementById('encryptError').innerText = "Lỗi mã hóa: " + err.message;
        document.getElementById('encryptionOutput').style.display = 'none';
        document.getElementById('decryptBtn').disabled = true;
    }
}

function decryptMessage() {
    document.getElementById('decryptError').innerText = "";
    try {
        if (c1 === undefined || c2 === undefined || !s) {
                throw new Error("Vui lòng mã hóa thông điệp trước!");
        }

        let c1s = math.multiply(c1, s);
        let c1s_scalar = c1s.get([0,0]);

        let v_intermediate = c2 - c1s_scalar;
        let v = ((v_intermediate % q_val_num) + q_val_num) % q_val_num;

        document.getElementById('value_v').innerHTML = v;

        const q_half = Math.floor(q_val_num / 2);
        const q_quarter = Math.floor(q_val_num / 4);

        if (Math.abs(v) < q_quarter || Math.abs(v - q_val_num) < q_quarter ) {
            decryptedMessage = 0;
        } else if (Math.abs(v - q_half) < q_quarter) {
            decryptedMessage = 1;
        } else {
                // Fallback for ambiguous v, closer to 0 or q/2?
            if (v < q_half) {
                decryptedMessage = (v < q_quarter) ? 0 : 1;
            } else {
                decryptedMessage = (v < q_val_num - q_quarter) ? 1 : 0;
            }
            console.warn("Giải mã có thể không chính xác do v nằm ngoài khoảng dự kiến rõ ràng. v =", v, "q/4 =", q_quarter);
        }

        document.getElementById('decrypted_M').innerText = decryptedMessage;
        const statusElement = document.getElementById('decryptionStatus');
        if (decryptedMessage === M) {
            statusElement.innerText = "Thành công! Thông điệp giải mã M' khớp với thông điệp gốc M. 🎉";
            statusElement.className = "success";
        } else {
            statusElement.innerText = "Thất bại! Thông điệp giải mã M' KHÔNG khớp với thông điệp gốc M. 😟 (Kiểm tra nhiễu, q)";
            statusElement.className = "error";
        }

        document.getElementById('decryptionOutput').style.display = 'block';
    } catch (err) {
            document.getElementById('decryptError').innerText = "Lỗi giải mã: " + err.message;
            document.getElementById('decryptionOutput').style.display = 'none';
    }
}

window.onload = () => {
    updateCustomInputPlaceholders();
    // Initial hiding of custom areas is done by inline style now
};