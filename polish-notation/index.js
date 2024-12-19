function tokenize(expression) {
    return expression.split(/([+\-*/()^])/).filter(token => token.trim() !== '');
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

console.log(infix2Postfix(tokenize('3 + 4 * 2 / ( 1 - 5 ) * 2 ^ 3 + 3')));