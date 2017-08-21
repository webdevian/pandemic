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
   * @param  {Number} [amount=1] How many infection cubes to add
   * @param  {String} disease    Which disease? Defaults to city's color
   * @return {Object}            Amount and disease, so game can deduct cubes from total
   */
  infect (amount = 1, disease) {
    if (!disease) {
      disease = this.color
    }
    this.infection[disease] += amount

    return {
      disease,
      amount
    }
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
