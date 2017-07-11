import "should"

import Compilador from '../src/Compilador'

import { Evaluador, Estado } from '../src/Evaluador'

import { N3, Escalar, Vector2 } from '../src/interfaces'

import fr_writer from '../src/utility/fr_writer'

const compilador = new Compilador()

describe('Evaluador', () => {
    it('Programa nulo', () => {
        const code = `variables
        inicio
        fin
        `
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
    })

    it('Programa con una asignacion a una variable', () => {
        const code = `variables
        entero a
        inicio
        a <- 2
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const variableAsignada = ev.consultarVariableEscalar("a", 2)

        variableAsignada.should.equal(true)
    })

    it('Programa con una asignacion a una variable vectorial', () => {
        const code = `variables
        entero a[2]
        inicio
        a[1] <- 1
        a[2] <- 2
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const primerAsignacion = ev.consultarVariableVectorial("a", [1], 1)

        primerAsignacion.should.equal(true)

        const segundaAsignacion = ev.consultarVariableVectorial("a", [2], 2)

        segundaAsignacion.should.equal(true)
    })

    it('Programa que copia un vector a otro', () => {
        const code = `variables
        entero a[2], b[2]
        inicio
        a[1] <- 1
        a[2] <- 2
        b <- a
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const b1 = ev.consultarVariableVectorial("b", [1], 1)

        b1.should.equal(true)

        const b2 = ev.consultarVariableVectorial("b", [2], 2)

        b2.should.equal(true)
    })

    it('Programa que copia una matriz a otra', () => {
        const code = `variables
        entero a[2, 2], b[2, 2]
        inicio
        a[1, 1] <- 1
        a[1, 2] <- 2
        a[2, 1] <- 3
        a[2, 2] <- 4
        b <- a
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const b11 = ev.consultarVariableVectorial("b", [1, 1], 1)

        b11.should.equal(true)

        const b12 = ev.consultarVariableVectorial("b", [1, 2], 2)

        b12.should.equal(true)

        const b13 = ev.consultarVariableVectorial("b", [2, 1], 3)

        b13.should.equal(true)

        const b14 = ev.consultarVariableVectorial("b", [2, 2], 4)

        b14.should.equal(true)
    })

    it('Programa que copia un vector a una fila de una matriz', () => {
        const code = `variables
        entero a[2], b[2, 2]
        inicio
        a[1] <- 1
        a[2] <- 2
        b[1] <- a
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const b11 = ev.consultarVariableVectorial("b", [1, 1], 1)

        b11.should.equal(true)

        const b12 = ev.consultarVariableVectorial("b", [1, 2], 2)

        b12.should.equal(true)
    })

    it('Programa que copia una fila de una matriz a un vector', () => {
        const code = `variables
        entero a[2], b[2, 2]
        inicio
        b[1, 1] <- 1
        b[1, 2] <- 2
        a <- b[1]
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const a1 = ev.consultarVariableVectorial("a", [1], 1)

        a1.should.equal(true)

        const a2 = ev.consultarVariableVectorial("a", [2], 2)

        a2.should.equal(true)
    })
    
    it('Programa que copia una fila de una matriz a otra matriz', () => {
        const code = `variables
        entero a[3, 2], b[2, 2]
        inicio
        a[2, 1] <- 1
        a[2, 2] <- 2
        b[1] <- a[2]
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const b11 = ev.consultarVariableVectorial("b", [1, 1], 1)

        b11.should.equal(true)

        const b12 = ev.consultarVariableVectorial("b", [1, 2], 2)

        b12.should.equal(true)
    })

    it('La ejecucion se detiene en un breakpoint y se puede resumir', () => {
        const code = `variables
        entero a[2]
        inicio
        a[1] <- 1
        a[2] <- 2
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.agregarBreakpoint(3)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        reporte.result.should.equal(3)

        /**
         * Luego de haberse detenido en el breakpoint, la ejecucion deberia poder reanudarse
         */
        ev.ejecutarPrograma()

        const primerAsignacion = ev.consultarVariableVectorial("a", [1], 1)

        primerAsignacion.should.equal(true)

        const segundaAsignacion = ev.consultarVariableVectorial("a", [2], 2)

        segundaAsignacion.should.equal(true)
    })

    it('Los breakpoints se eliminan correctamente', () => {
        const code = `variables
        entero a[2]
        inicio
        a[1] <- 1
        a[2] <- 2
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.agregarBreakpoint(3)
        ev.quitarBreakpoint(3)

        const reporte = ev.ejecutarPrograma()
        
        ev.ejecutarPrograma()

        const primerAsignacion = ev.consultarVariableVectorial("a", [1], 1)

        primerAsignacion.should.equal(true)

        const segundaAsignacion = ev.consultarVariableVectorial("a", [2], 2)

        segundaAsignacion.should.equal(true)
    })

    it('Programa con una estructura de seleccion que ejecuta la rama verdadera', () => {
        const code = `variables
        entero a
        inicio
        a <- 2
        si (a = 2) entonces
        a <- 5000
        sino
        a <- 6000
        finsi
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.should.equal(-1)

        const asignacion = ev.consultarVariableEscalar('a', 5000)

        asignacion.should.equal(true)
    })

    it('Programa con una estructura de seleccion que ejecuta la rama falsa', () => {
        const code = `variables
        entero a
        inicio
        a <- 1
        si (a = 2) entonces
        a <- 5000
        sino
        a <- 6000
        finsi
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.should.equal(-1)

        const asignacion = ev.consultarVariableEscalar('a', 6000)

        asignacion.should.equal(true)
    })

    it('Programa que incrementa un contador con una estructura mientras', () => {
        const code = `variables
        entero a
        inicio
        a <- 0
        mientras (a < 3)
        a <- a + 1
        finmientras
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.should.equal(-1)

        const asignacion = ev.consultarVariableEscalar('a', 3)

        asignacion.should.equal(true)
    })

    it('Programa que incrementa un contador con una estructura para', () => {
        const code = `variables
        entero a, b
        inicio
        para a <- 0 hasta 3
            b <- 2000
        finpara
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.should.equal(-1)

        const asignacionA = ev.consultarVariableEscalar('a', 4)

        asignacionA.should.equal(true)

        const asignacionB = ev.consultarVariableEscalar('b', 2000)

        asignacionB.should.equal(true)
    })

    it('Bucle PARA con un contador en una celda de un vector ', () => {
        const code = `variables
        entero a[2]
        inicio
        para a[1] <- 0 hasta 3
        finpara
        fin`
        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.should.equal(-1)

        const a1 = ev.consultarVariableVectorial('a', [1], 4)

        a1.should.equal(true)
    })

    it('Si el contador de un bucle PARA es mayor al valor final, el bucle es salteado', () => {
        const code = `variables
        entero a, b
        inicio
        b <- 3000
        para a <- 4 hasta 3
            b <- 2000
        finpara
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.should.equal(-1)

        const asignacion = ev.consultarVariableEscalar('b', 3000)

        asignacion.should.equal(true)
    })
})