const chai = require('chai')
const expect = chai.expect
const Player = require('../src/Player')
const Game = require('../src/Game')

describe('Player class', () => {
  it('Can create a new player', () => {
    const player1 = new Player('James')
    expect(player1.name).to.equal('James')
  })

  it('Can assign role to player', () => {
    const player1 = new Player('James')
    expect(player1.is('dispatcher')).to.equal(false)
    player1.assignRole({
      name: 'Dispatcher',
      key: 'dispatcher',
      color: 'magenta'
    })
    expect(player1.is('dispatcher')).to.equal(true)
  })
})

describe('Contingency planner role', () => {
  it('Gets a slot for saving an event card', () => {
    const player1 = new Player('James')
    expect(player1.is('contingency')).to.equal(false)
    expect(player1.role.savedCard).to.equal(undefined)
    player1.assignRole({
      name: 'Contingency Planner',
      key: 'contingency',
      color: 'blue'
    })
    expect(player1.is('contingency')).to.equal(true)
    expect(player1.role.savedCard).to.equal(null)
  })

  it('Can pick up an event from the discard deck, save it, and play it later', () => {
    const game = new Game(2)
    game.start()

    const events = game.decks.player.cards.filter(card => card.type === 'event')
    game.turn.player.assignRole({
      name: 'Contingency Planner',
      key: 'contingency',
      color: 'blue'
    })

    game.turn.player.cards.length = 0

    game.turn.player.pickUp(events[1])
    game.turn.player.pickUp(events[0])

    const name = game.turn.player.cards[0].name

    expect(game.turn.player.cards.length).to.equal(2)
    expect(game.decks.player.discarded.length).to.equal(0)

    expect(game.turn.availableActions.contingency.length).to.equal(0)
    expect(game.turn.availableActions.events.length).to.equal(2)

    game.turn.availableActions.events[0].do()

    expect(game.turn.player.cards.length).to.equal(1)
    expect(game.decks.player.discarded.length).to.equal(1)
    expect(game.turn.availableActions.events.length).to.equal(1)
    expect(game.turn.availableActions.contingency.length).to.equal(1)
    expect(game.turn.availableActions.events.length).to.equal(1)
    expect(game.turn.actions).to.equal(4)

    game.turn.availableActions.contingency[0].do()

    expect(game.turn.player.role.savedCard.name).to.equal(name)
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.player.cards.length).to.equal(1)
    expect(game.decks.player.discarded.length).to.equal(0)
    expect(game.turn.availableActions.contingency.length).to.equal(0)
    expect(game.turn.availableActions.events.length).to.equal(1)
    expect(game.turn.availableActions.savedCard).to.be.an('object')

    game.turn.availableActions.savedCard.do()
    expect(game.turn.player.cards.length).to.equal(1)
    expect(game.decks.player.discarded.length).to.equal(0)
    expect(game.turn.availableActions.events.length).to.equal(1)
    expect(game.turn.availableActions.contingency.length).to.equal(0)
    expect(game.turn.availableActions.events.length).to.equal(1)
    expect(game.turn.player.role.savedCard).to.equal(null)
    expect(game.turn.actions).to.equal(3)
  }, 2)
})

describe('Scientist role', () => {
  it('Only needs 4 cards to find a cure', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {
      name: 'Scientist',
      key: 'scientist',
      color: 'white'
    }
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 4) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(4)
    expect(game.turn.availableActions.discoverCure.length).to.equal(1)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 4)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.turn.player.cards.length).to.equal(0)
  })
})

describe('Quarantine Specialist role', () => {
  it('Prevents infection in current city', () => {
    const game = new Game(2)
    game.newTurn()
    game.turn.player.role = {
      name: 'Quarantine Specialist',
      key: 'quarantine',
      color: 'green'
    }

    game.infect(game.decks.infection.find('Kinshasa'), 1)
    expect(game.cities.pick('Kinshasa').infection.yellow).to.equal(1)
    game.move(game.turn.player, 'Kinshasa')

    game.decks.infection.discarded.slice().map(card => {
      game.decks.infection.cards.unshift(card)
    })

    game.decks.infection.discarded = []

    game.infect(game.decks.infection.find('Kinshasa'), 1)
    expect(game.cities.pick('Kinshasa').infection.yellow).to.equal(1)
  })

  it('Prevents infection in neighbouring city', () => {
    const game = new Game(2)
    game.newTurn()
    game.turn.player.role = {
      name: 'Quarantine Specialist',
      key: 'quarantine',
      color: 'green'
    }

    game.infect(game.decks.infection.find('Paris'), 1)
    expect(game.cities.pick('Paris').infection.blue).to.equal(1)
    game.move(game.turn.player, 'London')

    game.decks.infection.discarded.slice().map(card => {
      game.decks.infection.cards.unshift(card)
    })

    game.decks.infection.discarded = []

    game.infect(game.decks.infection.find('Paris'), 1)
    expect(game.cities.pick('Paris').infection.blue).to.equal(1)
  })

  it('Doesn\'t prevent if not in neighbouring city', () => {
    const game = new Game(2)
    game.newTurn()
    game.turn.player.role = {
      name: 'Quarantine Specialist',
      key: 'quarantine',
      color: 'green'
    }

    game.infect(game.decks.infection.find('Paris'), 1)
    expect(game.cities.pick('Paris').infection.blue).to.equal(1)
    game.move(game.turn.player, 'New York')

    game.decks.infection.discarded.slice().map(card => {
      game.decks.infection.cards.unshift(card)
    })

    game.decks.infection.discarded = []

    game.infect(game.decks.infection.find('Paris'), 1)
    expect(game.cities.pick('Paris').infection.blue).to.equal(2)
  })
})

describe('Medic role', () => {
  it('Treats all cubes at once', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {
      name: 'Medic',
      key: 'medic',
      color: 'orange'
    }

    game.turn.currentPosition.infection.blue = 0

    expect(game.turn.availableActions.treat).to.be.an('array')
    expect(game.turn.availableActions.treat.length).to.equal(0)
    game.turn.currentPosition.infection.blue = 3

    const totalBlue = game.diseases.blue.cubes
    expect(game.turn.availableActions.treat.length).to.equal(1)
    expect(game.turn.availableActions.treat[0].label).to.equal('Remove 3 blue disease cube')
    game.turn.availableActions.treat[0].do()
    expect(game.diseases.blue.cubes).to.equal(totalBlue + 3)
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.currentPosition.infection.blue).to.equal(0)
  })

  it('Cured diseases are treated instantly when moving to a city', () => {
    const game = new Game(2)
    game.newTurn()
    game.turn.player.role = {
      name: 'Medic',
      key: 'medic',
      color: 'orange'
    }

    game.turn.player.position = 'Santiago'

    game.infect(game.decks.infection.find('Lima'), 1)
    expect(game.cities.pick('Lima').infection.yellow).to.equal(1)

    game.diseases.yellow.cured = 1

    expect(game.turn.availableActions.drive.length).to.equal(1)
    game.turn.availableActions.drive[0].do()

    expect(game.cities.pick('Kinshasa').infection.yellow).to.equal(0)
  })

  it('Prevents infection of cured disease in current city', () => {
    const game = new Game(2)
    game.newTurn()
    game.turn.player.role = {
      name: 'Medic',
      key: 'medic',
      color: 'orange'
    }

    game.move(game.turn.player, 'Kinshasa')
    game.infect(game.decks.infection.find('Kinshasa'), 1)
    expect(game.cities.pick('Kinshasa').infection.yellow).to.equal(1)

    game.diseases.yellow.cured = 1

    game.decks.infection.discarded.slice().map(card => {
      game.decks.infection.cards.unshift(card)
    })

    game.decks.infection.discarded = []

    game.infect(game.decks.infection.find('Kinshasa'), 1)
    expect(game.cities.pick('Kinshasa').infection.yellow).to.equal(1)
  })
})
