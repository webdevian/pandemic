
const chai = require('chai')
const expect = chai.expect
const Deck = require('../src/Deck')
const Player = require('../src/Player')

describe('Deck Class', () => {
  it('Can create a new role deck', () => {
    const roles = new Deck('role')
    expect(roles.cards).to.be.an('array')
    expect(roles.remaining).to.equal(7)
    expect(roles.cards[0].name).to.be.a('string')
    expect(roles.cards[0].color).to.be.a('string')
    expect(roles.cards[0].type).to.equal('role')
  })

  it('Can shuffle a deck', () => {
    const roles = new Deck('role')
    const original = roles.cards.slice()
    roles.shuffle()
    expect(roles.cards.length).to.equal(original.length)
    expect(roles.cards).to.not.deep.equal(original)
  })

  it('Can draw a card from a deck', () => {
    const roles = new Deck('role')
    const topCard = roles.cards[0]
    const drawnCard = roles.draw()
    expect(roles.cards.length).to.equal(6)
    expect(drawnCard).to.deep.equal(topCard)
  })

  it('Can set up an infection deck', () => {
    const infections = new Deck('infection')
    expect(infections.cards).to.be.an('array')
    expect(infections.remaining).to.equal(48)
    expect(infections.cards[0].name).to.be.a('string')
    expect(infections.cards[0].type).to.equal('city')
  })

  it('Can set up player deck', () => {
    const deck = new Deck('player')
    expect(deck.cards).to.be.an('array')
    expect(deck.remaining).to.equal(48 + 5)
  })

  it('Can deal the player deck', () => {
    const deck = new Deck('player')
    const player1 = new Player()
    const player2 = new Player()
    deck.deal([player1, player2])
    expect(player1.cards.length).to.equal(4)
    expect(player2.cards.length).to.equal(4)
    expect(deck.remaining).to.equal(49)
  })

  it('Should be 4 epidemic cards in an easy game', () => {
    const deck = new Deck('player')
    const player1 = new Player()
    const player2 = new Player()
    deck.deal([player1, player2])
    let epidemics = 0
    deck.cards.map(card => {
      if (card.type === 'epidemic') {
        epidemics++
      }
    })
    expect(epidemics).to.equal(4)
  })

  it('Should be 6 epidemic cards in a hard game', () => {
    const deck = new Deck('player')
    const player1 = new Player()
    const player2 = new Player()
    deck.deal([player1, player2], 'hard')
    let epidemics = 0
    deck.cards.map(card => {
      if (card.type === 'epidemic') {
        epidemics++
      }
    })
    expect(epidemics).to.equal(6)
  })

  it('Should find a card by name', () => {
    const deck = new Deck('infection')
    const start = deck.remaining
    const card = deck.find('Bangkok')
    expect(card.name).to.equal('Bangkok')
    expect(deck.remaining).to.equal(start)
  })

  it('Should find and draw card by name', () => {
    const deck = new Deck('infection')
    const start = deck.remaining
    const card = deck.find('Bangkok', 1)
    expect(card.name).to.equal('Bangkok')
    expect(deck.remaining).to.equal(start - 1)
  })

  it('Should be able to discard a card', () => {
    const deck = new Deck('infection')
    const card = deck.find('Bangkok')
    const start = deck.remaining
    expect(deck.discarded.length).to.equal(0)
    card.discard()
    expect(deck.discarded.length).to.equal(1)
    expect(deck.remaining).to.equal(start - 1)
  })
})
