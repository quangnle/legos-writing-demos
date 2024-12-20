function tokenize(expression) {
    // split the expression by operators and operands
    // filter out empty strings
    const tokens = expression.split(/([+\-*/()^])/).filter(token => token.trim() !== '');
    return tokens.map(token => token.trim());
}

function infix2Postfix(tokens) {
    const precedence = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2,
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

function evalPostfix(postfix) {
    const s = [];
    for (let i = 0; i < postfix.length; i++) {
        const token = postfix[i];
        if ('+-*/^'.indexOf(token) !== -1) {
            const b = s.pop() * 1; // convert to number
            const a = s.pop() * 1;
            switch (token) {
                case '+':
                    s.push(a + b);
                    break;
                case '-':
                    s.push(a - b);
                    break;
                case '*':
                    s.push(a * b);
                    break;
                case '/':
                    s.push(a / b);
                    break;
                case '^':
                    s.push(a ** b);
                    break;
            }            
        } else {
            s.push(token);
        }
    }
    return s.pop();
}

// const expression = '32 + 14 * 4 / ( 1 - 5 ) * 2 ^ 3 + 213';
// const tokens = tokenize(expression);
// const postfix = infix2Postfix(tokens);
// console.log(postfix);
// console.log(evalPostfix(postfix)); 