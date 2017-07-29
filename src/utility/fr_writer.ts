import {Failure, Success, ParsedProgram, N3} from '../interfaces'

import { stringify as convertirTipoCadena } from './helpers'

export default function fr_writer (p: N3.ProgramaCompilado) : string {
    // TODO: actualizar esto para que separe el codigo de los modulos...
    let enunciados = p.instrucciones.map((e, i) => `: ${procesar_enunciado(e)}`)

    const numeracion = generarNumeracion(enunciados.length)

    enunciados = zip(numeracion, enunciados).map(par => par[0] + par[1])

    // longitud de la cadena mas larga
    const mayorLongitud = enunciados.map(e => e.length).reduce((p, c) => c > p ? c : p)

    for (let modulo in p.rangoModulo) {
        const rango = p.rangoModulo[modulo]
        if (rango.fin > rango.inicio) {
            let margen = (mayorLongitud - enunciados[rango.inicio].length) + 5
            enunciados[rango.inicio] += ` ${repetir('-', margen)}> INICIO MODULO ${modulo}`

            margen = (mayorLongitud - enunciados[rango.fin - 1].length) + 5
            enunciados[rango.fin - 1] += ` ${repetir('-', margen)}> FIN    MODULO ${modulo}`
        }
    }

    return enunciados.map(e => e + '\n').reduce((p, c) => p + c, '')
}

function procesar_enunciado (e: N3.Instruccion) : string {
    switch (e.tipo) {
        case N3.TipoInstruccion.SUMAR:
            return `SUMAR`
        case N3.TipoInstruccion.RESTAR:
            return `return RESTAR`
        case N3.TipoInstruccion.DIV_REAL:
            return `DIV_REAL`
        case N3.TipoInstruccion.DIV_ENTERO:
            return `DIV_ENTERO`
        case N3.TipoInstruccion.MODULO:
            return `MODULO`
        case N3.TipoInstruccion.MULTIPLICAR:
            return `MULTIPLICAR`
        case N3.TipoInstruccion.ELEVAR:
            return `ELEVAR`
        case N3.TipoInstruccion.NEGAR:
            return `NEGAR`
        case N3.TipoInstruccion.NOT:
            return `NOT`
        case N3.TipoInstruccion.AND:
            return `AND`
        case N3.TipoInstruccion.OR:
            return `OR`
        case N3.TipoInstruccion.MENOR:
            return `MENOR`
        case N3.TipoInstruccion.MENORIGUAL:
            return `MENORIGUAL`
        case N3.TipoInstruccion.MAYOR:
            return `MAYOR`
        case N3.TipoInstruccion.MAYORIGUAL:
            return `MAYORIGUAL`
        case N3.TipoInstruccion.IGUAL:
            return `IGUAL`
        case N3.TipoInstruccion.DIFERENTE:
            return `DIFERENTE`
        case N3.TipoInstruccion.APILAR:
            return `APILAR ${e.valor}`
        case N3.TipoInstruccion.APILAR_VAR:
            return `APILAR_VAR ${e.nombreVariable}`
        case N3.TipoInstruccion.APILAR_ARR:
            return `APILAR_ARR ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoInstruccion.ASIGNAR:
            return `ASIGNAR ${e.nombreVariable}`
        case N3.TipoInstruccion.ASIGNAR_ARR:
            return `ASIGNAR_ARR ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoInstruccion.APILAR_R:
            return 'APILAR_R'
        case N3.TipoInstruccion.ASIGNAR_R:
            return 'ASIGNAR_R'
        case N3.TipoInstruccion.JIF:
            return `JIF ${e.numeroLinea}`
        case N3.TipoInstruccion.JIT:
            return `JIT ${e.numeroLinea}`
        case N3.TipoInstruccion.JMP:
            return `JMP ${e.numeroLinea}`
        case N3.TipoInstruccion.LLAMAR:
            return `LLAMAR ${e.nombreModulo}`
        case N3.TipoInstruccion.RETORNAR:
            return `RETORNAR`
        case N3.TipoInstruccion.LEER:
            return `LEER ${e.nombreVariable} ${convertirTipoCadena(e.tipoVariable)}`
        case N3.TipoInstruccion.ESCRIBIR:
            return `ESCRIBIR`
        case N3.TipoInstruccion.ASIGNAR_CAD:
            return `ASIGNAR_CAD ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoInstruccion.CONCATENAR:
            return `CONCATENAR ${e.cantidadCaracteres}`
        case N3.TipoInstruccion.REFERENCIA:
            return `REFERENCIA ${e.nombreReferencia} ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoInstruccion.CREAR_MEMORIA:
            return `CREAR_MEMORIA ${e.nombreModulo}`
        case N3.TipoInstruccion.COPIAR_ARR:
            return `COPIAR_ARR ${e.nombreObjetivo} ${e.cantidadIndicesObjetivo} ${e.nombreFuente} ${e.cantidadIndicesFuente}`
        case N3.TipoInstruccion.INIT_ARR:
            return `INIT_ARR ${e.nombreArregloObjetivo} ${e.nombreArregloFuente} ${e.cantidadIndices}`
        case N3.TipoInstruccion.DETENER:
            return `DETENER`
    }
}

function generarNumeracion(fin: number) {
    const numeros = rango(0, fin).map(i => i.toString())

    const mayorLongitud = numeros.map(n => n.length).reduce((p, c) => c > p ? c : p)

    return numeros.map(n => `${repetir('0', mayorLongitud - n.length)}${n}`)
}

function repetir (c: string, n: number) {
    let s = ''
    for (let i = 0; i < n; i++) {
        s += c
    }
    return s
}

/**
 * Genera un rango de numeros que va desde 'inicio' a 'fin' (no inclusive).
 * @param inicio primer numero del rango
 * @param fin ultimo numero del rango + 1
 */
function rango(inicio: number, fin: number): number[] {
    const r: number[] = []
    for (let i = inicio; i < fin; i++) {
        r[i] = i
    }
    return r
}

/**
 * Dados dos arreglos a y b crea un arreglo que en cada elemento
 * contiene un arreglo donde: el primer item es de a y el segundo
 * es de b.
 * @param a Arreglo de 'A's
 * @param b Arreglo de 'B's
 */
function zip<A, B>(a: A[], b: B[]): [A, B][] {
    let r: [A, B][] = []
    for (let i = 0, l = a.length; i < l; i++) {
        r[i] = [a[i], b[i]]
    }
    return r
}