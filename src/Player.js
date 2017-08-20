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
}

module.exports = Player
