
const chai = require('chai')
const expect = chai.expect
const City = require('../src/City')
const Game = require('../src/Game')

describe('City class', () => {
  it('Can create a new city', () => {
    const london = new City({name: 'London'})
    expect(london.name).to.equal('London')
  })

  it('Can load cites from file', () => {
    const cities = City.load()
    expect(cities).to.be.an('array')
    expect(cities.length).to.equal(48)
  })

  it('Can pick city by name', () => {
    const cities = City.load()
    const london = cities.pick('London')
    expect(london.name).to.equal('London')
  })

  it('Can filter city by color', () => {
    const cities = City.load()
    const reds = cities.color('red')
    expect(reds).to.be.an('array')
    expect(reds.length).to.equal(12)
    const blues = cities.color('blue')
    expect(blues).to.be.an('array')
    expect(blues.length).to.equal(12)
    const yellows = cities.color('yellow')
    expect(yellows).to.be.an('array')
    expect(yellows.length).to.equal(12)
    const blacks = cities.color('black')
    expect(blacks).to.be.an('array')
    expect(blacks.length).to.equal(12)
  })

  it('City starts with 0 infection and can get infected', () => {
    const london = new City({name: 'London', color: 'blue'})
    expect(london.infection).to.be.an('object')
    expect(london.infection.blue).to.equal(0)
    london.infect(new Game())
    expect(london.infection.blue).to.equal(1)
  })

  it('City can be infected multiple times', () => {
    const london = new City({name: 'London', color: 'blue'})
    london.infect(new Game(), 3)
    expect(london.infection.blue).to.equal(3)
  })

  it('City can be infected with a different disease', () => {
    const london = new City({name: 'London', color: 'blue'})
    london.infect(new Game(), 1, 'red')
    expect(london.infection.blue).to.equal(0)
    expect(london.infection.red).to.equal(1)
  })

  it('A loaded city is linked to adjacent city classes', () => {
    const cities = City.load()
    const london = cities.pick('London')
    expect(london.adjacent).to.be.an('object')
    expect(london.adjacent.Paris).to.be.an.instanceof(City)

    cities.map(city => {
      Object.keys(city.adjacent).map(adjacentCity => {
        expect(city.adjacent[adjacentCity].adjacent[city.name]).to.be.an.instanceof(City)
      })
    })
  })
})
