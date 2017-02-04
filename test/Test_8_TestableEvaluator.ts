'use strict'
import 'should'

import Parser from '../src/parser/Parser.js'

import { ParsedProgram, S1, S3, Errors, Success, Failure, Read } from '../src/interfaces'

import { Evaluator } from '../src/interpreter/Evaluator'

import transform from '../src/transformer/transform'

import fr_writer from '../src/utility/fr_writer'

function run (e: Evaluator) {
  let output = e.step()

  while (output.error == false && output.result.done == false && output.result.action != 'read' && output.result.action != 'write') {
    output = e.step()
  }

  return output
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
      action: 'none',
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

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    while (output.error == false && !output.result.done) {
      output = evaluator.step()
    }

    const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

    a.value.should.equal(2)
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

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()
    }

    const v = evaluator.get_locals('main')['v'] as S1.ArrayVariable

    v.values[0].should.equal(5)
    v.values[1].should.equal(8)
    v.values[2].should.equal(7)
    v.values[3].should.equal(9)
    v.values[4].should.equal(3)
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

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()
    }

    const m = evaluator.get_locals('main')['m'] as S1.ArrayVariable

    m.values[0].should.equal(5)
    m.values[1].should.equal(8)
    m.values[2].should.equal(7)
    m.values[3].should.equal(9)
  })

  it('programa con un llamado a escribir de un solo argumento', () => {
    const code = `variables
    inicio
      escribir(4)
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    evaluator.step()

    let output = evaluator.step()

    output.error.should.equal(false)
    output.result.should.deepEqual({ done: true, action: 'write', value: 4 })
  })

  it('programa con un llamado a escribir con varios argumentos', () => {
    const code = `variables
    inicio
      escribir(4, 3, 2, 1)
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    output = evaluator.step()

    output.result.should.deepEqual({ done: false, action: 'write', value: 4 })

    evaluator.step()

    output = evaluator.step()

    output.result.should.deepEqual({ done: false, action: 'write', value: 3 })

    evaluator.step()

    output = evaluator.step()

    output.result.should.deepEqual({ done: false, action: 'write', value: 2 })

    evaluator.step()

    output = evaluator.step()

    output.result.should.deepEqual({ done: true, action: 'write', value: 1 })
  })

  it('programa que escribe el valor de una variable', () => {
    const code = `variables
      entero a
    inicio
      a <- 32
      escribir(a)
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()
    }

    output.result.should.deepEqual({ done: true, action: 'write', value: 32 })
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

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    let w1: boolean = false, w2: boolean = false;

    while (output.result.done == false) {
      output = evaluator.step()

      if (output.error == false) {
        if (output.result.action == 'write') {
          if (output.result.value == 5) {
            w1 = true
          }
          else if (output.result.value == 8) {
            w2 = true
          }
        }
      }
    }

    w1.should.equal(true)
    w2.should.equal(true)
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

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    let w1: boolean = false, w2: boolean = false;

    while (output.result.done == false) {
      output = evaluator.step()

      if (output.error == false) {
        if (output.result.action == 'write') {
          if (output.result.value == 5) {
            w1 = true
          }
          else if (output.result.value == 8) {
            w2 = true
          }
        }
      }
    }

    w1.should.equal(true)
    w2.should.equal(true)
  })

  it('programa con una llamada a leer', () => {
    const code = `variables
      entero m
    inicio
      leer(m)
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    let error = output.error
    let data_read = false

    while (!error && output.result.done == false && !data_read) {
      if (output.error == false) {
        data_read = output.result.action == 'read'
      }
      else {
        error = true
      }

      if (!data_read) {
        output = evaluator.step()
      }
    }

    let {done, action} = (output as Success<Read>).result
    done.should.equal(false)
    action.should.equal('read')

    evaluator.input(9)

    output = evaluator.step()

    error = output.error

    while (!error && output.result.done == false) {
      output = evaluator.step()
      error = output.error
    }

    done = (output as Success<Read>).result.done
    action = (output as Success<Read>).result.action
    done.should.equal(true)
    action.should.equal('none')

    const m = evaluator.get_locals('main')['m'] as S1.RegularVariable

    m.value.should.equal(9)
  })

  it('programa con una llamada a leer una celda de un vector', () => {
    const code = `variables
      entero v[2]
    inicio
      leer(v[1])
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    let output = evaluator.step()

    let error = output.error
    let data_read = false

    while (!error && output.result.done == false && !data_read) {
      if (output.error == false) {
        data_read = output.result.action == 'read'
      }
      else {
        error = true
      }
      if (!data_read) {
        output = evaluator.step()
      }
    }

    let {done, action} = (output as Success<Read>).result
    done.should.equal(false)
    action.should.equal('read')

    evaluator.input(9)

    output = evaluator.step()

    error = output.error

    while (!error && output.result.done == false) {
      output = evaluator.step()
      error = output.error
    }

    done = (output as Success<Read>).result.done
    action = (output as Success<Read>).result.action
    done.should.equal(true)
    action.should.equal('none')

    const v = evaluator.get_locals('main')['v'] as S1.ArrayVariable

    v.values[0].should.equal(9)
  })

  it('programa con un enunciado si', () => {
    const code = `variables
    inicio
      si (verdadero) entonces
        escribir(3)
      finsi
    fin`

    const p = compile(parse(code))

    const evaluator = new Evaluator(p)

    let output = evaluator.step() // evalua la condicion

    while (output.result.done == false) {
      output = evaluator.step()
    }

    output.result.should.deepEqual({ done: true, action: 'write', value: 3 })
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

    const evaluator = new Evaluator(p)

    let w: boolean = false

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()

      if (output.error == false) {
        if (output.result.action == 'write') {
          if (output.result.value == 4) {
            w = true
          }
        }
      }
    }

    w.should.equal(true)
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

    const evaluator = new Evaluator(p)

    let w1: boolean = false, w2: boolean = false, w3: boolean = false;

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()

      if (output.error == false) {
        if (output.result.action == 'write') {
          switch (output.result.value) {
            case 0:
              w1 = true
              break
            case 1:
              w2 = true
              break
            case 2:
              w3 = true
              break
          }
        }
      }
    }

    w1.should.equal(true)
    w2.should.equal(true)
    w3.should.equal(true)
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

    const evaluator = new Evaluator(p)

    let w1: boolean = false, w2: boolean = false, w3: boolean = false;

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()

      if (output.error == false) {
        if (output.result.action == 'write') {
          switch (output.result.value) {
            case 0:
              w1 = true
              break
            case 1:
              w2 = true
              break
            case 2:
              w3 = true
              break
          }
        }
      }
    }

    w1.should.equal(true)
    w2.should.equal(true)
    w3.should.equal(true)
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

    const evaluator = new Evaluator(p)

    let w1: boolean = false, w2: boolean = false, w3: boolean = false;

    let output = evaluator.step()

    while (output.result.done == false) {
      output = evaluator.step()

      if (output.error == false) {
        if (output.result.action == 'write') {
          switch (output.result.value) {
            case 0:
              w1 = true
              break
            case 1:
              w2 = true
              break
            case 2:
              w3 = true
              break
          }
        }
      }
    }

    w1.should.equal(true)
    w2.should.equal(true)
    w3.should.equal(true)
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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const c = evaluator.get_locals('main')['c'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const v = evaluator.get_locals('main')['v'] as S1.ArrayVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(3 / 2)
      })

      it('neg 3/neg 2', () => {

        const code = `variables
          real a
        inicio
          a <- neg 3/neg 2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(-3 / -2)
      })

      it('2+3/3+4', () => {
        const code = `variables
          real a
        inicio
          a <- 2+3/3+4
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(2 + 3 / 3 + 4)
      })

      it('3/2/2', () => {
        const code = `variables
          real a
        inicio
          a <- 3/2/2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(3 / 2 / 2)
      })

      it('2/2/2/2', () => {
        const code = `variables
          real a
        inicio
          a <- 2/2/2/2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(2 / 2 / 2 / 2)
      })

      it('4/2/2/2', () => {
        const code = `variables
          real a
        inicio
          a <- 4/2/2/2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(4 / 2 / 2 / 2)
      })

      it('2/2/2/4', () => {
        const code = `variables
            real a
          inicio
            a <- 2/2/2/4
          fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(2 / 2 / 2 / 4)
      })
    })

    describe('resta', () => {
      it('3-3-3', () => {
        const code = `variables \n entero a \n inicio \n a <- 3-3-3 \n fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(3 - 3 - 3)
      })

      it('(3-3-3)', () => {
        const code = `variables
          entero a
        inicio
          a <- (3-3-3)
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.result.done == false) {
        output = evaluator.step()
      }
      const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

      a.value.should.equal(2 + (2 + 3))
    })

    it('2+(2+3*4)', () => {
      const code = `variables
          entero a
        inicio
          a <- 2+(2+3*4)
        fin`

      const p = compile(parse(code))

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.result.done == false) {
        output = evaluator.step()
      }

      const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

      a.value.should.equal(2 + (2 + 3 * 4))
    })

    it('3*(2-6)', () => {
      const code = `variables
          entero a
        inicio
          a <- (3*2)-6
        fin`

      const p = compile(parse(code))

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.result.done == false) {
        output = evaluator.step()
      }

      const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

      a.value.should.equal((3 * 2) - 6)
    })

    it('(neg(neg(2+2)))', () => {
      const code = `variables
          entero a
        inicio
          a <- (neg(neg(2+2)))
        fin`

      const p = compile(parse(code))

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.result.done == false) {
        output = evaluator.step()
      }

      const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

      a.value.should.equal((-(-(2 + 2))))
    })

    it('2+8/2', () => {
      const code = `variables
          real a
        inicio
          a <- 2+8/2
        fin`

      const p = compile(parse(code))

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.result.done == false) {
        output = evaluator.step()
      }

      const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(true)
      })

      it('2 <> 2', () => {
        const code = `variables
          logico a
        inicio
          a <- 2 <> 2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(false)
      })

      it('2 >= 2', () => {
        const code = `variables
          logico a
        inicio
          a <- 2 >= 2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(true)
      })

      it('2 <= 2', () => {
        const code = `variables
          logico a
        inicio
          a <- 2 <= 2
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(true)
      })

      it('5 > 4', () => {
        const code = `variables
          logico a
        inicio
          a <- 5 > 4
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(true)
      })

      it('2 < 4', () => {
        const code = `variables
          logico a
        inicio
          a <- 2 < 4
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(true)
      })

      it('verdadero or falso', () => {
        const code = `variables
          logico a
        inicio
          a <- verdadero or falso
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(true)
      })

      it('verdadero and falso', () => {
        const code = `variables
          logico a
        inicio
          a <- verdadero and falso
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(false)
      })

      it('not verdadero', () => {
        const code = `variables
          logico a
        inicio
          a <- not verdadero
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

        a.value.should.equal(false)
      })

      it('not falso', () => {
        const code = `variables
          logico a
        inicio
          a <- not falso
        fin`

        const p = compile(parse(code))

        const evaluator = new Evaluator(p)

        let output = evaluator.step()

        while (output.result.done == false) {
          output = evaluator.step()
        }

        const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.result.done == false) {
        output = evaluator.step()
      }

      const a = evaluator.get_locals('main')['a'] as S1.RegularVariable

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

      const evaluator = new Evaluator(p)

      let output = evaluator.step()

      while (output.error == false && output.result.done == false && output.result.action != 'write') {
        output = evaluator.step()
      }

      output.result.should.deepEqual({done: true, action: 'write', value: 2 })
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

      output.should.deepEqual({error: false, result: {done: true, action: 'none'}})

      const a = e.get_locals('main')['a'] as S1.RegularVariable
      a.value.should.equal(8)
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

        output.should.deepEqual({error: false, result: {done: true, action: 'none'}})

        const a = e.get_locals('main')['a'] as S1.RegularVariable
        a.value.should.equal(32)
      })

      it('celda de vector por referencia ', () => {
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

        output.should.deepEqual({error: false, result: {done: true, action: 'none'}})

        const a = e.get_locals('main')['a'] as S1.ArrayVariable
        a.values[0].should.equal(32)
      })

      it.skip('vector por referencia', () => {})
      
      it.skip('matriz por referencia', () => {})

      it.skip('variable de un modulo pasada por referencia a otro modulo', () => {
        const code = `
        variables
        inicio
          p(22)
        fin

        procedimiento p(entero a)
        inicio
          o(a)
            escribir(a)
        finprocedimiento

        procedimiento o(entero ref u)
        inicio
          u <- 92
        finprocedimiento
        `

        const p = compile(parse(code))

        const e = new Evaluator(p)

        const output = run(e)

        output.should.deepEqual({error: false, result: {done: true, action: 'none'}})

        const a = e.get_locals('main')['a'] as S1.ArrayVariable
        a.values[0].should.equal(32)
      })
    })
  })
})
