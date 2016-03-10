'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

let Parser = require('../frontend/Parser.js')
let TokenQueue = require('../intermediate/TokenQueue')

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
  let IntegerPattern = require('../intermediate\/structures\/IntegerPattern.js')
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
    info.expectedToken.should.equal('entero')
    info.unexpectedToken.should.equal('word')
    info.atLine.should.equal(0)
    info.atColumn.should.equal(0)
    q.current().kind.should.equal('word')
  })
})

describe('IndexesPattern', () => {
  let IndexesPattern = require('../intermediate\/structures\/IndexesPattern.js')

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
    capture.result.unexpectedToken.should.equal('real')
    capture.result.atLine.should.equal(0)
    capture.result.atColumn.should.equal(6)
    q.current().kind.should.equal('real')
  })
})

describe('WordPattern', () => {
  let WordPattern = require('../intermediate\/structures\/WordPattern.js')

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
      unexpectedToken : 'entero',
      atColumn : 0,
      atLine : 0
    })
    q.current().kind.should.equal('entero')
  })
})

describe('VariableNamePattern', () => {
  let VariableNamePattern = require('../intermediate\/structures\/VariableNamePattern.js')
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
  let VariableListPattern = require('../intermediate\/structures\/VariableListPattern.js')
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
  let TypePattern = require('../intermediate\/structures\/TypePattern.js')

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
  let BeginPattern = require('../intermediate\/structures\/BeginPattern.js')
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
  let DeclarationPattern = require('../intermediate\/structures\/DeclarationPattern.js')
  it('captura dos variables de tipo entero y una real declaradas en un renglon', () => {
    let q = queueFromSource('entero a, b, real c')

    let capt = DeclarationPattern.capture(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'entero', isArray:false, value:null},
      b : {type:'entero', isArray:false, value:null},
      c : {type:'real', isArray:false, value:null}
    })
  })

  it('captura variables de distintos tipos declaradas dos renglones distintos', () => {
    let q = queueFromSource('caracter a, b\nlogico c')

    let capt = DeclarationPattern.capture(q)

    capt.error.should.deepEqual(false)
    capt.result.should.deepEqual({
      a : {type:'caracter', isArray:false, value:null},
      b : {type:'caracter', isArray:false, value:null},
      c : {type:'logico', isArray:false, value:null}
    })
  })

  it('captura variables de un solo tipo', () => {
    let q = queueFromSource('caracter a, b[4, 4]')

    let capt = DeclarationPattern.capture(q)

    capt.error.should.deepEqual(false)
    capt.result.a.should.deepEqual({type:'caracter', isArray:false, value:null})

    capt.result.b.type.should.equal('caracter')
    capt.result.b.isArray.should.equal(true)
    capt.result.b.dimension.should.deepEqual([4, 4])
  })
})

describe('BinaryOpPattern', () => {
  let BinaryOpPattern = require('../intermediate\/structures\/BinaryOpPattern.js')
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
  let MainModulePattern = require('../intermediate\/structures\/MainModulePattern.js')
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

describe('AssignmentPattern', () => {
  let AssignmentPattern = require('../intermediate\/structures\/AssignmentPattern.js')
  it('captura un enunciado de asignacion', () => {
    let asignacion = 'var <- 48'

    let q = queueFromSource(asignacion)
    let capt = AssignmentPattern.capture(q)

    capt.error.should.equal(false)
    capt.result.data.payload.should.deepEqual(
      {
        expression_type:'literal',
        value:48,
        type:'entero',
      }
    )
    capt.result.data.target.should.equal('var')
  })
})

describe.skip('ModuleCallPattern', () => {
  let ModuleCallPattern = require('../intermediate\/structures\/ModuleCallPattern.js')
  it('captura la llamada a un modulo', () => {
    let asignacion = 'escribir(42)'

    let q = queueFromSource(asignacion)
    let capt = AssignmentPattern.capture(q)

    capt.error.should.equal(false)
    capt.result.name.should.equal('escribir')
  })
})

describe('New Expression', () => {
  let Expression = require('../intermediate\/structures\/Expression.js')
  it ('captura la invocacion de una variable', () => {
    {
      let nombre = 'contador'
      let q = queueFromSource(nombre)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'invocation',
        varname:'contador',
        isArray:false,
        dimension:null
      })
    }

    {
      let nombre = 'contador + 1'
      let q = queueFromSource(nombre)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'operation',
        op:'plus',
        operands:[
          {
            expression_type:'invocation',
            varname:'contador',
            isArray:false,
            dimension:null
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
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'logical',
        value:true
      })
    }

    {
      let logico = 'falso'
      let q = queueFromSource(logico)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.should.deepEqual({
        expression_type:'literal',
        type:'logical',
        value:false
      })
    }
  })

  it('captura factores numeros', () => {
    {
      let dato = '32'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
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
      let capt = Expression.fromQueue(q)
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
      let capt = Expression.fromQueue(q)
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
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('or')
    }
  })

  it('captura una expresion AND', () => {
    {
      let dato = 'verdadero AND falso'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('and')
    }
  })

  it('captura una expresion IGUAL', () => {
    {
      let dato = 'verdadero = falso'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('equal')
    }
  })

  it('captura una expresion DESIGUAL', () => {
    {
      let dato = 'verdadero <> falso'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('diff-than')
    }
  })

  it('captura expresiones RELACIONALES', () => {
    {
      let dato = '3 > 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('major-than')
    }

    {
      let dato = '3 >= 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('major-equal')
    }

    {
      let dato = '2 < 7'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('minor-than')
    }

    {
      let dato = '2 <= 4'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('minor-equal')
    }
  })

  it('captura expresiones de ADICION (suma y resta)', () => {
    {
      let dato = '3 - 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('minus')
    }

    {
      let dato = '3 + 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('plus')
    }
  })

  it('captura expresiones MULTIPLICATIVAS (*, /, div y mod)', () => {
    {
      let dato = '3 mod 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('mod')
    }

    {
      let dato = '3 / 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('divide')
    }

    {
      let dato = '3 div 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('div')
    }

    {
      let dato = '3 * 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('times')
    }

    {
      let dato = '3 ^ 2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('operation')
      capt.result.op.should.equal('power')
    }
  })

  it('captura expresiones UNARIAS (-, +, not)', () => {
    {
      let dato = 'not verdadero'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('unary-operation')
      capt.result.op.should.equal('not')
    }

    {
      let dato = '-2'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('unary-operation')
      capt.result.op.should.equal('unary-minus')
    }

    {
      let dato = '+3'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('literal')
    }
  })

  it('captura expresiones entre parentesis', () => {
    {
      let dato = '(not verdadero)'
      let q = queueFromSource(dato)
      let capt = Expression.fromQueue(q)
      capt.error.should.equal(false)
      capt.result.expression_type.should.equal('expression')
      capt.result.expression.should.deepEqual({expression_type:'unary-operation', op:'not', operand:{expression_type:'literal', type:'logical', value:true}})
    }
  })
})
