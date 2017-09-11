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
    this.drawn = 0
    this.infected = 0
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
   * City the active player is in
   * @return {City}
   */
  get currentPosition () {
    return this.game.cities.pick(this.player.position)
  }

  /**
   * City the active player is in
   * @param {City|String} city City name
   */
  set currentPosition (city) {
    city = city.name || city
    this.game.move(this.player, city)
  }

  /**
   * Get a list of actions that a player can perform
   * @return {Object} Object with an array of options for each action type
   *                  Each option should have a label and a function to perform the action
   */
  get availableActions () {
    let actions = {}

    actions.events = this.getEvents()

    if (this.player.cards.length > 7) {
      actions.discard = this.getDiscardOptions()
      return actions
    }

    if (!this.actions) {
      if (!this.drawn) {
        // Do draw and infect stage first
        actions.draw = {
          label: 'Draw 2 cards',
          do: () => this.drawStage()
        }
      } else if (!this.infected) {
        actions.infect = {
          label: 'Infect cities',
          do: () => this.infectStage()
        }
      } else {
        actions.end = {
          label: 'End Turn',
          do: () => this.end()
        }
      }
    } else {
      actions.drive = this.getDriveOptions()
      actions.directFlight = this.getDirectFlightOptions()
      actions.charterFlight = this.getCharterFlightOptions()
      actions.shuttleFlight = this.getShuttleFlightOptions()
      actions.buildResearchStation = this.getBuildResearchStationOptions()
      actions.treat = this.getTreatOptions()
      actions.shareKnowledge = this.getShareKnowledgeOptions()
      actions.discoverCure = this.getDiscoverCureOptions()
    }

    Object.assign(actions, this.getRoleActions())

    return actions
  }

  /**
   * Perform an action
   * @param  {String} action Action name
   * @param  {Object} payload   Data to pass to the action function
   */
  doAction (action, payload) {
    this.actions--

    this[action](payload)
  }

  /**
   * Draw 2 cards from the player deck
   */
  drawStage () {
    for (let i = 0; i < 2; i++) {
      const card = this.game.decks.player.draw()
      if (card.type === 'epidemic') {
        this.game.epidemic()
      }
      this.player.pickUp(card)
    }

    this.drawn = 1
  }

  infectStage () {
    for (let i = 0; i < this.game.infectionRate; i++) {
      const infectCard = this.game.decks.infection.cards[0]
      this.game.infect(infectCard)
    }

    this.infected = 1
  }

  /**
   * Start a new game turn
   */
  end () {
    this.game.newTurn()
  }

  /**
   * Get playable event cards at a given time
   * @return {Array.Object}
   */
  getEvents () {
    const options = []

    this.player.cards.filter(card => card.type === 'event').map(card => {
      options.push({
        label: card.name,
        do: () => this.doEvent(card)
      })
    })

    return options
  }

  /**
   * Get actions specific to current player
   * @return {Object}
   */
  getRoleActions () {
    const actions = {}

    if (this.player.is('contingency')) {
      actions.contingency = []

      this.game.decks.player.discarded.filter(card => card.type === 'event').map(card => {
        actions.contingency.push({
          label: 'Pick up ' + card.name,
          do: () => {
            this.actions--
            this.player.role.savedCard = card
            this.player.role.savedCard.hand = null
            this.game.decks.player.discarded.splice(this.game.decks.player.discarded.indexOf(card), 1)
          }
        })
      })

      if (this.player.role.savedCard) {
        const card = this.player.role.savedCard
        actions.savedCard = {
          label: 'Saved Card: ' + card.name,
          do: () => {
            this.doEvent(card, false)
            this.player.role.savedCard = null
          }
        }
      }
    }

    return actions
  }

  /**
   * Complete the action on an event card
   * @param {Card} card Event card
   * @param {Bolean} [discard=true] Should card be discarded?
   */
  doEvent (card, discard = true) {
    // TODO Set up actual events
    if (discard) {
      card.discard()
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
   * Drive action
   * @param  {String} city City to drive to
   */
  drive (city) {
    this.currentPosition = city
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
    this.currentPosition = card.city
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
            label: 'Charter flight to ' + city.name,
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
    this.currentPosition = city
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
    this.currentPosition = city
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
        const cureAmount = this.game.diseases[disease].cured || this.player.is('medic') ? this.currentPosition.infection[disease] : 1
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
    this.game.checkEradicated(disease)
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
              return this.doAction('shareKnowledge', {card: player.cards.filter(card => card.name === this.currentPosition.name)[0], to: this.player})
            }
          })
        }

        if (this.player.cards.filter(card => card.name === this.currentPosition.name).length) {
          options.push({
            label: 'Give ' + this.currentPosition.name + ' card to ' + player.name,
            do: () => {
              return this.doAction('shareKnowledge', {card: this.player.cards.filter(card => card.name === this.currentPosition.name)[0], to: player})
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
   * @param  {Player} to    Player receiving the card
   */
  shareKnowledge ({card, to}) {
    to.pickUp(card)
  }

  /**
   * Get options for discovering cure by discarding 5 matching cards at a
   * research station. If player has more than 5 matching cards
   * different combinations are offered
   * @return {Array.Object}
   */
  getDiscoverCureOptions () {
    let requiredCards = 5

    if (this.player.is('scientist')) {
      requiredCards = 4
    }

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
            if (array.length === requiredCards) {
              const curingCards = []
              let curingString = ''
              array.map(card => {
                curingCards.push(card)
                curingString += card.city.name + ', '
              })
              options.push({
                label: 'Cure ' + color + ' with ' + curingString,
                do: () => {
                  this.doAction('discoverCure', {disease: color, cards: curingCards})
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
  discoverCure ({disease, cards}) {
    this.game.diseases[disease].cured = 1
    this.game.checkEradicated(disease)
    cards.map(card => card.discard())
  }

  /**
   * Get options for discarding cards from hand
   * @return {Array.Object}
   */
  getDiscardOptions () {
    const options = []
    this.player.cards.map(card => {
      options.push({
        label: 'Discard ' + card.name,
        do: () => {
          card.discard()
        }
      })
    })

    return options
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
