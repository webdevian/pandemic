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
    this.role = {}
    this.position = 'Atlanta'
  }

  /**
   * Does the player match the given role
   * @param  {String}  key Key for role
   */
  is (key) {
    return this.role.key === key
  }

  /**
   * Assign a role card to a player
   * @param  {Card} card Role card
   */
  assignRole (card) {
    this.role = {
      card: card,
      key: card.key,
      name: card.name,
      color: card.color
    }

    if (this.is('contingency')) {
      this.role.savedCard = null
    }
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
