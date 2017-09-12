const chai = require('chai')
const expect = chai.expect
const Game = require('../src/Game')
const Card = require('../src/Card')

describe('Resilient Population Event', () => {
  it('Can remove a card from the discard pile', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.player.cards = []

    game.turn.player.pickUp(new Card('event', game.decks.player, {
      key: 'resilient',
      name: 'Resilient Population'
    }))

    expect(game.turn.availableActions.events).to.be.an('array')
    expect(game.turn.availableActions.events[0]).to.be.an('object')
    expect(game.turn.availableActions.events[0].actions).to.be.an('array')
    expect(game.turn.availableActions.events[0].actions[0]).to.be.an('object')

    expect(game.decks.infection.discarded.length).to.equal(9)
    expect(game.decks.infection.cards.length).to.equal(39)

    game.turn.availableActions.events[0].actions[0].do()

    expect(game.decks.infection.discarded.length).to.equal(8)
    expect(game.decks.infection.cards.length).to.equal(39)

    expect(game.turn.player.cards.length).to.equal(0)
    expect(game.decks.player.discarded.length).to.equal(1)
  })
})

describe('One Quiet Night Event', () => {
  it('Stops the next infection stage', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.player.cards = []

    game.turn.player.pickUp(new Card('event', game.decks.player, {
      key: 'oqn',
      name: 'One Quiet Night'
    }))

    expect(game.turn.availableActions.events).to.be.an('array')
    expect(game.turn.availableActions.events[0]).to.be.an('object')

    game.turn.actions = 0

    game.turn.availableActions.draw.do()
    expect(game.turn.player.cards.length).to.equal(3)

    expect(game.turn.availableActions.infect).to.be.an('object')
    game.turn.availableActions.events[0].do()

    expect(game.turn.availableActions.infect).to.equal(undefined)
    expect(game.turn.player.cards.length).to.equal(2)
    expect(game.decks.player.discarded.length).to.equal(1)
  })
})

describe('Forecast Event', () => {
  it('TODO', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.player.cards = []

    game.turn.player.pickUp(new Card('event', game.decks.player, {
      key: 'forecast',
      name: 'Forecast'
    }))

    expect(game.turn.availableActions.events).to.be.an('array')
    expect(game.turn.availableActions.events[0]).to.be.an('object')

    game.turn.availableActions.events[0].do()

    expect(game.turn.player.cards.length).to.equal(0)
    expect(game.decks.player.discarded.length).to.equal(1)
  })
})

describe('Airlift Event', () => {
  it('Move another player to any city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.player.cards = []

    game.turn.player.pickUp(new Card('event', game.decks.player, {
      key: 'airlift',
      name: 'Airlift'
    }))

    expect(game.turn.availableActions.events).to.be.an('array')
    expect(game.turn.availableActions.events[0]).to.be.an('object')
    expect(game.turn.availableActions.events[0].actions).to.be.an('array')
    expect(game.turn.availableActions.events[0].actions[0]).to.be.an('object')
    expect(game.turn.availableActions.events[0].actions[0].actions).to.be.an('array')

    game.turn.availableActions.events[0].actions[1].actions[0].do()

    expect(game.players[1].position).to.equal('Algiers')

    expect(game.turn.player.cards.length).to.equal(0)
    expect(game.decks.player.discarded.length).to.equal(1)
  })
})

describe('Government Grant Event', () => {
  it('Build a research station in any city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.player.cards = []

    game.turn.player.pickUp(new Card('event', game.decks.player, {
      key: 'gg',
      name: 'Government Grant'
    }))

    expect(game.turn.availableActions.events).to.be.an('array')
    expect(game.turn.availableActions.events[0]).to.be.an('object')
    expect(game.turn.availableActions.events[0].actions).to.be.an('array')
    expect(game.turn.availableActions.events[0].actions[0]).to.be.an('object')

    game.turn.availableActions.events[0].actions[0].do()

    expect(game.cities.pick('Algiers').researchStation).to.equal(1)

    expect(game.turn.player.cards.length).to.equal(0)
    expect(game.decks.player.discarded.length).to.equal(1)
  })
})
