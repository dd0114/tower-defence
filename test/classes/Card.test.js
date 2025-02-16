const {Hand, Card, Deck} = require('../../js/classes/Card.js');
const {test, expect} = require('@jest/globals');

test('확률 분포', () => {

  const cnt = 1000000

  const resultMap = {}
  for (let i = 0; i < cnt; i++) {
    const result = getResult(7);

    let resultName = "unknown"
    if (result){
     resultName = result.name
    }
    resultMap[resultName] = resultMap[resultName] || 0
    resultMap[resultName] += 1
  }

  Object.entries(resultMap).sort(([, a], [, b]) => b - a)
         .forEach(([name, count]) => {
           console.log(`${name}: ${count}번 (${(count / cnt * 100).toFixed(2)}%)`);
         });

});





function getResult(cardNum) {
  const deck = new Deck();
  const hand = new Hand();

  for (let i = 0; i < cardNum; i++) {
    const card = deck.draw();
    hand.addCard(card)
  }

  return hand.getHandRank();
}