
const chai = require('chai')
const expect = chai.expect
const Game = require('../src/Game')

describe('Turn actions', () => {
  it('Gives options on the first turn', () => {
    const game = new Game(2)
    game.start()
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
    expect(game.turn.availableActions.drive[0].label).to.equal('Drive to Chicago')
    game.turn.availableActions.drive[0].do()
    expect(game.players[0].position).to.equal('Chicago')
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.availableActions.drive.length).to.equal(5)
  })

  it('Allow player to fly directly to a city', () => {
    const game = new Game(2)
    game.start()
    let city
    let cityCardIndex
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        cityCardIndex = index
        return true
      }
    })
    // TODO Catch flaky test by injecting city card
    const length = game.decks.player.cards.length
    expect(game.turn.availableActions.directFlight).to.be.an('array')
    game.turn.availableActions.directFlight[cityCardIndex].do()
    expect(game.turn.player.position).to.equal(city)
    expect(game.decks.player.cards.length).to.equal(length - 1)
    expect(game.turn.actions).to.equal(3)
  })

  it('Allow player to charter a flight to any city', () => {
    const game = new Game(2)
    game.start()
    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })
    game.turn.player.position = city
    game.turn.getAvailableActions()
    const length = game.decks.player.cards.length
    expect(game.turn.availableActions.charterFlight).to.be.an('array')
    game.turn.availableActions.charterFlight[0].do()
    expect(game.turn.player.position).to.equal('Algiers')
    expect(game.decks.player.cards.length).to.equal(length - 1)
    expect(game.turn.actions).to.equal(3)
  })

  it('Allow player to shuttle flight between research stations', () => {
    const game = new Game(2)
    game.start()
    expect(game.turn.availableActions.shuttleFlight.length).to.equal(0)
    game.buildResearchStation('Khartoum')
    expect(game.turn.availableActions.shuttleFlight).to.be.an('array')
    game.turn.getAvailableActions()
    game.turn.availableActions.shuttleFlight[0].do()
    expect(game.turn.player.position).to.equal('Khartoum')
    expect(game.turn.actions).to.equal(3)
  })

  it('Allow player to build a reaserch station in current city', () => {
    const game = new Game(2)
    game.start()
    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })
    game.turn.player.position = city
    game.turn.getAvailableActions()
    expect(game.turn.availableActions.buildResearchStation).to.be.an('array')
    expect(game.turn.availableActions.buildResearchStation.length).to.equal(1)
    game.turn.availableActions.buildResearchStation[0].do()
    expect(game.turn.currentPosition.researchStation).to.equal(1)
    expect(game.researchStations).to.equal(4)
    expect(game.turn.actions).to.equal(3)
  })

  it('Don\'t allow player to build a reaserch station in current city if one already exists', () => {
    const game = new Game(2)
    game.start()
    let city
    game.turn.player.cards.some((card, index) => {
      if (card.type === 'city') {
        city = card.name
        return true
      }
    })
    game.turn.player.position = city
    game.turn.getAvailableActions()
    game.turn.currentPosition.researchStation = 1
    game.turn.getAvailableActions()
    expect(game.turn.availableActions.buildResearchStation.length).to.equal(0)
  })

  it('Allow player to remove 1 disease cube in current city', () => {
    const game = new Game(2)
    game.start()
    game.turn.currentPosition.infection.blue = 0
    game.turn.getAvailableActions()
    expect(game.turn.availableActions.treat).to.be.an('array')
    expect(game.turn.availableActions.treat.length).to.equal(0)
    game.turn.currentPosition.infection.blue = 1
    game.turn.getAvailableActions()
    expect(game.turn.availableActions.treat.length).to.equal(1)
    expect(game.turn.availableActions.treat[0].label).to.equal('Remove 1 blue disease cube')
    game.turn.availableActions.treat[0].do()
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.currentPosition.infection.blue).to.equal(0)
  })

  it('Allow player to clear cured disease cubes in current city', () => {
    const game = new Game(2)
    game.start()
    game.turn.currentPosition.infection.blue = 0
    game.turn.getAvailableActions()
    expect(game.turn.availableActions.treat).to.be.an('array')
    expect(game.turn.availableActions.treat.length).to.equal(0)
    game.turn.currentPosition.infection.blue = 3
    game.diseases.blue.cured = true
    game.turn.getAvailableActions()
    expect(game.turn.availableActions.treat.length).to.equal(1)
    expect(game.turn.availableActions.treat[0].label).to.equal('Remove 3 blue disease cube')
    game.turn.availableActions.treat[0].do()
    expect(game.turn.actions).to.equal(3)
    expect(game.turn.currentPosition.infection.blue).to.equal(0)
  })
})
