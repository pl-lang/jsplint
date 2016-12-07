
'use strict'
import 'should'

import SourceWrapper from '../src/parser/SourceWrapper.js'

import Lexer from '../src/parser/Lexer.js'

import TokenQueue from '../src/parser/TokenQueue.js'

import {ValueKind, ReservedKind, SymbolKind, OtherKind, Token} from '../src/parser/TokenTypes'

import {PatternError} from '../src/interfaces/ParsingInterfaces'

import * as Patterns from '../src/parser/Patterns.js'

function queueFromSource (string: string) {
  const source = new SourceWrapper(string)
  const tokenizer = new Lexer(source)

  const tokenArray: Token[] = []

  let t = tokenizer.nextToken()

  while ( t.kind !== SymbolKind.EOF) {
    tokenArray.push(t)
    t = tokenizer.nextToken()
  }
  tokenArray.push(t)

  const q = new TokenQueue(tokenArray)

  return q
}

describe('IntegerPattern', () => {
  it('captura token entero', () => {
    const q = queueFromSource('36 a')

    const number = Patterns.Integer(q)

    number.error.should.equal(false)
    number.result.should.equal(36)
    q.current().kind.should.equal('word')
  })

  it('devuelve un error cuando el primer token en la cola no coincide', () => {
    const q = queueFromSource('papa 389')

    const number = Patterns.Integer(q)

    number.error.should.equal(true)

    const info = number.result as PatternError
    info.expected.should.equal(['entero'])
    info.unexpected.should.equal(OtherKind.Word)
    info.line.should.equal(0)
    info.column.should.equal(0)
    q.current().kind.should.equal(OtherKind.Word)
  })
})

describe('ArrayDimension', () => {

  it('captura el indice de un vector', () => {
    const q = queueFromSource('3')

    const capture = Patterns.ArrayDimension(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3])
    q.current().kind.should.equal('eof')
  })

  it('captura los indices de una matriz', () => {
    const q = queueFromSource('3, 7')

    const capture = Patterns.ArrayDimension(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3, 7])
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    const q = queueFromSource('3, 7, 2.78')
    const capture = Patterns.ArrayDimension(q)

    capture.error.should.equal(true)

    const info = capture.result as PatternError
    info.unexpected.should.equal(ValueKind.Real)
    info.line.should.equal(0)
    info.column.should.equal(6)
    q.current().kind.should.equal('real')
  })
})

describe('WordPattern', () => {

  it('captura una palabra', () => {
    const q = queueFromSource('rodrigo')

    const capture = Patterns.Word(q)

    capture.error.should.equal(false)
    capture.result.should.equal('rodrigo')
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error cuando el patron no coincide', () => {
    const q = queueFromSource('32')

    const capture = Patterns.Word(q)

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
      const q = queueFromSource('rmb')

      const captura = match(Patterns.Kind("word")).from(q)

      captura.error.should.equal(false)
    }

    {
      const q = queueFromSource('123')

      const captura = match(Patterns.Kind("entero")).from(q)

      captura.error.should.equal(false)
    }
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    const q = queueFromSource('rmb')

    const captura = match(Patterns.Kind("entero")).from(q)

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
    const q = queueFromSource('sueldo')

    const capture = match(Patterns.VariableDeclaration).from(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name    : 'sueldo',
      isArray : false,
      dimension: []
    })
  })

  it('captura el nombre de una matriz y sus dimensiones', () => {
    const q = queueFromSource('vuelos[3, 12]')

    const capture = match(Patterns.VariableDeclaration).from(q)

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
    const q = queueFromSource('a, b, matriz[3, 3], v[8]')

    const capture = match(Patterns.VariableList).from(q)

    capture.error.should.equal(false)
    capture.result[0].should.deepEqual({name:'a', isArray:false, dimension:[]})
    capture.result[1].should.deepEqual({name:'b', isArray:false, dimension:[]})
    capture.result[2].should.deepEqual({name:'matriz', isArray:true, dimension:[3, 3]})
    capture.result[3].should.deepEqual({name:'v', isArray:true, dimension:[8]})
    q.current().kind.should.equal('eof')
  })
})

describe('TypeName', () => {

  it('extrae un token de tipo', () => {
    const q = queueFromSource('entero, real')

    const capture = match(Patterns.TypeName).from(q)

    capture.error.should.equal(false)
    capture.result.should.equal('entero')
    q.current().kind.should.equal('comma')
  })

  it('extrae un token de tipo', () => {
    const q = queueFromSource('gatp, real')

    const capture = match(Patterns.TypeName).from(q)

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
    const asignacion = 'var <- 48'

    const q = queueFromSource(asignacion)
    const assignment_match = match(Patterns.Assignment).from(q)

    assignment_match.error.should.equal(false)
    assignment_match.result.payload.should.deepEqual([
      {type:'literal', value:48}
    ])
    assignment_match.result.target.name.should.equal('var')
  })
})

describe('ArgumentList', () => {
  it('captura dos expresiones', () => {
    const test_string = '2, verdadero'

    const q = queueFromSource(test_string)

    const argument_match = match(Patterns.ArgumentList).from(q)

    argument_match.error.should.equal(false)
    argument_match.result.should.deepEqual([
      [{type:'literal', value:2}],
      [{type:'literal', value:true}]
    ])
  })
})

describe('ParameterList', () => {
  it('captura varios parametros', () => {
    const list = 'entero a, entero ref b'

    const q = queueFromSource(list)

    const report =  match(Patterns.ParameterList).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual([
      {name:'a', type:'entero', by_ref:false},
      {name:'b', type:'entero', by_ref:true}
    ])
  })
})

describe('ModuleCall pattern', () => {
  it('captura la llamada a un modulo', () => {
    const asignacion = 'escribir(42)'

    const q = queueFromSource(asignacion)
    const capt = match(Patterns.ModuleCall).from(q)

    capt.error.should.equal(false)
    capt.result.name.should.equal('escribir')
    capt.result.args.should.deepEqual([
      [{type:'literal', value:42}],
    ])
  })
})

describe('VariablePattern', () => {

  it('captura la variable en una asignacion', () => {
    const dato = 'mi_variable <- 2'
    const q = queueFromSource(dato)
    const report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_variable',
      isArray:false,
      indexes:[],
    })
  })

  it('captura la variable (un arreglo) en una asignacion', () => {
    const dato = 'mi_vector[2] <- 2'
    const q = queueFromSource(dato)
    const report = match(Patterns.Variable).from(q)

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
    const dato = 'mi_matriz[i, j] <- 2'
    const q = queueFromSource(dato)
    const report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_matriz',
      isArray:true,
      indexes:[
        [{type:'invocation', name:'i', isArray:false, indexes:[]}],
        [{type:'invocation', name:'j', isArray:false, indexes:[]}]
      ]
    })
  })

  it('captura la variable (un arreglo3) en una asignacion', () => {
    const dato = 'mi_matriz[i, j, k] <- 2'
    const q = queueFromSource(dato)
    const report = match(Patterns.Variable).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      name:'mi_matriz',
      isArray:true,
      indexes:[
        [{type:'invocation', name:'i', isArray:false, indexes:[]}],
        [{type:'invocation', name:'j', isArray:false, indexes:[]}],
        [{type:'invocation', name:'k', isArray:false, indexes:[]}]
      ]
    })
  })

})

describe('If', () => {
  it('captura una estructura si bien escrita', () => {
    const code = `si (verdadero) entonces
    var <- 32
    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'if',
      condition: [{type:'literal', value:true}],
      true_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:[]},
        right:[{type:'literal', value:32}]
      }],
      false_branch:[]
    })
  })

  it('captura una estructura si...sino bien escrita', () => {
    const code = `si (verdadero) entonces
    var <- 32
    sino
    var <- 16
    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'if',
      condition: [{type:'literal', value:true}],
      true_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:[]},
        right:[{type:'literal', value:32}]
      }],
      false_branch:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:[]},
        right:[{type:'literal', value:16}]
      }]
    })
  })

  it('captura una estructura si...sino sin enunciados', () => {
    const code = `si (verdadero) entonces


    sino


    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'if',
      condition:[{type:'literal', value:true}],
      true_branch:[],
      false_branch:[]
    })
  })

  it('falta el parentesis izquierdo', () => {
    const code = `si verdadero) entonces
    var <- 32
    sino
    var <- 16
    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

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
    const code = `si (verdadero entonces
    var <- 32
    sino
    var <- 16
    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

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
    const code = `si (verdadero)
    var <- 32
    sino
    var <- 16
    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

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
    const code = `si (verdadero) entonces
    var <- 32
    sino
    var<-16
    `
    const q = queueFromSource(code)
    const report = match(Patterns.If).from(q)

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
    const code = `mientras (verdadero)
    var <- 32
    finmientras
    `
    const q = queueFromSource(code)
    const report = match(Patterns.While).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'while',
      condition:[{type:'literal', value:true}],
      body:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:[]},
        right:[{type:'literal', value:32}]
      }]
    })
  })

  it('captura un bucle mientras vacio', () => {
    const code = `mientras (verdadero)



    finmientras
    `
    const q = queueFromSource(code)
    const report = match(Patterns.While).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'while',
      condition:[{type:'literal', value:true}],
      body:[]
    })
  })

  it('falta el parentesis izquierdo en la condicion', () => {
    const code = `mientras verdadero)
    finmientras
    `
    const q = queueFromSource(code)
    const report = match(Patterns.While).from(q)

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
    const code = `mientras (verdadero)`
    const q = queueFromSource(code)
    const report = match(Patterns.While).from(q)

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
    const code = `repetir
    var <- 32
    hasta que (verdadero)
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Until).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'until',
      condition:[{type:'literal', value:true}],
      body:[{
        type:'assignment',
        left:{name:'var', isArray:false, indexes:[]},
        right:[{type:'literal', value:32}]
      }]
    })
  })

  it('captura un bucle repetir vacio', () => {
    const code = `repetir





    hasta que (verdadero)
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Until).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'until',
      condition:[{type:'literal', value:true}],
      body:[]
    })
  })

  it('falta hasta al final del bucle', () => {
    const code = `repetir
    var <- 32
    que (verdadero)
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Until).from(q)

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
    const code = `repetir
    var <- 32
    hasta (verdadero)
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Until).from(q)

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
    const code = `para i <- 1 hasta 10
    j <- 2
    finpara
    `
    const q = queueFromSource(code)
    const report = match(Patterns.For).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type: 'for',
      counter_init: {
        type:'assignment',
        left:{name:'i', isArray:false, indexes:[]},
        right:[{type:'literal', value:1}]
      },
      last_value: [{type:'literal', value:10}],
      body: [{
        type:'assignment',
        left:{name:'j', isArray:false, indexes:[]},
        right:[{type:'literal', value:2}]
      }]
    })
  })
})

describe('Statement', () => {
  it('captura un si', () => {
    const code = `si (falso) entonces
    var <- 32
    finsi
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.type.should.equal('if')
  })

  it('captura un mientras', () => {
    const code = `mientras (falso)
    var <- 32
    finmientras
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.type.should.equal('while')
  })

  it('captura un repetir', () => {
    const code = `repetir
    var <- 32
    hasta que (verdadero)
    `
    const q = queueFromSource(code)
    const report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.type.should.equal('until')
  })

  it('captura un retornar', () => {
    const code = `retornar 25`

    const q = queueFromSource(code)

    const report = match(Patterns.Statement).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'return',
      expression:[{type:'literal', value:25}]
    })
  })

  it('devuelve un error cuando no encuentra un enunciado', () => {
    const code = `2 + 3`
    const q = queueFromSource(code)
    const report = match(Patterns.Statement).from(q)

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
    const code = `entero a, b, c\n`
    const q = queueFromSource(code)
    const report = match(Patterns.DeclarationStatement).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'entero', name:'a', isArray:false, dimension:[]},
        {type:'entero', name:'b', isArray:false, dimension:[]},
        {type:'entero', name:'c', isArray:false, dimension:[]}
      ]
    })
  })

  it('captura variable de distintos tipos en el mismo renglon', () => {
    const code = `entero var_entera1, var_entera2, real var_real\n`
    const q = queueFromSource(code)
    const report = match(Patterns.DeclarationStatement).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'entero', name:'var_entera1', isArray:false, dimension:[]},
        {type:'entero', name:'var_entera2', isArray:false, dimension:[]},
        {type:'real', name:'var_real', isArray:false, dimension:[]}
      ]
    })
  })

  it('captura tres varaibles declaradas en distintos renglones', () => {
    const code = `entero var_entera1, var_entera2\nreal var_real\n`
    const q = queueFromSource(code)

    const first_line = match(Patterns.DeclarationStatement).from(q)

    const second_line = match(Patterns.DeclarationStatement).from(q)

    first_line.error.should.equal(false)
    first_line.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'entero', name:'var_entera1', isArray:false, dimension:[]},
        {type:'entero', name:'var_entera2', isArray:false, dimension:[]},
      ]
    })

    second_line.error.should.equal(false)
    second_line.result.should.deepEqual({
      type:'declaration',
      variables:[
        {type:'real', name:'var_real', isArray:false, dimension:[]}
      ]
    })
  })
})

describe('MainModule', () => {
  it('captura un modulo principal bien escrito y con variables', () => {
    const code = `variables
    entero var_entera1, var_entera2
    inicio
    var<-32
    fin
    `
    const q = queueFromSource(code)

    const report = match(Patterns.MainModule).from(q)

    report.error.should.equal(false)
    report.result.should.deepEqual({
      type:'module',
      module_type:'main',
      name:'main',
      body:[
        {
          type:'declaration',
          variables:[
            {type:'entero', name:'var_entera1', isArray:false, dimension:[]},
            {type:'entero', name:'var_entera2', isArray:false, dimension:[]}
          ]
        },
        {
          type:'assignment',
          left:{
            name:'var',
            isArray:false,
            indexes:[]
          },
          right:[{type:'literal', value:32}]
        }
      ]
    })
  })

  it('captura un modulo principal bien escrito y sin variables', () => {
    const code = `variables
    inicio
    var<-32
    fin
    `
    const q = queueFromSource(code)

    const report = match(Patterns.MainModule).from(q)

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
          indexes:[]
        },
        right:[{type:'literal', value:32}]
      }]
    })
  })

  it('programa sin encabezado ("variables") para el modulo principal', () => {
    const code = `inicio
    var<-32
    fin
    `
    const q = queueFromSource(code)

    const report = match(Patterns.MainModule).from(q)

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
    const code = `variables
    entero var
    var<-32
    fin
    `
    const q = queueFromSource(code)

    const report = match(Patterns.MainModule).from(q)

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
    const code = `variables
    var<-32
    fin
    `
    const q = queueFromSource(code)

    const report = match(Patterns.MainModule).from(q)

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
    const code = `variables\ninicio\nvar<-32`
    const q = queueFromSource(code)

    const report = match(Patterns.MainModule).from(q)

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
    const code = `entero funcion mi_funcion (entero a, entero ref b)
    entero a, b, c
    inicio
      escribir(42)
      retornar 2
    finfuncion
    `

    const q = queueFromSource(code)

    const report = match(Patterns.FunctionModule).from(q)

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
            {type:'entero', name:'a', isArray:false, dimension:[]},
            {type:'entero', name:'b', isArray:false, dimension:[]},
            {type:'entero', name:'c', isArray:false, dimension:[]}
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
    const code = `procedimiento mi_proc (entero a, entero ref b)
    entero a, b, c
    inicio
      escribir(42)
    finprocedimiento
    `

    const q = queueFromSource(code)

    const report = match(Patterns.ProcedureModule).from(q)

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
            {type:'entero', name:'a', isArray:false, dimension:[]},
            {type:'entero', name:'b', isArray:false, dimension:[]},
            {type:'entero', name:'c', isArray:false, dimension:[]}
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
