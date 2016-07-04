'use strict'
import should from 'should'

import expressionFromString from '../src/parser/expressionFromString.js'

import TypeChecker from '../src/typechecker/TypeChecker.js'

import Parser from '../src/parser/Parser.js'

describe('TypeChecker', () => {

  let globals = {
    a:{
      type:'entero',
      isArray:false,
      dimension:null
    },
    b:{
      type:'entero',
      isArray:true,
      dimension:[3, 4]
    }
  }

  let checker = new TypeChecker()

  // este 'hack' establece 'a mano' las variables globales y las locales del
  // modulo main. Ademas establece el nombre del modulo que se esta 'analizando'
  checker.locals_by_module.main = globals
  checker.globals = globals
  checker.current_module_name = 'main'

  describe('#getExpressionReturnType', () => {
    it('literal', () => {
      let exp = expressionFromString('2').result
      let type = checker.getExpressionReturnType(exp)
      type.result.should.equal('entero')
    })

    it('operacion', () => {
      {
        let exp = expressionFromString('verdadero AND falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }
    })

    it('expresion entre parentesis', () => {
      {
        let exp = expressionFromString('(verdadero AND falso)').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }
    })

    it('expresion de invocacion', () => {
      {
        let exp = expressionFromString('a').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }
    })

    it('2 parametros enteros en operadores matematicos', () => {
      {
        let exp = expressionFromString('2 + 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = expressionFromString('2 * 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = expressionFromString('2 - 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = expressionFromString('2 ^ 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = expressionFromString('2 + verdadero').result
        let type = checker.getExpressionReturnType(exp)
        type.error.should.equal(true)
      }
    })

    it('1 entero y un real en operadores matematicos', () => {
      {
        let exp = expressionFromString('2 + 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }

      {
        let exp = expressionFromString('2 * 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }

      {
        let exp = expressionFromString('2 - 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }

      {
        let exp = expressionFromString('2 ^ 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }
    })

    it('operadores de comparasion', () => {
      {
        let exp = expressionFromString('2 = 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('2 + 2 = 4').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('2 <> 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('2 < 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('2 > 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('2 <= 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('2 >= 2.3').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }
    })

    it('operadores que solo toman enteros', () => {
      {
        let exp = expressionFromString('2 div 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }

      {
        let exp = expressionFromString('2 mod 2').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('entero')
      }
    })

    it('operador de division', () => {
      {
        let exp = expressionFromString('2.0 / 2.0').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('real')
      }
    })

    it('operadores logicos', () => {
      {
        let exp = expressionFromString('verdadero AND falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('verdadero OR falso').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }

      {
        let exp = expressionFromString('NOT verdadero').result
        let type = checker.getExpressionReturnType(exp)
        type.result.should.equal('logico')
      }
    })
  })

  it('encontrar variables duplicadas', (done) => {
    let parser = new Parser()

    let code = `
    variables
      real var_uno
      entero var_uno
    inicio
    fin
    `

    let parsing_report = parser.parse(code)

    let program = parsing_report.result

    let checker = new TypeChecker()

    let repeated_vars_found = false

    checker.on('type-error', (ev, error_info) => {

      // NOTE: antes de cambiar esta prueba, error_info contenia las siguientes
      // props:
      // let original = {
      //   name:'var_uno',
      //   type:'real',
      //   isArray:false,
      //   dimension:null
      // }
      //
      // let repeated = {
      //   name:'var_uno',
      //   type:'entero',
      //   isArray:false,
      //   dimension:null
      // }
      //
      // Ahora contiene {name, original_type, repeated_type}

      error_info.name.should.equal('var_uno')
      error_info.original_type.should.equal('real')
      error_info.repeated_type.should.equal('entero')

      repeated_vars_found = true
    })

    checker.on('type-check-finished', () => {
      repeated_vars_found.should.equal(true)
      done()
    })

    checker.check(program)
  })

  it('verificar enunciados de asignacion', (done) => {
    let parser = new Parser()

    let code = `
    variables
      real a
      entero b
    inicio
      a <- 2.0 + verdadero
      b <- a
    fin
    `

    let parsing_report = parser.parse(code)

    parsing_report.error.should.equal(false)

    let program = parsing_report.result

    let error_list = []

    let checker = new TypeChecker()

    checker.on('type-error', (ev_info, error) => {
      error_list.push(error)
    })

    checker.on('type-check-finished', () => {
      error_list.length.should.equal(2)
      error_list[0].reason.should.equal('incompatible-operator-types')
      error_list[1].reason.should.equal('incompatible-types-at-assignment')
      done()
    })

    checker.check(program)
  })

  describe('Estructura si', () => {
    it('verificar un programa con un enunciado si..sino', (done) => {
      let parser = new Parser()

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

      let parsing_report = parser.parse(code)

      parsing_report.error.should.equal(false)

      let program = parsing_report.result

      let checker = new TypeChecker()

      let condition_error = false

      checker.on('type-error', (ev, error) => {
        if (error.reason === 'invalid-type-at-condition') condition_error = true;
      })

      checker.on('type-check-finished', () => {
        condition_error.should.equal(false)
        done()
      })

      checker.check(program)
    })
  })

  describe('Bucles mientras', () => {
    it('verificar condicion de un bucle mientras', (done) => {

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

      let parser = new Parser()

      let parsing_report = parser.parse(code)

      parsing_report.error.should.equal(false)

      let program = parsing_report.result

      let checker = new TypeChecker()

      let condition_error = false

      checker.on('type-error', (ev, error) => {
        if (error.reason === 'invalid-type-at-condition') condition_error = true;
      })

      checker.on('type-check-finished', () => {
        condition_error.should.equal(false)
        done()
      })

      checker.check(program)
    })

    it('verificar enunciados de un bucle mientras', (done) => {

      let code = `
      variables
        logico a
      inicio
        a <- verdadero
        mientras (a)
          a <- 34
          a <- falso
        finmientras
      fin
      `

      let parser = new Parser()

      let parsing_report = parser.parse(code)

      parsing_report.error.should.equal(false)

      let program = parsing_report.result

      let checker = new TypeChecker()

      let assigment_error = false

      checker.on('type-error', (ev, error) => {
        if (error.reason === 'incompatible-types-at-assignment') assigment_error = true;
      })

      checker.on('type-check-finished', () => {
        assigment_error.should.equal(true)
        done()
      })

      checker.check(program)
    })
  })

  describe('Bucles repetir', () => {
    it('verificar que no haya errores en un bucle repetir', (done) => {

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

      let parser = new Parser()

      let parsing_report = parser.parse(code)

      parsing_report.error.should.equal(false)

      let program = parsing_report.result

      let checker = new TypeChecker()

      let condition_error = false

      checker.on('type-error', (ev, error) => {
        if (error.reason === 'invalid-type-at-condition') condition_error = true;
      })

      checker.on('type-check-finished', () => {
        condition_error.should.equal(false)
        done()
      })

      checker.check(program)
    })
  })

  describe('Bucles para', () => {
    it('verificar que no haya errores en un bucle para', (done) => {
      let code = `
      variables
        entero i
      inicio
        para i <- 1 hasta 10
          escribir(i)
        finpara
      fin
      `

      let parser = new Parser()

      let parser_report = parser.parse(code)

      parser_report.error.should.equal(false)

      let program = parser_report.result

      let checker = new TypeChecker()

      let error_found = false

      checker.on('type-error', () => {error_found = true})

      checker.on('type-check-finished', () => {
        error_found.should.equal(false)
        done()
      })

      checker.check(program)
    })

    it('se detecta un error cuando el contador no es de tipo entero', (done) => {
      let code = `
      variables
        real i
      inicio
        para i <- 1 hasta 10
          escribir(i)
        finpara
      fin
      `

      let parser = new Parser()

      let parser_report = parser.parse(code)

      parser_report.error.should.equal(false)

      let program = parser_report.result

      let checker = new TypeChecker()

      let error_found = false

      checker.on('type-error', (ev_name, error_name) => {
        if (error_name === '@for-counter-must-be-entero') {
          error_found = true
        }
      })

      checker.on('type-check-finished', () => {
        error_found.should.equal(true)
        done()
      })

      checker.check(program)
    })

    it('emite un error si el primer valor no es de tipo entero', (done) => {
      let code = `
      variables
        entero i
      inicio
        para i <- 2.8 hasta 10
          escribir(i)
        finpara
      fin
      `

      let parser = new Parser()

      let parser_report = parser.parse(code)

      parser_report.error.should.equal(false)

      let program = parser_report.result

      let checker = new TypeChecker()

      let error_found = false

      checker.on('type-error', (ev_name, error_name) => {
        if (error_name === '@for-init-value-must-be-entero') {
          error_found = true
        }
      })

      checker.on('type-check-finished', () => {
        error_found.should.equal(true)
        done()
      })

      checker.check(program)
    })

    it('se detecta un error cuando el ultimo valor no es entero', (done) => {
      let code = `
      variables
        entero i
      inicio
        para i <- 1 hasta 12.4
          escribir(i)
        finpara
      fin
      `

      let parser = new Parser()

      let parser_report = parser.parse(code)

      parser_report.error.should.equal(false)

      let program = parser_report.result

      let checker = new TypeChecker()

      let error_found = false

      checker.on('type-error', (ev_name, error_name) => {
        if (error_name === '@for-last-value-must-be-entero') {
          error_found = true
        }
      })

      checker.on('type-check-finished', () => {
        error_found.should.equal(true)
        done()
      })

      checker.check(program)
    })
  })

  it('checkCondition', () => {
    let checker = new TypeChecker()

    {
      let exp = expressionFromString('2 + verdadero').result

      let condition_check = checker.checkCondition(exp)

      condition_check.error.should.equal(true)
      condition_check.result.reason.should.equal('incompatible-operator-types')
    }

    {
      let exp = expressionFromString('4.78').result

      let condition_check = checker.checkCondition(exp)

      condition_check.error.should.equal(true)
      condition_check.result.reason.should.equal('invalid-type-at-condition')
      condition_check.result.expected.should.equal('logico')
      condition_check.result.unexpected.should.equal('real')
    }
  })

  it('checkArrayInvocation', () => {
    let globals = {
      a:{
        type:'entero',
        isArray:false,
        dimension:null
      },
      b:{
        type:'entero',
        isArray:true,
        dimension:[3, 4]
      }
    }

    {
      // invalid index

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:true,
        indexes:[{expression_type:'literal', type:'entero', value:2}, {expression_type:'literal', type:'logico', value:true}]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('non-integer-index')
      report.result.bad_index.should.equal(1)
    }

    {
      // not enough indexes

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:true,
        indexes:[{expression_type:'literal', type:'entero', value:2}]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('dimension-length-diff-than-indexes-length')
      report.result.dimensions.should.equal(2)
      report.result.indexes.should.equal(1)
    }

    {
      // too many indexes

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:true,
        indexes:[
          {expression_type:'literal', type:'entero', value:1},
          {expression_type:'literal', type:'entero', value:2},
          {expression_type:'literal', type:'entero', value:3}
        ]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('dimension-length-diff-than-indexes-length')
      report.result.dimensions.should.equal(2)
      report.result.indexes.should.equal(3)
    }

    {
      // not an array

      let target = globals.a
      let invocation = {
        name:'a',
        isArray:true,
        indexes:[
          {expression_type:'literal', type:'entero', value:1},
          {expression_type:'literal', type:'entero', value:2},
          {expression_type:'literal', type:'entero', value:3}
        ]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('var-isnt-array')
      report.result.name.should.equal('a')
    }

    {
      // missing index

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:false,
        indexes:null
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('missing-index')
      report.result.name.should.equal('b')
    }

    {
      // out of bounds index/es

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:true,
        indexes:[
          {expression_type:'literal', type:'entero', value:2},
          {expression_type:'literal', type:'entero', value:7}
        ]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('index-out-of-bounds')
      report.result.bad_index.should.equal(1)
      report.result.expected.should.equal(4)
    }

    {
      // index < 1

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:true,
        indexes:[
          {expression_type:'literal', type:'entero', value:0},
          {expression_type:'literal', type:'entero', value:3}
        ]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(true)
      report.result.reason.should.equal('index-less-than-one')
      report.result.bad_index.should.equal(0)
    }

    {
      // can't check bounds at compile time

      let target = globals.b
      let invocation = {
        name:'b',
        isArray:true,
        indexes:[
          expressionFromString('2 + 3').result,
          {expression_type:'literal', type:'entero', value:3}
        ]
      }

      let report = checker.checkArrayInvocation(target, invocation)

      report.error.should.equal(false)

      invocation.bounds_checked.should.equal(false)
    }
  })
})
