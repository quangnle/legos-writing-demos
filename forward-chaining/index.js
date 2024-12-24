class Rule {
    constructor(statemment) {
        const [stmt, comment] = statemment.split('//');
        const [premises, conclusion] = stmt.split('=>').map(s => s.trim());        
        this.comment = comment ? comment.trim() : '';
        this.premises = premises.split(',').map(s => s.trim());
        this.conclusion = conclusion;
    }

    matches(facts) {
        return this.premises.every(premise => facts.some(fact => fact.content === premise));
    }
}

class KnowledgeBase {
    constructor() {
        this.rules = [];
    }

    forwardChaining(facts) {
        const inferred = facts.map(f => ({ content: f, inferredBy: null }));
        const checkedRules = [];
        let canInfer = true;
        while (canInfer) {
            canInfer = false;
            for (const rule of this.rules) {
                if (checkedRules.includes(rule)) continue;
                if (rule.matches(inferred)) {
                    const newFact = { content: rule.conclusion, inferredBy: rule };
                    if (!inferred.some(f => f.content === newFact.content)) {
                        inferred.push(newFact);
                        canInfer = true;
                        checkedRules.push(rule);
                    }
                }
            } 
            if (!canInfer) break;           
        }
        return inferred;
    }

    solve(facts, target){
        const inferredFacts = this.forwardChaining(facts);    
        //trace back by inferredBy
        let solution = inferredFacts.find(f => f.content === target);
        if (!solution) {
            console.log(`No solution found for ${target}`);
            return null;
        } else {
            let q = [solution];
            let result = [];
            do {
                let current = q.shift();
                if (!current.inferredBy) continue;
                result.push(current.inferredBy);
                for (let i = 0; i < current.inferredBy.premises.length; i++) {
                    const premise = current.inferredBy.premises[i];
                    const fact = inferredFacts.find(f => f.content === premise);
                                       
                    if (!q.includes(fact)) {
                        q.push(fact);
                    }
                } 
            } while (q.length > 0);
            return result;
        }               
        
    }
}

const kb = new KnowledgeBase();
kb.rules.push(new Rule('a, ha => S // S=\\frac{1}{2}a \\cdot h_a'));
kb.rules.push(new Rule('a, S => ha // S=\\frac{1}{2}a \\cdot h_a'));
kb.rules.push(new Rule('ha, S => a // S=\\frac{1}{2}a \\cdot h_a'));
kb.rules.push(new Rule('b, hb => S // S=\\frac{1}{2}b \\cdot h_b'));
kb.rules.push(new Rule('b, S => hb // S=\\frac{1}{2}b \\cdot h_b'));
kb.rules.push(new Rule('hb, S => b // S=\\frac{1}{2}b \\cdot h_b'));
kb.rules.push(new Rule('c, hc => S // S=\\frac{1}{2}c \\cdot h_c'));
kb.rules.push(new Rule('c, S => hc // S=\\frac{1}{2}c \\cdot h_c'));
kb.rules.push(new Rule('hc, S => c // S=\\frac{1}{2}c \\cdot h_c'));
kb.rules.push(new Rule('a, b, c => S // S=\\sqrt{p(p-a)(p-b)(p-c)}'));
kb.rules.push(new Rule('a, b, c => p // p=\\frac{a+b+c}{2}'));
kb.rules.push(new Rule('a, b, p => c // p=\\frac{a+b+c}{2}'));
kb.rules.push(new Rule('b, c, p => a // p=\\frac{a+b+c}{2}'));
kb.rules.push(new Rule('c, a, p => b // p=\\frac{a+b+c}{2}'));
kb.rules.push(new Rule('a, b, C => S // S=\\frac 1 2 ab\\sin C'));
kb.rules.push(new Rule('a, b, S => C // S=\\frac 1 2 ab\\sin C'));
kb.rules.push(new Rule('b, c, A => S // S=\\frac 1 2 bc\\sin A'));
kb.rules.push(new Rule('b, c, S => A // S=\\frac 1 2 bc\\sin A'));
kb.rules.push(new Rule('c, a, B => S // S=\\frac 1 2 ca\\sin B'));
kb.rules.push(new Rule('c, a, S => B // S=\\frac 1 2 ca\\sin B'));
kb.rules.push(new Rule('a, b, C => c // c^2=a^2+b^2-2ab\\cos C'));
kb.rules.push(new Rule('b, c, A => a // a^2=b^2+c^2-2bc\\cos A'));
kb.rules.push(new Rule('c, a, B => b // b^2=c^2+a^2-2ca\\cos B'));
kb.rules.push(new Rule('A, B => C // A+B+C=180^\\circ'));
kb.rules.push(new Rule('A, C => B // A+B+C=180^\\circ'));
kb.rules.push(new Rule('B, C => A // A+B+C=180^\\circ'));