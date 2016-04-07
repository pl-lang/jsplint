'use strict'
import should from 'should'
import fs from 'fs'

import SourceWrapper from '../src/parser/SourceWrapper.js'
import Lexer from '../src/parser/Lexer.js'

import TokenQueue from '../src/parser/TokenQueue.js'
import * as Patterns from '../src/parser/Patterns.js'

const match = Patterns.match

function queueFromSource(string) {
  let source = new SourceWrapper(string)
  let tokenizer = new Lexer(source)

  let tokenArray = []
  let t = tokenizer.nextToken()

  while ( t.kind !== 'eof') {
    tokenArray.push(t)
    t = tokenizer.nextToken()
  }
  tokenArray.push(t)

  let q = new TokenQueue(tokenArray)

  return q
}

describe('IntegerPattern', () => {
  it('captura token entero', () => {
    let q = queueFromSource('36 a')

    let number = match(Patterns.Integer).from(q)

    number.error.should.equal(false)
    number.result.should.equal(36)
    q.current().kind.should.equal('word')
  })

  it('devuelve un error cuando el primer token en la cola no coincide', () => {
    let q = queueFromSource('papa 389'
  )
    let number = match(Patterns.Integer).from(q)

    number.error.should.equal(true)

    let info = number.result
    info.expected.should.equal('entero')
    info.unexpected.should.equal('word')
    info.atLine.should.equal(0)
    info.atColumn.should.equal(0)
    q.current().kind.should.equal('word')
  })
})

describe('ArrayDimension', () => {

  it('captura el indice de un vector', () => {
    let q = queueFromSource('3')

    let capture = match(Patterns.ArrayDimension).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3])
    q.current().kind.should.equal('eof')
  })

  it('captura los indices de una matriz', () => {
    let q = queueFromSource('3, 7')

    let capture = match(Patterns.ArrayDimension).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3, 7])
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    let q = queueFromSource('3, 7, 2.78')
    let capture = match(Patterns.ArrayDimension).from(q)

    capture.error.should.equal(true)
    capture.result.unexpected.should.equal('real')
    capture.result.atLine.should.equal(0)
    capture.result.atColumn.should.equal(6)
    q.current().kind.should.equal('real')
  })
})

describe('WordPattern', () => {

  it('captura una palabra', () => {
    let q = queueFromSource('rodrigo')

    let capture = match(Patterns.Word).from(q)

    capture.error.should.equal(false)
    capture.result.should.equal('rodrigo')
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error cuando el patron no coincide', () => {
    let q = queueFromSource('32')

    let capture = match(Patterns.Word).from(q)

    capture.error.should.equal(true)
    capture.result.should.deepEqual({
      expected : 'word',
      unexpected : 'entero',
      atColumn : 0,
      atLine : 0
    })
    q.current().kind.should.equal('entero')
  })
})

describe('VariableDeclaration', () => {

  it('captura el nombre de una variable', () => {
    let q = queueFromSource('sueldo')

    let capture = match(Patterns.VariableDeclaration).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name    : 'sueldo',
      data    : {isArray : false, type:'unknown'}
    })
  })

  it('captura el nombre de una matriz y sus dimensiones', () => {
    let q = queueFromSource('vuelos[3, 12]')

    let capture = match(Patterns.VariableDeclaration).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name        : 'vuelos',
      data        : {isArray: true, dimension: [3, 12], type: 'unknown'}
    })
  })
})

describe('VariableList', () => {

  it('lee las variables de una lista', () => {
    let q = queueFromSource('a, b, matriz[3, 3], v[8]')

    let capture = match(Patterns.VariableList).from(q)

    capture.error.should.equal(false)
    capture.result[0].should.deepEqual({name:'a', data : {isArray:false, type:'unknown'}})
    capture.result[1].should.deepEqual({name:'b', data : {isArray:false, type:'unknown'}})
    capture.result[2].should.deepEqual({name:'matriz', data: {isArray:true, dimension:[3, 3], type:'unknown'}})
    capture.result[3].should.deepEqual({name:'v', data: {isArray:true, dimension:[8], type:'unknown'}})
    q.current().kind.should.equal('eof')
  })
})

describe('TypeName', () => {

  it('extrae un token de tipo', () => {
    let q = queueFromSource('entero, real')

    let capture = match(Patterns.TypeName).from(q)

    capture.error.should.equal(false)
    capture.result.should.equal('entero')
    q.current().kind.should.equal('comma')
  })

  it('extrae un token de tipo', () => {
    let q = queueFromSource('gatp, real')

    let capture = match(Patterns.TypeName).from(q)

    capture.error.should.equal(true)
    capture.result.should.deepEqual({
        unexpected : 'word'
      , expected  : ['entero', 'real', 'logico', 'caracter']
      , atColumn        : 0
      , atLine          : 0
      , reason          : 'nonexistent-type'
    })
    q.current().kind.should.equal('word')
    q.current().text.should.equal('gatp')
  })
})

describe('Declaration', () => {
  it('captura dos variables de tipo entero y una real declaradas en un renglon', () => {
    let q = queueFromSource('entero a, b, real c')

    let capt = match(Patterns.Declaration).from(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'entero', isArray:false, value:null},
      b : {type:'entero', isArray:false, value:null},
      c : {type:'real', isArray:false, value:null}
    })
  })

  it('captura variables de distintos tipos declaradas dos renglones distintos', () => {
    let q = queueFromSource('caracter a, b\nlogico c')

    let capt = match(Patterns.Declaration).from(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'caracter', isArray:false, value:null},
      b : {type:'caracter', isArray:false, value:null},
      c : {type:'logico', isArray:false, value:null}
    })
  })

  it('captura variables de un solo tipo', () => {
    let q = queueFromSource('caracter a, b[4, 4]')

    let capt = match(Patterns.Declaration).from(q)

    capt.error.should.deepEqual(false)
    capt.result.a.should.deepEqual({type:'caracter', isArray:false, value:null})

    capt.result.b.type.should.equal('caracter')
    capt.result.b.isArray.should.equal(true)
    capt.result.b.dimension.should.deepEqual([4, 4])
  })
})

describe.skip('MainModulePattern', () => {
  it('funciona correctamente en un programa con "inicio" y variables declaradas')

  it('funciona correctamente para un programa sin variables declaradas')

  it('programa sin encabezado ("variables") para el modulo principal')

  it('programa sin "inicio" pero con varibles declaradas')

  it('programa sin "inicio" sin varibles declaradas')

  it('programa sin "fin"')
})

describe('Assignment pattern', () => {
  it('captura un enunciado de asignacion', () => {
    let asignacion = 'var <- 48'

    let q = queueFromSource(asignacion)
    let assignment_match = match(Patterns.Assignment).from(q)

    assignment_match.error.should.equal(false)
    assignment_match.result.payload.should.deepEqual(
      {
        expression_type:'literal',
        value:48,
        type:'entero',
      }
    )
    assignment_match.result.target.name.should.equal('var')
  })
})

describe('Argument list pattern', () => {
  it('captura dos expresiones', () => {
    let test_string = '2, verdadero'

    let q = queueFromSource(test_string)

    let argument_match = match(Patterns.ArgumentList).from(q)

    argument_match.error.should.equal(false)
    argument_match.result.should.deepEqual([
      {expression_type:'literal', type:'entero', value:2},
      {expression_type:'literal', type:'logico', value:true}
    ])
  })
})

describe('ModuleCall pattern', () => {
  it('captura la llamada a un modulo', () => {
    let asignacion = 'escribir(42)'

    let q = queueFromSource(asignacion)
    let capt = match(Patterns.ModuleCall).from(q)

    capt.error.should.equal(false)
    capt.result.name.should.equal('escribir')
    capt.result.args.should.deepEqual([
      {expression_type:'literal', type:'entero', value:42},
    ])
  })
})

describe('New Expression', () => {
  it ('captura la invocacion de una variable', () => {
    {
      let nombre = 'contador'
      let q = queueFromSource(nombre)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'invocation',
        name:'contador',
        isArray:false,
        indexes:null
      })
    }

    {
      let nombre = 'contador + 1'
      let q = queueFromSource(nombre)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'operation',
        op:'plus',
        operands:[
          {
            expression_type:'invocation',
            name:'contador',
            isArray:false,
            indexes:null
          },
          {expression_type:'literal', type:'entero', value:1}
        ]
      })
    }

    {
      let nombre = 'vector[2] + 1'
      let q = queueFromSource(nombre)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'operation',
        op:'plus',
        operands:[
          {
            expression_type:'invocation',
            name:'vector',
            isArray:true,
            indexes:[{expression_type:'literal', type:'entero', value:2}]
          },
          {expression_type:'literal', type:'entero', value:1}
        ]
      })
    }

  })

  it('captura factores logicos', () => {
    {
      let logico = 'verdadero'
      let q = queueFromSource(logico)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'logico',
        value:true
      })
    }

    {
      let logico = 'falso'
      let q = queueFromSource(logico)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'logico',
        value:false
      })
    }
  })

  it('captura factores numeros', () => {
    {
      let dato = '32'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'entero',
        value:32
      })
    }

    {
      let dato = '2.78'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'real',
        value:2.78
      })
    }
  })

  it('captura cadenas', () => {
    {
      let dato = '"hola mundo"'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'string',
        value:'hola mundo',
        length:"hola mundo".length
      })
    }
  })

  it('captura una expresion OR', () => {
    {
      let dato = 'verdadero OR falso'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('or')
    }
  })

  it('captura una expresion AND', () => {
    {
      let dato = 'verdadero AND falso'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('and')
    }
  })

  it('captura una expresion IGUAL', () => {
    {
      let dato = 'verdadero = falso'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('equal')
    }
  })

  it('captura una expresion DESIGUAL', () => {
    {
      let dato = 'verdadero <> falso'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('diff-than')
    }
  })

  it('captura expresiones RELACIONALES', () => {
    {
      let dato = '3 > 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('major-than')
    }

    {
      let dato = '3 >= 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('major-equal')
    }

    {
      let dato = '2 < 7'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('minor-than')
    }

    {
      let dato = '2 <= 4'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('minor-equal')
    }
  })

  it('captura expresiones de ADICION (suma y resta)', () => {
    {
      let dato = '3 - 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('minus')
    }

    {
      let dato = '3 + 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('plus')
    }
  })

  it('captura expresiones MULTIPLICATIVAS (*, /, div y mod)', () => {
    {
      let dato = '3 mod 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('mod')
    }

    {
      let dato = '3 / 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('divide')
    }

    {
      let dato = '3 div 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('div')
    }

    {
      let dato = '3 * 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('times')
    }

    {
      let dato = '3 ^ 2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('power')
    }
  })

  it('captura expresiones UNARIAS (-, +, not)', () => {
    {
      let dato = 'not verdadero'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('unary-operation')
      capt.result.op.should.equal('not')
    }

    {
      let dato = '-2'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('unary-operation')
      capt.result.op.should.equal('unary-minus')
    }

    {
      let dato = '+3'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('literal')
    }
  })

  it('captura expresiones entre parentesis', () => {
    {
      let dato = '(not verdadero)'
      let q = queueFromSource(dato)
      let capt = match(Patterns.Expression).from(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('expression')
      capt.result.expression.should.deepEqual({expression_type:'unary-operation', op:'not', operand:{expression_type:'literal', type:'logico', value:true}})
    }
  })
})


describe('VariablePattern', () => {

  it('captura la variable en una asignacion', () => {
    let dato = 'mi_variable <- 2'
    let q = queueFromSource(dato)
    let report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_variable',
      isArray:false,
      indexes:null,
      bounds_checked:false
    })
  })

  it('captura la variable (un arreglo) en una asignacion', () => {
    let dato = 'mi_vector[2] <- 2'
    let q = queueFromSource(dato)
    let report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_vector',
      isArray:true,
      indexes:[{
        expression_type:'literal',
        type:'entero',
        value:2
      }],
      bounds_checked:false
    })
  })

  it('captura la variable (una matriz) en una asignacion', () => {
    let dato = 'mi_matriz[i, j] <- 2'
    let q = queueFromSource(dato)
    let report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_matriz',
      isArray:true,
      indexes:[
        {expression_type:'invocation', name:'i', isArray:false, indexes:null},
        {expression_type:'invocation', name:'j', isArray:false, indexes:null}
      ],
      bounds_checked:false
    })
  })

})

describe('NewAssignment', () => {
  it('captura una asignacion bien escrita', () => {
    let code = 'var <- 32'
    let q = queueFromSource(code)
    let report = match(Patterns.NewAssignment).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'assignment',
      left:{
        name:'var',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      right:{
        expression_type:'literal',
        type:'entero',
        value:32
      }
    })
  })

  it('captura una asignacion bien escrita', () => {
    let code = 'var = 32'
    let q = queueFromSource(code)
    let report = match(Patterns.NewAssignment).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected:'equal',
      expected:'<-',
      line:0,
      column:4,
      reason:'bad-assignment-operator'
    })
  })
})

describe('If', () => {
  it('captura una estructura si bien escrita', () => {
    let code = `si (verdadero) entonces
    var <- 32
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'if',
      condition:{expression_type:'literal', type:'logico', value:true},
      true_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null, bounds_checked:false},
        right:{expression_type:'literal', type:'entero', value:32}
      }],
      false_branch:[]
    })
  })

  it('captura una estructura si...sino bien escrita', () => {
    let code = `si (verdadero) entonces
    var <- 32
    sino
    var <- 16
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'if',
      condition:{expression_type:'literal', type:'logico', value:true},
      true_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null, bounds_checked:false},
        right:{expression_type:'literal', type:'entero', value:32}
      }],
      false_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null, bounds_checked:false},
        right:{expression_type:'literal', type:'entero', value:16}
      }]
    })
  })

  it('captura una estructura si...sino sin enunciados', () => {
    let code = `si (verdadero) entonces
    sino
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'if',
      condition:{expression_type:'literal', type:'logico', value:true},
      true_branch:[],
      false_branch:[]
    })
  })

  it('falta el parentesis izquierdo', () => {
    let code = `si verdadero) entonces
    var <- 32
    sino
    var <- 16
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected:'verdadero',
      expected:'(',
      line:0,
      column:3,
      reason:'missing-par-at-condition'
    })
  })

  it.skip('falta el parentesis derecho', () => {
    let code = `si (verdadero entonces
    var <- 32
    sino
    var <- 16
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected:'entonces',
      expected:')',
      line:0,
      column:12,
      reason:'missing-par-at-condition'
    })
  })

  it('falta entonces', () => {
    let code = `si (verdadero)
    var <- 32
    sino
    var <- 16
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected:'eol',
      expected:'entonces',
      line:0,
      column:14,
      reason:'missing-entonces'
    })
  })

  it('falta finsi', () => {
    let code = `si (verdadero) entonces
    var <- 32
    sino
    var<-16
    `
    let q = queueFromSource(code)
    let report = match(Patterns.If).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected:'eof',
      expected:'finsi',
      line:4,
      column:4,
      reason:'missing-finsi'
    })
  })
})

describe('While', () => {
  it('captura un bucle mientras bien escrito', () => {
    let code = `mientras (verdadero)
    var <- 32
    finmientras
    `
    let q = queueFromSource(code)
    let report = match(Patterns.While).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'while',
      condition:{expression_type:'literal', type:'logico', value:true},
      body:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null, bounds_checked:false},
        right:{expression_type:'literal', type:'entero', value:32}
      }]
    })
  })

  it('captura un bucle mientras vacio', () => {
    let code = `mientras (verdadero)
    finmientras
    `
    let q = queueFromSource(code)
    let report = match(Patterns.While).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'while',
      condition:{expression_type:'literal', type:'logico', value:true},
      body:[]
    })
  })

  it('falta el parentesis izquierdo en la condicion', () => {
    let code = `mientras verdadero)
    finmientras
    `
    let q = queueFromSource(code)
    let report = match(Patterns.While).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'verdadero',
      expected : '(',
      line : 0,
      column : 9,
      reason : 'missing-par-at-condition'
    })
  })

  it('falta el parentesis izquierdo en la condicion', () => {
    let code = `mientras (verdadero)`
    let q = queueFromSource(code)
    let report = match(Patterns.While).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'eof',
      expected : 'finmientras',
      line : 0,
      column : 20,
      reason : 'missing-finmientras'
    })
  })
})
