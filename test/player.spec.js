const chai = require('chai')
const expect = chai.expect
const Player = require('../src/Player')

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
