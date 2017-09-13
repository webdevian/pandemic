'use strict'

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

  /**
   * Add card to discard pile and remove from hand (if in hand)
   */
  discard () {
    this.deck.discard(this)
    if (this.hand) {
      this.hand.cards.splice(this.hand.cards.indexOf(this), 1)
    }
  }

  /**
   * Is the card a city card
   * @return {Boolean}
   */
  isCity () {
    return this.type === 'city'
  }
}

module.exports = Card
