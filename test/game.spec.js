
const chai = require('chai')
const expect = chai.expect
const Game = require('../src/Game')

describe('Game class', () => {
  it('Can create a new game with 2 players', () => {
    const game = new Game(2)
    expect(game.infectionLevel).to.equal(0)
    expect(game.outbreakCount).to.equal(0)
    expect(game.researchStations).to.equal(5)
    expect(game.diseases.red.cured).to.equal(0)
    expect(game.diseases.yellow.eradicated).to.equal(0)
    expect(game.players.length).to.equal(2)
    expect(game.players[0].role.name).to.be.a('string')
    expect(game.decks).to.be.an('object')
    expect(game.decks.player.cards).to.be.an('array')
    expect(game.players[0].cards.length).to.equal(4)
    expect(game.decks.infection.cards).to.be.an('array')
    expect(game.decks.infection.cards[0].type).to.equal('city')
    expect(game.cities).to.be.an('array')
  })

  it('Can create a new game with 4 players', () => {
    const game = new Game(4)
    expect(game.players.length).to.equal(4)
    expect(game.players[0].cards.length).to.equal(2)
  })

  it('Research station is placed in Atlanta', () => {
    const game = new Game(4)
    expect(game.cities.pick('Atlanta').researchStation).to.equal(1)
  })

  it('Creates a google map static image url displaying the state of the game', () => {
    const game = new Game(2)
    game.cities.pick('Khartoum').infect(3)
    expect(game.map).to.be.a('string')
    expect(game.map).contain('&markers=color:yellow|label:3|15.500654,32.559899&path=weight:1|15.500654,32.559899|-4.441931,15.266293&path=weight:1|15.500654,32.559899|6.524379,3.379206')
  })
})
