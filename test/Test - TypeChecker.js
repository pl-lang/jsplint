'use strict'
const should = require('should')
const Expression = require('../intermediate/structures/Expression')
const TypeChecker = require('../analisys/TypeChecker')

describe('TypeChecker', () => {
  let checker = new TypeChecker(null, null, null, null)
  describe('getExpressionReturnType', () => {
    it('literal', () => {
      let exp = Expression.fromString('2').result
      let type = checker.getExpressionReturnType(exp)
      type.result.should.equal('integer')
    })

    it('suma de enteros', () => {
      let exp = Expression.fromString('2 + 2').result
      let type = checker.getExpressionReturnType(exp)
      type.result.should.equal('integer')
    })

    it('suma de entero y real', () => {
      let exp = Expression.fromString('2 + 2.78').result
      let type = checker.getExpressionReturnType(exp)
      type.result.should.equal('float')
    })
  })
})
