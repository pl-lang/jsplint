'use strict'
import should from 'should'

import Parser from '../src/parser/Parser.js'

import StaticChecker from '../src/typechecker/TypeChecker.js'

import DeclarationTransform from '../src/transformer/Checkable.js'
import EvaluatorTransform from '../src/transformer/Interpretable.js'
import TreeToRPNTransform from '../src/transformer/TreeToRPN.js'


import Evaluator from '../src/interpreter/Evaluator.js'

function programFromSource(string) {
  let parser = new Parser()

  let checker = new StaticChecker()

  checker.on('type-error', (...args) => {
    console.log(...args)
    throw new Error('Programa con error de tipado en una de las pruebas')
  })

  let parser_output = parser.parse(string).result

  let executable_ast = EvaluatorTransform(DeclarationTransform(TreeToRPNTransform(parser_output)))

  return executable_ast
}


describe.only('Evaluacion de programas y expresiones', () => {
  it('programa sin enunciados', () => {
    let code = `variables
    inicio
    fin
    `
    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({
      done:true,
      error:false,
      output:null
    })
  })

  it('programa con una asignacion a una variable', () => {
    let code = `variables
      entero a
    inicio
      a <- 2
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').a.value.should.equal(2)
  })

  it('programa con una asignacion a un vector', () => {
    let code = `variables
      entero v[5]
    inicio
      v[1] <- 5
      v[2] <- 8
      v[3] <- 7
      v[4] <- 9
      v[5] <- 3
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').v.values[0].should.equal(5)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').v.values[1].should.equal(8)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').v.values[2].should.equal(7)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').v.values[3].should.equal(9)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()
    output.should.deepEqual({done:true, error:false, output:null})
    evaluator.getLocals('main').v.values[4].should.equal(3)
  })

  it('programa con una asignacion a una matriz', () => {
    let code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      m[2, 1] <- 7
      m[2, 2] <- 9
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').m.values[0].should.equal(5)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').m.values[1].should.equal(8)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator.getLocals('main').m.values[2].should.equal(7)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})
    evaluator.getLocals('main').m.values[3].should.equal(9)
  })

  it('programa con 2 enunciados de asignacion', () => {
    let code = `variables
      entero a, b
    inicio
      a <- 25
      b <- 89
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    evaluator.getLocals('main').a.value.should.equal(25)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').b.value.should.equal(89)
  })

  it('programa con un llamado a escribir de un solo argumento', () => {
    let code = `variables
    inicio
      escribir(4)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[4]}})
  })

  it('programa con un llamado a escribir con varios argumentos', () => {
    let code = `variables
    inicio
      escribir(4, 3, 2, 1)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[4, 3, 2, 1]}})
  })

  it('programa que escribe el valor de una variable', () => {
    let code = `variables
      entero a
    inicio
      a <- 32
      escribir(a)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output = evaluator.step()

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[32]}})
  })

  it('programa que escribe los valores de un vector', () => {
    let code = `variables
      entero v[5]
    inicio
      v[1] <- 5
      v[2] <- 8
      v[3] <- 7
      v[4] <- 9
      v[5] <- 3
      escribir(v[1])
      escribir(v[2])
      escribir(v[3])
      escribir(v[4])
      escribir(v[5])
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    let output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[5]}})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[8]}})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[7]}})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[9]}})

    output = evaluator.step()
    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[3]}})
  })

  it('programa que escribe los valores de una matriz', () => {
    let code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      m[2, 1] <- 7
      m[2, 2] <- 9
      escribir(m[1, 1])
      escribir(m[1, 2])
      escribir(m[2, 1])
      escribir(m[2, 2])
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    evaluator.step()
    evaluator.step()

    let output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[5]}})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[8]}})

    output = evaluator.step()
    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[7]}})

    output = evaluator.step()
    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[9]}})
  })

  it('programa con una llamada a leer', () => {
    let code = `variables
      entero m
    inicio
      leer(m)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:{action:'read', type:'entero'}})

    evaluator.input(9)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').m.value.should.equal(9)
  })

  it('programa con una llamada a leer una celda de un vector', () => {
    let code = `variables
      entero v[2]
    inicio
      leer(v[1])
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:{action:'read', type:'entero'}})

    evaluator.input(9)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').v.values[0].should.equal(9)
  })

  it.skip('programa con un enunciado si', () => {
    let code = `variables
    inicio
      si (verdadero) entonces
        escribir(3)
      finsi
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step() // evalua la condicion

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[3]}})
  })

  it.skip('programa con un enunciado si/sino', () => {
    let code = `variables
    inicio
      si (verdadero = falso) entonces
        escribir(3)
      sino
        escribir(4)
      finsi
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[4]}})
  })

  it.skip('programa con un bucle mientras', () => {
    let code = `variables
      entero i
    inicio
      i <- 0
      mientras (i < 2)
        escribir(i)
        i <- i + 1
      finmientras
      escribir(i)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step() // i <- 0

    evaluator.getLocals('main').i.value.should.equal(0)

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[0]}})

    output = evaluator.step() // i <- i + 1

    output.should.deepEqual({done:false, error:false, output:null})

    evaluator.getLocals('main').i.value.should.equal(1)

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[1]}})

    output = evaluator.step() // i <- i + 1

    output.should.deepEqual({done:false, error:false, output:null})

    evaluator.getLocals('main').i.value.should.equal(2)

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[2]}})
  })

  it.skip('programa con un bucle para', () => {
    let code = `variables
      entero i
    inicio
      para i <- 0 hasta 1
        escribir(i)
      finpara
      escribir(i)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step() // i <- 0

    evaluator.getLocals('main').i.value.should.equal(0)

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[0]}})

    output = evaluator.step() // i <- i + 1

    output.should.deepEqual({done:false, error:false, output:null})

    evaluator.getLocals('main').i.value.should.equal(1)

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[1]}})

    output = evaluator.step() // i <- i + 1

    output.should.deepEqual({done:false, error:false, output:null})

    evaluator.getLocals('main').i.value.should.equal(2)

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[2]}})
  })

  it.skip('programa con un bucle repetir', () => {
    let code = `variables
      entero i
    inicio
      i <- 0
      repetir
        escribir(i)
        i <- i + 1
      hasta que (i = 2)
      escribir(i)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step() // asigna 0 a i

    evaluator.getLocals('main').i.value.should.equal(0)

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[0]}})

    output = evaluator.step() // i <- i + 1

    evaluator.getLocals('main').i.value.should.equal(1)

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step() // evalua la condicion del bucle

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:false, error:false, output:{action:'write', values:[1]}})

    output = evaluator.step() // i <- i + 1

    evaluator.getLocals('main').i.value.should.equal(2)

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step() // evalua la condicion del bucle

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step() // escribir(i)

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[2]}})
  })

  describe('Evaluacion de expresiones', () => {
    it.skip('multiplicacion', () => {
      // 2*3
      {
        let code = `variables
          entero a
        inicio
          a <- 2*3
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2*3)
      }

      // -2*-3
      {
        let code = `variables
          entero a
        inicio
          a <- -2*-3
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(-2*-3)
      }

      // 2*2*2
      {
        let code = `variables
          entero a
        inicio
          a <- 2*2*2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2*2*2)
      }

      {
        let code = `variables
          entero a, b, c
        inicio
          a <- 2
          b <- 6
          c <- a * b
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output

        output = evaluator.step()

        output.should.deepEqual({done:false, error:false, output:null})

        output = evaluator.step()

        output.should.deepEqual({done:false, error:false, output:null})

        output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').c.value.should.equal(12)
      }

      {
        let code = `variables
          entero v[3]
        inicio
          v[1] <- 2
          v[2] <- 6
          v[3] <- v[1] * v[2]
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output

        output = evaluator.step()

        output.should.deepEqual({done:false, error:false, output:null})

        output = evaluator.step()

        output.should.deepEqual({done:false, error:false, output:null})

        output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').v.values[2].should.equal(12)
      }
    })

    it.skip('division', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 3/2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(3/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- -3/-2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(-3/-2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+3/3+4
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2+3/3+4)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 3/2/2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(3/2/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2/2/2/2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2/2/2/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 4/2/2/2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(4/2/2/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2/2/2/4
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2/2/2/4)
      }
    })

    it.skip('resta', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 3-3-3
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(3-3-3)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- (3-3-3)
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal((3-3-3))
      }
    })

    it.skip('suma', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 2+43
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2+43)
      }
    })

    it.skip('operaciones combinadas', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 2-(2-3)
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2-(2-3))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+(2+3)
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2+(2+3))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+(2+3*4)
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2+(2+3*4))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- (3*2)-6
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal((3*2)-6)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- (-(-(2+2)))
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal((-(-(2+2))))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+8/2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(2+8/2)
      }
    })

    it.skip('relacionales', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 2 = 2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 <> 2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(false)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 >= 2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 <= 2
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 5 > 4
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 < 4
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- verdadero or falso
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- verdadero and falso
        fin`

        let modules = programFromSource(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        output.should.deepEqual({done:true, error:false, output:null})

        evaluator.getLocals('main').a.value.should.equal(false)
      }
    })

    it.skip('prueba que no deberia fallar', () => {
      let code = `variables
        entero a
      inicio
        a <- 2 + 2 = 4
      fin`

      let modules = programFromSource(code).modules

      let evaluator = new Evaluator(modules)

      let output = evaluator.step()

      output.should.deepEqual({done:true, error:false, output:null})

      evaluator.getLocals('main').a.value.should.equal(true)
    })
  })

  describe.skip('Programas con funciones o procedimientos', () => {
    it.skip('procedimiento sencillo', () => {
      let code = `variables
      inicio
        informar(2)
      fin

      procedimiento informar(entero a)
      inicio
        escribir(a)
      finprocedimiento
      `
      let modules = programFromSource(code).modules

      let evaluator = new Evaluator(modules)

      let output = evaluator.step()

      output.should.deepEqual({done:false, error:false, output:null})

      output = evaluator.step()

      output.should.deepEqual({done:false, error:false, output:{action:'write', values:[2]}})

      output = evaluator.step()

      output.should.deepEqual({done:true, error:false, output:null})
    })
  })
})
