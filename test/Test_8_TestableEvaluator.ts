'use strict'
import 'should'

import Parser from '../src/parser/Parser.js'

import { ParsedProgram, S1, S3, Errors, Success, Failure, Read, Write, NullAction, Paused } from '../src/interfaces'
import { Vector, Scalar } from '../src/interfaces'

import Evaluator from '../src/interpreter/Evaluator'

import transform from '../src/transforms/transform'

function run(e: Evaluator) {
  let output = e.step()

  while (output.error == false) {
    if (output.result.done || output.result.action == 'read' || output.result.action == 'write') {
      return output as (Success<Read> | Success<Write> | Success<NullAction>)
    }
    else {
      output = e.step()
    }
  }
}

function compile(p: Failure<Errors.Lexical[] | Errors.Pattern[]> | Success<ParsedProgram>): S3.Program {
  if (p.error) {
    // for (let error of p.result) {
    //   console.log(error)
    // }
    throw new Error('Se encontraron errores durante la transformacion')
  }
  else if (p.error == false) {
    const tp = transform(p.result)
    if (tp.error) {
      // for (let error of tp.result) {
      //   console.log(error)
      // }
      throw new Error('Se encontraron errores durante la transformacion')
    }
    else if (tp.error == false) {
      return tp.result
    }
  }
}

function parse(s: string) {
  const p = new Parser()

  p.on('syntax-error', console.log)

  return p.parse(s)
}


describe('Evaluacion de programas y expresiones', () => {
  it('programa sin enunciados', () => {
    const code = `variables
    inicio
    fin
    `
    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    const output = evaluator.step()

    output.result.should.deepEqual({
      kind: 'action', action: 'none',
      done: true
    })
  })

  it('programa con una asignacion a una variable', () => {
    const code = `variables
      entero a
    inicio
      a <- 2
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal(2)
  })

  it('asignar una cadena a un vector', () => {
    const code = `variables
      caracter v[4]
    inicio
      v <- "hola"
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const v = e.get_globals()['v'] as Vector

    v.values[0].should.equal("h")
    v.values[1].should.equal("o")
    v.values[2].should.equal("l")
    v.values[3].should.equal("a")
  })

  it('programa con una asignacion a un vector', () => {
    const code = `variables
      entero v[5]
    inicio
      v[1] <- 5
      v[2] <- 8
      v[3] <- 7
      v[4] <- 9
      v[5] <- 3
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const v = e.get_globals()['v'] as Vector

    v.values[0].should.equal(5)
    v.values[1].should.equal(8)
    v.values[2].should.equal(7)
    v.values[3].should.equal(9)
    v.values[4].should.equal(3)
  })

  it('copiar un vector a otro', () => {
    const code = `variables
      entero a[3], b[3]
    inicio
      a[1] <- 1
      a[2] <- 2
      a[3] <- 3
      b <- a
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const b = e.get_globals()['b'] as Vector

    b.values[0].should.equal(1)
    b.values[1].should.equal(2)
    b.values[2].should.equal(3)
  })

  it('programa con una asignacion a una matriz', () => {
    const code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      m[2, 1] <- 7
      m[2, 2] <- 9
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const m = e.get_globals()['m'] as Vector

    m.values[0].should.equal(5)
    m.values[1].should.equal(8)
    m.values[2].should.equal(7)
    m.values[3].should.equal(9)
  })

  it('copiar una matriz a otra', () => {
    const code = `variables
      entero m[2, 2], n[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      m[2, 1] <- 7
      m[2, 2] <- 9
      n <- m
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const n = e.get_globals()['n'] as Vector

    n.values[0].should.equal(5)
    n.values[1].should.equal(8)
    n.values[2].should.equal(7)
    n.values[3].should.equal(9)
  })

  it('copiar vector a fila de matriz', () => {
    const code = `variables
      entero n[2], m[2, 2]
    inicio
      n[1] <- 5
      n[2] <- 8
      m[1] <- n
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const m = e.get_globals()['m'] as Vector

    m.values[0].should.equal(5)
    m.values[1].should.equal(8)
  })

  it('copiar fila de matriz a vector', () => {
    const code = `variables
      entero n[2], m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      n <- m[1]
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const n = e.get_globals()['n'] as Vector

    n.values[0].should.equal(5)
    n.values[1].should.equal(8)
  })

  it('programa con un llamado a escribir de un solo argumento', () => {
    const code = `variables
    inicio
      escribir(4)
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.error.should.equal(false)
    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 4 })
  })

  it('escribir una cadena literal', () => {
    const code = `variables
    inicio
      escribir("hola")
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    let output = run(evaluator)

    output.error.should.equal(false)
    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: "hola" })
  })

  it('programa con un llamado a escribir con varios argumentos', () => {
    const code = `variables
    inicio
      escribir(4, 3, 2, 1)
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 4 })

    output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 3 })

    output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 2 })

    output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 1 })
  })

  it('programa que escribe el valor de una variable', () => {
    const code = `variables
      entero a
    inicio
      a <- 32
      escribir(a)
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 32 })
  })

  it('programa que escribe los valores de un vector', () => {
    const code = `variables
      entero v[2]
    inicio
      v[1] <- 5
      v[2] <- 8
      escribir(v[1])
      escribir(v[2])
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 5 })

    output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 8 })
  })

  it('programa que escribe los valores de una matriz', () => {
    const code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      escribir(m[1, 1])
      escribir(m[1, 2])
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 5 })

    output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 8 })
  })

  it('programa con una llamada a leer', () => {
    const code = `variables
      entero m
    inicio
      leer(m)
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.error.should.equal(false)

    const { done, action, name } = output.result as Read

    done.should.equal(false)
    action.should.equal('read')
    name.should.equal('m')

    e.input(2)

    output = run(e)

    output.error.should.equal(false)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

    const m = e.get_globals()['m'] as Scalar
    m.value.should.equal(2)
  })

  it('programa con una llamada a leer una celda de un vector', () => {
    const code = `variables
      entero v[2]
    inicio
      leer(v[1])
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.error.should.equal(false)

    const { done, action, name } = output.result as Read

    done.should.equal(false)
    action.should.equal('read')
    name.should.equal('v')

    e.input(9)

    output = run(e)

    output.error.should.equal(false)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

    const v = e.get_globals()['v'] as Vector

    v.values[0].should.equal(9)
  })

  it('lectura de una cadena', () => {
    const code = `
        variables
          caracter v[4]
        inicio
          leer(v)
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.error.should.equal(false)

    const { done, action, name } = output.result as Read

    done.should.equal(false)
    action.should.equal('read')
    name.should.equal('v')

    e.input('hola')

    output = run(e)

    output.error.should.equal(false)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

    const v = e.get_globals()['v'] as Vector
    v.values[0].should.equal('h')
    v.values[1].should.equal('o')
    v.values[2].should.equal('l')
    v.values[3].should.equal('a')

    e.get_value_stack().length.should.equal(0)
  })

  it('escribir cadena leida', () => {
    const code = `
        variables
          caracter v[4]
        inicio
          leer(v)
          escribir(v)
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.error.should.equal(false)

    const { done, action, name } = output.result as Read

    done.should.equal(false)
    action.should.equal('read')
    name.should.equal('v')

    e.input('hola')

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'write', value: 'hola' } })
  })

  it('escribir cadena asignada', () => {
    const code = `
        variables
          caracter v[4]
        inicio
          v <- "hola"
          escribir(v)
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'write', value: 'hola' } })
  })

  it('programa con un enunciado si', () => {
    const code = `variables
    inicio
      si (verdadero) entonces
        escribir(3)
      finsi
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 3 })
  })

  it('programa con un enunciado si/sino', () => {
    const code = `variables
    inicio
      si (verdadero = falso) entonces
        escribir(3)
      sino
        escribir(4)
      finsi
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 4 })
  })

  it('programa con un bucle mientras', () => {
    const code = `variables
      entero i
    inicio
      i <- 0
      mientras (i < 2)
        escribir(i)
        i <- i + 1
      finmientras
      escribir(i)
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 0 })

    output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 1 })

    output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 2 })
  })

  it('programa con un bucle para', () => {
    const code = `variables
      entero i
    inicio
      para i <- 0 hasta 2
        escribir(i)
      finpara
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 0 })

    output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 1 })

    output = run(e)

    // en este retorno `done` es `false` porque despues del ultimo enunciado del cuerpo del bucle
    // va la evaluacion de la condicon
    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 2 })
  })

  it('programa con un bucle repetir', () => {
    const code = `variables
      entero i
    inicio
      i <- 0
      repetir
        escribir(i)
        i <- i + 1
      hasta que (i = 2)
      escribir(i)
    fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 0 })

    output = run(e)

    output.result.should.deepEqual({ done: false, kind: 'action', action: 'write', value: 1 })

    output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 2 })
  })

  describe('Evaluacion de expresiones', () => {
    describe('multiplicacion', () => {
      it('2*3', () => {
        const code = `variables
          entero a
        inicio
          a <- 2*3
        fin`

        const p = compile(parse(code))

        const e = new Evaluator(p)

        let output = run(e)

        const a = e.get_globals()['a'] as Scalar

        a.value.should.equal(2 * 3)
      })

      // -2*-3
      it('-2*-3', () => {
        const code = `variables
          entero a
        inicio
          a <- neg 2 * neg 3
        fin`

        const p = compile(parse(code))

        const e = new Evaluator(p)

        let output = run(e)

        const a = e.get_globals()['a'] as Scalar

        a.value.should.equal(-2 * -3)
      })

    // 2*2*2
    it('2*2*2', () => {
      const code = `variables
          entero a
        inicio
          a <- 2*2*2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(2 * 2 * 2)
    })

    it('a*b', () => {
      const code = `variables
          entero a, b, c
        inicio
          a <- 2
          b <- 6
          c <- a * b
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const c = e.get_globals()['c'] as Scalar

      c.value.should.equal(12)
    })

    it('v[1]*v[2]', () => {
      const code = `variables
          entero v[3]
        inicio
          v[1] <- 2
          v[2] <- 6
          v[3] <- v[1] * v[2]
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const v = e.get_globals()['v'] as Vector

      v.values[2].should.equal(12)
    })
  })

  describe('division', () => {
    it('3/2', () => {
      const code = `variables
          real a
        inicio
          a <- 3/2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(3 / 2)
    })

    it('neg 3/neg 2', () => {

      const code = `variables
          real a
        inicio
          a <- neg 3/neg 2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(-3 / -2)
    })

    it('2+3/3+4', () => {
      const code = `variables
          real a
        inicio
          a <- 2+3/3+4
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(2 + 3 / 3 + 4)
    })

    it('3/2/2', () => {
      const code = `variables
          real a
        inicio
          a <- 3/2/2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(3 / 2 / 2)
    })

    it('2/2/2/2', () => {
      const code = `variables
          real a
        inicio
          a <- 2/2/2/2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(2 / 2 / 2 / 2)
    })

    it('4/2/2/2', () => {
      const code = `variables
          real a
        inicio
          a <- 4/2/2/2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(4 / 2 / 2 / 2)
    })

    it('2/2/2/4', () => {
      const code = `variables
            real a
          inicio
            a <- 2/2/2/4
          fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(2 / 2 / 2 / 4)
    })
  })

  describe('resta', () => {
    it('3-3-3', () => {
      const code = `variables \n entero a \n inicio \n a <- 3-3-3 \n fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(3 - 3 - 3)
    })

    it('(3-3-3)', () => {
      const code = `variables
          entero a
        inicio
          a <- (3-3-3)
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal((3 - 3 - 3))
    })
  })

  describe('suma', () => {
    it('2+43', () => {
      const code = `variables
          entero a
        inicio
          a <- 2+43
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(2 + 43)
    })
  })

  describe('operaciones combinadas', () => {
    it('2-(2-3)', () => {
      const code = `variables
          entero a
        inicio
          a <- 2-(2-3)
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(2 - (2 - 3))
    })
  })

  it('2+(2+3)', () => {
    const code = `variables
          entero a
        inicio
          a <- 2+(2+3)
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)
    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal(2 + (2 + 3))
  })

  it('2+(2+3*4)', () => {
    const code = `variables
          entero a
        inicio
          a <- 2+(2+3*4)
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal(2 + (2 + 3 * 4))
  })

  it('3*(2-6)', () => {
    const code = `variables
          entero a
        inicio
          a <- (3*2)-6
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal((3 * 2) - 6)
  })

  it('(neg(neg(2+2)))', () => {
    const code = `variables
          entero a
        inicio
          a <- (neg(neg(2+2)))
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal((-(-(2 + 2))))
  })

  it('2+8/2', () => {
    const code = `variables
          real a
        inicio
          a <- 2+8/2
        fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal(2 + 8 / 2)
  })

  describe('relacionales', () => {
    it('2 = 2', () => {
      const code = `variables
          logico a
        inicio
          a <- 2 = 2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })

    it('2 <> 2', () => {
      const code = `variables
          logico a
        inicio
          a <- 2 <> 2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(false)
    })

    it('2 >= 2', () => {
      const code = `variables
          logico a
        inicio
          a <- 2 >= 2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })

    it('2 <= 2', () => {
      const code = `variables
          logico a
        inicio
          a <- 2 <= 2
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })

    it('5 > 4', () => {
      const code = `variables
          logico a
        inicio
          a <- 5 > 4
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })

    it('2 < 4', () => {
      const code = `variables
          logico a
        inicio
          a <- 2 < 4
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })

    it('verdadero or falso', () => {
      const code = `variables
          logico a
        inicio
          a <- verdadero or falso
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })

    it('verdadero and falso', () => {
      const code = `variables
          logico a
        inicio
          a <- verdadero and falso
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(false)
    })

    it('not verdadero', () => {
      const code = `variables
          logico a
        inicio
          a <- not verdadero
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(false)
    })

    it('not falso', () => {
      const code = `variables
          logico a
        inicio
          a <- not falso
        fin`

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      const a = e.get_globals()['a'] as Scalar

      a.value.should.equal(true)
    })
  })

  it('prueba que no deberia fallar', () => {
    const code = `variables
        logico a
      inicio
        a <- 2 + 2 = 4
      fin`

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    const a = e.get_globals()['a'] as Scalar

    a.value.should.equal(true)
  })
})

describe('Programas con funciones o procedimientos', () => {
  it('procedimiento sencillo', () => {
    const code = `variables
      inicio
        informar(2)
      fin

      procedimiento informar(entero a)
      inicio
        escribir(a)
      finprocedimiento
      `
    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.result.should.deepEqual({ done: true, kind: 'action', action: 'write', value: 2 })
  })

  it('funcion sencilla', () => {
    const code = `
      variables
        entero a
      inicio
        a <- sumar(2, 6)
      fin
      
      entero funcion sumar(entero a, entero b)
      inicio
        retornar a + b
      finfuncion
      `

    const p = compile(parse(code))

    const e = new Evaluator(p)

    const output = run(e)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

    const a = e.get_globals()['a'] as Scalar
    a.value.should.equal(8)
  })

  it('pasar un vector como argumento', () => {
    const code = `
        variables
          entero a[3]
        inicio
          a[1] <- 1
          a[2] <- 2
          a[3] <- 3
          p(a)
        fin

        procedimiento p(entero b[3])
        inicio
          escribir(b[1])
          escribir(b[2])
          escribir(b[3])
        finprocedimiento
        `

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 1 } })

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 2 } })

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'write', value: 3 } })
  })

  it('pasar una fila de matriz como argumento', () => {
    const code = `
        variables
          entero a[2, 3]
        inicio
          a[1, 1] <- 1
          a[1, 2] <- 2
          a[1, 3] <- 3
          p(a[1])
        fin

        procedimiento p(entero b[3])
        inicio
          escribir(b[1])
          escribir(b[2])
          escribir(b[3])
        finprocedimiento
        `

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 1 } })

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 2 } })

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'write', value: 3 } })
  })

  it('pasar un matriz como argumento', () => {
    const code = `
        variables
          entero a[2, 2]
        inicio
          a[1, 1] <- 1
          a[1, 2] <- 2
          a[2, 1] <- 3
          a[2, 2] <- 4
          p(a)
        fin

        procedimiento p(entero b[2, 2])
        inicio
          escribir(b[1, 1])
          escribir(b[1, 2])
          escribir(b[2, 1])
          escribir(b[2, 2])
        finprocedimiento
        `

    const p = compile(parse(code))

    const e = new Evaluator(p)

    let output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 1 } })

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 2 } })

    output = run(e)

    output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 3 } })

    output = run(e)


    output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'write', value: 4 } })
  })

  describe('parametros por referencia', () => {
    it('variable normal por referencia ', () => {
      const code = `
        variables
          entero a
        inicio
          a <- 16
          p(a)
        fin

        procedimiento p(entero ref b)
        inicio
          b <- 32
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const a = e.get_globals()['a'] as Scalar
      a.value.should.equal(32)
    })

    it('pasar celda de vector', () => {
      const code = `
        variables
          entero a[2]
        inicio
          a[1] <- 16
          p(a[1])
        fin

        procedimiento p(entero ref b)
        inicio
          b <- 32
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const a = e.get_globals()['a'] as Vector
      a.values[0].should.equal(32)
    })

    it('pasar variable de un modulo a otro', () => {
      const code = `
        variables
          entero a
        inicio
          a <- p(2)
        fin

        entero funcion p(entero inutil)
          entero b
        inicio
          b <- 32
          o(b)
          retornar b
        finfuncion

        procedimiento o(entero ref c)
        inicio
          c <- 48
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const a = e.get_globals()['a'] as Scalar
      a.value.should.equal(48)
    })

    it('parametro tomado por referencia pasado por referencia a otro modulo', () => {
      const code = `
        variables
          entero a
        inicio
          p(a)
        fin

        procedimiento p(entero ref b)
        inicio
          b <- 32
          o(b)
        finprocedimiento

        procedimiento o(entero ref c)
        inicio
          c <- 48
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const a = e.get_globals()['a'] as Scalar
      a.value.should.equal(48)
    })

    it('pasar vector entero', () => {
      const code = `
        variables
          entero v[3]
        inicio
          inicializar(v)
        fin

        procedimiento inicializar(entero ref b[3])
          entero i
        inicio
          para i <- 1 hasta 3
            b[i] <- i
          finpara
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const a = e.get_globals()['v'] as Vector
      a.values[0].should.equal(1)
      a.values[1].should.equal(2)
      a.values[2].should.equal(3)
    })

    it('pasar matriz entera', () => {
      const code = `
        variables
          entero m[2, 2]
        inicio
          inicializar(m)
        fin

        procedimiento inicializar(entero ref b[2, 2])
          entero i, j
        inicio
          para i <- 1 hasta 2
            para j <- 1 hasta 2
              b[i, j] <- i + j
            finpara
          finpara
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const m = e.get_globals()['m'] as Vector
      m.values[0].should.equal(2)
      m.values[1].should.equal(3)
      m.values[2].should.equal(3)
      m.values[3].should.equal(4)
    })

    it('pasar fila de matriz', () => {
      const code = `
        variables
          entero m[2, 2]
        inicio
          inicializar(m[1])
        fin

        procedimiento inicializar(entero ref b[2])
          entero i
        inicio
          para i <- 1 hasta 2
            b[i] <- i
          finpara
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const m = e.get_globals()['m'] as Vector
      m.values[0].should.equal(1)
      m.values[1].should.equal(2)
    })

    it('copiar vector a parametro referenciado', () => {
      const code = `
        variables
          entero v[3]
        inicio
          inicializar(v)
        fin

        procedimiento inicializar(entero ref tgt[3])
          entero v[3]
        inicio
          v[1] <- 1
          v[2] <- 2
          v[3] <- 3
          tgt <- v
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const v = e.get_globals()['v'] as Vector
      v.values[0].should.equal(1)
      v.values[1].should.equal(2)
      v.values[2].should.equal(3)
    })

    it('copiar valores desde un vector referenciado', () => {
      const code = `
        variables
          entero v[3]
        inicio
          v[1] <- 1
          v[2] <- 2
          v[3] <- 3
          p(v)
        fin

        procedimiento p(entero ref src[3])
          entero v[3]
        inicio
          v <- src
          escribir(v[1])
          escribir(v[2])
          escribir(v[3])
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      let output = run(e)

      output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 1 } })

      output = run(e)

      output.should.deepEqual({ error: false, result: { done: false, kind: 'action', action: 'write', value: 2 } })

      output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'write', value: 3 } })
    })

    it('copia de vectores referenciados', () => {
      const code = `
        variables
          entero v[3], w[3]
        inicio
          v[1] <- 1
          v[2] <- 2
          v[3] <- 3          
          copiar(v, w)
        fin

        procedimiento copiar(entero ref src[3], entero ref tgt[3])
        inicio
          tgt <- src
        finprocedimiento
        `

      const p = compile(parse(code))

      const e = new Evaluator(p)

      const output = run(e)

      output.should.deepEqual({ error: false, result: { done: true, kind: 'action', action: 'none' } })

      const w = e.get_globals()['w'] as Vector
      w.values[0].should.equal(1)
      w.values[1].should.equal(2)
      w.values[2].should.equal(3)
    })
  })
})
})
