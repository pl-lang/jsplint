import {Failure, Success, ParsedProgram, N3} from '../interfaces'

import { stringify as convertirTipoCadena } from './helpers'

import transform from '../transforms/transform'

import Parser from '../parser/Parser'

function parse (s: string) {
    const p = new Parser()

    p.on('lexical-error', console.log)
    p.on('syntax-error', console.log)

    return p.parse(s)
}

const espacios = 2

export default function fr_writer (p: N3.ProgramaCompilado) : string {
    // TODO: actualizar esto para que separe el codigo de los modulos...
    let enunciados = p.enunciados.map((e, i) => `${i}: ${procesar_enunciado(e)}\n`)

    return enunciados.reduce((p, c) => p + c, '')
}

function procesar_enunciado (e: N3.Enunciado) : string {
    switch (e.tipo) {
        case N3.TipoEnunciado.SUMAR:
            return `SUMAR`
        case N3.TipoEnunciado.RESTAR:
            return `return RESTAR`
        case N3.TipoEnunciado.DIV_REAL:
            return `DIV_REAL`
        case N3.TipoEnunciado.DIV_ENTERO:
            return `DIV_ENTERO`
        case N3.TipoEnunciado.MODULO:
            return `MODULO`
        case N3.TipoEnunciado.MULTIPLICAR:
            return `MULTIPLICAR`
        case N3.TipoEnunciado.ELEVAR:
            return `ELEVAR`
        case N3.TipoEnunciado.NEGAR:
            return `NEGAR`
        case N3.TipoEnunciado.NOT:
            return `NOT`
        case N3.TipoEnunciado.AND:
            return `AND`
        case N3.TipoEnunciado.OR:
            return `OR`
        case N3.TipoEnunciado.MENOR:
            return `MENOR`
        case N3.TipoEnunciado.MENORIGUAL:
            return `MENORIGUAL`
        case N3.TipoEnunciado.MAYOR:
            return `MAYOR`
        case N3.TipoEnunciado.MAYORIGUAL:
            return `MAYORIGUAL`
        case N3.TipoEnunciado.IGUAL:
            return `IGUAL`
        case N3.TipoEnunciado.DIFERENTE:
            return `DIFERENTE`
        case N3.TipoEnunciado.APILAR:
            return `APILAR ${e.valor}`
        case N3.TipoEnunciado.APILAR_VAR:
            return `APILAR_VAR ${e.nombreVariable}`
        case N3.TipoEnunciado.APILAR_ARR:
            return `APILAR_ARR ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoEnunciado.ASIGNAR:
            return `ASIGNAR ${e.nombreVariable}`
        case N3.TipoEnunciado.ASIGNAR_ARR:
            return `ASIGNAR_ARR ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoEnunciado.APILAR_R:
            return 'APILAR_R'
        case N3.TipoEnunciado.ASIGNAR_R:
            return 'ASIGNAR_R'
        case N3.TipoEnunciado.JIF:
            return `JIF ${e.numeroLinea}`
        case N3.TipoEnunciado.JIT:
            return `JIT ${e.numeroLinea}`
        case N3.TipoEnunciado.JMP:
            return `JMP ${e.numeroLinea}`
        case N3.TipoEnunciado.LLAMAR:
            return `LLAMAR ${e.nombreModulo}`
        case N3.TipoEnunciado.LEER:
            return `LEER ${e.nombreVariable} ${convertirTipoCadena(e.tipoVariable)}`
        case N3.TipoEnunciado.ESCRIBIR:
            return `ESCRIBIR`
        case N3.TipoEnunciado.ASIGNAR_CAD:
            return `ASIGNAR_CAD ${e.nombreVariable} ${e.longitudCadena} ${e.cantidadIndices}`
        case N3.TipoEnunciado.CONCATENAR:
            return `CONCATENAR ${e.cantidadCaracteres}`
        case N3.TipoEnunciado.REFERENCIA:
            return `REFERENCIA ${e.nombreReferencia} ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoEnunciado.COPIAR_ARR:
            return `COPIAR_ARR ${e.nombreObjetivo} ${e.cantidadIndicesObjetivo} ${e.nombreFuente} ${e.cantidadIndicesFuente}`
        case N3.TipoEnunciado.INIT_ARR:
            return `INIT_ARR ${e.nombreArregloObjetivo} ${e.arregloFuente}`
    }
}

function repetir (c: string, n: number) {
    let s = ''
    for (let i = 0; i < n; i++) {
        s += c
    }
    return s
}