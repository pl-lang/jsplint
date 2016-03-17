'use strict'
const should = require('should')
const Expression = require('../intermediate/structures/Expression')
const TypeChecker = require('../analisys/TypeChecker')
const Compiler = require('../tools/Compiler')

const RUN_TYPE_CHECKER = true
const DO_NOT_RUN_TYPE_CHECKER = false

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
        type.result.should.equal('logico')
      }
    })

    it('expresion entre parentesis', () => {
      {
        let exp = Expression.fromString('(verdadero AND falso)').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
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
        type.result.should.equal('logico')
      }

      {
        // TODO: averiguar por qué está fallando esto...

        // let exp = Expression.fromString('2 + 2 = 4').result
        // let type = checker.getExpressionReturnType(exp)
        // type.result.should.equal('logico')
      }

      {
        let exp = Expression.fromString('2 <> 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = Expression.fromString('2 < 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = Expression.fromString('2 > 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = Expression.fromString('2 <= 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = Expression.fromString('2 >= 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
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
        type.result.should.equal('logico')
      }

      {
        let exp = Expression.fromString('verdadero OR falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      // TODO: ver por que esta expresion devuelve undefined
      // {
      //   let exp = Expression.fromString('NOT verdadero').result
      //   let type = checker.getExpressionReturnType(exp)
      //   type.result.should.equal('logico')
      // }
    })
  })

  it('checkAssigmentNodes', () => {
    let compiler = new Compiler()

    let code = `
    variables
      real a
      entero b
    inicio
      a <- 2.0 + verdadero
      b <- a
    fin
    `

    let compilation_report = compiler.compile(code, DO_NOT_RUN_TYPE_CHECKER)

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

  it('lookForErrors', () => {
    let compiler = new Compiler()

    let condition_error = false

    compiler.on('type-error', (ev, reason) => {
      console.log(reason)
      if (reason === 'incorrect-type-at-condition') condition_error = true;
    })

    let code = `
    variables
    inicio
      si (2 + 2 = 4) entonces
        escribir("hola")
      sino
        escribir("error")
      finsi
      escribir("chau")
    fin
    `

    let compilation_report = compiler.compile(code, RUN_TYPE_CHECKER)

    compilation_report.error.should.equal(false)

    condition_error.should.equal(false)
  })

  it('verificar que se revise bien un program con bucle mientras', () => {
    let compiler = new Compiler()

    let condition_error = false

    compiler.on('type-error', (ev, reason) => {
      console.log(reason)
      if (reason === 'incorrect-type-at-condition') condition_error = true;
    })

    let code = `
    variables
      logico a
    inicio
      a <- verdadero
      mientras (a)
        escribir("dentro del bucle")
        a <- falso
      finmientras
      escribir("fuera del bucle")
    fin
    `

    let compilation_report = compiler.compile(code, RUN_TYPE_CHECKER)

    compilation_report.error.should.equal(false)

    condition_error.should.equal(false)
  })

  it('verificar que no haya errores en un bucle repetir', () => {
    let compiler = new Compiler()

    let condition_error = false

    compiler.on('type-error', (ev, reason) => {
      console.log(reason)
      if (reason === 'incorrect-type-at-condition') condition_error = true;
    })

    let code = `
    variables
      logico a
    inicio
      a <- verdadero
      repetir
        escribir("dentro del bucle")
        a <- falso
      hasta que (a = falso)
      escribir("fuera del bucle")
    fin
    `

    let compilation_report = compiler.compile(code, RUN_TYPE_CHECKER)

    compilation_report.error.should.equal(false)

    condition_error.should.equal(false)
  })
})
