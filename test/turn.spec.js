
const chai = require('chai')
const expect = chai.expect
const Game = require('../src/Game')

describe('Turn actions', () => {
  it('Gives options on the first turn', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn).to.be.an('object')
    expect(game.turn.constructor.name).to.equal('Turn')
    expect(game.turn.actions).to.equal(4)
    expect(game.turn.availableActions).to.be.an('object')
    expect(game.turn.availableActions.drive).to.be.an('array')
    expect(game.turn.availableActions.directFlight).to.be.an('array')
    expect(game.turn.availableActions.drive.length).to.equal(3)
  })

  it('Allow player to drive to adjacent city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.drive[0].label).to.equal('Drive to Chicago')
    game.turn.availableActions.drive[0].do()
    expect(game.players[0].position).to.equal('Chicago')
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.availableActions.drive.length).to.equal(5)
  })

  it('Allow player to fly directly to a city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city' && card.name !== 'Atlanta') {
        city = card.name
        return true
      }
    })

    const length = game.decks.player.cards.length
    expect(game.turn.availableActions.directFlight).to.be.an('array')
    game.turn.availableActions.directFlight[0].do()
    expect(game.turn.player.position).to.equal(city)
    expect(game.decks.player.cards.length).to.equal(length - 1)
    expect(game.turn.player.cards.length).to.equal(3)
    expect(game.turn.actions).to.equal(3)
  })

  it('Allow player to charter a flight to any city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })
    game.turn.player.position = city

    const length = game.decks.player.cards.length
    expect(game.turn.availableActions.charterFlight).to.be.an('array')
    game.turn.availableActions.charterFlight[0].do()
    expect(game.turn.player.position).to.equal('Algiers')
    expect(game.decks.player.cards.length).to.equal(length - 1)
    expect(game.turn.player.cards.length).to.equal(3)
    expect(game.turn.actions).to.equal(3)
  })

  it('Allow player to shuttle flight between research stations', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.shuttleFlight).to.be.an('array')
    expect(game.turn.availableActions.shuttleFlight.length).to.equal(0)
    game.buildResearchStation('Khartoum')
    expect(game.turn.availableActions.shuttleFlight.length).to.be.above(0)

    game.turn.availableActions.shuttleFlight[0].do()
    expect(game.turn.player.position).to.equal('Khartoum')
    expect(game.turn.actions).to.equal(3)
  })

  it('Allow player to build a reaserch station in current city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
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
    expect(game.turn.player.cards.length).to.equal(3)
    expect(game.turn.actions).to.equal(3)
  }, 2)

  it('Don\'t allow player to build a reaserch station in current city if one already exists', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })
    game.turn.player.position = city

    game.turn.currentPosition.researchStation = 1

    expect(game.turn.availableActions.buildResearchStation.length).to.equal(0)
  })

  it('Allow player to remove 1 disease cube in current city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.currentPosition.infection.blue = 0

    expect(game.turn.availableActions.treat).to.be.an('array')
    expect(game.turn.availableActions.treat.length).to.equal(0)
    game.turn.currentPosition.infection.blue = 1

    const totalBlue = game.diseases.blue.cubes
    expect(game.turn.availableActions.treat.length).to.equal(1)
    expect(game.turn.availableActions.treat[0].label).to.equal('Remove 1 blue disease cube')
    game.turn.availableActions.treat[0].do()
    expect(game.diseases.blue.cubes).to.equal(totalBlue + 1)
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.currentPosition.infection.blue).to.equal(0)
  })

  it('Allow player to clear cured disease cubes in current city', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    game.turn.currentPosition.infection.blue = 0

    expect(game.turn.availableActions.treat).to.be.an('array')
    expect(game.turn.availableActions.treat.length).to.equal(0)
    game.turn.currentPosition.infection.blue = 3
    game.diseases.blue.cured = true

    const totalBlue = game.diseases.blue.cubes
    expect(game.turn.availableActions.treat.length).to.equal(1)
    expect(game.turn.availableActions.treat[0].label).to.equal('Remove 3 blue disease cube')
    game.turn.availableActions.treat[0].do()
    expect(game.diseases.blue.cubes).to.equal(totalBlue + 3)
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.currentPosition.infection.blue).to.equal(0)
  })

  it('Allow players to share a card when both in that city', () => {
    let game = new Game(2)
    game.start()
    game.players[0].role = {}
    game.players[1].role = {}

    let city

    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })

    game.players[0].position = city
    game.players[1].position = city

    expect(game.turn.availableActions.shareKnowledge).to.be.an('array')
    expect(game.turn.availableActions.shareKnowledge.length).to.equal(1)
    expect(game.turn.availableActions.shareKnowledge[0].label).to.equal('Give ' + city + ' card to player2')

    game.turn.end()

    expect(game.turn.availableActions.shareKnowledge).to.be.an('array')
    expect(game.turn.availableActions.shareKnowledge.length).to.equal(1)
    expect(game.turn.availableActions.shareKnowledge[0].label).to.equal('Take ' + city + ' card from player1')

    game.turn.availableActions.drive[0].do()

    expect(game.turn.availableActions.shareKnowledge.length).to.equal(0)

    game = new Game(2)
    game.start()
    game.players[0].role = {}
    game.players[1].role = {}

    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })

    game.players[0].position = city
    game.players[1].position = city

    expect(game.turn.availableActions.shareKnowledge).to.be.an('array')
    expect(game.turn.availableActions.shareKnowledge.length).to.equal(1)

    game.turn.availableActions.shareKnowledge[0].do()
    expect(game.turn.actions).to.equal(3)

    expect(game.players[0].cards.length).to.equal(3)
    expect(game.players[1].cards.length).to.equal(5)

    game.turn.availableActions.shareKnowledge[0].do()

    expect(game.players[0].cards.length).to.equal(4)
    expect(game.players[1].cards.length).to.equal(4)
  })

  it('Allow player to discover cure if they have 5 cards of the same colour', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 5) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(5)
    expect(game.turn.availableActions.discoverCure.length).to.equal(1)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 5)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.turn.player.cards.length).to.equal(0)
  })

  it('Allow player to discover cure if they have 6 cards of the same colour', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 6) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(6)
    expect(game.turn.availableActions.discoverCure.length).to.equal(6)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 5)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.turn.player.cards.length).to.equal(1)
  })

  it('Allow player to discover cure if they have 7 cards of the same colour', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 7) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(7)
    expect(game.turn.availableActions.discoverCure.length).to.equal(21)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 5)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.turn.player.cards.length).to.equal(2)
  })

  it('Player cannot discover cure if they are not at a research station', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 5) {
        game.turn.player.pickUp(card)
      }
    })

    game.turn.currentPosition.researchStation = 0
    expect(game.turn.player.cards.length).to.equal(5)
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)
  })

  it('Player cannot discover cure if it is already cured', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 5) {
        game.turn.player.pickUp(card)
      }
    })

    game.diseases.red.cured = 1

    expect(game.turn.player.cards.length).to.equal(5)
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)
  })

  it('Mark a disease as eradicated if it is cured and there are no infected cities ', () => {
    const game = new Game(2)
    game.buildResearchStation('Atlanta')
    game.players.map(player => {
      game.move(player, 'Atlanta')
    })
    game.newTurn()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 5) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(5)
    expect(game.turn.availableActions.discoverCure.length).to.equal(1)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 5)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.diseases.red.eradicated).to.equal(1)
    expect(game.turn.player.cards.length).to.equal(0)
  })

  it('Mark a disease as eradicated if it is cured when removing the last infection cube', () => {
    const game = new Game(2)
    game.buildResearchStation('Atlanta')
    game.players.map(player => {
      game.move(player, 'Atlanta')
    })
    game.newTurn()
    game.turn.player.role = {}

    // Infect Atlanta with one red cube
    game.turn.currentPosition.infect(game, 1, 'red')

    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 5) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(5)
    expect(game.turn.availableActions.discoverCure.length).to.equal(1)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 5)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.diseases.red.eradicated).to.equal(0)
    expect(game.turn.player.cards.length).to.equal(0)

    expect(game.turn.availableActions.treat.length).to.equal(1)
    expect(game.turn.availableActions.treat[0].label).to.equal('Remove 1 red disease cube')
    game.turn.availableActions.treat[0].do()

    expect(game.diseases.red.eradicated).to.equal(1)
  })

  it('Infection cubes aren\'t added to a city if the disease is eradicated', () => {
    const game = new Game(2)
    game.buildResearchStation('Atlanta')
    game.players.map(player => {
      game.move(player, 'Atlanta')
    })
    game.newTurn()
    game.turn.player.role = {}
    expect(game.turn.availableActions.discoverCure).to.be.an('array')
    expect(game.turn.availableActions.discoverCure.length).to.equal(0)

    game.turn.player.cards.length = 0
    const redCards = game.decks.player.cards.filter(card => card.city && card.city.color === 'red')

    redCards.forEach((card, index) => {
      if (index < 5) {
        game.turn.player.pickUp(card)
      }
    })

    expect(game.turn.player.cards.length).to.equal(5)
    expect(game.turn.availableActions.discoverCure.length).to.equal(1)
    expect(game.turn.availableActions.discoverCure[0].label).to.contain('Cure red with')
    const discarded = game.decks.player.discarded.length
    const unique = [...new Set(game.turn.availableActions.discoverCure)]
    expect(unique.length).to.equal(game.turn.availableActions.discoverCure.length)
    game.turn.availableActions.discoverCure[0].do()
    expect(game.decks.player.discarded.length).to.equal(discarded + 5)
    expect(game.diseases.red.cured).to.equal(1)
    expect(game.diseases.red.eradicated).to.equal(1)
    expect(game.turn.player.cards.length).to.equal(0)

    game.turn.currentPosition.infect(game, 1, 'red')

    expect(game.diseases.red.cured).to.equal(1)
    expect(game.diseases.red.eradicated).to.equal(1)
    expect(game.turn.currentPosition.infection.red).to.equal(0)
  })

  it('Throw an epidemic', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}

    let i = 0

    do {
      if (game.decks.player.cards[0].type === 'epidemic') {
        i = 1
      } else {
        game.decks.player.cards[0].discard()
      }
    } while (!i)

    game.turn.drawStage()
    expect(game.infectionLevel).to.equal(1)
    expect(game.infectionRate).to.equal(2)
    expect(game.decks.infection.cards.length).to.equal(47)
    expect(game.decks.infection.discarded.length).to.equal(1)

    game.turn.infectStage()

    expect(game.decks.infection.cards.length).to.equal(45)
    expect(game.decks.infection.discarded.length).to.equal(3)

    const infectedCity = game.cities.pick(game.decks.infection.discarded[2].city.name)
    expect(infectedCity.infection[infectedCity.color]).to.equal(3)
  })

  it('If a player has more than 7 cards, the only action is to discard', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}

    for (let i = 0; i < 4; i++) {
      const card = game.decks.player.draw()
      game.turn.player.pickUp(card)
    }

    expect(game.turn.player.cards.length).to.equal(8)
    expect(Object.keys(game.turn.availableActions).length).to.be.below(3)
    expect(game.turn.availableActions.discard.length).to.equal(8)
    expect(game.turn.availableActions.discard[0].label).to.contain('Discard')
  })

  it('Player can discard a card when they have more than 7 cards', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}

    for (let i = 0; i < 4; i++) {
      const card = game.decks.player.draw()
      game.turn.player.pickUp(card)
    }

    const playerDiscardLength = game.decks.player.discarded.length
    expect(game.turn.player.cards.length).to.equal(8)

    game.turn.availableActions.discard[0].do()

    expect(game.turn.player.cards.length).to.equal(7)
    expect(game.decks.player.discarded.length).to.equal(playerDiscardLength + 1)
  })

  it('Player can discard a card when they have more than 8 cards', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}

    for (let i = 0; i < 5; i++) {
      const card = game.decks.player.draw()
      game.turn.player.pickUp(card)
    }

    const playerDiscardLength = game.decks.player.discarded.length
    expect(game.turn.player.cards.length).to.equal(9)
    expect(game.turn.availableActions.discard.length).to.equal(9)

    game.turn.availableActions.discard[0].do()

    expect(game.turn.player.cards.length).to.equal(8)
    expect(game.turn.availableActions.discard.length).to.equal(8)
    expect(game.decks.player.discarded.length).to.equal(playerDiscardLength + 1)

    game.turn.availableActions.discard[0].do()

    expect(game.turn.player.cards.length).to.equal(7)
    expect(game.turn.availableActions.discard).to.be.an('undefined')
    expect(game.decks.player.discarded.length).to.equal(playerDiscardLength + 2)
  })

  it('Player has option for each event, at all stages of turn', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}

    const events = game.decks.player.cards.filter(card => card.type === 'event')

    game.turn.player.cards.length = 0

    game.turn.player.pickUp(events[1])
    game.turn.player.pickUp(events[0])

    expect(game.turn.availableActions.events.length).to.equal(2)
    expect(game.turn.availableActions.events[0].label).to.equal(game.turn.player.cards[0].name)
    expect(game.turn.availableActions.events[1].label).to.equal(game.turn.player.cards[1].name)
  }, 2)

  it('When player plays an event, the card is discarded', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.role = {}

    const events = game.decks.player.cards.filter(card => card.type === 'event')

    game.turn.player.cards.length = 0

    game.turn.player.pickUp(events[1])
    game.turn.player.pickUp(events[0])

    expect(game.turn.player.cards.length).to.equal(2)
    expect(game.decks.player.discarded.length).to.equal(0)

    game.turn.availableActions.events[0].do()

    expect(game.turn.player.cards.length).to.equal(1)
    expect(game.decks.player.discarded.length).to.equal(1)
  }, 2)
})
