
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

describe('Funciones que agrupan patrones', () => {
  describe('until', () => {
    it('recolecta palabras hasta encontrar fin', () => {
      let code = 'uno dos una_variable otra_variable fin'

      let q = queueFromSource(code)

      let pattern = Patterns.until(Patterns.Word, tk => tk == 'fin')

      let report = match(pattern).from(q)

      report.error.should.equal(false)
      report.result.should.deepEqual(['uno', 'dos', 'una_variable', 'otra_variable'])
    })
  })

  describe('concat', () => {
    it('crea un patron que busca una palabra seguida de un numero', () => {
      let code = 'un_nombre 25'

      let q = queueFromSource(code)

      let pattern = Patterns.concat([Patterns.Word, Patterns.Integer])

      let report = match(pattern).from(q)

      report.error.should.equal(false)
      report.result.should.deepEqual(['un_nombre', 25])
    })
  })
})

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
    info.line.should.equal(0)
    info.column.should.equal(0)
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
    capture.result.line.should.equal(0)
    capture.result.column.should.equal(6)
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
      column : 0,
      line : 0
    })
    q.current().kind.should.equal('entero')
  })
})

describe('Kind', () => {
  it('captura distintos tipos de token', () => {
    {
      let q = queueFromSource('rmb')

      let captura = match(Patterns.Kind("word")).from(q)

      captura.error.should.equal(false)
    }

    {
      let q = queueFromSource('123')

      let captura = match(Patterns.Kind("entero")).from(q)

      captura.error.should.equal(false)
    }
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    let q = queueFromSource('rmb')

    let captura = match(Patterns.Kind("entero")).from(q)

    captura.error.should.equal(true)
    captura.result.should.deepEqual({
      reason:'unexpected-token',
      unexpected:'word',
      expected:'entero'
    })
  })
})

describe('VariableDeclaration', () => {

  it('captura el nombre de una variable', () => {
    let q = queueFromSource('sueldo')

    let capture = match(Patterns.VariableDeclaration).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name    : 'sueldo',
      isArray : false,
      dimension: null
    })
  })

  it('captura el nombre de una matriz y sus dimensiones', () => {
    let q = queueFromSource('vuelos[3, 12]')

    let capture = match(Patterns.VariableDeclaration).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name        : 'vuelos',
      isArray     : true,
      dimension   : [3, 12]
    })
  })
})

describe('VariableList', () => {

  it('lee las variables de una lista', () => {
    let q = queueFromSource('a, b, matriz[3, 3], v[8]')

    let capture = match(Patterns.VariableList).from(q)

    capture.error.should.equal(false)
    capture.result[0].should.deepEqual({name:'a', isArray:false, dimension:null})
    capture.result[1].should.deepEqual({name:'b', isArray:false, dimension:null})
    capture.result[2].should.deepEqual({name:'matriz', isArray:true, dimension:[3, 3]})
    capture.result[3].should.deepEqual({name:'v', isArray:true, dimension:[8]})
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
      , column        : 0
      , line          : 0
      , reason          : 'nonexistent-type'
    })
    q.current().kind.should.equal('word')
    q.current().text.should.equal('gatp')
  })
})

describe('Assignment pattern', () => {
  it('captura un enunciado de asignacion', () => {
    let asignacion = 'var <- 48'

    let q = queueFromSource(asignacion)
    let assignment_match = match(Patterns.Assignment).from(q)

    assignment_match.error.should.equal(false)
    assignment_match.result.payload.should.deepEqual([
      {type:'literal', value:48}
    ])
    assignment_match.result.target.name.should.equal('var')
  })
})

describe('ArgumentList', () => {
  it('captura dos expresiones', () => {
    let test_string = '2, verdadero'

    let q = queueFromSource(test_string)

    let argument_match = match(Patterns.ArgumentList).from(q)

    argument_match.error.should.equal(false)
    argument_match.result.should.deepEqual([
      [{type:'literal', value:2}],
      [{type:'literal', value:true}]
    ])
  })
})

describe('ParameterList', () => {
  it('captura varios parametros', () => {
    let list = 'entero a, entero ref b'

    let q = queueFromSource(list)

    let report =  match(Patterns.ParameterList).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual([
      {name:'a', type:'entero', by_ref:false},
      {name:'b', type:'entero', by_ref:true}
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
      [{type:'literal', value:42}],
    ])
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
      indexes:[
        [{type:'literal', value:2}]
      ]
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
        [{type:'invocation', name:'i', isArray:false, indexes:null}],
        [{type:'invocation', name:'j', isArray:false, indexes:null}]
      ]
    })
  })

  it('captura la variable (un arreglo3) en una asignacion', () => {
    let dato = 'mi_matriz[i, j, k] <- 2'
    let q = queueFromSource(dato)
    let report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_matriz',
      isArray:true,
      indexes:[
        [{type:'invocation', name:'i', isArray:false, indexes:null}],
        [{type:'invocation', name:'j', isArray:false, indexes:null}],
        [{type:'invocation', name:'k', isArray:false, indexes:null}]
      ]
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
      condition: [{type:'literal', value:true}],
      true_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null},
        right:[{type:'literal', value:32}]
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
      condition: [{type:'literal', value:true}],
      true_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null},
        right:[{type:'literal', value:32}]
      }],
      false_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null},
        right:[{type:'literal', value:16}]
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
      condition:[{type:'literal', value:true}],
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
      condition:[{type:'literal', value:true}],
      body:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null},
        right:[{type:'literal', value:32}]
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
      condition:[{type:'literal', value:true}],
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


describe('Until', () => {
  it('captura un bucle repetir bien escrito', () => {
    let code = `repetir
    var <- 32
    hasta que (verdadero)
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Until).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'until',
      condition:[{type:'literal', value:true}],
      body:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:null},
        right:[{type:'literal', value:32}]
      }]
    })
  })

  it('captura un bucle repetir vacio', () => {
    let code = `repetir





    hasta que (verdadero)
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Until).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'until',
      condition:[{type:'literal', value:true}],
      body:[]
    })
  })

  it('falta hasta al final del bucle', () => {
    let code = `repetir
    var <- 32
    que (verdadero)
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Until).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'que',
      expected : 'hasta',
      line : 2,
      column : 4,
      reason : 'missing-hasta'
    })
  })

  it('falta que al final del bucle', () => {
    let code = `repetir
    var <- 32
    hasta (verdadero)
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Until).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'left-par',
      expected : 'que',
      line : 2,
      column : 10,
      reason : 'missing-que'
    })
  })
})

describe('For', () => {
  it('para bien escrito', () => {
    let code = `para i <- 1 hasta 10
    j <- 2
    finpara
    `
    let q = queueFromSource(code)
    let report = match(Patterns.For).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type: 'for',
      counter_init: {
        type:'assignment',
        left:{name:'i', isArray:false, indexes:null},
        right:[{type:'literal', value:1}]
      },
      last_value: [{type:'literal', value:10}],
      body: [{
        type:'assignment',
        left:{name:'j', isArray:false, indexes:null},
        right:[{type:'literal', value:2}]
      }]
    })
  })
})

describe('Statement', () => {
  it('captura un si', () => {
    let code = `si (falso) entonces
    var <- 32
    finsi
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.type.should.equal('if')
  })

  it('captura un mientras', () => {
    let code = `mientras (falso)
    var <- 32
    finmientras
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.type.should.equal('while')
  })

  it('captura un repetir', () => {
    let code = `repetir
    var <- 32
    hasta que (verdadero)
    `
    let q = queueFromSource(code)
    let report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.type.should.equal('until')
  })

  it('captura un retornar', () => {
    let code = `retornar 25`

    let q = queueFromSource(code)

    let report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'return',
      expression:[{type:'literal', value:25}]
    })
  })

  it('devuelve un error cuando no encuentra un enunciado', () => {
    let code = `2 + 3`
    let q = queueFromSource(code)
    let report = match(Patterns.Statement).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'entero',
      expected : 'variable|funcion|procedimiento|si|mientras|repetir',
      line : 0,
      column : 0,
      reason : 'missing-statement'
    })
  })
})

describe('DeclarationStatement', () => {
  it('captura tres variables del mismo tipo', () => {
    let code = `entero a, b, c\n`
    let q = queueFromSource(code)
    let report = match(Patterns.DeclarationStatement).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'entero', name:'a', isArray:false, dimension:null},
        {type:'entero', name:'b', isArray:false, dimension:null},
        {type:'entero', name:'c', isArray:false, dimension:null}
      ]
    })
  })

  it('captura variable de distintos tipos en el mismo renglon', () => {
    let code = `entero var_entera1, var_entera2, real var_real\n`
    let q = queueFromSource(code)
    let report = match(Patterns.DeclarationStatement).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'entero', name:'var_entera1', isArray:false, dimension:null},
        {type:'entero', name:'var_entera2', isArray:false, dimension:null},
        {type:'real', name:'var_real', isArray:false, dimension:null}
      ]
    })
  })

  it('captura tres varaibles declaradas en distintos renglones', () => {
    let code = `entero var_entera1, var_entera2\nreal var_real\n`
    let q = queueFromSource(code)

    let first_line = match(Patterns.DeclarationStatement).from(q)

    let second_line = match(Patterns.DeclarationStatement).from(q)

    first_line.error.should.equal(false)
    first_line.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'entero', name:'var_entera1', isArray:false, dimension:null},
        {type:'entero', name:'var_entera2', isArray:false, dimension:null},
      ]
    })

    second_line.error.should.equal(false)
    second_line.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'real', name:'var_real', isArray:false, dimension:null}
      ]
    })
  })
})

describe('MainModule', () => {
  it('captura un modulo principal bien escrito y con variables', () => {
    let code = `variables
    entero var_entera1, var_entera2
    inicio
    var<-32
    fin
    `
    let q = queueFromSource(code)

    let report = match(Patterns.MainModule).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'module',
      module_type:'main',
      name:'main',
      body:[
        {
          type:'declaration',
          variables:[
            {type:'entero', name:'var_entera1', isArray:false, dimension:null},
            {type:'entero', name:'var_entera2', isArray:false, dimension:null}
          ]
        },
        {
          type:'assignment',
          left:{
            name:'var',
            isArray:false,
            indexes:null
          },
          right:[{type:'literal', value:32}]
        }
      ]
    })
  })

  it('captura un modulo principal bien escrito y sin variables', () => {
    let code = `variables
    inicio
    var<-32
    fin
    `
    let q = queueFromSource(code)

    let report = match(Patterns.MainModule).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'module',
      module_type:'main',
      name:'main',
      body:[{
        type:'assignment',
        left:{
          name:'var',
          isArray:false,
          indexes:null
        },
        right:[{type:'literal', value:32}]
      }]
    })
  })

  it('programa sin encabezado ("variables") para el modulo principal', () => {
    let code = `inicio
    var<-32
    fin
    `
    let q = queueFromSource(code)

    let report = match(Patterns.MainModule).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'inicio',
      expected : 'variables',
      line : 0,
      column : 0,
      reason : 'missing-variables'
    })
  })

  it('programa sin "inicio" pero con varibles declaradas', () => {
    let code = `variables
    entero var
    var<-32
    fin
    `
    let q = queueFromSource(code)

    let report = match(Patterns.MainModule).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'word',
      expected : ['entero', 'real', 'logico', 'caracter'],
      line : 2,
      column : 4,
      reason : 'nonexistent-type'
    })
  })

  it('programa sin "inicio" sin varibles declaradas', () => {
    let code = `variables
    var<-32
    fin
    `
    let q = queueFromSource(code)

    let report = match(Patterns.MainModule).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'word',
      expected : ['entero', 'real', 'logico', 'caracter'],
      line : 1,
      column : 4,
      reason : 'nonexistent-type'
    })
  })

  it('programa sin "fin"', () => {
    let code = `variables\ninicio\nvar<-32`
    let q = queueFromSource(code)

    let report = match(Patterns.MainModule).from(q)

    report.error.should.equal(true)
    report.result.should.deepEqual({
      unexpected : 'eof',
      expected : 'fin',
      line : 2,
      column : 7,
      reason : 'missing-fin'
    })
  })
})

describe('FunctionModule', () => {
  it('captura parte de una funcion correctamente', () => {
    let code = `entero funcion mi_funcion (entero a, entero ref b)
    entero a, b, c
    inicio
      escribir(42)
      retornar 2
    finfuncion
    `

    let q = queueFromSource(code)

    let report = match(Patterns.FunctionModule).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'module',
      module_type:'function',
      name:'mi_funcion',
      return_type:'entero',
      parameters:[{name:'a', type:'entero', by_ref:false}, {name:'b', type:'entero', by_ref:true}],
      body:[
        {
          type:'declaration',
          variables:[
            {type:'entero', name:'a', isArray:false, dimension:null},
            {type:'entero', name:'b', isArray:false, dimension:null},
            {type:'entero', name:'c', isArray:false, dimension:null}
          ]
        },
        {
          type:'call',
          args:[[{type:'literal', value:42}]],
          name:'escribir'
        },
        {
          type:'return',
          expression:[{type:'literal', value:2}]
        }
      ]
    })
  })
})

describe('ProcedureModule', () => {
  it('captura un procedimiento correctamente', () => {
    let code = `procedimiento mi_proc (entero a, entero ref b)
    entero a, b, c
    inicio
      escribir(42)
    finprocedimiento
    `

    let q = queueFromSource(code)

    let report = match(Patterns.ProcedureModule).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'module',
      module_type:'procedure',
      name:'mi_proc',
      parameters:[{name:'a', type:'entero', by_ref:false}, {name:'b', type:'entero', by_ref:true}],
      body:[
        {
          type:'declaration',
          variables:[
            {type:'entero', name:'a', isArray:false, dimension:null},
            {type:'entero', name:'b', isArray:false, dimension:null},
            {type:'entero', name:'c', isArray:false, dimension:null}
          ]
        },
        {
          type:'call',
          args:[[{type:'literal', value:42}]],
          name:'escribir'
        }
      ]
    })
  })
})
