'use strict'
const should = require('should')
const Expression = require('../intermediate/structures/Expression')
const TypeChecker = require('../analisys/TypeChecker')

describe('TypeChecker', () => {
  let checker = new TypeChecker(null, null, {a:{type:'entero'}}, {})

  describe('getExpressionReturnType', () => {
    // TODO: agregrar pruebas de errores
    it('literal', () => {
      let exp = Expression.fromString('2').result
      let type = checker.getExpressionReturnType(exp)
      type.result.should.equal('entero')
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
        type.result.should.equal('entero')
      }
    })

    it('2 parametros enteros en operadores matematicos', () => {
      {
        let exp = Expression.fromString('2 + 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = Expression.fromString('2 * 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = Expression.fromString('2 - 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = Expression.fromString('2 ^ 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }
    })

    it('1 entero y un real en operadores matematicos', () => {
      {
        let exp = Expression.fromString('2 + 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }

      {
        let exp = Expression.fromString('2 * 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }

      {
        let exp = Expression.fromString('2 - 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }

      {
        let exp = Expression.fromString('2 ^ 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
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
        type.result.should.equal('entero')
      }

      {
        let exp = Expression.fromString('2 mod 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }
    })

    it('operador de division', () => {
      {
        let exp = Expression.fromString('2.0 / 2.0').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
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

  it('checkAssigmentNodes', () => {
    const Controller = require('../main.js')

    let controller = new Controller({event_logging:false})

    let code = `
    variables
      real a
      entero b
    inicio
      a <- 2.0 + verdadero
      b <- a
    fin
    `

    let compilation_report = controller.compile(code)

    compilation_report.error.should.equal(false)

    let module_root = compilation_report.result.main.statements
    let globals = compilation_report.result.main.variables, locals = globals
    let module_info = {main:{return_data_type:'none'}}

    let error_list = []

    let checker = new TypeChecker(module_root, module_info, globals, locals)

    checker.on('type-error', (ev_info, error) => {
      error_list.push(error)
    })

    checker.checkAssigmentNodes(module_root)

    error_list.length.should.equal(2)
    error_list[0].reason.should.equal('incompatible-operator-types')
    error_list[1].reason.should.equal('incompatible-types-at-assignment')
  })
})
