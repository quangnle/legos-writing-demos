class Card {
    constructor(suit, value){
        this.suit = suit;
        this.value = value;
    }

    toString() {
        return this.value + this.suit;
    }
}

class CardDeck {
    constructor() {
        this.cards = [];
        this.suits = ['♥', '♦', '♣', '♠'];
        this.values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

        // initialize deck
        for (let suit of this.suits) {
            for (let value of this.values) {
                this.cards.push(new Card(suit, value));
            }
        } 
    }

    moveTopCardToBottom() {
        this.cards.push(this.cards.shift());
    }

    moveBottomCardToTop() {
        this.cards.unshift(this.cards.pop());
    }
    
    shuffle() {
        this.cards.sort(() => Math.random() - 0.5);
    }

    cut() {
        let cutIndex = Math.floor(Math.random() * this.cards.length);
        let topHalf = this.cards.slice(0, cutIndex);
        let bottomHalf = this.cards.slice(cutIndex);
        this.cards = bottomHalf.concat(topHalf);
    }

    cutMiddleToTop() {
        let cutIndex1 = Math.floor(Math.random() * this.cards.length);
        let cutIndex2 = Math.floor(Math.random() * this.cards.length - cutIndex1) + cutIndex1;
        let topHalf = this.cards.slice(0, cutIndex1);
        let middleHalf = this.cards.slice(cutIndex1, cutIndex2);
        let bottomHalf = this.cards.slice(cutIndex2);
        this.cards = middleHalf.concat(topHalf, bottomHalf);        
    }
    
    draw() {
        return this.cards.pop();
    }
}