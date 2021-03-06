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
   * @param  {Player} player
   * @return {Boolean}
   */
  isInCity (card, player) {
    return card.name === player.position
  }

  /**
   * City the active player is in
   * @return {City}
   */
  get currentPosition () {
    return this.game.cities.pick(this.player.position)
  }

  /**
   * Get a list of actions that a player can perform
   * @return {Object} Object with an array of options for each action type
   *                  Each option should have a label and a function to perform the action
   */
  get availableActions () {
    let actions = {}

    actions.events = this.getEvents(this.player)

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
      } else if (!this.infected && !this.skipInfect) {
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
   * @param {Player} player Player to play event card
   * @return {Array.Object}
   */
  getEvents (player) {
    const events = []

    const optionsMethodName = key => 'get' + key.charAt(0).toUpperCase() + key.slice(1) + 'Options'

    if (this.player.role.savedCard) {
      const options = this[optionsMethodName(this.player.role.savedCard.key)](this.player.role.savedCard)

      options.label = 'Saved Card: ' + options.label
      events.push(options)
    }

    player.cards.filter(card => card.type === 'event').map(card => {
      events.push(this[optionsMethodName(card.key)](card))
    })

    return events
  }

  /**
   * Get actions specific to current player
   * @return {Object}
   */
  getRoleActions () {
    if (this.player.is('contingency')) {
      return this.getContingencyActions()
    }

    if (this.player.is('operations')) {
      return this.getOperationsActions()
    }

    if (this.player.is('dispatcher')) {
      return this.getDispatcherActions()
    }

    return {}
  }

  /**
   * Complete the action on an event card
   * @param {Card} card Event card
   * @param {Object} payload Data to pass to event method
   * @param {Bolean} [discard=true] Should card be discarded?
   */
  doEvent (card, payload, discard = true) {
    this[card.key + 'Event'](payload)

    if (card.isSaved) {
      this.player.role.savedCard = null
    } else {
      card.discard()
    }
  }

  /**
   * Get options for the drive action based on adjacent cities
   * @param {Player} [player] Player to move (defaults to current turn player)
   * @return {Array.Object}
   */
  getDriveOptions (player) {
    player = player || this.player
    const options = []

    Object.keys(this.game.cities.pick(player.position).adjacent).map(city => {
      options.push({
        label: 'Drive to ' + city,
        do: () => {
          return this.doAction('drive', {city, player})
        }
      })
    })

    return options
  }

  /**
   * Drive action
   * @param {String} city City to drive to
   * @param {Player} player Player to move
   */
  drive ({city, player}) {
    this.game.move(player, city)
  }

  /**
   * Get options for flying direct
   * @param {Player} [player] Player to move (defaults to current turn player)
   * @param {Array} [cards] Cards to be played (defaults to current turn player's hand)
   * @return {Array.Object}
   */
  getDirectFlightOptions (player, cards) {
    player = player || this.player
    cards = cards || this.player.cards
    const options = []

    cards.map(card => {
      if (card.isCity() && !this.isInCity(card, player)) {
        options.push({
          label: 'Fly to ' + card.city.name,
          do: () => {
            return this.doAction('directFlight', {card, player})
          }
        })
      }
    })

    return options
  }

  /**
   * Fly to a specific city and discard the card
   * @param {Card} card
   * @param {Player} player Player to move
   */
  directFlight ({card, player}) {
    this.game.move(player, card.city.name)
    card.discard()
  }

  /**
   * Get options for chartering flight to anywhere
   * @param {Player} [player] Player to move (defaults to current turn player)
   * @param {Array} [cards] Cards to be played (defaults to current turn player's hand)
   * @return {Array.Object}
   */
  getCharterFlightOptions (player, cards) {
    player = player || this.player
    cards = cards || this.player.cards
    const options = []
    cards.map(card => {
      if (card.isCity() && this.isInCity(card, player)) {
        this.game.cities.map(city => {
          options.push({
            label: 'Charter flight to ' + city.name,
            do: () => {
              return this.doAction('charterFlight', {card, city, player})
            }
          })
        })
      }
    })

    return options
  }

  /**
   * Fly to any city by discarding the card of the current city
   * @param {Card} card
   * @param {City} city
   * @param {Player} player Player to move
   */
  charterFlight ({card, city, player}) {
    this.game.move(player, city.name)
    card.discard()
  }

  /**
   * Options for travelling to another research station
   * @param {Player} [player] Player to move (defaults to current turn player)
   * @return {Array.Object}
   */
  getShuttleFlightOptions (player) {
    player = player || this.player
    const options = []

    if (this.game.cities.pick(player.position).researchStation) {
      this.game.cities.filter(city => city.researchStation && this.currentPosition.name !== city.name).map(city => {
        options.push({
          label: 'Shuttle flight to ' + city.name,
          do: () => {
            return this.doAction('shuttleFlight', {city, player})
          }
        })
      })
    }

    return options
  }

  /**
   * Move between research stations
   * @param {City} city
   * @param {Player} player Player to move
   */
  shuttleFlight ({city, player}) {
    this.game.move(player, city.name)
  }

  /**
   * Get option for building research station
   * @return {Array.Object}
   */
  getBuildResearchStationOptions () {
    let options = []
    this.player.cards.map(card => {
      if (card.isCity() && this.isInCity(card, this.player) && !this.currentPosition.researchStation) {
        options.push({
          label: 'Build Research Station in ' + card.name,
          do: () => {
            return this.doAction('buildResearchStation', card)
          }
        })
      }
    })

    if (!options.length && this.player.is('operations')) {
      const city = this.currentPosition

      options.push({
        label: 'Build Research Station in ' + city.name,
        do: () => {
          return this.doAction('buildResearchStation', { name: city.name })
        }
      })
    }

    return options
  }

  /**
   * Build research station in current city
   * @param  {Card} card
   */
  buildResearchStation (card) {
    this.game.buildResearchStation(card.name)

    if (!this.player.is('operations')) {
      card.discard()
    }
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
        this.player.cards.filter(card => (card.type === 'city' && this.player.is('researcher')) || card.name === this.currentPosition.name).map(card => {
          options.push({
            label: 'Give ' + card.name + ' card to ' + player.name,
            do: () => {
              return this.doAction('shareKnowledge', {card, to: player})
            }
          })
        })

        player.cards.filter(card => (card.type === 'city' && player.is('researcher')) || card.name === this.currentPosition.name).map(card => {
          options.push({
            label: 'Take ' + card.name + ' card from ' + player.name,
            do: () => {
              return this.doAction('shareKnowledge', {card, to: this.player})
            }
          })
        })
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
   * Actions for contingency role
   * @return {Object}
   */
  getContingencyActions () {
    const actions = {}

    actions.contingency = []

    this.game.decks.player.discarded.filter(card => card.type === 'event').map(card => {
      actions.contingency.push({
        label: 'Pick up ' + card.name,
        do: () => {
          this.actions--
          card.hand = null
          card.isSaved = true
          this.player.role.savedCard = card
          this.game.decks.player.discarded.splice(this.game.decks.player.discarded.indexOf(card), 1)
        }
      })
    })

    return actions
  }

  /**
   * Actions for operations role
   * @return {Object}
   */
  getOperationsActions () {
    const actions = {}

    actions.operations = []

    if (this.currentPosition.researchStation && this.player.cards.filter(card => card.type === 'city').length) {
      this.game.cities.filter(city => !city.researchStation && city.name !== this.currentPosition.name).map(city => {
        const discards = []

        this.player.cards.filter(card => card.type === 'city').map(card => {
          discards.push({
            label: 'Discard ' + card.name + 'to move to ' + city.name,
            do: () => {
              this.actions--
              this.game.move(this.player, city.name)
              card.discard()
            }
          })
        })

        actions.operations.push({
          label: 'Move to ' + city.name,
          actions: discards
        })
      })
    }

    return actions
  }

  /**
   * Actions for dispatcher role
   * @return {Object}
   */
  getDispatcherActions () {
    const actions = {}

    actions.dispatcher = {}

    actions.dispatcher.dispatch = []

    this.game.players.map(player => {
      const dispatchActions = []

      this.game.players.filter(otherPlayer => otherPlayer.name !== player.name && otherPlayer.position !== player.position).map(otherPlayer => {
        dispatchActions.push({
          label: 'Move ' + player.name + ' to ' + otherPlayer.position,
          do: () => {
            this.actions--
            this.game.move(player, otherPlayer.position)
          }
        })
      })

      actions.dispatcher.dispatch.push({
        label: 'Move ' + player.name,
        actions: dispatchActions
      })
    })

    actions.dispatcher.move = []
    this.game.players.filter(player => player.name !== this.player.name).map(player => {
      actions.dispatcher.move.push({
        label: 'Move ' + player.name,
        actions: {
          drive: this.getDriveOptions(player),
          directFlight: this.getDirectFlightOptions(player, this.player.cards),
          charterFlight: this.getCharterFlightOptions(player, this.player.cards),
          shuttleFlight: this.getShuttleFlightOptions(player)
        }
      })
    })

    return actions
  }

  /**
   * Get Actions(s) for the Resilient Population event
   * @param  {Card} eventCard Event card to play
   * @return {Object}
   */
  getResilientOptions (eventCard) {
    const actions = []
    this.game.decks.infection.discarded.map(card => {
      actions.push({
        label: 'Resilient Population',
        do: () => {
          this.doEvent(eventCard, {card: card.name})
        }
      })
    })

    return {
      label: eventCard.name,
      actions
    }
  }

  /**
   * Remove a card from the infection discard pile
   * @param  {String} card Name of the card to remove
   */
  resilientEvent ({card}) {
    this.game.decks.infection.discarded.map((infectionCard, i) => {
      if (infectionCard.name === card) {
        this.game.decks.infection.discarded.splice(i, 1)
      }
    })
  }

  /**
   * Get Actions(s) for the One Quiet Night event
   * @param  {Card} eventCard Event card to play
   * @return {Object}
   */
  getOqnOptions (eventCard) {
    return {
      label: 'One Quiet Night',
      do: () => {
        this.doEvent(eventCard)
      }
    }
  }

  /**
   * Skip the infection step for this turn
   */
  oqnEvent () {
    this.skipInfect = 1
  }

  /**
   * Get Actions(s) for the Forecast event
   * @param  {Card} eventCard Event card to play
   * @return {Object}
   */
  getForecastOptions (eventCard) {
    return {
      label: 'Forecast',
      do: () => {
        this.doEvent(eventCard)
      }
    }
  }

  /**
   * Show player top 6 infection deck cards then re-arrange them
   */
  forecastEvent () {
    // Eeeesh :/
  }

  /**
   * Get Actions(s) for the Airlift event
   * @param  {Card} eventCard Event card to play
   * @return {Object}
   */
  getAirliftOptions (eventCard) {
    const actions = []
    this.game.players.map(player => {
      const playerActions = []
      this.game.cities.map(city => {
        if (city.name !== player.position) {
          playerActions.push({
            label: 'Move ' + player.name + ' to ' + city.name,
            do: () => {
              this.doEvent(eventCard, {player, city: city.name})
            }
          })
        }
      })

      actions.push({
        label: 'Move ' + player.name,
        actions: playerActions
      })
    })

    return {
      label: 'Airlift',
      actions
    }
  }

  /**
   * Move any player to any city
   * @param  {Player} player Player to move
   * @param  {String} city   Name of city to move them to
   */
  airliftEvent ({player, city}) {
    this.game.move(player, city)
  }

  /**
   * Get Actions(s) for the Government Grant event
   * @param  {Card} eventCard Event card to play
   * @return {Object}
   */
  getGgOptions (eventCard) {
    const actions = []
    this.game.cities.map(city => {
      if (!city.researchStation) {
        actions.push({
          label: 'Build Research Station in ' + city.name,
          do: () => {
            this.doEvent(eventCard, {city: city.name})
          }
        })
      }
    })

    return {
      label: 'Government Grant',
      actions
    }
  }

  /**
   * Build a research station in any city
   * @param  {String} city name of the city
   */
  ggEvent ({city}) {
    this.game.buildResearchStation(city)
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
