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

    this.getAvailableActions()
  }

  isInCity (card) {
    return card.type === 'city' && card.name === this.currentPosition.name
  }

  notInCity (card) {
    return card.type === 'city' && card.name !== this.currentPosition.name
  }

  /**
   * Get a list of actions that a player can perform
   * @return {Object} Object with an array of options for each action type
   *                  Each option should have a label and a function to perform the action
   */
  getAvailableActions () {
    this.currentPosition = this.game.cities.pick(this.player.position)
    this.availableActions = {
      drive: this.getDriveOptions(),
      directFlight: this.getDirectFlightOptions(),
      charterFlight: this.getCharterFlightOptions(),
      shuttleFlight: this.getShuttleFlightOptions(),
      buildResearchStation: this.buildResearchStationOptions()
    }
  }

  /**
   * Get options for the drive action based on adjacent cities
   * @return {Array.Object}
   */
  getDriveOptions () {
    const options = []

    Object.keys(this.currentPosition.adjacent).map(city => {
      options.push({
        label: 'Drive to ' + city,
        do: () => {
          return this.doAction('drive', city)
        }
      })
    })

    return options
  }

  /**
   * Get options for flying direct
   * @return {Array.Object}
   */
  getDirectFlightOptions () {
    const options = []

    this.player.cards.map(card => {
      if (this.notInCity(card)) {
        options.push({
          label: 'Fly to ' + card.city,
          do: () => {
            return this.doAction('directFlight', card)
          }
        })
      }
    })

    return options
  }

  /**
   * Get options for chartering flight to anywhere
   * @return {Array.Object}
   */
  getCharterFlightOptions () {
    const options = []
    this.player.cards.map(card => {
      if (this.isInCity(card)) {
        this.game.cities.map(city => {
          options.push({
            label: 'Charter flight to ' + city,
            do: () => {
              return this.doAction('charterFlight', {card, city})
            }
          })
        })
      }
    })

    return options
  }

  /**
   * Options for travelling to another research station
   * @return {Array.Object}
   */
  getShuttleFlightOptions () {
    const options = []
    if (this.currentPosition.researchStation) {
      this.game.cities.filter(city => city.researchStation && this.currentPosition.name !== city.name).map(city => {
        options.push({
          label: 'Shuttle flight to ' + city.name,
          do: () => {
            return this.doAction('shuttleFlight', city)
          }
        })
      })
    }

    return options
  }

  /**
   * Get option for building research station
   * @return {Array.Object}
   */
  buildResearchStationOptions () {
    let options = []
    this.player.cards.map(card => {
      if (this.isInCity(card) && !this.currentPosition.researchStation) {
        options.push({
          label: 'Build Research Station in ' + card.name,
          do: () => {
            return this.doAction('buildResearchStation', card)
          }
        })
      }
    })

    return options
  }

  /**
   * Perform an action
   * @param  {String} action Action name
   * @param  {Object} payload   Data to pass to the action function
   */
  doAction (action, payload) {
    this.actions--

    this[action](payload)

    if (!this.actions) {
      // Do draw and infect stage first
      return this.end()
    }

    this.getAvailableActions()
  }

  /**
   * Drive action
   * @param  {String} city City to drive to
   */
  drive (city) {
    this.game.move(this.player, city)
  }

  /**
   * Fly to a specific city and discard the card
   * @param  {Card} card
   */
  directFlight (card) {
    this.game.move(this.player, card.name)
    card.discard()
  }

  /**
   * Fly to any city by discarding the card of the current city
   * @param  {Card} card
   * @param  {City} city
   */
  charterFlight ({card, city}) {
    this.game.move(this.player, city.name)
    card.discard()
  }

  /**
   * Move between research stations
   * @param  {City} city
   */
  shuttleFlight (city) {
    this.game.move(this.player, city.name)
  }

  /**
   * Build research station in current city
   * @param  {Card} card
   */
  buildResearchStation (card) {
    this.game.buildResearchStation(card.name)
    card.discard()
  }

  /**
   * Start a new game turn
   */
  end () {
    this.game.newTurn()
  }
}

module.exports = Turn
