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

function dealPokerHands(deck, nHands) {
    // deal 2 cards to each player
    const hands = dealCards(deck, nHands, 2);

    // deal 5 community cards
    const communityCards = [];
    
    // burn a card
    deck.moveTopCardToBottom();

    // deal flop
    communityCards.push(deck.draw());
    communityCards.push(deck.draw());
    communityCards.push(deck.draw());

    // burn a card
    deck.moveTopCardToBottom();

    // deal turn
    communityCards.push(deck.draw());

    // burn a card
    deck.moveTopCardToBottom();

    // deal river
    communityCards.push(deck.draw());

    return {hands, communityCards};
}

function evaluatePokerHand(hand, communityCards) {
    const allCards = hand.concat(communityCards);
    allCards.sort((a, b) => a.value - b.value);

    // check for royal flush
    let royalFlush = checkRoyalFlush(allCards);
    if (royalFlush) {
        return royalFlush;
    }

    // check for straight flush
    let straightFlush = checkStraightFlush(allCards);
    if (straightFlush) {
        return straightFlush;
    }

    // check for four of a kind
    let fourOfAKind = checkFourOfAKind(allCards);
    if (fourOfAKind) {
        return fourOfAKind;
    }

    // check for full house
    let fullHouse = checkFullHouse(allCards);
    if (fullHouse) {
        return fullHouse;
    }

    // check for flush
    let flush = checkFlush(allCards);
    if (flush) {
        return flush;
    }

    // check for straight
    let straight = checkStraight(allCards);
    if (straight) {
        return straight;
    }

    // check for three of a kind
    let threeOfAKind = checkThreeOfAKind(allCards);
    if (threeOfAKind) {
        return threeOfAKind;
    }

    // check for two pair
    let twoPair = checkTwoPair(allCards);
    if (twoPair) {
        return twoPair;
    }

    // check for one pair
    let onePair = checkOnePair(allCards);
    if (onePair) {
        return onePair;
    }

    // check for high card
    return checkHighCard(allCards);    
}

function checkRoyalFlush(allCards) {
    let straightFlush = checkStraightFlush(allCards);
    if (straightFlush && straightFlush.value === 'A') {
        return {
            rank: 'royal flush',
            value: 'A'
        };
    }
}

function checkStraightFlush(allCards) {
    let straight = checkStraight(allCards, true);
    if (straight) {
        return {
            rank: 'straight flush',
            value: straight.value
        };
    }
}

function checkFourOfAKind(allCards) {
    let fourOfAKind = checkNOfAKind(allCards, 4);
    if (fourOfAKind) {
        return {
            rank: 'four of a kind',
            value: fourOfAKind.value
        };
    }
}

function checkFullHouse(allCards) {
    let threeOfAKind = checkNOfAKind(allCards, 3);
    if (!threeOfAKind) {
        return null;
    }

    let pair = checkNOfAKind(allCards, 2, threeOfAKind.value);

    if (threeOfAKind && pair) {
        return {
            rank: 'full house',
            value: threeOfAKind.value
        };
    }
}

function checkFlush(allCards) {
    let suits = {
        'hearts': 0,
        'diamonds': 0,
        'clubs': 0,
        'spades': 0
    };
    
    for (let i = 0; i < allCards.length; i++) {
        suits[allCards[i].suit]++;
        if (suits[allCards[i].suit] === 5) {
            return {
                rank: 'flush',
                value: allCards[i].value
            };
        }
    }

    return null;
}

function checkStraight(allCards, isInSameSuit=false) {
    const orders = ['A','2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    for (let i = 0; i < orders.length - 4; i++) {
        let valid = true;
        for (let j = 0; j < 5; j++) {
            if (!allCards.find(card => card.value === orders[i + j])) {
                valid = false;
                break;
            } else {
                if (isInSameSuit && allCards.find(card => card.value === orders[i + j]).suit !== allCards[0].suit) {
                    valid = false;
                    break;
                }
            }
        }
        if (valid) {
            return {
                rank: 'straight',
                value: orders[i + 4]
            };
        }
    }

    return null;
}

function checkThreeOfAKind(allCards) {
    let threeOfAKind = checkNOfAKind(allCards, 3);
    if (threeOfAKind) {
        return {
            rank: 'three of a kind',
            value: threeOfAKind.value
        };
    }
}

function checkTwoPair(allCards) {
    let pair1 = checkNOfAKind(allCards, 2);
    if (!pair1) {
        return null;
    }

    let pair2 = checkNOfAKind(allCards, 2, pair1.value);
    if (pair1 && pair2) {
        return {
            rank: 'two pair',
            value: pair1.value
        };
    }
    return null;
}

function checkOnePair(allCards) {
    let pair = checkNOfAKind(allCards, 2);
    if (pair) {
        return {
            rank: 'one pair',
            value: pair.value
        };
    }
}

function checkHighCard(allCards) {
    return {
        rank: 'high card',
        value: allCards[allCards.length - 1].value
    };
}

function checkNOfAKind(allCards, n, except=null) {
    let valueCount = {
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
        '10': 0,
        'J': 0,
        'Q': 0,
        'K': 0,
        'A': 0
    };

    for (let i = 0; i < allCards.length; i++) {
        if (allCards[i].value === except) {
            continue;
        }

        valueCount[allCards[i].value]++;
        if (valueCount[allCards[i].value] === n) {
            return allCards[i];
        }
    }

    return null;
}