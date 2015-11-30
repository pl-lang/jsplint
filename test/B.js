'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

let Parser = require('../frontend/Parser.js')
let TokenQueue = require('../frontend/TokenQueue.js')

function queueFromSource(string) {
  let source = new Source(string)
  let tokenizer = new Parser(source)

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
  let IntegerPattern = require('../frontend/structures/IntegerPattern.js')
  it('captura token entero', () => {
    let q = queueFromSource('36 a')

    let number = IntegerPattern.capture(q)

    number.error.should.equal(false)
    number.result.should.equal(36)
    q.current().kind.should.equal('word')
  })

  it('devuelve un error cuando el primer token en la cola no coincide', () => {
    let q = queueFromSource('papa 389'
  )
    let number = IntegerPattern.capture(q)

    number.error.should.equal(true)

    let info = number.result
    info.expectedToken.should.equal('integer')
    info.unexpectedToken.should.equal('word')
    info.atLine.should.equal(0)
    info.atColumn.should.equal(0)
    q.current().kind.should.equal('word')
  })
})

describe('IndexesPattern', () => {
  let IndexesPattern = require('../frontend/structures/IndexesPattern.js')

  it('captura el indice de un vector', () => {
    let q = queueFromSource('3')

    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3])
    q.current().kind.should.equal('eof')
  })

  it('captura los indices de una matriz', () => {
    let q = queueFromSource('3, 7')

    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3, 7])
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    let q = queueFromSource('3, 7, 2.78')
    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(true)
    capture.result.unexpectedToken.should.equal('float')
    capture.result.atLine.should.equal(0)
    capture.result.atColumn.should.equal(6)
    q.current().kind.should.equal('float')
  })
})

describe('WordPattern', () => {
  let WordPattern = require('../frontend/structures/WordPattern.js')

  it('captura una palabra', () => {
    let q = queueFromSource('rodrigo')

    let capture = WordPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.equal('rodrigo')
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error cuando el patron no coincide', () => {
    let q = queueFromSource('32')

    let capture = WordPattern.capture(q)

    capture.error.should.equal(true)
    capture.result.should.deepEqual({
      expectedToken : 'word',
      unexpectedToken : 'integer',
      atColumn : 0,
      atLine : 0
    })
    q.current().kind.should.equal('integer')
  })
})

describe('VariableNamePattern', () => {
  let VariableNamePattern = require('../frontend/structures/VariableNamePattern.js')
  it('captura el nombre de una variable', () => {
    let q = queueFromSource('sueldo')

    let capture = VariableNamePattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name    : 'sueldo',
      data    : {isArray : false, type:'unknown'}
    })
  })

  it('captura el nombre de una matriz y sus dimensiones', () => {
    let q = queueFromSource('vuelos[3, 12]')

    let capture = VariableNamePattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      name        : 'vuelos',
      data        : {isArray: true, dimension: [3, 12], type: 'unknown'}
    })
  })
})

describe('VariableListPattern', () => {
  let VariableListPattern = require('../frontend/structures/VariableListPattern.js')
  it('lee las variables de una lista', () => {
    let q = queueFromSource('a, b, matriz[3, 3], v[8]')

    let capture = VariableListPattern.capture(q)

    capture.error.should.equal(false)
    capture.result[0].should.deepEqual({name:'a', data : {isArray:false, type:'unknown'}})
    capture.result[1].should.deepEqual({name:'b', data : {isArray:false, type:'unknown'}})
    capture.result[2].should.deepEqual({name:'matriz', data: {isArray:true, dimension:[3, 3], type:'unknown'}})
    capture.result[3].should.deepEqual({name:'v', data: {isArray:true, dimension:[8], type:'unknown'}})
    q.current().kind.should.equal('eof')
  })
})

describe('TypePattern', () => {
  let TypePattern = require('../frontend/structures/TypePattern.js')

  it('extrae un token de tipo', () => {
    let q = queueFromSource('entero, real')

    let capture = TypePattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.equal('entero')
    q.current().kind.should.equal('comma')
  })

  it('extrae un token de tipo', () => {
    let q = queueFromSource('gatp, real')

    let capture = TypePattern.capture(q)

    capture.error.should.equal(true)
    capture.result.should.deepEqual({
        unexpectedToken : 'word'
      , expectedTokens  : ['entero', 'real', 'logico', 'caracter']
      , atColumn        : 0
      , atLine          : 0
      , reason          : 'nonexistent-type'
    })
    q.current().kind.should.equal('word')
    q.current().text.should.equal('gatp')
  })
})


describe('BeginPattern', () => {
  let BeginPattern = require('../frontend/structures/BeginPattern.js')
  it ('captura el token inicio', () => {
    let q = queueFromSource('inicio error')

    let capt = BeginPattern.capture(q)

    capt.error.should.equal(false)
    capt.result.text.should.equal('inicio')
    q.current().kind.should.equal('word')
  })

  it ('devuelve un error al encontrar un token inesperado', () => {
    let q = queueFromSource('nombre inicio')

    let capt = BeginPattern.capture(q)

    capt.error.should.equal(true)
    capt.result.unexpectedToken.should.equal('word')
    capt.result.expectedToken.should.equal('inicio')
    q.current().kind.should.equal('word')
  })
})

describe('DeclarationPattern', () => {
  let DeclarationPattern = require('../frontend/structures/DeclarationPattern.js')
  it('captura dos variables de tipo entero y una real declaradas en un renglon', () => {
    let q = queueFromSource('entero a, b, real c')

    let capt = DeclarationPattern.capture(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'entero', isArray:false},
      b : {type:'entero', isArray:false},
      c : {type:'real', isArray:false}
    })
  })

  it('captura variables de distintos tipos declaradas dos renglones distintos', () => {
    let q = queueFromSource('caracter a, b\nlogico c')

    let capt = DeclarationPattern.capture(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'caracter', isArray:false},
      b : {type:'caracter', isArray:false},
      c : {type:'logico', isArray:false}
    })
  })

  it('captura variables de un solo tipo', () => {
    let q = queueFromSource('caracter a, b[4, 4]')

    let capt = DeclarationPattern.capture(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'caracter', isArray:false},
      b : {type:'caracter', isArray:true, dimension:[4, 4]}
    })
  })
})

describe('BinaryOpPattern', () => {
  let BinaryOpPattern = require('../frontend/structures/BinaryOpPattern.js')
  it('captura todos los operadores', () => {
    {
      let q = queueFromSource('and')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('and')
    }

    {
      let q = queueFromSource('or')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('or')
    }

    {
      let q = queueFromSource('mod')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('mod')
    }

    {
      let q = queueFromSource('div')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('div')
    }

    {
      let q = queueFromSource('*')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('times')
    }

    {
      let q = queueFromSource('^')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('power')
    }

    {
      let q = queueFromSource('/')
      let capt = BinaryOpPattern.capture(q)
      capt.error.should.equal(false)
      capt.result.should.equal('divide')
    }

  })
})

describe.skip('MainModulePattern', () => {
  let MainModulePattern = require('../frontend/structures/MainModulePattern.js')
  it('funciona correctamente en un programa con "inicio" y variables declaradas', () => {

    let programa = '\nvariables\n  entero a, b, c\ninicio\nfin\n'
    let q = queueFromSource(programa)

    let capt = MainModulePattern.capture(q)

    capt.error.should.equal(false)
    capt.result.should.deepEqual({
        localVariables  : {
            caracter  : []
          , logico    : []
          , entero    : [{text:'a', isArray:false}, {text:'b', isArray:false}, {text:'c', isArray:false}]
          , real      : []
        }
      , name            : 'main'
      , atColumn        : 0
      , atLine          : 0
    })
    // TODO: Cambiar 'text' por 'name' en el resultado de VariableNamePattern
  })

  it('funciona correctamente para un programa sin variables declaradas', () => {
    let programa = 'variables\ninicio\nfin'

    let q = queueFromSource(programa)
    let capt = MainModulePattern.capture(q)

    capt.error.should.equal(false)
    capt.result.should.deepEqual({
        localVariables  : {
            caracter  : []
          , logico    : []
          , entero    : []
          , real      : []
        }
      , name            : 'main'
      , atColumn        : 0
      , atLine          : 0
    })
  })

  it('programa sin encabezado ("variables") para el modulo principal', () => {
    let programa = 'entero a, b, c\ninicio\nfin'

    let q = queueFromSource(programa)
    let capt = MainModulePattern.capture(q)

    capt.error.should.equal(true)
    capt.result.should.deepEqual({
        unexpected  : 'entero'
      , expected    : 'variables'
      , atColumn    : 0
      , atLine      : 0
      , reason      : 'missing-var-declaration'
    })
  })

  it('programa sin "inicio" pero con varibles declaradas', () => {
    let programa = 'variables\n entero a, b, c\nfin'

    let q = queueFromSource(programa)
    let capt = MainModulePattern.capture(q)

    capt.error.should.equal(true)
    capt.result.should.deepEqual({
        unexpected  : 'fin'
      , expected    : 'inicio'
      , atColumn    : 0
      , atLine      : 2
      , reason      : 'missing-inicio'
    })
  })

  it('programa sin "inicio" sin varibles declaradas', () => {
    let programa = 'variables\nfin'

    let q = queueFromSource(programa)
    let capt = MainModulePattern.capture(q)

    capt.error.should.equal(true)
    capt.result.should.deepEqual({
        unexpected  : 'fin'
      , expected    : 'inicio'
      , atColumn    : 0
      , atLine      : 1
      , reason      : 'missing-inicio'
    })
  })

  it('programa sin "fin"', () => {
    let programa = 'variables\n entero a, b, c\ninicio\nfi'

    let q = queueFromSource(programa)
    let capt = MainModulePattern.capture(q)

    capt.error.should.equal(true)
    capt.result.should.deepEqual({
        unexpected  : 'word'
      , expected    : 'fin'
      , atColumn    : 0
      , atLine      : 3
      , reason      : 'missing-fin'
    })
  })
})

describe('ExpressionPattern', () => {
  let ExpressionPattern = require('../frontend/structures/ExpressionPattern.js')

  it('lee una expresion compuesta por un entero (negativo o postivo)', () => {
    let positivo = queueFromSource('3')

    let e = ExpressionPattern.capture(positivo)

    e.error.should.equal(false)
    e.result.should.deepEqual([
      {
        expression_type:'literal',
        content:{value:3, sign:'plus', type:'integer', expression_type:'literal'},
        sign:'plus'
      }
    ])

    let negativo = queueFromSource('-7')
    let f = ExpressionPattern.capture(negativo)

    f.error.should.equal(false)
    f.result.should.deepEqual([
      {
        expression_type:'literal',
        content:{value:7, sign:'plus', type:'integer', expression_type:'literal'},
        sign:'minus'
      }
    ])
  })

  it('lee una operacion', () => {
    let multiplicacion = queueFromSource('2*3')
    let e = ExpressionPattern.capture(multiplicacion)

    e.error.should.equal(false)
    e.result.should.deepEqual(
      [
        {
          sign:'plus',
          expression_type:'operation',
          content:
          {
            op:'times',
            expression_type:'operation',
            operands:[
              {value:2, sign:'plus', type:'integer', expression_type:'literal'},
              {value:3, sign:'plus', type:'integer', expression_type:'literal'}
            ]
          }
        }
      ]
    )
  })
})

describe('AssignmentPattern', () => {
  let AssignmentPattern = require('../frontend/structures/AssignmentPattern.js')
  it('captura un enunciado de asignacion', () => {
    let asignacion = 'var <- 48'

    let q = queueFromSource(asignacion)
    let capt = AssignmentPattern.capture(q)

    capt.error.should.equal(false)
    capt.result.payload.should.deepEqual(
      [
        {
          expression_type:'literal',
          content:{value:48, sign:'plus', type:'integer', expression_type:'literal'},
          sign:'plus'
        }
      ]
    )
    capt.result.target.should.equal('var')
  })
})
