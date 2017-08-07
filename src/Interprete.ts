import Compilador from './Compilador'
import Evaluador from './Evaluador'

import { type_literal as creaTipoLiteral } from './utility/helpers'
import { types_are_equal as tiposIguales } from './utility/helpers'
import { stringify as tipoACadena } from './utility/helpers'

import { N3, Errors, Failure, Success, Accion, MensajeInterprete, ValorExpresionInspeccionada, Value, S2, Typed, DatosLectura } from './interfaces'

export default class Interprete {
    private compilador: Compilador
    private evaluador: Evaluador
    private programaCargado: boolean

    constructor() {
        this.compilador = new Compilador()
        this.programaCargado = false
    }

    cargarPrograma(codigo: string): Failure<Errors.Compilation[]> | Success<N3.ProgramaCompilado> {
        const programa = this.compilador.compilar(codigo)

        if (programa.error == true) {
            return programa
        }
        else {
            this.programaCargado = true
            this.evaluador = new Evaluador(programa.result)
            return { error: false, result: programa.result }
        }
    }

    programaFinalizado() {
        return this.evaluador.programaFinalizado()
    }

    ejecutarHastaElFinal(): Failure<null> | Success<MensajeInterprete> {
        if (this.programaCargado) {
            const reporte = this.evaluador.ejecutarPrograma()

            if (reporte.error == true) {
                return reporte
            }
            else {
                if (this.evaluador.hayEscrituraPendiente()) {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.ESCRIBIR, numeroLineaFuente, numeroInstruccion } }
                }
                else if (this.evaluador.hayLecturaPendiente()) {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.LEER, numeroLineaFuente, numeroInstruccion } }
                }
                else {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.NADA, numeroLineaFuente, numeroInstruccion } }
                }
            }
        }
        else {
            throw new Error("No se puede ejecutar el programa porque no hay ningun programa cargado")
        }
    }

    darPaso(): Failure<null> | Success<MensajeInterprete> {
        if (this.programaCargado) {
            const reporte = this.evaluador.ejecutarEnunciadoSiguiente()

            if (reporte.error == true) {
                return reporte
            }
            else {
                if (this.evaluador.hayEscrituraPendiente()) {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.ESCRIBIR, numeroLineaFuente, numeroInstruccion } }
                }
                else if (this.evaluador.hayLecturaPendiente()) {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.LEER, numeroLineaFuente, numeroInstruccion } }
                }
                else {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.NADA, numeroLineaFuente, numeroInstruccion } }
                }
            }
        }
        else {
            throw new Error("No se puede ejecutar el programa porque no hay ningun programa cargado")
        }
    }

    ejecutarInstruccion(): Failure<null> | Success<MensajeInterprete> {
        if (this.programaCargado) {
            const reporte = this.evaluador.ejecutarInstruccion()

            if (reporte.error == true) {
                return reporte
            }
            else {
                if (this.evaluador.hayEscrituraPendiente()) {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.ESCRIBIR, numeroLineaFuente, numeroInstruccion } }
                }
                else if (this.evaluador.hayLecturaPendiente()) {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.LEER, numeroLineaFuente, numeroInstruccion } }
                }
                else {
                    const { numeroLineaFuente, numeroInstruccion } = reporte.result
                    return { error: false, result: { accion: Accion.NADA, numeroLineaFuente, numeroInstruccion } }
                }
            }
        }
        else {
            throw new Error("No se puede ejecutar el programa porque no hay ningun programa cargado")
        }
    }

    obtenerEscrituraPendiente() {
        if (this.programaCargado) {
            return this.evaluador.obtenerEscrituraPendiente()
        }
        else {
            throw new Error("No se puede obtener la escritura pendiente porque no hay un programa cargado.")
        }
    }

    obtenerLecturaPendiente() {
        if (this.programaCargado) {
            return this.evaluador.obtenerLecturaPendiente()
        }
        else {
            throw new Error("No se puede obtener la lectura pendiente porque no hay un programa cargado.")
        }
    }

    inspeccionarExpresion(expresion: string): Failure<(Errors.Pattern | Errors.Lexical | S2.Error | Typed.Error | Errors.TypeError)[]> | Success<ValorExpresionInspeccionada> {
        const expresionCompilada = this.compilador.compilarExpresion(expresion, this.evaluador.obtenerAmbitoActual())

        if (expresionCompilada.error == false) {
            const expresionEvaluada = this.evaluador.inspeccionarExpresion(expresionCompilada.result)

            if (expresionEvaluada.error == false) {
                return expresionEvaluada
            }
            else {
                throw new Error("LA EXPRESION INSPECCIONADA TIRO UN ERROR AL SER EVALUADA")
            }
        }
        else {
            return expresionCompilada
        }
    }

    verificarLectura(lectura: DatosLectura, cadenaLeida: string): Failure<null> | Success<Value> {
        // verificar que lo que se leyo sea del tipo esperado...etc...
        const lecturaAnalizada = this.compilador
    }

    parse(value: string): S0.LiteralValue {
        let v: Value = null

        if (/^\d+$/.test(value)) {
            /**
             * es un entero
             */
            v = parseInt(value)
        }
        else if (/^\d+(\.\d+)?$/.test(value)) {
            /**
             * es un real
             */
            v = parseFloat(value)
        }
        else if (/^(verdadero|falso)$/.test(value)) {
            /**
             * es un booleano
             */
            v = value == 'verdadero'
        }
        else {
            /**
             * es una cadena
             */
            v = value
        }

        return { type: 'literal', value: v }
    }

    enviarLectura(valor: Value) {
        this.evaluador.leer(valor)
    }

    agregarBreakpoint(n: number) {
        if (this.programaCargado) {
            this.evaluador.agregarBreakpoint(n)
        }
        else {
            throw new Error("No se puede establecer un breakpoint porque no hay ningun programa cargado.")
        }
    }

    quitarBreakpoint(n: number) {
        if (this.programaCargado) {
            this.evaluador.quitarBreakpoint(n)
        }
        else {
            throw new Error("No se puede quitar un breakpoint porque no hay ningun programa cargado.")
        }
    }
}