'use strict'
const should = require('should')
const Expression = require('../intermediate/structures/Expression')
const TypeChecker = require('../analisys/TypeChecker')

describe('TypeChecker', () => {
  let checker = new TypeChecker(null, null, {a:{type:'integer'}}, {})

  describe('getExpressionReturnType', () => {
    // TODO: agregrar pruebas de errores
    it('literal', () => {
      let exp = Expression.fromString('2').result
      let type = checker.getExpressionReturnType(exp)
      type.result.should.equal('integer')
    })

    it('operacion', () => {
      {
        let exp = Expression.fromString('verdadero AND falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }
    })

    it('expresion entre parentesis', () => {
      {
        let exp = Expression.fromString('(verdadero AND falso)').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }
    })

    it('expresion de invocacion', () => {
      {
        let exp = Expression.fromString('a').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }
    })

    it('2 parametros enteros en operadores matematicos', () => {
      {
        let exp = Expression.fromString('2 + 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }

      {
        let exp = Expression.fromString('2 * 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }

      {
        let exp = Expression.fromString('2 - 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }

      {
        let exp = Expression.fromString('2 ^ 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }
    })

    it('1 entero y un real en operadores matematicos', () => {
      {
        let exp = Expression.fromString('2 + 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('float')
      }

      {
        let exp = Expression.fromString('2 * 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('float')
      }

      {
        let exp = Expression.fromString('2 - 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('float')
      }

      {
        let exp = Expression.fromString('2 ^ 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('float')
      }
    })

    it('operadores de comparasion', () => {
      {
        let exp = Expression.fromString('2 = 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      {
        let exp = Expression.fromString('2 <> 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      {
        let exp = Expression.fromString('2 < 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      {
        let exp = Expression.fromString('2 > 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      {
        let exp = Expression.fromString('2 <= 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      {
        let exp = Expression.fromString('2 >= 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }
    })

    it('operadores que solo toman enteros', () => {
      {
        let exp = Expression.fromString('2 div 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }

      {
        let exp = Expression.fromString('2 mod 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('integer')
      }
    })

    it('operador de division', () => {
      {
        let exp = Expression.fromString('2.0 / 2.0').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('float')
      }
    })

    it('operadores logicos', () => {
      {
        let exp = Expression.fromString('verdadero AND falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      {
        let exp = Expression.fromString('verdadero OR falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logical')
      }

      // TODO: ver por que esta expresion devuelve undefined
      // {
      //   let exp = Expression.fromString('NOT verdadero').result
      //   let type = checker.getExpressionReturnType(exp)
      //   type.result.should.equal('logical')
      // }
    })
  })
})
