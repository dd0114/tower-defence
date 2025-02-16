export class Card {
  constructor(suit, rank) {
    this.suit = suit
    this.rank = rank
  }
}

export class Deck {
  constructor() {
    this.cardList = []
    for (let suit = 4; 0 < suit; suit--) {
      for (let rank = 14; 2 <= rank; rank--) {
        this.cardList.push(new Card(suit, rank))
      }
    }
  }

  draw() {
    let randomIndex = Math.floor(Math.random() * 1000000) % this.cardList.length;
    const card = this.cardList[randomIndex]
    this.cardList.splice(randomIndex, 1)
    return card
  }

  trash(card) {
    this.cardList.push(card)
  }
}

export class Hand {
  constructor() {
    this.cardList = [];
    this.sortedCards = [];
    this.suitMap = new Map(); // Map<number, Card[]>
    this.rankMap = new Map();
    this.handRank = undefined;
  }

  addCard(card) {
    // 카드 추가
    this.cardList.push(card);

    // 정렬된 배열 업데이트
    this.sortedCards = [...this.cardList].sort((a, b) => b.rank - a.rank);

    // suit map 업데이트
    if (!this.suitMap.has(card.suit)) {
      this.suitMap.set(card.suit, []);
    }
    this.suitMap.get(card.suit).push(card);
    this.suitMap.get(card.suit).sort((a, b) => b.rank - a.rank);

    // rank map 업데이트
    if (!this.rankMap.has(card.rank)) {
      this.rankMap.set(card.rank, []);
    }
    this.rankMap.get(card.rank).push(card);

    this.handRank = this.getHandRank()
  }

  removeCard(card) {
    // 카드 제거
    const index = this.cardList.findIndex(c => c.equals(card));
    if (index === -1) {
      return false;
    }

    this.cardList.splice(index, 1);

    // 정렬된 배열 업데이트
    this.sortedCards = [...this.cardList].sort((a, b) => b.rank - a.rank);

    // suit map 업데이트
    const suitCards = this.suitMap.get(card.suit);
    const suitIndex = suitCards.findIndex(c => c.equals(card));
    suitCards.splice(suitIndex, 1);
    if (suitCards.length === 0) {
      this.suitMap.delete(card.suit);
    }

    // rank map 업데이트
    const rankCards = this.rankMap.get(card.rank);
    const rankIndex = rankCards.findIndex(c => c.equals(card));
    rankCards.splice(rankIndex, 1);
    if (rankCards.length === 0) {
      this.rankMap.delete(card.rank);
    }

    this.handRank = this.getHandRank()

    return true;
  }

  getHandRank() {
    // 족보 체크 함수들
    const isRoyalStraightFlush = () => {
      const result = isStraightFlush();
      if (result && result.topCards[0].rank === 14) {
        return new HandRankResult(
          'RoyalStraightFlush',
          result.usedCards,
          result.topCards
        );
      }
      return null;
    };

    const isStraightFlush = () => {
      // suit map을 활용한 최적화된 플러시 체크
      for (const [suit, cards] of this.suitMap.entries()) {
        if (cards.length >= 5) {
          // 같은 무늬 카드들 중에서 스트레이트 체크
          let straightCards = [cards[0]];
          for (let i = 1; i < cards.length; i++) {
            if (cards[i].rank === straightCards[straightCards.length - 1].rank - 1) {
              straightCards.push(cards[i]);
              if (straightCards.length === 5) {
                return new HandRankResult(
                  'StraightFlush',
                  straightCards,
                  [straightCards[0]]
                );
              }

              if (cards[0].rank === 14 && straightCards[0].rank === 5 && straightCards.length === 4) {
                straightCards.push(straightCards[0])
                return new HandRankResult(
                  'StraightFlush',
                  straightCards,
                  [straightCards[0]]
                )
              }

            } else if (cards[i].rank !== straightCards[straightCards.length - 1].rank) {
              straightCards = [cards[i]];
            }
          }
        }
      }
      return null;
    };

    const isFourCard = () => {
      // rank map을 활용한 최적화된 포카드 체크
      for (const [rank, cards] of this.rankMap.entries()) {
        if (cards.length === 4) {
          return new HandRankResult(
            'FourCard',
            cards,
            [cards[0]]
          );
        }
      }
      return null;
    };

    const isFullHouse = () => {
      // rank map을 활용한 최적화된 풀하우스 체크
      let triple = null;
      let pair = null;

      for (const [rank, cards] of this.rankMap.entries()) {
        if (cards.length === 3 && !triple) {
          triple = cards;
        } else if (cards.length >= 2 && !pair) {
          pair = cards.slice(0, 2);
        }

        if (triple && pair) {
          return new HandRankResult(
            'FullHouse',
            [...triple, ...pair],
            [triple[0], pair[0]]
          );
        }
      }
      return null;
    };

    const isFlush = () => {
      // suit map을 활용한 최적화된 플러시 체크
      for (const [suit, cards] of this.suitMap.entries()) {
        if (cards.length >= 5) {
          const flushCards = cards.slice(0, 5);
          return new HandRankResult(
            'Flush',
            flushCards,
            [flushCards[0]]
          );
        }
      }
      return null;
    };

    const isStraight = () => {
      // sortedCards를 활용한 스트레이트 체크

      let straightCards = [this.sortedCards[0]];
      for (let i = 1; i < this.sortedCards.length; i++) {
        if (this.sortedCards[i].rank === straightCards[straightCards.length - 1].rank - 1) {
          straightCards.push(this.sortedCards[i]);
          if (straightCards.length === 5) {
            return new HandRankResult(
              'Straight',
              straightCards,
              [straightCards[0]]
            );
          }

          //back straight
          if (this.sortedCards[0].rank === 14 && straightCards[0].rank === 5 && straightCards.length === 4) {
            straightCards.push(this.sortedCards[0])
            return new HandRankResult(
              'Straight',
              straightCards,
              [straightCards[0]]
            )
          }

        } else if (this.sortedCards[i].rank !== straightCards[straightCards.length - 1].rank) {
          straightCards = [this.sortedCards[i]];
        }
      }
      return null;
    };

    const isTriple = () => {
      // rank map을 활용한 최적화된 트리플 체크
      for (const [rank, cards] of this.rankMap.entries()) {
        if (cards.length === 3) {
          return new HandRankResult(
            'Triple',
            cards,
            [cards[0]]
          );
        }
      }
      return null;
    };

    const isTwoPair = () => {
      // rank map을 활용한 최적화된 투페어 체크
      const pairs = [];
      for (const [rank, cards] of this.rankMap.entries()) {
        if (cards.length >= 2) {
          pairs.push(cards.slice(0, 2));
          if (pairs.length === 2) {
            return new HandRankResult(
              'TwoPair',
              [...pairs[0], ...pairs[1]],
              [pairs[0][0], pairs[1][0]]
            );
          }
        }
      }
      return null;
    };

    const isPair = () => {
      // rank map을 활용한 최적화된 원페어 체크
      for (const [rank, cards] of this.rankMap.entries()) {
        if (cards.length >= 2) {
          const pairCards = cards.slice(0, 2);
          return new HandRankResult(
            'OnePair',
            pairCards,
            [pairCards[0]]
          );
        }
      }
      return null;
    };

    // 족보 우선순위대로 체크
    return isRoyalStraightFlush() ||
           isStraightFlush() ||
           isFourCard() ||
           isFullHouse() ||
           isFlush() ||
           isStraight() ||
           isTriple() ||
           isTwoPair() ||
           isPair()
           // ||
           // new HandRankResult('HighCard', [this.sortedCards[0]], [this.sortedCards[0]]);
  }
}

export class HandRankResult {
  constructor(name, usedCards, topCards) {
    this.name = name;           // 족보 이름
    this.usedCards = usedCards; // 족보 구성에 사용된 카드들
    this.topCards = topCards;   // [메인카드, 서브카드(있는 경우)]
  }
}

// module.exports = {Card, Hand, Deck};