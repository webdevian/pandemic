/**
 * A card
 * @class
 */
class Card {
  /**
   * Create a new card
   * @param  {String} type      Type of card
   * @param  {Deck} deck        Deck that this card belongs to
   * @param  {Object} [data={}] Data to assign to the card
   */
  constructor (type, deck, data = {}) {
    this.deck = deck
    this.type = type
    Object.keys(data).map(key => {
      this[key] = data[key]
    })
  }
}

module.exports = Card
