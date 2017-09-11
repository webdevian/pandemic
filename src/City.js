'use strict'

const cities = require('../lib/cities')

/**
 * Cities within the game
 * @class
 */
class City {
  /**
   * Create new city
   * @param  {Object} data Data to assign to the city
   */
  constructor (data) {
    Object.keys(data).map(key => {
      this[key] = data[key]
    })

    this.infection = {
      red: 0,
      blue: 0,
      yellow: 0,
      black: 0
    }

    this.researchStation = false
  }

  /**
   * Infect a city
   * @param  {Game}
   * @param  {Number} [amount=1]        How many infection cubes to add
   * @param  {String} disease           Which disease? Defaults to city's color
   * @param  {Array.String} [outbreakSources]  City outbreak started in
   * @return {Object}                   Amount and disease, so game can deduct cubes from total
   */
  infect (game, amount = 1, disease, outbreakSources) {
    const quarantineSpecialist = game.players.filter(player => player.is('quarantine'))[0]

    if (quarantineSpecialist) {
      if (this.name === quarantineSpecialist.position || (this.adjacent && this.adjacent[quarantineSpecialist.position])) {
        return false
      }
    }

    if (!disease) {
      disease = this.color
    }

    if (game.diseases[disease].eradicated) {
      return false
    }

    if (this.infection[disease] + amount > 3) {
      this.infection[disease] = 3
      return this.outbreak(game, disease, outbreakSources)
    }

    // Do outbreak here
    this.infection[disease] += amount
    game.diseases[disease].cubes -= amount

    if (game.diseases[disease].cubes < 1) {
      throw new Error('Game Over')
    }
  }

  /**
   * Outbreak a disease to neighbouring cities
   * @param  {Game}
   * @param  {String} disease                   Which disease? Defaults to city's color
   * @param  {Array.String} [outbreakSources=[]] City outbreak started in
   */
  outbreak (game, disease, outbreakSources = []) {
    if (outbreakSources.indexOf(this.name) > -1) {
      return false
    }

    game.outbreakCount++
    if (game.outbreakCount > 7) {
      throw Error('Game Over')
    }

    Object.keys(this.adjacent).map(city => {
      outbreakSources.push(this.name)
      this.adjacent[city].infect(game, 1, disease, outbreakSources)
    })
  }

  /**
   * Total number of infection cubes (all colours)
   * @member
   * @return {Number}
   */
  get infectionTotal () {
    let total = 0

    Object.keys(this.infection).map(color => {
      total += this.infection[color]
    })

    return total
  }

  /**
   * Load cities from file
   * @return {Array.City} Array of city objects
   */
  static load () {
    const all = []
    cities.map(city => {
      all.push(new City(city))
    })

    all.constructor.prototype.pick = function (name) {
      return this.filter(city => city.name === name)[0]
    }

    all.constructor.prototype.color = function (color) {
      return this.filter(city => city.color === color)
    }

    all.map(city => {
      const linkedCities = {}
      city.adjacent.map(adjacentCityName => {
        /* istanbul ignore next */
        if (!all.pick(adjacentCityName)) {
          throw new Error('Adjacent city ' + adjacentCityName + ' doesn\'t exist')
        }
        linkedCities[adjacentCityName] = all.pick(adjacentCityName)
      })
      city.adjacent = linkedCities
    })

    return all
  }
}

module.exports = City
