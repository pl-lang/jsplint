'use strict'
import should from 'should'

import Interpreter from '../src/interpreter/Interpreter.js'

import Compiler from '../src/parser/Compiler.js'

const DO_NOT_RUN_TYPE_CHECKER = false

// TODO: ejecutar el TypeChecker al compilar (en todas las pruebas)

describe.skip('Pruebas que verifican la correcta evaluacion de los programas', () => {
  // De momento, obtengo los resultados de las pruebas a traves de llamadas a escribir

  it('Estructura si...entonces', () => {
    let compiler = new Compiler()

    let programa = `
    variables
    logico a
    inicio
    a <- falso
    si (NOT a) entonces
      a <- verdadero
      escribir(a)
    finsi
    fin
    `

    let report = compiler.compile(programa, DO_NOT_RUN_TYPE_CHECKER)

    report.error.should.equal(false)

    let program_modules = report.result

    let interpreter = new Interpreter(program_modules)

    let bandera = false

    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] == true) bandera = true;
    })

    interpreter.run()

    bandera.should.equal(true)

  })

  it('Estructura si...entonces...sino...', () => {
    let compiler = new Compiler()

    let programa = `
    variables
    logico a
    inicio
    a <- falso
    si (a) entonces
      escribir(a)
    sino
      a <- verdadero
      escribir(a)
    finsi
    fin
    `

    let report = compiler.compile(programa, DO_NOT_RUN_TYPE_CHECKER)

    report.error.should.equal(false)

    let interpreter = new Interpreter(report.result)

    let bandera = false
    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] == true) bandera = true
    })

    interpreter.run()

    bandera.should.equal(true)
  })

  it('Estructura si...entonces con condicion falsa', () => {
    let compiler = new Compiler()

    let programa = `
    variables
    logico a
    inicio
    a <- falso
    si (a) entonces
      escribir(a)
    finsi
    a <- verdadero
    escribir(a)
    fin
    `

    let report = compiler.compile(programa, DO_NOT_RUN_TYPE_CHECKER)

    report.error.should.equal(false)

    let interpreter = new Interpreter(report.result)

    let bandera = false
    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] == true) bandera = true;
    })

    interpreter.run()

    bandera.should.equal(true)
  })

  it('Estructura repetir...hasta que...', () => {
    let compiler = new Compiler()

    let programa = `
    variables
    entero contador
    inicio
      contador <- 0
    repetir
      contador <- contador + 1
    hasta que (contador = 10)
    escribir(contador)
    fin
    `

    let report = compiler.compile(programa, DO_NOT_RUN_TYPE_CHECKER)

    report.error.should.equal(false)

    let interpreter = new Interpreter(report.result)

    let bandera = false
    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] == 10) bandera = true
    })

    interpreter.run()

    bandera.should.equal(true)
  })

  // TODO: Arreglar el caso de la estructura mientras vacia

  it('Estructura mientras...', () => {
    let compiler = new Compiler()

    let programa = `
    variables
    entero contador
    inicio
      contador <- 0
    mientras (contador < 10)
      contador <- contador + 1
    finmientras
    escribir(contador)
    fin
    `

    let report = compiler.compile(programa, DO_NOT_RUN_TYPE_CHECKER)

    report.error.should.equal(false)

    let interpreter = new Interpreter(report.result)

    let bandera = false
    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] == 10) bandera = true
    })

    interpreter.run()

    bandera.should.equal(true)
  })

  it.skip('Estructura para...hasta...', () => {
  })

  it('Asignacion', () => {
    let compiler = new Compiler()

    let code = `
    variables
    entero a
    inicio
    a <- 32
    escribir(a)
    fin
    `

    let report = compiler.compile(code)

    report.error.should.equal(false)

    let interpreter = new Interpreter(report.result)

    let bandera = false
    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] === 32) bandera = true;
    })

    interpreter.run()

    bandera.should.equal(true)
  })
})
