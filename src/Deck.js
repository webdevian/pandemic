'use strict'

const Card = require('./Card')
const roleCards = require('../lib/cards/role')
const cities = require('../lib/cities')
const eventCards = require('../lib/cards/event')

/**
 * A deck of cards
 * @class
 */
class Deck {
  /**
   * Create a new deck
   * @param  {String} type       Type of deck (player, role or infection)
   * @param  {String} difficulty Difficulty level of the game
   */
  constructor (type, difficulty) {
    this.type = type
    this[ type + 'Build' ](difficulty)
    this.shuffle()
  }

  /**
   * Build the role deck
   */
  roleBuild () {
    const cards = []

    roleCards.map(role => {
      cards.push(new Card('role', this, role))
    })

    this.cards = cards
  }

  /**
   * Build the infection deck from the cities lib
   */
  infectionBuild () {
    const cards = []

    cities.map(city => {
      cards.push(new Card('city', this, { name: city.name, city }))
    })

    this.cards = cards
    this.discarded = []
  }

  /**
   * move a card from the deck to the discard pile
   * @param  {Card} card Card instance
   */
  discard (card) {
    const pickedCard = this.find(card.name, 1)
    this.discarded.unshift(pickedCard)
  }

  /**
   * Build the player deck from the cities and events libs
   */
  playerBuild () {
    const cards = []

    cities.map(city => {
      cards.push(new Card('city', this, { name: city.name, city }))
    })

    eventCards.map(event => {
      cards.push(new Card('event', this, event))
    })

    this.cards = cards
    this.discarded = []
  }

  /**
   * Deal starting player deck cards
   * @param  {Array.Object} players Players array
   * @param  {String} difficulty    Difficulty level of the game
   */
  deal (players, difficulty = 'easy') {
    this.shuffle()

    const cardsToDeal = Deck.cardsPerPlayer[players.length]

    Array.from(Array(cardsToDeal)).map(() => {
      players.map(player => {
        player.pickUp(this.draw())
      })
    })

    const amountOfEpidemics = Deck.difficultyEpidemics[difficulty]

    const groups = this.split(this.cards, amountOfEpidemics)
    const newOrder = []

    groups.map(group => {
      group.push(new Card('epidemic', this))
      this.randomiseArray(group)
      group.map(card => {
        newOrder.push(card)
      })
    })

    this.cards = newOrder
  }

  /**
   * Find a card by name and optionally draw it from the deck
   * @param  {String} name          Name of the card
   * @param  {Boolean} [draw=false] Take out of deck
   * @return {Card}                 Card instance
   */
  find (name, draw = false) {
    let index
    this.cards.map((card, i) => {
      if (card.name === name) {
        index = i
      }
    })
    const card = this.cards[index]

    if (draw) {
      this.cards.splice(index, 1)
    }

    return card
  }

  /**
   * Split an array into several groups
   * @param  {Array} array            Array to split
   * @param  {Number} numberOfGroups  Number of groups to split into
   * @return {Array.Array}            Array of smaller arrays
   */
  split (array, numberOfGroups) {
    const rest = array.length % numberOfGroups // how much to divide
    let restUsed = rest // to keep track of the division over the elements
    const partLength = Math.floor(array.length / numberOfGroups)
    const result = []

    for (let i = 0; i < array.length; i += partLength) {
      let end = partLength + i
      let add = false

      if (rest !== 0 && restUsed) { // should add one element for the division
        end++
        restUsed-- // we've used one division element now
        add = true
      }

      result.push(array.slice(i, end)) // part of the cardsay

      if (add) {
        i++ // also increment i in the case we added an extra element for division
      }
    }

    return result
  }

  /**
   * How many epidemic cards to add for each
   * difficulty level
   * @static
   * @member
   * @type {Object}
   */
  static get difficultyEpidemics () {
    return {
      easy: 4,
      medium: 5,
      hard: 6
    }
  }

  /**
   * How many player cards to deal at the start of the game
   * @static
   * @member
   * @type {Object}
   */
  static get cardsPerPlayer () {
    return {
      2: 4,
      3: 3,
      4: 2
    }
  }

  /**
   * Amount of cards in the deck
   * @member
   * @return {Number}
   */
  get remaining () {
    return this.cards.length
  }

  /**
   * Pick the top card and remove it from the deck
   * @return {Card} Chosen card
   */
  draw () {
    if (this.type === 'player' && this.cards.length < 2) {
      throw new Error('Game Over')
    }
    const card = this.cards[0]
    this.cards.splice(0, 1)
    return card
  }

  /**
   * Shuffle the order of an array
   * @param  {Array} array Array to shuffle
   * @return {Array}       Array in a new order
   */
  randomiseArray (array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
    return array
  }

  /**
   * Shuffle the cards in the deck
   */
  shuffle () {
    this.cards = this.randomiseArray(this.cards.slice())
  }
}

module.exports = Deck
