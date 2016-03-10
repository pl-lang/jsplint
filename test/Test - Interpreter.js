'use strict'
const should = require('should');

const Interpreter = require('../backend/Interpreter')

const Compiler = require('../tools/Compiler')

describe('Pruebas que verifican la correcta evaluacion de los programas', () => {
  // De momento, obtengo los resultados de las pruebas a traves de llamadas a escribir

  it('Estructura si...entonces', () => {
    let compiler = new Compiler({event_logging:true})

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

    let compiler_report = compiler.compile(programa, false)

    compiler_report.error.should.equal(false)

    let program_modules = compiler_report.result

    let interpreter = new Interpreter(program_modules)

    let bandera = false

    interpreter.on('write', (event_info, value_list) => {
      if (value_list[0] == true) bandera = true;
    })

    interpreter.run()

    bandera.should.equal(true)

  })

  it('Estructura si...entonces...sino...', () => {
    let controller = new InterpreterController({event_logging:false});
    let bandera = false;

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
    `;

    controller.on('write', (event_info, value_list) => {
      if (value_list[0] == true) bandera = true;
    });

    controller.run(programa);

    bandera.should.equal(true);
  });

  it('Estructura si...entonces con condicion falsa', () => {
    let controller = new InterpreterController({event_logging:false});
    let bandera = false;

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
    `;

    controller.on('write', (event_info, value_list) => {
      if (value_list[0] == true) bandera = true;
    });

    controller.run(programa);

    bandera.should.equal(true);
  })

  it('Estructura repetir...hasta que...', () => {
    let controller = new InterpreterController({event_logging:false});
    let bandera = false;

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
    `;

    controller.on('write', (event_info, value_list) => {
      if (value_list[0] == 10) bandera = true;
    });

    controller.run(programa)

    bandera.should.equal(true)
  });

  // TODO: Arreglar el caso de la estructura mientras vacia

  it('Estructura mientras...', () => {
    let controller = new InterpreterController({event_logging:false});
    let bandera = false;

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

    controller.on('write', (event_info, value_list) => {
      if (value_list[0] == 10) bandera = true
    });

    controller.run(programa)

    bandera.should.equal(true)
  })

  it.skip('Estructura para...hasta...', () => {
    let controller = new InterpreterController({event_logging:false});
    let bandera = false;

  });

  it('Asignacion', () => {
    let controller = new InterpreterController({event_logging:false})
    let bandera = false

    controller.on('write', (event_info, value_list) => {
      if (value_list[0] === 32) bandera = true;
    })

    let code = `
    variables
    entero a
    inicio
    a <- 32
    escribir(a)
    fin
    `
    controller.run(code)

    bandera.should.equal(true)
  })
});
