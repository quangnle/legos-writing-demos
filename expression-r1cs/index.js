function tokenize(expression) {
    // split the expression by operators and operands
    // filter out empty strings
    const tokens = expression.split(/([+*^()])/).filter(token => token.trim() !== '');
    return tokens.map(token => token.trim());
}

function infix2Postfix(tokens) {
    const precedence = {
        '+': 1,
        '*': 2,
        '^': 3
    };

    const s = [];
    const postfix = [];

    // step 1: add '(' to the stack
    s.push('(');

    // step 2: add ')' to the end of the tokens
    tokens.push(')');
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        // if token is '(' push it to the stack
        if (token === '(') {
            s.push(token);
        } else if (token === ')') { // if token is ')' pop from the stack until '('
            while (s[s.length - 1] !== '(') {
                postfix.push(s.pop()); // add the popped token to the postfix
            }
            s.pop(); // remove '(' from the stack
        } else if (token in precedence) {
            // if the token is an operator
            // pop from the stack until the precedence of the token is greater than the precedence of the top of the stack
            while (precedence[s[s.length - 1]] >= precedence[token]) {
                postfix.push(s.pop()); // add the popped token to the postfix
            }
            // push the current token to the stack
            s.push(token);
        } else { // if the token is an operand
            // add the token to the postfix
            postfix.push(token);
        }
    }

    return postfix;
}

function postfix2r1cs(postfix) {
    const s = [];
    const result = [];
    const variables = new Set();
    // step 1: add '1' to the stack
    variables.add('1');

    // autoIdx is used to generate unique variable names
    let autoIdx = 0;

    // I made a very dirty code here and can be improved far better
    // I will refactor it later on then, but now, for sake of time, I am leaving it as it is
    for (let i = 0; i < postfix.length; i++) {
        const token = postfix[i];
        if ('+*^'.indexOf(token) !== -1) {
            autoIdx++;
            const b = s.pop(); 
            const a = s.pop();
            // check if a is a number
            if (isNaN(a) && !variables.has(a)) { // if a is a number and not in variables
                variables.add(a);
            }
            // check if b is not in variables
            if (isNaN(b) &&!variables.has(b)) {
                variables.add(b);
            }

            switch (token) {
                case '+':
                    result.push(`z${autoIdx} = ${a} + ${b}`);
                    s.push(`z${autoIdx}`);
                    variables.add(`z${autoIdx}`);
                    break;
                case '*':
                    result.push(`z${autoIdx} = ${a} * ${b}`);
                    s.push(`z${autoIdx}`);
                    variables.add(`z${autoIdx}`);
                    break;                
                case '^':                     
                    if (b*1 !== parseInt(b)) {
                        throw new Error('Exponent must be an integer');
                    } else {
                        if (b*1 === 0) {
                            result.push(`z${autoIdx} = 1`);                            
                            s.push(`z${autoIdx}`);
                            variables.add(`z${autoIdx}`);
                        } else if (b*1 === 1) {
                            result.push(`z${autoIdx} = ${a}`);                            
                            s.push(`z${autoIdx}`);
                            variables.add(`z${autoIdx}`);
                        } else {
                            result.push(`z${autoIdx} = ${a} * ${a}`);
                            s.push(`z${autoIdx}`);
                            variables.add(`z${autoIdx}`);
                            for (let i=2; i < b*1; i++) {
                                autoIdx++;
                                result.push(`z${autoIdx} = z${autoIdx-1} * ${a}`);
                                s.push(`z${autoIdx}`);   
                                variables.add(`z${autoIdx}`);                     
                            }
                        }                        
                    }
                    break;
            }            
        } else {
            s.push(token);
        }
    }
    return {result, variables};
}

function exp2r1cs(expression) {
    // expression cannot contain / and -
    if (expression.indexOf('/') >= 0 || expression.indexOf('-') >= 0) {
        throw new Error('Expression allowed only +, *, ^ operators');
    }

    const lhs = expression.split('=')[0].trim();
    const rhs = expression.split('=')[1].trim();

    const postfix = infix2Postfix(tokenize(rhs));
    const {result, variables} = postfix2r1cs(postfix);
    const equations = result;

    // add lhs to the variables
    variables.add(lhs);
    // remove the last variable in the equations
    let v = equations[equations.length - 1].split('=')[0].trim();
    // remove v in the variables
    variables.delete(v);    

    // replace the last element of the equations with the lhs    
    equations[equations.length - 1] = `${lhs} = ${equations[equations.length - 1].split('=')[1].trim()}`;
    


    return {equations, variables};
}

function exp2LROmatrices(expression) {
    const {equations, variables} = exp2r1cs(expression);
    const r1cs = equations;
    const variablesSet = new Set(variables);
    const variablesArray = Array.from(variablesSet);
    const n = variablesArray.length;
    const m = r1cs.length;

    const L = [];
    const R = [];
    const O = [];

    for (let i = 0; i < m; i++) {
        const r1c = r1cs[i];
        const l = Array(n).fill(0);
        const r = Array(n).fill(0);
        const o = Array(n).fill(0);

        const oElement = r1c.split('=')[0].trim();
        const rhs = r1c.split('=')[1].trim();

        if (rhs.indexOf('+') !== -1) {
            const ops = rhs.split('+');
            const op1 = ops[0].trim();
            const op2 = ops[1].trim();
                
                if (variablesSet.has(op1)) {
                    // if op1 is a variable
                    l[variablesArray.indexOf(op1)] = 1;
                } else {
                    // if op1 is a constant
                    l[variablesArray.indexOf('1')] = op1 * 1;
                }

                if (variablesSet.has(op2)) {
                    // if op2 is a variable
                    l[variablesArray.indexOf(op2)] = 1;
                } else {
                    // if op2 is a constant
                    l[variablesArray.indexOf('1')] = op2 * 1;
                }

                r[variablesArray.indexOf('1')] = 1;
            
        } else {
            const ops = rhs.split('*');
            const op1 = ops[0].trim();
            const op2 = ops[1].trim();

            if (variablesSet.has(op1)) {
                // if op1 is a variable
                l[variablesArray.indexOf(op1)] = 1;
            } else {
                // if op1 is a constant
                l[variablesArray.indexOf('1')] = op1 * 1;
            }

            if (variablesSet.has(op2)) {
                // if op2 is a variable
                r[variablesArray.indexOf(op2)] = 1;
            } else {
                // if op2 is a constant
                r[variablesArray.indexOf('1')] = op2 * 1;
            }
        }

        o[variablesArray.indexOf(oElement)] = 1;

        L.push(l);
        R.push(r);
        O.push(o);
    }

    return { L, R, O };
}