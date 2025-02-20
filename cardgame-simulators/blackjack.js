function dealCards(deck, nHands, nCards) {

    let hands = [];
    for (let i = 0; i < nHands; i++) {
        hands.push([]);
    }

    for (let i = 0; i < nCards; i++) {
        for (let j = 0; j < nHands; j++) {
            hands[j].push(deck.draw());
        }
    }

    return hands;
}

function evaluateBlackJackHand(hand) {
    let score = 0;

    if (hand.length === 2) {
        if (hand[0].value === 'A' && hand[1].value === 'A') {
            return 200;
        } else if ((hand[0].value === 'A' && (hand[1].value === 'J' || hand[1].value === 'Q' || hand[1].value === 'K' || hand[1].value === '10')) ||
                   ((hand[1].value === 'A' && (hand[0].value === 'J' || hand[0].value === 'Q' || hand[0].value === 'K' || hand[0].value === '10')))) {
            return 100;
        }
    } 

    let hasAce = false;
    for (let card of hand) {
        if (card.value === 'A') {
            hasAce = true;
            score += 11;
        } else if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }

    score = (score > 21 && hasAce) ? score - 10 : score;

    if (score > 21) return 0;
    if (score <= 21 && hand.length === 5) 
        return 50;

    return score;
}

function simulateOneMatch(nHands, lowLimit, stopLimit){
    let deck = new CardDeck();
    deck.shuffle();

    let hands = dealCards(deck, nHands, 2);
    let scores = [];

    for (let hand of hands) {
        let score = 0; 
        while (score < stopLimit) {
            score = evaluateBlackJackHand(hand);
            if (score == 100 || score == 200) break;
            if (score == 0) break; // busted
            if (hand.length < 5) {
                if (score < lowLimit) {
                    hand.push(deck.draw());
                } else {
                    let range = 1 - (score / stopLimit);
                    if (Math.random() < range) {
                        hand.push(deck.draw());
                    } else {
                        break;
                    }
                }
            }        
        }
        score = evaluateBlackJackHand(hand);
        scores.push(score);
    }

    return {hands, scores};
}