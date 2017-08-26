'use strict'

/**
 * A turn in the game
 * @class Turn
 */
class Turn {
  /**
   * @param  {Game} game    The game instance
   * @param  {Player} player A player instance
   */
  constructor (game, player) {
    this.game = game
    this.player = player
    this.actions = 4

    this.getAvailableActions()
  }

  /**
   * Is the player in the city of a given card
   * @param  {Card}  card
   * @return {Boolean}
   */
  isInCity (card) {
    return card.type === 'city' && card.name === this.currentPosition.name
  }

  /**
   * Is the player not in the city of a given given city card
   * @param  {Card}  card
   * @return {Boolean}
   */
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
      buildResearchStation: this.getBuildResearchStationOptions(),
      treat: this.getTreatOptions(),
      shareKnowledge: this.getShareKnowledgeOptions(),
      discoverCure: this.getDiscoverCureOptions()
    }
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
   * Start a new game turn
   */
  end () {
    this.game.newTurn()
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
   * Drive action
   * @param  {String} city City to drive to
   */
  drive (city) {
    this.game.move(this.player, city)
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
          label: 'Fly to ' + card.city.name,
          do: () => {
            return this.doAction('directFlight', card)
          }
        })
      }
    })

    return options
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
   * Fly to any city by discarding the card of the current city
   * @param  {Card} card
   * @param  {City} city
   */
  charterFlight ({card, city}) {
    this.game.move(this.player, city.name)
    card.discard()
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
   * Move between research stations
   * @param  {City} city
   */
  shuttleFlight (city) {
    this.game.move(this.player, city.name)
  }

  /**
   * Get option for building research station
   * @return {Array.Object}
   */
  getBuildResearchStationOptions () {
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
   * Build research station in current city
   * @param  {Card} card
   */
  buildResearchStation (card) {
    this.game.buildResearchStation(card.name)
    card.discard()
  }

  /**
   * Get options for treating diseases in current city
   * @return {Array.Object}
   */
  getTreatOptions () {
    const options = []

    Object.keys(this.currentPosition.infection).map(disease => {
      if (this.currentPosition.infection[disease]) {
        const cureAmount = this.game.diseases[disease].cured ? this.currentPosition.infection[disease] : 1
        options.push({
          label: 'Remove ' + cureAmount + ' ' + disease + ' disease cube',
          do: () => {
            this.doAction('treat', {disease, cureAmount})
          }
        })
      }
    })

    return options
  }

  /**
   * Treat a disease in a current city
   * @param  {String} disease  disease name
   * @param  {Number} cureAmount How many cubes to remove
   */
  treat ({disease, cureAmount}) {
    this.currentPosition.infection[disease] -= cureAmount
    this.game.diseases[disease].cubes += cureAmount
  }

  /**
   * Get options for sharing cards with other players
   * @return {Array.Object}
   */
  getShareKnowledgeOptions () {
    const options = []

    this.game.players.map(player => {
      if (player.position === this.currentPosition.name && player !== this.player) {
        if (player.cards.filter(card => card.name === this.currentPosition.name).length) {
          options.push({
            label: 'Take ' + this.currentPosition.name + ' card from ' + player.name,
            do: () => {
              return this.doAction('shareKnowledge', {card: player.cards.filter(card => card.name === this.currentPosition.name)[0], from: player, to: this.player})
            }
          })
        }

        if (this.player.cards.filter(card => card.name === this.currentPosition.name).length) {
          options.push({
            label: 'Give ' + this.currentPosition.name + ' card to ' + player.name,
            do: () => {
              return this.doAction('shareKnowledge', {card: this.player.cards.filter(card => card.name === this.currentPosition.name)[0], from: this.player, to: player})
            }
          })
        }
      }
    })

    return options
  }

  /**
   * Give or take a card to/from another player
   * @param  {Card} card    The card to share
   * @param  {Player} from  Player giving the card
   * @param  {Player} to    Player receiving the card
   */
  shareKnowledge ({card, from, to}) {
    from.cards.map((cardInHand, index) => {
      if (card.name === cardInHand.name) {
        to.cards.unshift(cardInHand)
        from.cards.splice(index, 1)

        // TODO Check for 7 or more cards and prompt discard
      }
    })
  }

  /**
   * Get options for discovering cure by discarding 5 matching cards at a
   * research station. If player has more than 5 matching cards
   * different combinations are offered
   * @return {Array.Object}
   */
  getDiscoverCureOptions () {
    const options = []
    if (this.currentPosition.researchStation) {
      const cardTotals = {}
      this.player.cards.map(card => {
        if (card.city) {
          cardTotals[card.city.color] = cardTotals[card.city.color] ? cardTotals[card.city.color] + 1 : 1
        }
      })

      Object.keys(cardTotals).map(color => {
        const coloredCards = this.player.cards.filter(card => card.city && card.city.color === 'red')
        if (!this.game.diseases[color].cured) {
          this.combinations(coloredCards).map(array => {
            if (array.length === 5) {
              const curingCards = []
              let curingString = ''
              array.map(card => {
                curingCards.push(card)
                curingString += card.city.name + ', '
              })
              options.push({
                label: 'Cure ' + color + ' with ' + curingString,
                do: () => {
                  this.doAction('discoverCure', {color, cards: curingCards})
                }
              })
            }
          })
        }
      })
    }

    return options
  }

  /**
   * Discard 5 cards of the same color at at a research station
   * to cure the corresponding disease
   * @param  {String} color Which disease
   * @param  {Array.Card} cards Cards to discard
   */
  discoverCure ({color, cards}) {
    this.game.diseases[color].cured = 1
    // TODO Check for eradicated
    cards.map(card => card.discard())
  }

  /**
   * Return all unique subset combinations of array items
   * @param  {Array} array
   * @return {Array.Array}
   */
  combinations (array) {
    const results = [[]]
    for (const value of array) {
      const copy = [...results]
      for (const prefix of copy) {
        results.push(prefix.concat(value))
      }
    }
    return results
  }
}

module.exports = Turn
