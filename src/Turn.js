'use strict'

/**
 * A turn in the game
 * @class Turn
 */
class Turn {
  /**
   * [constructor description]
   * @param  {Game} game    The game instance
   * @param  {Player} player A player instance
   */
  constructor (game, player) {
    this.game = game
    this.player = player
    this.actions = 4

    this.availableActions = this.getAvailableActions()
  }

  /**
   * Get a list of actions that a player can perform
   * @return {Object} Object with an array of options for each action type
   *                  Each option should have a label and a function to perform the action
   */
  getAvailableActions () {
    this.currentPosition = this.game.cities.pick(this.player.position)
    return {
      drive: this.getDriveOptions()
    }
  }

  /**
   * Get options for the drive action based on adjacent cities
   * @return {Array}
   */
  getDriveOptions () {
    const options = []

    Object.keys(this.currentPosition.adjacent).map(city => {
      options.push({
        label: 'Drive to ' + city,
        do: () => {
          return this.doAction('drive', { city })
        }
      })
    })

    return options
  }

  /**
   * Perform an action
   * @param  {String} action Action name
   * @param  {Object} body   Data to pass to the action function
   */
  doAction (action, body) {
    this.actions--

    this[action](body)

    if (!this.actions) {
      // Do draw and infect stage first
      return this.end()
    }

    this.availableActions = this.getAvailableActions()
  }

  /**
   * Drive action
   * @param  {String} city City to drive to
   */
  drive ({city}) {
    this.game.move(this.player, city)
  }

  /**
   * Start a new game turn
   */
  end () {
    this.game.newTurn()
  }
}

module.exports = Turn
