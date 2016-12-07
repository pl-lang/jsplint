'use strict'
import 'should'

import Parser from '../src/parser/Parser.js'

import stage1_transform from '../src/transformer/Declarator'
import stage2_transform from '../src/transformer/CallDecorator'
import stage3_transform from '../src/transformer/Interpretable'

import {Evaluator} from '../src/interpreter/Evaluator'

import transform from '../src/transformer/transform'

function parse (s: string) {
    const p = new Parser()

    p.on('syntax-error', console.log)

    return p.parse(s)
}


describe('Evaluacion de programas y expresiones', () => {
  it('programa sin enunciados', () => {
    let code = `variables
    inicio
    fin
    `
    let modules = parse(code)

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

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').a.values[0].should.equal(2)
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

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false) {
      output = evaluator.step()
    }

    evaluator.getLocals('main').v.values[0].should.equal(5)
    evaluator.getLocals('main').v.values[1].should.equal(8)
    evaluator.getLocals('main').v.values[2].should.equal(7)
    evaluator.getLocals('main').v.values[3].should.equal(9)
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

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false) {
      output = evaluator.step()
    }

    evaluator.getLocals('main').m.values[0].should.equal(5)
    evaluator.getLocals('main').m.values[1].should.equal(8)
    evaluator.getLocals('main').m.values[2].should.equal(7)
    evaluator.getLocals('main').m.values[3].should.equal(9)
  })

  it('programa con un llamado a escribir de un solo argumento', () => {
    let code = `variables
    inicio
      escribir(4)
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    evaluator.step()

    let output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:4}})
  })

  it('programa con un llamado a escribir con varios argumentos', () => {
    let code = `variables
    inicio
      escribir(4, 3, 2, 1)
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output

    evaluator.step()

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:4}})

    evaluator.step()

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:3}})

    evaluator.step()

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:2}})

    evaluator.step()

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:1}})
  })

  it('programa que escribe el valor de una variable', () => {
    let code = `variables
      entero a
    inicio
      a <- 32
      escribir(a)
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:32}})
  })

  it('programa que escribe los valores de un vector', () => {
    let code = `variables
      entero v[2]
    inicio
      v[1] <- 5
      v[2] <- 8
      escribir(v[1])
      escribir(v[2])
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output == null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:5}})

    output = evaluator.step()

    while (output.done == false && output.output == null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:8}})
  })

  it('programa que escribe los valores de una matriz', () => {
    let code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      escribir(m[1, 1])
      escribir(m[1, 2])
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:5}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:8}})
  })

  it('programa con una llamada a leer', () => {
    let code = `variables
      entero m
    inicio
      leer(m)
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'read', type:'entero'}})

    evaluator.input(9)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').m.values[0].should.equal(9)
  })

  it('programa con una llamada a leer una celda de un vector', () => {
    let code = `variables
      entero v[2]
    inicio
      leer(v[1])
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'read', type:'entero'}})

    evaluator.input(9)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator.getLocals('main').v.values[0].should.equal(9)
  })

  it('programa con un enunciado si', () => {
    let code = `variables
    inicio
      si (verdadero) entonces
        escribir(3)
      finsi
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step() // evalua la condicion

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:3}})
  })

  it('programa con un enunciado si/sino', () => {
    let code = `variables
    inicio
      si (verdadero = falso) entonces
        escribir(3)
      sino
        escribir(4)
      finsi
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:4}})
  })

  it('programa con un bucle mientras', () => {
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

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:0}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:1}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:2}})
  })

  it('programa con un bucle para', () => {
    let code = `variables
      entero i
    inicio
      para i <- 0 hasta 2
        escribir(i)
      finpara
    fin`

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:0}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:1}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:2}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:null})
  })

  it('programa con un bucle repetir', () => {
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

    let modules = parse(code).modules

    let evaluator = new Evaluator(modules)

    let output

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:0}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:false, error:false, output:{action:'write', value:1}})

    output = evaluator.step()

    while (output.done == false && output.output === null) {
      output = evaluator.step()
    }

    output.should.deepEqual({done:true, error:false, output:{action:'write', value:2}})
  })

  describe('Evaluacion de expresiones', () => {
    it('multiplicacion', () => {
      // 2*3
      {
        let code = `variables
          entero a
        inicio
          a <- 2*3
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2*3)
      }

      // -2*-3
      {
        let code = `variables
          entero a
        inicio
          a <- -2*-3
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(-2*-3)
      }

      // 2*2*2
      {
        let code = `variables
          entero a
        inicio
          a <- 2*2*2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2*2*2)
      }

      {
        let code = `variables
          entero a, b, c
        inicio
          a <- 2
          b <- 6
          c <- a * b
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').c.values[0].should.equal(12)
      }

      {
        let code = `variables
          entero v[3]
        inicio
          v[1] <- 2
          v[2] <- 6
          v[3] <- v[1] * v[2]
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').v.values[2].should.equal(12)
      }
    })

    it('division', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 3/2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(3/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- -3/-2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(-3/-2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+3/3+4
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2+3/3+4)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 3/2/2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(3/2/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2/2/2/2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2/2/2/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 4/2/2/2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(4/2/2/2)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2/2/2/4
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2/2/2/4)
      }
    })

    it('resta', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 3-3-3
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(3-3-3)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- (3-3-3)
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal((3-3-3))
      }
    })

    it('suma', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 2+43
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2+43)
      }
    })

    it('operaciones combinadas', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 2-(2-3)
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2-(2-3))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+(2+3)
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }
        evaluator.getLocals('main').a.values[0].should.equal(2+(2+3))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+(2+3*4)
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2+(2+3*4))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- (3*2)-6
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal((3*2)-6)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- (-(-(2+2)))
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal((-(-(2+2))))
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2+8/2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(2+8/2)
      }
    })

    it('relacionales', () => {
      {
        let code = `variables
          entero a
        inicio
          a <- 2 = 2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 <> 2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(false)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 >= 2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 <= 2
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 5 > 4
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- 2 < 4
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- verdadero or falso
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(true)
      }

      {
        let code = `variables
          entero a
        inicio
          a <- verdadero and falso
        fin`

        let modules = parse(code).modules

        let evaluator = new Evaluator(modules)

        let output = evaluator.step()

        while (output.done == false && output.output === null) {
          output = evaluator.step()
        }

        evaluator.getLocals('main').a.values[0].should.equal(false)
      }
    })

    it('prueba que no deberia fallar', () => {
      let code = `variables
        entero a
      inicio
        a <- 2 + 2 = 4
      fin`

      let modules = parse(code).modules

      let evaluator = new Evaluator(modules)

      let output = evaluator.step()

      while (output.done == false && output.output === null) {
        output = evaluator.step()
      }

      evaluator.getLocals('main').a.values[0].should.equal(true)
    })
  })

  describe('Programas con funciones o procedimientos', () => {
    it('procedimiento sencillo', () => {
      let code = `variables
      inicio
        informar(2)
      fin

      procedimiento informar(entero a)
      inicio
        escribir(a)
      finprocedimiento
      `
      let modules = parse(code).modules

      let evaluator = new Evaluator(modules)

      let output = evaluator.step()

      while (output.done == false && output.output === null) {
        output = evaluator.step()
      }

      output.should.deepEqual({done:true, error:false, output:{action:'write', value:2}})
    })
  })
})
