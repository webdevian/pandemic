'use strict'

const Deck = require('./Deck')
const Player = require('./Player')
const City = require('./City')
const Turn = require('./Turn')

/**
 * Top level class. Start a new game from here
 * @class Game
 */
class Game {
  /**
   * Start a new game
   * @param  {Number} players How many players (2-4)
   *
   * @example
   * const game = new Game(2)
   */
  constructor (players) {
    this.setUpGame()
    this.createPlayers(players)
    this.pickRoles()
    this.dealCards()
  }

  /**
   * Set up game variables to default starting values
   */
  setUpGame () {
    this.infectionLevel = 0
    this.outbreakCount = 0
    this.researchStations = 6
    this.diseases = {}
    this.turns = []

    const colors = ['red', 'yellow', 'black', 'blue']

    colors.map(color => {
      this.diseases[color] = {
        cured: 0,
        eradicated: 0,
        cubes: 24
      }
    })

    this.decks = {
      player: new Deck('player'),
      infection: new Deck('infection')
    }

    this.cities = City.load()
  }

  /**
   * Start the game
   */
  start () {
    this.initialInfect()
    this.buildResearchStation('Atlanta')
    this.players.map(player => {
      this.move(player, 'Atlanta')
    })
    this.newTurn()
  }

  /**
   * Start a new turn
   */
  newTurn () {
    let player

    if (!this.turn) {
      // Decide first turn
      player = this.players[0]
    } else {
      const current = this.players.indexOf(this.turn.player)
      player = current >= 0 && current < this.players.length - 1 ? this.players[current + 1] : this.players[0]
    }

    this.turns.push(new Turn(this, player))
  }

  /**
   * Getter for the current turn
   * @return {Turn} Turn instance
   */
  get turn () {
    return this.turns[this.turns.length - 1]
  }

  /**
   * Rate of infection, based on infectionLevel
   * @return {Number}
   */
  get infectionRate () {
    const rates = [2, 2, 2, 3, 3, 4, 4]
    return rates[this.infectionLevel]
  }

  /**
   * Create player instances for a new game
   * @param  {Number} players How many players (2-4)
   */
  createPlayers (players) {
    this.players = []
    Array.from(Array(players)).map((x, i) => {
      this.players.push(new Player('player' + (i + 1)))
    })
  }

  /**
   * Draw a role card and assign for each player
   */
  pickRoles () {
    const roles = new Deck('role')
    this.players.map(player => {
      player.role = roles.draw()
    })
  }

  /**
   * Deal game starting player cards to players
   */
  dealCards () {
    this.decks.player.deal(this.players)
  }

  /**
   * Move a player
   * @param  {Player} player Player instance
   * @param  {String} city   City Name
   */
  move (player, city) {
    player.position = city
  }

  /**
   * Can a research station be build in this city
   * @param  {City} city City instance
   * @return {Boolean}
   */
  canBuildResearchStation (city) {
    if (this.researchStations > 0) {
      if (!city.researchStation) {
        return true
      }
    }

    return false
  }

  /**
   * Build a research station in a given city
   * @param  {String} city City Name
   * @return {Boolean}     Was it built?
   */
  buildResearchStation (city) {
    city = this.cities.pick(city)
    if (!this.canBuildResearchStation(city)) {
      return false
    }

    city.researchStation = 1
    this.researchStations--
    return true
  }

  /**
   * Infect a city
   * @param  {Card} card         Infection Card
   * @param  {Number} [amount=1] Number of cubes
   * @param  {String} disease    Which disease? Defaults to city's color
   */
  infect (card, amount = 1, disease) {
    const city = this.cities.pick(card.city.name)
    city.infect(this, amount, disease)
    card.discard()
  }

  /**
   * Infect 9 cities at the start of the game
   */
  initialInfect () {
    for (let i = 0; i < 9; i++) {
      const card = this.decks.infection.cards[0]
      this.infect(card, Math.floor(i / 3) + 1)
    }
  }

  /**
   * Build a google maps static api for the status of the board
   * @member
   * @return {String} Url
   */
  get map () {
    let url = 'https://maps.googleapis.com/maps/api/staticmap?zoom=1&size=1200x1200&maptype=terrain'

    this.cities.map(city => {
      url += `&markers=color:${city.color}|label:${city.infectionTotal}|${city.loc}`

      if (city.researchStation) {
        url += `&markers=icon:${encodeURIComponent('http://i.imgur.com/B5DUeSF.png')}|${city.loc}`
      }

      Object.keys(city.adjacent).map(adjacentCity => {
        if (!url.includes(`${city.adjacent[adjacentCity].loc}|${city.loc}`)) {
          url += `&path=weight:1|${city.loc}|${city.adjacent[adjacentCity].loc}`
        }
      })
    })

    return url
  }
}

module.exports = Game
