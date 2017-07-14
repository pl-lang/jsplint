import Compilador from './Compilador'
import Evaluador from './Evaluador'

import { type_literal as creaTipoLiteral } from './utility/helpers'
import { types_are_equal as tiposIguales } from './utility/helpers'
import { stringify as tipoACadena } from './utility/helpers'

import { N3, Errors, Failure, Success, Accion, MensajeInterprete } from './interfaces'

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
                    return { error: false, result: { accion: Accion.ESCRIBIR, numeroLinea: reporte.result } }
                }
                else if (this.evaluador.hayLecturaPendiente()) {
                    return { error: false, result: { accion: Accion.LEER, numeroLinea: reporte.result } }
                }
                else {
                    return { error: false, result: { accion: Accion.NADA, numeroLinea: reporte.result } }
                }
            }
        }
        else {
            throw new Error("No se puede ejecutar el programa porque no hay ningun programa cargado")
        }
    }

    darPaso() {

    }

    obtenerEscrituraPendiente() {
        if (this.programaCargado) {
            return this.evaluador.obtenerEscrituraPendiente()
        }
        else {
            throw new Error("No se puede establecer un breakpoint porque no hay ningun programa cargado.")
        }
    }

    enviarLectura(k: any) {
        // verificar que lo que se leyo sea del tipo esperado...etc...
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