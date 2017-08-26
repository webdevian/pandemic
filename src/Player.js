'use strict'

/**
 * A player in the game
 * @class Player
 */
class Player {
  /**
   * Create a new player
   * @param  {String} name Player's Name
   */
  constructor (name) {
    this.name = name
    this.cards = []
    this.position = 'Atlanta'
  }

  /**
   * Place a card in player's hand
   * @param  {Card} card
   */
  pickUp (card) {
    if (card.hand) {
      card.hand.cards.splice(card.hand.cards.indexOf(card), 1)
    }

    card.hand = this
    this.cards.unshift(card)
  }
}

module.exports = Player
