'use strict'

import SourceWrapper from '../src/parser/SourceWrapper.js'
import { WordToken, NumberToken, StringToken, SpecialSymbolToken } from '../src/parser/TokenTypes.js'
import Lexer from '../src/parser/Lexer.js'
import TokenQueue from '../src/parser/TokenQueue.js'

import should from 'should'
import fs from 'fs'



describe('SourceWrapper:', () => {
  it('funciona correctamente', () => {
    let string = fs.readFileSync('./test/ejemplo.md', 'utf-8')

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

    token.kind.should.equal('word')
    token.text.should.equal('palabra123')

  })

  it('lee un nombre reservado', () => {
    let source = new SourceWrapper('variables')
    let token = new WordToken(source)

    token.kind.should.equal('variables')
    token.text.should.equal('variables')
  })

  it('se detiene al encontrar un caracter que no sea numero o letra', () => {
    let source = new SourceWrapper('nombre24 chau')
    let token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('nombre24')
  })

  it('funciona con nombres que contengan guion bajo', () => {
    let source = new SourceWrapper('costo_total')
    let token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('costo_total')
  })
})

describe('NumberToken', () => {
  it('lee un entero', () => {
    let source = new SourceWrapper('22')

    let token = new NumberToken(source)

    token.kind.should.equal('entero')
    token.text.should.equal('22')
    token.value.should.equal(22)
  })

  it('lee un real', () => {
    let source = new SourceWrapper('3.1487')
    let token = new NumberToken(source)

    token.kind.should.equal('real')
    token.text.should.equal('3.1487')
    token.value.should.equal(3.1487)
  })

  it('devuelve un error al encontrar un caracter no permitido en un real', () => {
    let source = new SourceWrapper('3.A')
    let token = new NumberToken(source)

    token.kind.should.equal('LEXICAL_ERROR')
    token.text.should.equal('3.')
    token.unexpectedChar.should.equal('A')
    token.line.should.equal(0)
    token.column.should.equal(2)
  })
})

describe('StringToken', () => {
  it('lee una cadena', () => {
    {
      let source = new SourceWrapper('"Hola Mundo"')
      let token = new StringToken(source)

      token.kind.should.equal('string')
      token.text.should.equal('"Hola Mundo"')
      token.value.should.equal('Hola Mundo')
    }

    {
      let source = new SourceWrapper('"hasta que los chanchos vuelen..."')
      let token = new StringToken(source)

      token.kind.should.equal('string')
      token.text.should.equal('"hasta que los chanchos vuelen..."')
      token.value.should.equal('hasta que los chanchos vuelen...')
    }
  })

  it('devuelve error al encontrar \\n en medio de una cadena', () => {
    let source = new SourceWrapper('"Hola \n Mundo"')
    let token = new StringToken(source)

    token.kind.should.equal('LEXICAL_ERROR')
    token.unexpectedChar.should.equal('\n')
    token.line.should.equal(0)
    token.column.should.equal(6)
  })
})

describe('SpecialSymbolToken', () => {
  it ('isSpecialSymbolChar funciona', () => {
    SpecialSymbolToken.isSpecialSymbolChar('<').should.equal(true)
  })

  it('lee operadores aritmeticos', () => {
    let source = new SourceWrapper('+')
    let token = new SpecialSymbolToken(source)

    token.kind.should.equal('plus')
    token.text.should.equal('+')

    source = new SourceWrapper('-')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('minus')
    token.text.should.equal('-')

    source = new SourceWrapper('*')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('times')
    token.text.should.equal('*')

    source = new SourceWrapper('/')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('divide')
    token.text.should.equal('/')

    source = new SourceWrapper('^')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('power')
    token.text.should.equal('^')

  })

  it('lee operadores relacionales', () => {
    let source = new SourceWrapper('<')
    let token = new SpecialSymbolToken(source)
    token.kind.should.equal('minor-than')
    token.text.should.equal('<')

    source = new SourceWrapper('=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('equal')
    token.text.should.equal('=')

    source = new SourceWrapper('<=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('minor-equal')
    token.text.should.equal('<=')

    source = new SourceWrapper('<>')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('diff-than')
    token.text.should.equal('<>')

    source = new SourceWrapper('>')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('major-than')
    token.text.should.equal('>')

    source = new SourceWrapper('>=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('major-equal')
    token.text.should.equal('>=')
  })

  it('lee otros simbolos', () => {
    let source = new SourceWrapper('(')
    let token = new SpecialSymbolToken(source)
    token.kind.should.equal('left-par')
    token.text.should.equal('(')

    source = new SourceWrapper(')')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('right-par')
    token.text.should.equal(')')

    source = new SourceWrapper('[')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('left-bracket')
    token.text.should.equal('[')

    source = new SourceWrapper(']')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('right-bracket')
    token.text.should.equal(']')

    source = new SourceWrapper(',')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('comma')
    token.text.should.equal(',')

    source = new SourceWrapper('<-')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('assignment')
    token.text.should.equal('<-')
  })
})

describe('Lexer', () => {
  it('deberia fichar un numero, una palabra y otro numero para: "1a 2.3"', () => {
    let source = new SourceWrapper('1a 2.3')
    let tokenizer = new Lexer(source)
    let tokenArray = []

    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof' ) {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }

    // guarda el token EOF
    tokenArray.push(t)

    tokenArray[0].kind.should.equal('entero')
    tokenArray[1].kind.should.equal('word')
    tokenArray[2].kind.should.equal('real')
    tokenArray[3].kind.should.equal('eof')
  })

  it('deberia saltearse los comentarios', () => {
    let source = new SourceWrapper('//comentario\n')
    let tokenizer = new Lexer(source)

    let t = tokenizer.nextToken()
    let tokenArray = []

    while ( t.kind !== 'eof' ) {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    tokenArray[0].kind.should.equal('eol')
    tokenArray[1].kind.should.equal('eof')
  })

  it('deberia fichar todos los tokens de un programa modelo', () => {
    let programa = fs.readFileSync('./test/programa.md', 'utf-8')
    let source = new SourceWrapper(programa)
    let tokenizer = new Lexer(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    tokenArray[0].kind.should.equal('eol')

    tokenArray[1].kind.should.equal('eol')

    tokenArray[2].kind.should.equal('variables')
    tokenArray[3].kind.should.equal('eol')

    tokenArray[4].kind.should.equal('entero')
    tokenArray[5].kind.should.equal('word')
    tokenArray[6].kind.should.equal('comma')
    tokenArray[7].kind.should.equal('word')
    tokenArray[8].kind.should.equal('eol')

    tokenArray[9].kind.should.equal('inicio')
    tokenArray[10].kind.should.equal('eol')

    tokenArray[11].kind.should.equal('word')
    tokenArray[12].kind.should.equal('assignment')
    tokenArray[13].kind.should.equal('entero')
    tokenArray[14].kind.should.equal('eol')

    tokenArray[15].kind.should.equal('word')
    tokenArray[16].kind.should.equal('assignment')
    tokenArray[17].kind.should.equal('entero')
    tokenArray[18].kind.should.equal('eol')

    tokenArray[19].kind.should.equal('si')
    tokenArray[20].kind.should.equal('left-par')
    tokenArray[21].kind.should.equal('word')
    tokenArray[22].kind.should.equal('major-than')
    tokenArray[23].kind.should.equal('word')
    tokenArray[24].kind.should.equal('right-par')
    tokenArray[25].kind.should.equal('entonces')
    tokenArray[26].kind.should.equal('eol')

    tokenArray[27].kind.should.equal('word')
    tokenArray[28].kind.should.equal('left-par')
    tokenArray[29].kind.should.equal('string')
    tokenArray[30].kind.should.equal('right-par')
    tokenArray[31].kind.should.equal('eol')

    tokenArray[32].kind.should.equal('sino')
    tokenArray[33].kind.should.equal('eol')

    tokenArray[34].kind.should.equal('word')
    tokenArray[35].kind.should.equal('left-par')
    tokenArray[36].kind.should.equal('string')
    tokenArray[37].kind.should.equal('right-par')
    tokenArray[38].kind.should.equal('eol')

    tokenArray[39].kind.should.equal('fin')
    tokenArray[40].kind.should.equal('eol')
    tokenArray[41].kind.should.equal('eof')
  })
})

describe('TokenQueue', () => {
  it('funciona correctamente', () => {
    let q = new TokenQueue([1, 2, 3])

    q.current().should.equal(1)
    q.next().should.equal(2)
    q.next().should.equal(3)
    // devuelve un EoFToken cuando se alcanzó el final del arreglo
    q.peek().kind.should.equal('eof')
  })
})
