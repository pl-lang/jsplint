'use strict'
const should = require('should')

const expressionFromString = require('../intermediate/expressionFromString')

const TypeChecker = require('../analisys/TypeChecker')

const Compiler = require('../tools/Compiler')

const RUN_TYPE_CHECKER = true
const DO_NOT_RUN_TYPE_CHECKER = false

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
let checker = new TypeChecker(null, null, globals, {})

describe('TypeChecker.getExpressionReturnType', () => {
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

    // TODO: ver por que esta expresion devuelve undefined
    // {
    //   let exp = expressionFromString('NOT verdadero').result
    //   let type = checker.getExpressionReturnType(exp)
    //   type.result.should.equal('logico')
    // }
  })
})

describe('TypeChecker', () => {

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

  it('checkCondition', () => {
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
