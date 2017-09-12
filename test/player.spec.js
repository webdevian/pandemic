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

describe('Researcher role', () => {
  it('Can give a card that doesn\' match current city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.assignRole({
      name: 'Researcher',
      key: 'researcher',
      color: 'brown'
    })
    game.players[1].role = {}

    const cityCard = game.turn.player.cards.filter(card => card.type === 'city' && card.name !== 'Atlanta')[0]

    expect(game.turn.availableActions.shareKnowledge).to.be.an('array')
    expect(game.turn.availableActions.shareKnowledge.length).to.be.above(1)
    expect(game.turn.availableActions.shareKnowledge[0].label).to.equal('Give ' + cityCard.name + ' card to player2')
    game.turn.availableActions.shareKnowledge[0].do()
    game.turn.end()
    game.turn.player.cards.length = 0

    expect(game.turn.availableActions.shareKnowledge).to.be.an('array')
    expect(game.turn.availableActions.shareKnowledge.length).to.be.above(1)
    game.turn.availableActions.shareKnowledge[0].do()
  })
})

describe('Operations Expert role', () => {
  it('Can build a research station in current city without using card', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {
      name: 'Operations Expert',
      key: 'operations',
      color: 'teal'
    }

    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })
    game.turn.player.position = city

    expect(game.turn.availableActions.buildResearchStation).to.be.an('array')
    expect(game.turn.availableActions.buildResearchStation.length).to.equal(1)
    game.turn.availableActions.buildResearchStation[0].do()
    expect(game.turn.currentPosition.researchStation).to.equal(1)
    expect(game.researchStations).to.equal(4)
    expect(game.turn.player.cards.length).to.equal(4)
    expect(game.turn.actions).to.equal(3)
  })

  it('Can build a research station in current city without holding card', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {
      name: 'Operations Expert',
      key: 'operations',
      color: 'teal'
    }

    game.turn.player.cards.length = 0

    game.turn.player.position = 'Tokyo'

    expect(game.turn.availableActions.buildResearchStation).to.be.an('array')
    expect(game.turn.availableActions.buildResearchStation.length).to.equal(1)
    game.turn.availableActions.buildResearchStation[0].do()
    expect(game.turn.currentPosition.researchStation).to.equal(1)
    expect(game.researchStations).to.equal(4)
    expect(game.turn.actions).to.equal(3)
  })

  it('Can fly to any city from a research station', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {
      name: 'Operations Expert',
      key: 'operations',
      color: 'teal'
    }

    game.turn.player.position = 'Kinshasa'

    expect(game.turn.availableActions.shuttleFlight).to.be.an('array')
    expect(game.turn.availableActions.operations).to.be.an('array')
    expect(game.turn.availableActions.operations.length).to.equal(0)
    expect(game.turn.availableActions.shuttleFlight.length).to.equal(0)

    game.buildResearchStation('Khartoum')
    game.turn.player.position = 'Khartoum'

    expect(game.turn.availableActions.shuttleFlight.length).to.equal(1)
    expect(game.turn.availableActions.shuttleFlight.length).to.be.above(0)

    game.turn.availableActions.operations[0].actions[0].do()
    expect(game.turn.player.position).to.not.equal('Khartoum')
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.player.cards.length).to.equal(3)
  })
})

describe('Dispatcher role', () => {
  it('Can move any player to a city with another pawn in', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.assignRole({
      name: 'Dispatcher',
      key: 'dispatcher',
      color: 'magenta'
    })
    game.players[1].role = {}
    game.players[0].position = 'Mexico City'
    game.players[1].position = 'Khartoum'

    expect(game.turn.availableActions.dispatcher).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.dispatch).to.be.an('array')
    expect(game.turn.availableActions.dispatcher.dispatch[0].actions).to.be.an('array')
    expect(game.turn.availableActions.dispatcher.dispatch[0].label).to.equal('Move player1')
    expect(game.turn.availableActions.dispatcher.dispatch[0].actions.length).to.equal(1)
    expect(game.turn.availableActions.dispatcher.dispatch[1].actions.length).to.equal(1)
    expect(game.turn.availableActions.dispatcher.dispatch[1].actions[0].label).to.equal('Move player2 to Mexico City')

    game.turn.availableActions.dispatcher.dispatch[1].actions[0].do()
    expect(game.players[1].position).to.equal('Mexico City')
    expect(game.turn.actions).to.equal(3)
  })

  it('Can drive any player to an adjacent city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.assignRole({
      name: 'Dispatcher',
      key: 'dispatcher',
      color: 'magenta'
    })
    game.players[1].role = {}
    game.players[1].position = 'Santiago'

    expect(game.turn.availableActions.dispatcher).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move).to.be.an('array')
    expect(game.turn.availableActions.dispatcher.move.length).to.equal(1)
    expect(game.turn.availableActions.dispatcher.move[0].actions).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move[0].label).to.equal('Move player2')

    game.turn.availableActions.dispatcher.move[0].actions.drive[0].do()
    expect(game.players[1].position).to.equal('Lima')
    expect(game.turn.player.cards.length).to.equal(4)
    expect(game.turn.actions).to.equal(3)
  })

  it('Can fly any player directly to a city with that city card', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.assignRole({
      name: 'Dispatcher',
      key: 'dispatcher',
      color: 'magenta'
    })
    game.players[1].role = {}

    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city' && card.name !== 'Atlanta') {
        city = card.name
        return true
      }
    })

    expect(game.turn.availableActions.dispatcher).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move).to.be.an('array')
    expect(game.turn.availableActions.dispatcher.move.length).to.equal(1)
    expect(game.turn.availableActions.dispatcher.move[0].actions).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move[0].label).to.equal('Move player2')
    game.turn.availableActions.dispatcher.move[0].actions.directFlight[0].do()
    expect(game.players[1].position).to.equal(city)
    expect(game.turn.player.cards.length).to.equal(3)
    expect(game.turn.actions).to.equal(3)
  })

  it('Can charter fly any player from a city to anywhere, with that city card', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.assignRole({
      name: 'Dispatcher',
      key: 'dispatcher',
      color: 'magenta'
    })
    game.players[1].role = {}

    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city' && card.name !== 'Atlanta') {
        city = card.name
        return true
      }
    })

    game.players[1].position = city

    expect(game.turn.availableActions.dispatcher).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move).to.be.an('array')
    expect(game.turn.availableActions.dispatcher.move.length).to.equal(1)
    expect(game.turn.availableActions.dispatcher.move[0].actions).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move[0].label).to.equal('Move player2')
    game.turn.availableActions.dispatcher.move[0].actions.charterFlight[0].do()
    expect(game.players[1].position).to.not.equal(city)
    expect(game.turn.player.cards.length).to.equal(3)
    expect(game.turn.actions).to.equal(3)
  })

  it('Can shuttle fly any player between research stations', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.assignRole({
      name: 'Dispatcher',
      key: 'dispatcher',
      color: 'magenta'
    })
    game.players[1].role = {}

    expect(game.turn.availableActions.dispatcher).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move).to.be.an('array')
    expect(game.turn.availableActions.dispatcher.move.length).to.equal(1)
    expect(game.turn.availableActions.dispatcher.move[0].actions).to.be.an('object')
    expect(game.turn.availableActions.dispatcher.move[0].actions.shuttleFlight.length).to.equal(0)
    game.buildResearchStation('Khartoum')
    expect(game.turn.availableActions.dispatcher.move[0].actions.shuttleFlight.length).to.equal(1)
    game.turn.availableActions.dispatcher.move[0].actions.shuttleFlight[0].do()
    expect(game.players[1].position).to.equal('Khartoum')
    expect(game.turn.player.cards.length).to.equal(4)
    expect(game.turn.actions).to.equal(3)
  })
})
