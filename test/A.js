'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

describe('Source:', () => {
  it('funciona correctamente', () => {
    let string = fs.readFileSync('./test/ejemplo.md', 'utf-8')

    let source = new Source(string)

    source._currentLineIndex.should.equal(0)
    source._currentCharIndex.should.equal(0)
    source.currentChar().should.equal('1')
    source.nextChar().should.equal('\n')


    source.nextChar().should.equal('2')
    source._currentLineIndex.should.equal(1)
    source._currentCharIndex.should.equal(0)
    source.nextChar() // consume '\n'

    source.nextChar().should.equal('3')
    source._currentLineIndex.should.equal(2)
    source._currentCharIndex.should.equal(0)

    source.nextChar().should.equal('4')
    source._currentLineIndex.should.equal(2)
    source._currentCharIndex.should.equal(1)
    source.nextChar() // consume '\n'

    source.nextChar().should.equal(source.EOF)
  })

  it('cuenta bien los renglones', () => {
    let string = '0\n1\n2'
    let source = new Source(string)

    source._currentLineIndex.should.equal(0)
    source.nextChar()
    source.nextChar()

    source.currentChar().should.equal('1')
    source._currentLineIndex.should.equal(1)
    source.nextChar()
    source.nextChar()

    source._currentLineIndex.should.equal(2)
  })
})

describe('WordToken', () => {
  let WordToken = require('../frontend/tokens/WordToken.js')
  it('lee un nombre de variable', () => {
    let source = new Source('palabra123')

    let token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('palabra123')

  })

  it('lee un nombre reservado', () => {
    let source = new Source('variables')
    let token = new WordToken(source)

    token.kind.should.equal('variables')
    token.text.should.equal('variables')
  })

  it('se detiene al encontrar un caracter que no sea numero o letra', () => {
    let source = new Source('nombre24 chau')
    let token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('nombre24')
  })

  it('funciona con nombres que contengan guion bajo', () => {
    let source = new Source('costo_total')
    let token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('costo_total')
  })
})

describe('NumberToken', () => {
  let NumberToken = require('../frontend/tokens/NumberToken.js')
  it('lee un entero', () => {
    let source = new Source('22')

    let token = new NumberToken(source)

    token.kind.should.equal('integer')
    token.text.should.equal('22')
    token.value.should.equal(22)
  })

  it('lee un real', () => {
    let source = new Source('3.1487')
    let token = new NumberToken(source)

    token.kind.should.equal('float')
    token.text.should.equal('3.1487')
    token.value.should.equal(3.1487)
  })

  it('devuelve un error al encontrar un caracter no permitido en un real', () => {
    let source = new Source('3.A')
    let token = new NumberToken(source)

    token.kind.should.equal('LEXICAL_ERROR')
    token.text.should.equal('3.')
    token.errorInfo.unexpectedChar.should.equal('A')
    token.errorInfo.atLine.should.equal(0)
    token.errorInfo.atColumn.should.equal(2)
  })
})

describe('StringToken', () => {
  let StringToken = require('../frontend/tokens/StringToken.js')
  it('lee una cadena', () => {
    let source = new Source('"Hola Mundo"')
    let token = new StringToken(source)

    token.kind.should.equal('string')
    token.text.should.equal('"Hola Mundo"')
    token.value.should.equal('Hola Mundo')
  })

  it('devuelve error al encontrar \\n en medio de una cadena', () => {
    let source = new Source('"Hola \n Mundo"')
    let token = new StringToken(source)

    token.kind.should.equal('LEXICAL_ERROR')
    token.errorInfo.unexpectedChar.should.equal('\n')
    token.errorInfo.atLine.should.equal(0)
    token.errorInfo.atColumn.should.equal(5)
  })
})

describe('SpecialSymbolToken', () => {
  let SpecialSymbolToken = require('../frontend/tokens/SpecialSymbolToken.js')
  it ('isSpecialSymbolChar funciona', () => {
    SpecialSymbolToken.isSpecialSymbolChar('<').should.equal(true)
  })

  it('lee operadores aritmeticos', () => {
    let source = new Source('+')
    let token = new SpecialSymbolToken(source)

    token.kind.should.equal('plus')
    token.text.should.equal('+')

    source = new Source('-')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('minus')
    token.text.should.equal('-')

    source = new Source('*')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('times')
    token.text.should.equal('*')

    source = new Source('/')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('divide')
    token.text.should.equal('/')

    source = new Source('^')
    token = new SpecialSymbolToken(source)

    token.kind.should.equal('power')
    token.text.should.equal('^')

  })

  it('lee operadores relacionales', () => {
    let source = new Source('<')
    let token = new SpecialSymbolToken(source)
    token.kind.should.equal('minor-than')
    token.text.should.equal('<')

    source = new Source('=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('equal')
    token.text.should.equal('=')

    source = new Source('<=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('minor-equal')
    token.text.should.equal('<=')

    source = new Source('<>')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('diff-than')
    token.text.should.equal('<>')

    source = new Source('>')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('major-than')
    token.text.should.equal('>')

    source = new Source('>=')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('major-equal')
    token.text.should.equal('>=')
  })

  it('lee otros simbolos', () => {
    let source = new Source('(')
    let token = new SpecialSymbolToken(source)
    token.kind.should.equal('left-par')
    token.text.should.equal('(')

    source = new Source(')')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('right-par')
    token.text.should.equal(')')

    source = new Source('[')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('left-bracket')
    token.text.should.equal('[')

    source = new Source(']')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('right-bracket')
    token.text.should.equal(']')

    source = new Source(',')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('comma')
    token.text.should.equal(',')

    source = new Source('<-')
    token = new SpecialSymbolToken(source)
    token.kind.should.equal('assignment')
    token.text.should.equal('<-')
  })
})

describe('Parser', () => {
  let Parser = require('../frontend/Parser.js')
  it('deberia fichar un numero, una palabra y otro numero para: "1a 2.3"', () => {
    let source = new Source('1a 2.3')
    let tokenizer = new Parser(source)
    let tokenArray = []

    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof' ) {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }

    // guarda el token EOF
    tokenArray.push(t)

    tokenArray[0].kind.should.equal('integer')
    tokenArray[1].kind.should.equal('word')
    tokenArray[2].kind.should.equal('float')
    tokenArray[3].kind.should.equal('eof')
  })

  it('deberia fichar todos los tokens de un programa modelo', () => {
    let programa = fs.readFileSync('./test/programa.md', 'utf-8')
    let source = new Source(programa)
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    tokenArray[0].kind.should.equal('eol')
    tokenArray[1].kind.should.equal('variables')
    tokenArray[2].kind.should.equal('eol')
    tokenArray[3].kind.should.equal('entero')
    tokenArray[4].kind.should.equal('word')
    tokenArray[5].kind.should.equal('comma')
    tokenArray[6].kind.should.equal('word')
    tokenArray[7].kind.should.equal('eol')
    tokenArray[8].kind.should.equal('inicio')
    tokenArray[9].kind.should.equal('eol')
    tokenArray[10].kind.should.equal('word')
    tokenArray[11].kind.should.equal('assignment')
    tokenArray[12].kind.should.equal('integer')
    tokenArray[13].kind.should.equal('eol')
    tokenArray[14].kind.should.equal('word')
    tokenArray[15].kind.should.equal('assignment')
    tokenArray[16].kind.should.equal('integer')
    tokenArray[17].kind.should.equal('eol')
    tokenArray[18].kind.should.equal('si')
    tokenArray[19].kind.should.equal('left-par')
    tokenArray[20].kind.should.equal('word')
    tokenArray[21].kind.should.equal('major-than')
    tokenArray[22].kind.should.equal('word')
    tokenArray[23].kind.should.equal('right-par')
    tokenArray[24].kind.should.equal('entonces')
    tokenArray[25].kind.should.equal('eol')
    tokenArray[26].kind.should.equal('word')
    tokenArray[27].kind.should.equal('left-par')
    tokenArray[28].kind.should.equal('string')
    tokenArray[29].kind.should.equal('right-par')
    tokenArray[30].kind.should.equal('eol')
    tokenArray[31].kind.should.equal('sino')
    tokenArray[32].kind.should.equal('eol')
    tokenArray[33].kind.should.equal('word')
    tokenArray[34].kind.should.equal('left-par')
    tokenArray[35].kind.should.equal('string')
    tokenArray[36].kind.should.equal('right-par')
    tokenArray[37].kind.should.equal('eol')
    tokenArray[38].kind.should.equal('fin')
    tokenArray[39].kind.should.equal('eof')
  })
})

describe('TokenQueue', () => {
  let TokenQueue = require('../frontend/TokenQueue.js')
  it('funciona correctamente', () => {
    let q = new TokenQueue([1, 2, 3])

    q.current().should.equal(1)
    q.next().should.equal(2)
    q.next().should.equal(3)
    // devuelve un EoFToken cuando se alcanzó el final del arreglo
    q.peek().kind.should.equal('eof')
  })
})
