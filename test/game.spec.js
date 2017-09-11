
const chai = require('chai')
const expect = chai.expect
const Game = require('../src/Game')

describe('Game class', () => {
  it('Can create a new game with 2 players', () => {
    const game = new Game(2)
    expect(game.infectionLevel).to.equal(0)
    expect(game.outbreakCount).to.equal(0)
    expect(game.researchStations).to.equal(6)
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

    game.start()
    expect(game.researchStations).to.equal(5)
  })

  it('Can create a new game with 4 players', () => {
    const game = new Game(4)
    expect(game.players.length).to.equal(4)
    expect(game.players[0].cards.length).to.equal(2)
  })

  it('Research station is placed in Atlanta', () => {
    const game = new Game(4)
    game.start()
    expect(game.cities.pick('Atlanta').researchStation).to.equal(1)
    expect(game.map).to.be.a('string')
    expect(game.map).to.contain('&markers=icon:http%3A%2F%2Fi.imgur.com%2FB5DUeSF.png|33.748995,-84.387982')
  })

  it('Cannot build a research station if one already exists', () => {
    const game = new Game(4)
    game.start()
    expect(game.cities.pick('Atlanta').researchStation).to.equal(1)
    expect(game.buildResearchStation('Atlanta')).to.equal(false)
  })

  it('Cannot build a research station if there are none left', () => {
    const game = new Game(4)
    game.start()
    expect(game.cities.pick('Atlanta').researchStation).to.equal(1)
    game.researchStations = 0
    expect(game.buildResearchStation('Atlanta')).to.equal(false)
  })

  it('Can infect a city and the total cubes available is reduced', () => {
    const game = new Game(4)
    const start = game.diseases.red.cubes
    const blackStart = game.diseases.black.cubes
    const card = game.decks.infection.find('Bangkok')
    game.infect(card)
    expect(game.diseases.red.cubes).to.equal(start - 1)
    expect(game.cities.pick('Bangkok').infection.red).to.equal(1)
    game.infect(card, 2, 'black')
    expect(game.diseases.red.cubes).to.equal(start - 1)
    expect(game.diseases.black.cubes).to.equal(blackStart - 2)
    expect(game.cities.pick('Bangkok').infection.black).to.equal(2)
  })

  it('Creates a google map static image url displaying the state of the game', () => {
    const game = new Game(2)
    const card = game.decks.infection.find('Khartoum')
    game.infect(card, 3)
    expect(game.map).to.be.a('string')
    expect(game.map).contain('&markers=color:yellow|label:3|15.500654,32.559899&path=weight:1|15.500654,32.559899|-4.441931,15.266293&path=weight:1|15.500654,32.559899|6.524379,3.379206')
  })

  it('Infects 9 cities at the start of a game', () => {
    const game = new Game(2)
    game.start()
    expect(game.diseases.red.cubes + game.diseases.yellow.cubes + game.diseases.black.cubes + game.diseases.blue.cubes).to.equal(96 - (9 + 6 + 3))
  })

  it('Manually Move onto next player', () => {
    const game = new Game(2)
    game.start()
    expect(game.turn.player.name).to.equal('player1')
    game.newTurn()
    expect(game.turn.player.name).to.equal('player2')
    game.newTurn()
    expect(game.turn.player.name).to.equal('player1')
  })

  it('Move onto draw and infect after 4 actions', () => {
    const game = new Game(2)
    game.start()
    expect(game.turn.player.name).to.equal('player1')
    game.turn.availableActions.drive[0].do()
    game.turn.availableActions.drive[0].do()
    game.turn.availableActions.drive[0].do()

    // Put safe cards at top of deck
    game.decks.player.cards.unshift(game.players[1].cards[0])
    game.decks.player.cards.unshift(game.players[1].cards[1])
    game.turn.availableActions.drive[0].do()

    expect(game.turn.availableActions.draw).to.be.an('object')

    game.turn.availableActions.draw.do()

    expect(game.players[0].cards.length).to.equal(6)

    expect(game.turn.availableActions.infect).to.be.an('object')

    game.turn.availableActions.infect.do()

    expect(game.diseases.red.cubes + game.diseases.yellow.cubes + game.diseases.black.cubes + game.diseases.blue.cubes).to.equal(96 - (9 + 6 + 3 + 2))

    expect(game.turn.availableActions.end).to.be.an('object')

    game.turn.availableActions.end.do()

    expect(game.turn.player.name).to.equal('player2')
  })

  it('Player can manually discard a card', () => {
    const game = new Game(2)
    game.start()
    game.turn.player.cards[0].discard()
    expect(game.turn.player.cards.length).to.equal(3)
  })

  it('Game ends when there are no player cards left', () => {
    const game = new Game(2)
    game.start()
    for (let i = 0; i < 48; i++) {
      game.decks.player.draw()
    }

    try {
      game.decks.player.draw()
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.equal('Game Over')
    }
  })

  it('Game ends when a disease\'s cubes run out', () => {
    const game = new Game(2)

    game.infect(game.decks.infection.find('Kinshasa'), 3)
    game.infect(game.decks.infection.find('Johannesburg'), 3)
    game.infect(game.decks.infection.find('Mexico City'), 3)
    game.infect(game.decks.infection.find('Lagos'), 3)
    game.infect(game.decks.infection.find('Lima'), 3)
    game.infect(game.decks.infection.find('Bogota'), 3)
    game.infect(game.decks.infection.find('Los Angeles'), 3)

    try {
      game.infect(game.decks.infection.find('Buenos Aires'), 3)
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.equal('Game Over')
    }
  })
})
