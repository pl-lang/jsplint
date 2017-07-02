'use strict'

import SourceWrapper from '../src/parser/SourceWrapper.js'
import { Token } from '../src/interfaces'
import { WordToken, NumberToken, StringToken, SpecialSymbolToken } from '../src/parser/TokenTypes'
import { ValueKind, SymbolKind, ReservedKind, OtherKind } from '../src/interfaces'
import Lexer from '../src/parser/Lexer.js'
import TokenQueue from '../src/parser/TokenQueue.js'

import 'should'

describe('SourceWrapper:', () => {
  it('funciona correctamente', () => {
    let string = `1
2
34
`

    let source = new SourceWrapper(string)

    source._current_line.should.equal(0)
    source._current_column.should.equal(0)
    source.currentChar().should.equal('1')
    source.nextChar().should.equal('\n')

    source.nextChar().should.equal('2')
    source._current_line.should.equal(1)
    source._current_column.should.equal(0)
    source.nextChar() // consume '\n'

    source.nextChar().should.equal('3')
    source._current_line.should.equal(2)
    source._current_column.should.equal(0)

    source.nextChar().should.equal('4')
    source._current_line.should.equal(2)
    source._current_column.should.equal(1)
    source.nextChar() // consume '\n'

    source.nextChar().should.equal(source.EOF)
  })

  it('cuenta bien los renglones', () => {
    let string = '0\n1\n2'

    let source = new SourceWrapper(string)

    source._current_line.should.equal(0)
    source.nextChar()
    source.nextChar()

    source.currentChar().should.equal('1')
    source._current_line.should.equal(1)
    source.nextChar()
    source.nextChar()

    source._current_line.should.equal(2)
  })

  it('cuenta bien las columnas', () => {
    let string = '0123\n456\n789'

    let source = new SourceWrapper(string)

    source._current_line.should.equal(0)

    source.currentChar().should.equal('0')
    source._current_column.should.equal(0)

    source.nextChar()

    source.currentChar().should.equal('1')
    source._current_column.should.equal(1)

    source.nextChar()

    source.currentChar().should.equal('2')
    source._current_column.should.equal(2)

    source.nextChar()

    source.currentChar().should.equal('3')
    source._current_column.should.equal(3)

    source.nextChar()

    source.currentChar().should.equal(source.EOL)
    source._current_column.should.equal(4)

    source.nextChar()

    source._current_line.should.equal(1)

    source.currentChar().should.equal('4')
    source._current_column.should.equal(0)

    source.nextChar()

    source.currentChar().should.equal('5')
    source._current_column.should.equal(1)

    source.nextChar()

    source.currentChar().should.equal('6')
    source._current_column.should.equal(2)

    source.nextChar()

    source.currentChar().should.equal(source.EOL)
    source._current_column.should.equal(3)

    source.nextChar()

    source._current_line.should.equal(2)

    source.currentChar().should.equal('7')
    source._current_column.should.equal(0)

    source.nextChar()

    source.currentChar().should.equal('8')
    source._current_column.should.equal(1)

    source.nextChar()

    source.currentChar().should.equal('9')
    source._current_column.should.equal(2)

    source.nextChar()

    source.currentChar().should.equal(source.EOF)
    source._current_column.should.equal(3)
  })
})

describe('WordToken', () => {
  it('lee un nombre de variable', () => {
    let source = new SourceWrapper('palabra123')

    let token = new WordToken(source)

    token.kind.should.equal(OtherKind.Word)
    token.text.should.equal('palabra123')

  })

  it('lee un nombre reservado', () => {
    let source = new SourceWrapper('variables')
    let token = new WordToken(source)

    token.kind.should.equal(ReservedKind.Variables)
    token.text.should.equal('variables')
  })

  it('se detiene al encontrar un caracter que no sea numero o letra', () => {
    let source = new SourceWrapper('nombre24 chau')
    let token = new WordToken(source)

    token.kind.should.equal(OtherKind.Word)
    token.text.should.equal('nombre24')
  })

  it('funciona con nombres que contengan guion bajo', () => {
    let source = new SourceWrapper('costo_total')
    let token = new WordToken(source)

    token.kind.should.equal(OtherKind.Word)
    token.text.should.equal('costo_total')
  })
})

describe('NumberToken', () => {
  it('lee un entero', () => {
    let source = new SourceWrapper('22')

    let token = new NumberToken(source)

    token.kind.should.equal(ValueKind.Integer)
    token.text.should.equal('22')
    token.value.should.equal(22)
  })

  it('lee un real', () => {
    let source = new SourceWrapper('3.1487')
    let token = new NumberToken(source)

    token.kind.should.equal(ValueKind.Real)
    token.text.should.equal('3.1487')
    token.value.should.equal(3.1487)
  })

  it('devuelve un error al encontrar un caracter no permitido en un real', () => {
    let source = new SourceWrapper('3.A')
    let token = new NumberToken(source)

    token.kind.should.equal(ValueKind.Integer)
    token.text.should.equal('3.')
    token.error_info.unexpected.should.equal('A')
    token.error_info.pos.line.should.equal(0)
    token.error_info.pos.column.should.equal(2)
  })
})

describe('StringToken', () => {
  it('lee una cadena', () => {
    {
      let source = new SourceWrapper('"Hola Mundo"')
      let token = new StringToken(source)

      token.kind.should.equal(ValueKind.String)
      token.text.should.equal('"Hola Mundo"')
      token.value.should.equal('Hola Mundo')
    }

    {
      let source = new SourceWrapper('"hasta que los chanchos vuelen.."')
      let token = new StringToken(source)

      token.kind.should.equal(ValueKind.String)
      token.text.should.equal('"hasta que los chanchos vuelen.."')
      token.value.should.equal('hasta que los chanchos vuelen..')
    }
  })

  it('devuelve error al encontrar \\n en medio de una cadena', () => {
    let source = new SourceWrapper('"Hola \n Mundo"')
    let token = new StringToken(source)

    token.kind.should.equal(ValueKind.String)
    token.error_info.unexpected.should.equal('\n')
    token.error_info.pos.line.should.equal(0)
    token.error_info.pos.column.should.equal(6)
  })
})

describe('SpecialSymbolToken', () => {
  it ('isSpecialSymbolChar funciona', () => {
    SpecialSymbolToken.isSpecialSymbolChar('<').should.equal(true)
  })

  it('lee operadores aritmeticos', () => {
    let source = new SourceWrapper('+')
    let token = new SpecialSymbolToken(source)

    token.kind.should.equal(SymbolKind.Plus)
    token.text.should.equal('+')

    source = new SourceWrapper('-')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal(SymbolKind.Minus)
    token.text.should.equal('-')

    source = new SourceWrapper('*')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal(SymbolKind.Times)
    token.text.should.equal('*')

    source = new SourceWrapper('/')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal(SymbolKind.Slash)
    token.text.should.equal('/')

    source = new SourceWrapper('^')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal(SymbolKind.Power)
    token.text.should.equal('^')

  })

  it('lee operadores relacionales', () => {
    let source = new SourceWrapper('<')
    let token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.Minor)
    token.text.should.equal('<')

    source = new SourceWrapper('=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.Equal)
    token.text.should.equal('=')

    source = new SourceWrapper('<=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.MinorEq)
    token.text.should.equal('<=')

    source = new SourceWrapper('<>')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.Different)
    token.text.should.equal('<>')

    source = new SourceWrapper('>')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.Major)
    token.text.should.equal('>')

    source = new SourceWrapper('>=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.MajorEq)
    token.text.should.equal('>=')
  })

  it('lee otros simbolos', () => {
    let source = new SourceWrapper('(')
    let token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.LeftPar)
    token.text.should.equal('(')

    source = new SourceWrapper(')')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.RightPar)
    token.text.should.equal(')')

    source = new SourceWrapper('[')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.LeftBracket)
    token.text.should.equal('[')

    source = new SourceWrapper(']')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.RightBracket)
    token.text.should.equal(']')

    source = new SourceWrapper(',')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.Comma)
    token.text.should.equal(',')

    source = new SourceWrapper('<-')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal(SymbolKind.Assignment)
    token.text.should.equal('<-')
  })
})

describe('Lexer', () => {
  it('deberia fichar un numero, una palabra y otro numero para: "1a 2.3"', () => {
    let source = new SourceWrapper('1a 2.3')
    let tokenizer = new Lexer(source)
    let tokenArray: Token[] = []

    let t = tokenizer.nextToken()

    while ( t.kind !== SymbolKind.EOF ) {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }

    // guarda el token EOF
    tokenArray.push(t)

    tokenArray[0].kind.should.equal(ValueKind.Integer)
    tokenArray[1].kind.should.equal(OtherKind.Word)
    tokenArray[2].kind.should.equal(ValueKind.Real)
    tokenArray[3].kind.should.equal(SymbolKind.EOF)
  })

  it('deberia saltearse los comentarios', () => {
    let source = new SourceWrapper('//comentario\n')
    let tokenizer = new Lexer(source)

    let t = tokenizer.nextToken()
    let tokenArray: Token[] = []

    while ( t.kind !== SymbolKind.EOF ) {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    tokenArray[0].kind.should.equal(SymbolKind.EOL)
    tokenArray[1].kind.should.equal(SymbolKind.EOF)
  })

  it('deberia fichar todos los tokens de un programa modelo', () => {
    let programa = `//comentario

variables
  entero a, b
inicio
  a <- 3
  b <- 7
  si (a > b) entonces
    escribir("a es mayor que b")
  sino
    escribir("b es mayor que a")
fin
`
    let source = new SourceWrapper(programa)
    let tokenizer = new Lexer(source)

    let tokenArray: Token[] = []
    let t = tokenizer.nextToken()

    while ( t.kind !== SymbolKind.EOF) {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    tokenArray[0].kind.should.equal(SymbolKind.EOL)

    tokenArray[1].kind.should.equal(SymbolKind.EOL)

    tokenArray[2].kind.should.equal(ReservedKind.Variables)
    tokenArray[3].kind.should.equal(SymbolKind.EOL)

    tokenArray[4].kind.should.equal(ReservedKind.Entero)
    tokenArray[5].kind.should.equal(OtherKind.Word)
    tokenArray[6].kind.should.equal(SymbolKind.Comma)
    tokenArray[7].kind.should.equal(OtherKind.Word)
    tokenArray[8].kind.should.equal(SymbolKind.EOL)

    tokenArray[9].kind.should.equal(ReservedKind.Inicio)
    tokenArray[10].kind.should.equal(SymbolKind.EOL)

    tokenArray[11].kind.should.equal(OtherKind.Word)
    tokenArray[12].kind.should.equal(SymbolKind.Assignment)
    tokenArray[13].kind.should.equal(ValueKind.Integer)
    tokenArray[14].kind.should.equal(SymbolKind.EOL)

    tokenArray[15].kind.should.equal(OtherKind.Word)
    tokenArray[16].kind.should.equal(SymbolKind.Assignment)
    tokenArray[17].kind.should.equal(ValueKind.Integer)
    tokenArray[18].kind.should.equal(SymbolKind.EOL)

    tokenArray[19].kind.should.equal(ReservedKind.Si)
    tokenArray[20].kind.should.equal(SymbolKind.LeftPar)
    tokenArray[21].kind.should.equal(OtherKind.Word)
    tokenArray[22].kind.should.equal(SymbolKind.Major)
    tokenArray[23].kind.should.equal(OtherKind.Word)
    tokenArray[24].kind.should.equal(SymbolKind.RightPar)
    tokenArray[25].kind.should.equal(ReservedKind.Entonces)
    tokenArray[26].kind.should.equal(SymbolKind.EOL)

    tokenArray[27].kind.should.equal(OtherKind.Word)
    tokenArray[28].kind.should.equal(SymbolKind.LeftPar)
    tokenArray[29].kind.should.equal(ValueKind.String)
    tokenArray[30].kind.should.equal(SymbolKind.RightPar)
    tokenArray[31].kind.should.equal(SymbolKind.EOL)

    tokenArray[32].kind.should.equal(ReservedKind.Sino)
    tokenArray[33].kind.should.equal(SymbolKind.EOL)

    tokenArray[34].kind.should.equal(OtherKind.Word)
    tokenArray[35].kind.should.equal(SymbolKind.LeftPar)
    tokenArray[36].kind.should.equal(ValueKind.String)
    tokenArray[37].kind.should.equal(SymbolKind.RightPar)
    tokenArray[38].kind.should.equal(SymbolKind.EOL)

    tokenArray[39].kind.should.equal(ReservedKind.Fin)
    tokenArray[40].kind.should.equal(SymbolKind.EOL)
    tokenArray[41].kind.should.equal(SymbolKind.EOF)
  })
})

describe('TokenQueue', () => {
  it('funciona correctamente', () => {
    let q = new TokenQueue([1, 2, 3])

    q.current().should.equal(1)
    q.next().should.equal(2)
    q.next().should.equal(3)
    // devuelve un EoFToken cuando se alcanzó el final del arreglo
    q.peek().kind.should.equal(SymbolKind.EOF)
  })
})
