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

export default function fr_writer (p: N3.Programa) : string {
    let programaRF = ""

    for (let mn in p.modulos) {
        let moduloRF = ""

        const modulo = p.modulos[mn]

        moduloRF += `INICIO ${mn.toUpperCase()}\n`

        for (let subEnunciado of modulo) {
            moduloRF += procesar_enunciado(subEnunciado, 1) + '\n'
        }

        moduloRF += `FIN ${mn.toUpperCase()}\n\n`

        programaRF += moduloRF
    }

    return programaRF
}

function procesar_enunciado (e: N3.Enunciado, nivel: number) : string {
    switch (e.tipo) {
        case N3.TipoEnunciado.SUMAR:
            return `${repetir(' ', nivel * espacios)}SUMAR`
        case N3.TipoEnunciado.RESTAR:
            return `return ${repetir(' ', nivel * espacios)}RESTAR`
        case N3.TipoEnunciado.DIV_REAL:
        return `${repetir(' ', nivel*espacios)}DIV_REAL`
        case N3.TipoEnunciado.DIV_ENTERO:
        return `${repetir(' ', nivel*espacios)}DIV_ENTERO`
        case N3.TipoEnunciado.MODULO:
        return `${repetir(' ', nivel*espacios)}MODULO`
        case N3.TipoEnunciado.MULTIPLICAR:
        return `${repetir(' ', nivel*espacios)}MULTIPLICAR`
        case N3.TipoEnunciado.ELEVAR:
        return `${repetir(' ', nivel*espacios)}ELEVAR`
        case N3.TipoEnunciado.NEGAR:
        return `${repetir(' ', nivel*espacios)}NEGAR`
        case N3.TipoEnunciado.NOT:
        return `${repetir(' ', nivel*espacios)}NOT`
        case N3.TipoEnunciado.AND:
        return `${repetir(' ', nivel*espacios)}AND`
        case N3.TipoEnunciado.OR:
        return `${repetir(' ', nivel*espacios)}OR`
        case N3.TipoEnunciado.MENOR:
        return `${repetir(' ', nivel*espacios)}MENOR`
        case N3.TipoEnunciado.MENORIGUAL:
        return `${repetir(' ', nivel*espacios)}MENORIGUAL`
        case N3.TipoEnunciado.MAYOR:
        return `${repetir(' ', nivel*espacios)}MAYOR`
        case N3.TipoEnunciado.MAYORIGUAL:
        return `${repetir(' ', nivel*espacios)}MAYORIGUAL`
        case N3.TipoEnunciado.IGUAL:
        return `${repetir(' ', nivel*espacios)}IGUAL`
        case N3.TipoEnunciado.DIFERENTE:
        return `${repetir(' ', nivel*espacios)}DIFERENTE`
        case N3.TipoEnunciado.APILAR:
            return `${repetir(' ', nivel * espacios)}APILAR ${e.valor}`
        case N3.TipoEnunciado.APILAR_VAR:
            return `${repetir(' ', nivel * espacios)}APILAR_VAR ${e.nombreVariable}`
        case N3.TipoEnunciado.APILAR_ARR:
            return `${repetir(' ', nivel * espacios)}APILAR_ARR ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoEnunciado.ASIGNAR:
            return `${repetir(' ', nivel * espacios)}ASIGNAR ${e.nombreVariable}`
        case N3.TipoEnunciado.ASIGNAR_ARR:
            return `${repetir(' ', nivel * espacios)}ASIGNAR_ARR ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoEnunciado.JIF:
            return `${repetir(' ', nivel * espacios)}JIF ${e.numeroLinea}`
        case N3.TipoEnunciado.JIT:
            return `${repetir(' ', nivel * espacios)}JIT ${e.numeroLinea}`
        case N3.TipoEnunciado.JMP:
            return `${repetir(' ', nivel * espacios)}JMP ${e.numeroLinea}`
        case N3.TipoEnunciado.LLAMAR:
            return `${repetir(' ', nivel * espacios)}LLAMAR ${e.nombreModulo}`
        case N3.TipoEnunciado.LEER:
            return `${repetir(' ', nivel * espacios)}LEER ${e.nombreVariable} ${convertirTipoCadena(e.tipoVariable)}`
        case N3.TipoEnunciado.ESCRIBIR:
            return `${repetir(' ', nivel * espacios)}ESCRIBIR`
        case N3.TipoEnunciado.ASIGNAR_CAD:
            return `${repetir(' ', nivel * espacios)}ASIGNAR_CAD ${e.nombreVariable} ${e.longitudCadena} ${e.cantidadIndices}`
        case N3.TipoEnunciado.CONCATENAR:
            return `${repetir(' ', nivel * espacios)}CONCATENAR ${e.cantidadCaracteres}`
        case N3.TipoEnunciado.REFERENCIA:
            return `${repetir(' ', nivel * espacios)}REFERENCIA ${e.nombreReferencia} ${e.nombreVariable} ${e.cantidadIndices}`
        case N3.TipoEnunciado.MKFRAME:
            return `${repetir(' ', nivel * espacios)}MKFRAME ${e.nombreModulo}`
        case N3.TipoEnunciado.COPIAR_ARR:
            return `${repetir(' ', nivel * espacios)}COPIAR_ARR ${e.arregloObjetivo} ${e.arregloFuente}`
        case N3.TipoEnunciado.INIT_ARR:
            return `${repetir(' ', nivel * espacios)}INIT_ARR ${e.nombreArregloObjetivo} ${e.arregloFuente}`
    }
}

function repetir (c: string, n: number) {
    let s = ''
    for (let i = 0; i < n; i++) {
        s += c
    }
    return s
}