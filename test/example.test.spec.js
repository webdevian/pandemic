
const chai = require('chai')
const expect = chai.expect
const Example = require('../src/example')

describe('Some example tests', () => {
  it('Some test', () => {
    expect(0).to.equal(0)
  })

  it('Another test', () => {
    const example = new Example()

    expect(example).to.be.an('object')
    expect(example.exampleMethod).to.be.a('function')
    expect(example.exampleMethod()).to.be.an('object')
  })

  it('Failing test', () => {
    expect(0).to.equal(1)
  })
})
