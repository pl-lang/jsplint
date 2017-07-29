import "should"

import Compilador from '../src/Compilador'

import Evaluador from '../src/Evaluador'

import { N3, Escalar, Vector2, Estado, EscalarInspeccionado, ArregloInspeccionado } from '../src/interfaces'

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

        reporte.result.numeroLineaFuente.should.equal(3)

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
        reporte.result.numeroLineaFuente.should.equal(3)

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
        reporte.result.numeroLineaFuente.should.equal(3)

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
        reporte.result.numeroLineaFuente.should.equal(3)

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
        reporte.result.numeroLineaFuente.should.equal(3)

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
        reporte.result.numeroLineaFuente.should.equal(3)

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

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        const asignacion = ev.consultarVariableEscalar('b', 3000)

        asignacion.should.equal(true)
    })

    it('Programa con un llamado a ESCRIBIR con un solo argumento', () => {
        const code = `variables
        entero a
        inicio
        escribir(38)
        a <- 1000
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(4)

        // probar que haya una escritura pendiente
        let hayEscrituraPendiente = ev.hayEscrituraPendiente()

        hayEscrituraPendiente.should.equal(true)

        // probar que el valor a escribir sea el correcto
        const valor = ev.obtenerEscrituraPendiente()
        valor.should.equal(38)

        // probar que luego de escribir ya no hay escrituras pendientes
        hayEscrituraPendiente = ev.hayEscrituraPendiente()

        hayEscrituraPendiente.should.equal(false)

        // probar que la ejecucion se resume
        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        const asignacion = ev.consultarVariableEscalar('a', 1000)

        asignacion.should.equal(true)
    })

    it('Programa con un llamado a LEER con un solo argumento', () => {
        const code = `variables
        entero a
        inicio
        leer(a)
        a <- 1000
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.agregarBreakpoint(4)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        // probar que haya una lectura pendiente
        let hayLecturaPendiente = ev.hayLecturaPendiente()

        hayLecturaPendiente.should.equal(true)

        // obtener el nombre y el tipo de la variable a leer
        const datosVariable = ev.obtenerLecturaPendiente()
        datosVariable.nombreVariable.should.equal('a')

        // enviar valor "leido"
        ev.leer(2000)

        // probar que luego de leer ya no hay lectura pendiente
        hayLecturaPendiente = ev.hayLecturaPendiente()

        hayLecturaPendiente.should.equal(false)

        // probar que la ejecucion se resume hasta el breakpoint en la linea 4
        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(4)

        // ahora, la variable 'a' deberia tener el valor que fue "leido", es decir, a == 2000
        let asignacion = ev.consultarVariableEscalar('a', 2000)

        asignacion.should.equal(true)

        // resumir la ejecucion nuevamente
        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        asignacion = ev.consultarVariableEscalar('a', 1000)

        asignacion.should.equal(true)
    })

    it('Llamado a un modulo que toma una variable escalar por referencia y la modifica', () => {
        const code = `variables
        entero a
        inicio
        a <- 2
        modificar(a)
        fin
        
        procedimiento modificar(entero ref b)
        inicio
        b <- 95
        finprocedimiento`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.agregarBreakpoint(4)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(4)

        // probar que antes de la llamada, a == 2
        let asignacion = ev.consultarVariableEscalar('a', 2)

        asignacion.should.equal(true)

        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        // probar que luego de la llamada a == 95
        asignacion = ev.consultarVariableEscalar('a', 95)

        asignacion.should.equal(true)
    })

    it('Llamado a un modulo que toma un vector como parametro', () => {
        const code = `variables
        entero a[2]
        inicio
        a[1] <- 26
        a[2] <- 27
        recibirVector(a)
        fin
        
        procedimiento recibirVector(entero b[2])
        inicio
        escribir("prueba")
        finprocedimiento`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        /**
         * Pongo un breakpoint en el unico enunciado del procedimiento
         * para poder probar que las celdas de b recibieron los valores
         * de las celdas de a. Hay que usar un breakpoint porque
         * consultarVariable[Vectorial | Escalar] solo consulta
         * variables en ambito.
         */
        ev.agregarBreakpoint(10)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(10)

        // probar que luego de la llamada b[1] == 26 y b[2] == 27
        let asignacion = ev.consultarVariableVectorial('b', [1], 26)

        asignacion.should.equal(true)

        asignacion = ev.consultarVariableVectorial('b', [2], 27)

        asignacion.should.equal(true)

        // resumir la ejecucion hasta finalizar el programa
        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)
    })

    it('Llamado a un modulo que toma una matriz como parametro', () => {
        const code = `variables
        entero a[2, 2, 2]
        inicio
        a[1, 1, 1] <- 26
        a[1, 1, 2] <- 27
        a[1, 2, 1] <- 28
        a[1, 2, 2] <- 29
        recibirMatriz(a[1])
        fin
        
        procedimiento recibirMatriz(entero b[2, 2])
        inicio
        escribir("prueba")
        finprocedimiento`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        /**
         * Pongo un breakpoint en el unico enunciado del procedimiento
         * para poder probar que las celdas de b recibieron los valores
         * de las celdas de a. Hay que usar un breakpoint porque
         * consultarVariable[Vectorial | Escalar] solo consulta
         * variables en ambito.
         */
        ev.agregarBreakpoint(12)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(12)

        // probar que luego de la llamada b[1] == 26 y b[2] == 27
        let asignacion = ev.consultarVariableVectorial('b', [1, 1], 26)

        asignacion.should.equal(true)

        asignacion = ev.consultarVariableVectorial('b', [1, 2], 27)

        asignacion.should.equal(true)

        asignacion = ev.consultarVariableVectorial('b', [2, 1], 28)

        asignacion.should.equal(true)

        asignacion = ev.consultarVariableVectorial('b', [2, 2], 29)

        asignacion.should.equal(true)

        // resumir la ejecucion hasta finalizar el programa
        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)
    })

    it('Llamado a una funcion que suma dos numeros', () => {
        const code = `variables
        entero a, b, c
        inicio
        a <- 5
        b <- 7
        c <- sumar(a, b)
        fin
        
        entero funcion sumar(entero x, entero y)
        inicio
        retornar x + y
        finfuncion`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        // probar que luego de la c == 12
        let asignacion = ev.consultarVariableEscalar('c', 12)

        asignacion.should.equal(true)
    })

    it('Programa ejecutado paso a paso', () => {
        const code = `variables
        entero a, b, c
        inicio
        a <- 5
        b <- 7
        c <- 12
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        /**
         * Iniciar ejecucion paso a paso. El evaluador se detiene
         * ANTES de ejecutar el primer enunciado del programa.
         */
        let reporte = ev.ejecutarEnunciadoSiguiente()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(3)

        /**
         * Dar paso, el evaluador ejecuta el primer enunciado
         * y se detiene ANTES de ejecutar el segundo.
         */
        reporte = ev.ejecutarEnunciadoSiguiente()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(4)

        /**
         * Verificar que luego de la ejecucion del primer enunciado
         * a == 5.
         */
        let asignacion = ev.consultarVariableEscalar('a', 5)

        asignacion.should.equal(true)

        /**
         * El evaluador ejecuta el segundo enunciado
         * y se detiene antes del tercero
         */
        reporte = ev.ejecutarEnunciadoSiguiente()

        reporte.error.should.equal(false)
        reporte.result.numeroLineaFuente.should.equal(5)

        /**
         * Verificar segunda asignacion.
         */
        asignacion = ev.consultarVariableEscalar('b', 7)

        asignacion.should.equal(true)

        /**
         * Ejecutar ultimo enunciado.
         */
        reporte = ev.ejecutarEnunciadoSiguiente()

        reporte.error.should.equal(false)

        /**
         * Cuando el programa finaliza el evaluador devuelve
         * el numero de linea del primer enunciado del modulo
         * principal.
         */
        reporte.result.numeroLineaFuente.should.equal(3)

        // Verificar tercer asignacion.
        asignacion = ev.consultarVariableEscalar('c', 12)

        asignacion.should.equal(true)
    })

    it('Inspeccionar expresion: 2 + 2', () => {
        const code = `variables
        inicio
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const expresionCompilada = compilador.compilarExpresion('2 + 2', 'principal')

        expresionCompilada.error.should.equal(false)

        const inspeccion = ev.inspeccionarExpresion(expresionCompilada.result as N3.ExpresionCompilada)

        inspeccion.error.should.equal(false)
        
        const resultado = inspeccion.result as EscalarInspeccionado

        resultado.valor.should.equal(4)
    })

    it('Inspeccionar expresion: a + 2', () => {
        const code = `variables
            entero a
        inicio
            a <- 3
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.ejecutarPrograma()

        const expresionCompilada = compilador.compilarExpresion('a + 2', 'principal')

        expresionCompilada.error.should.equal(false)

        const inspeccion = ev.inspeccionarExpresion(expresionCompilada.result as N3.ExpresionCompilada)

        inspeccion.error.should.equal(false)

        const resultado = inspeccion.result as EscalarInspeccionado

        resultado.valor.should.equal(5)
    })

    it('Inspeccionar valores de un vector', () => {
        const code = `variables
            entero a[2]
        inicio
            a[1] <- 1
            a[2] <- 2
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.ejecutarPrograma()

        const expresionCompilada = compilador.compilarExpresion('a', 'principal')

        expresionCompilada.error.should.equal(false)

        const inspeccion = ev.inspeccionarExpresion(expresionCompilada.result as N3.ExpresionCompilada)

        inspeccion.error.should.equal(false)

        const resultado = inspeccion.result as ArregloInspeccionado

        resultado.celdas.should.deepEqual([
            { indice: [1], valor: 1 },
            { indice: [2], valor: 2 }
        ])
    })

    it('Inspeccionar valores de una matriz', () => {
        const code = `variables
            entero a[2, 2]
        inicio
            a[1, 1] <- 1
            a[1, 2] <- 2
            a[2, 1] <- 3
            a[2, 2] <- 4
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.ejecutarPrograma()

        const expresionCompilada = compilador.compilarExpresion('a', 'principal')

        expresionCompilada.error.should.equal(false)

        const inspeccion = ev.inspeccionarExpresion(expresionCompilada.result as N3.ExpresionCompilada)

        inspeccion.error.should.equal(false)

        const resultado = inspeccion.result as ArregloInspeccionado

        resultado.celdas.should.deepEqual([
            { indice: [1, 1], valor: 1 },
            { indice: [1, 2], valor: 2 },
            { indice: [2, 1], valor: 3 },
            { indice: [2, 2], valor: 4 }
        ])
    })

    it('Inspeccionar valores de una fila de una matriz', () => {
        const code = `variables
            entero a[2, 2]
        inicio
            a[1, 1] <- 1
            a[1, 2] <- 2
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        ev.ejecutarPrograma()

        const expresionCompilada = compilador.compilarExpresion('a[1]', 'principal')

        expresionCompilada.error.should.equal(false)

        const inspeccion = ev.inspeccionarExpresion(expresionCompilada.result as N3.ExpresionCompilada)

        inspeccion.error.should.equal(false)

        const resultado = inspeccion.result as ArregloInspeccionado

        resultado.celdas.should.deepEqual([
            { indice: [1, 1], valor: 1 },
            { indice: [1, 2], valor: 2 }
        ])
    })

    it('Inspeccionar funcion que suma dos numeros', () => {
        const code = `variables
        entero a, b, c
        inicio
        a <- 5
        b <- 7
        c <- sumar(a, b)
        fin
        
        entero funcion sumar(entero x, entero y)
        inicio
        retornar x + y
        finfuncion`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const expresionCompilada = compilador.compilarExpresion('sumar(2, 2)', 'principal')

        expresionCompilada.error.should.equal(false)

        const inspeccion = ev.inspeccionarExpresion(expresionCompilada.result as N3.ExpresionCompilada)

        inspeccion.error.should.equal(false)

        const resultado = inspeccion.result as EscalarInspeccionado

        resultado.valor.should.equal(4)
    })

    it('Asignar una cadena a un vector de caracteres', () => {
        const code = `variables
        caracter a[4]
        inicio
        a <- "hola"
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const a1 = ev.consultarVariableVectorial('a', [1], 'h')
        a1.should.equal(true)

        const a2 = ev.consultarVariableVectorial('a', [2], 'o')
        a2.should.equal(true)

        const a3 = ev.consultarVariableVectorial('a', [3], 'l')
        a3.should.equal(true)
        
        const a4 = ev.consultarVariableVectorial('a', [4], 'a')
        a4.should.equal(true)
    })

    it('Asignar una cadena a una fila de una matriz de caracteres', () => {
        const code = `variables
        caracter a[2, 4]
        inicio
        a[1] <- "hola"
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        const reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const a1 = ev.consultarVariableVectorial('a', [1, 1], 'h')
        a1.should.equal(true)

        const a2 = ev.consultarVariableVectorial('a', [1, 2], 'o')
        a2.should.equal(true)

        const a3 = ev.consultarVariableVectorial('a', [1, 3], 'l')
        a3.should.equal(true)

        const a4 = ev.consultarVariableVectorial('a', [1, 4], 'a')
        a4.should.equal(true)
    })

    it('Leer una cadena y guardarla en un vector', () => {
        const code = `variables
        caracter a[4]
        inicio
        leer(a)
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        ev.leer('hola')

        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const a1 = ev.consultarVariableVectorial('a', [1], 'h')
        a1.should.equal(true)

        const a2 = ev.consultarVariableVectorial('a', [2], 'o')
        a2.should.equal(true)

        const a3 = ev.consultarVariableVectorial('a', [3], 'l')
        a3.should.equal(true)

        const a4 = ev.consultarVariableVectorial('a', [4], 'a')
        a4.should.equal(true)
    })

    it('Leer una cadena y guardarla en una fila de una matriz', () => {
        const code = `variables
        caracter a[3, 4]
        inicio
        leer(a[1])
        fin`

        const programaCompilado = compilador.compilar(code)

        const ev = new Evaluador(programaCompilado.result as N3.ProgramaCompilado)

        let reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        ev.leer('hola')

        reporte = ev.ejecutarPrograma()

        reporte.error.should.equal(false)

        const a1 = ev.consultarVariableVectorial('a', [1, 1], 'h')
        a1.should.equal(true)

        const a2 = ev.consultarVariableVectorial('a', [1, 2], 'o')
        a2.should.equal(true)

        const a3 = ev.consultarVariableVectorial('a', [1, 3], 'l')
        a3.should.equal(true)

        const a4 = ev.consultarVariableVectorial('a', [1, 4], 'a')
        a4.should.equal(true)
    })
})