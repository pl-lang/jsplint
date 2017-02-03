import {Failure, Success, ParsedProgram, S3} from '../interfaces'
import transform from '../transformer/transform'
import Parser from '../parser/Parser'

function parse (s: string) {
    const p = new Parser()

    p.on('lexical-error', console.log)
    p.on('syntax-error', console.log)

    return p.parse(s)
}

const espacios = 2

export default function fr_writer (p: S3.Program) : string {
    let variables = 'VARIABLES\n'

    for (let vn in p.local_variables['main']) {
        const v = p.local_variables['main'][vn] 
        variables += `${repetir(' ', espacios)}${v.datatype} ${vn}`
        if (v.is_array) {
            variables += `[${v.dimensions.toString()}]`
        }
        variables += '\n'
    }

    let s = `${variables}INICIO\n`

    /**
     * Procesar main
     */
    let c = p.entry_point
    while (c != null) {
        s += procesar_enunciado(c, 1) + '\n'
        c = c.exit_point
    }

    s += `FIN\n`

    for (let mn in p.modules) {
        s += `\n${mn} (${procesar_parametros(p.modules[mn].parameters)})\n`

        let variables = ''   
        /**
         * imprimir las variables
         */
        for (let vn in p.local_variables[mn]) {
            const v = p.local_variables[mn][vn] 
            variables += `${repetir(' ', espacios)}${v.datatype} ${vn}`
            if (v.is_array) {
                variables += `[${v.dimensions.toString()}]`
            }
            variables += '\n'
        }

        s += `${variables}INICIO\n`

        /**
         * Procesar main
         */
        let c = p.modules[mn].entry_point
        while (c != null) {
            s += procesar_enunciado(c, 1) + '\n'
            c = c.exit_point
        }

        s += `FIN\n`
    }

    return s
}

function procesar_parametros (ps: {[p: string]: S3.Parameter}) {
    let s = ''
    const length = Object.keys(ps).length
    let i = 0
    for (let pn in ps) {
         s += `${ps[pn].by_ref ? 'ref ':''}${pn}${ps[pn].is_array ? '[]':''}`
         if (i < length - 1) {
             s += ', '
         }
         i++
    }
    return s
}

function procesar_enunciado (e: S3.Statement, nivel: number) : string {
    switch (e.kind) {
        case S3.StatementKinds.Plus:
            return `${repetir(' ', nivel*espacios)}SUMAR`
        case S3.StatementKinds.Minus:
            return `${repetir(' ', nivel*espacios)}RESTAR`
        case S3.StatementKinds.Times:
            return `${repetir(' ', nivel*espacios)}MULTIPLICAR`
        case S3.StatementKinds.Slash:
            return `${repetir(' ', nivel*espacios)}DIVIDIR`
        case S3.StatementKinds.Div:
            return `${repetir(' ', nivel*espacios)}DIV`
        case S3.StatementKinds.Mod:
            return `${repetir(' ', nivel*espacios)}MODULO`
        case S3.StatementKinds.Power:
            return `${repetir(' ', nivel*espacios)}POTENCIA`
        case S3.StatementKinds.Assign:
            return `${repetir(' ', nivel*espacios)}ASIGNAR ${e.varname}`
        case S3.StatementKinds.Get:
            return `${repetir(' ', nivel*espacios)}INVOCAR ${e.varname}`
        case S3.StatementKinds.AssignV:
            return `${repetir(' ', nivel*espacios)}ASIGNARV ${e.varname} ${e.total_indexes}`
        case S3.StatementKinds.GetV:
            return `${repetir(' ', nivel*espacios)}INVOCARV ${e.varname} ${e.total_indexes}`
        case S3.StatementKinds.Push:
            return `${repetir(' ', nivel*espacios)}APILAR ${e.value}`
        case S3.StatementKinds.Pop:
            return `${repetir(' ', nivel*espacios)}DESAPILAR`
        case S3.StatementKinds.Minor:
            return `${repetir(' ', nivel*espacios)}MENOR`
        case S3.StatementKinds.MinorEq:
            return `${repetir(' ', nivel*espacios)}MENOR IGUAL`
        case S3.StatementKinds.Different:
            return `${repetir(' ', nivel*espacios)}DISTINTO`
        case S3.StatementKinds.Equal:
            return `${repetir(' ', nivel*espacios)}IGUAL`
        case S3.StatementKinds.Major:
            return `${repetir(' ', nivel*espacios)}MAYOR`
        case S3.StatementKinds.MajorEq:
            return `${repetir(' ', nivel*espacios)}MAYOR IGUAL`
        case S3.StatementKinds.Not:
            return `${repetir(' ', nivel*espacios)}NOT`
        case S3.StatementKinds.And:
            return `${repetir(' ', nivel*espacios)}AND`
        case S3.StatementKinds.Or:
            return `${repetir(' ', nivel*espacios)}O`
        case S3.StatementKinds.If:
            return procesar_si(e, nivel + 1)
        case S3.StatementKinds.While:
            return procesar_mientras(e, nivel + 1)
        case S3.StatementKinds.Until:
            // return procesar_hasta(e, nivel + 1)
            return '"REPETIR HASTA QUE" NO IMPLEMENTADO'
        case S3.StatementKinds.UserModuleCall:
            return `${repetir(' ', nivel*espacios)}LLAMAR ${e.name} ${e.total_args}`
        case S3.StatementKinds.ReadCall:
            return `${repetir(' ', nivel*espacios)}LEER ${e.varname}`
        case S3.StatementKinds.WriteCall:
            return `${repetir(' ', nivel*espacios)}ESCRIBIR`
        case S3.StatementKinds.Return:
            return `${repetir(' ', nivel*espacios)}RETORNAR`
        case S3.StatementKinds.Concat:
            return `${repetir(' ', nivel*espacios)}CONCATENAR ${e.length}`
        case S3.StatementKinds.AssignString:
            return `${repetir(' ', nivel*espacios)}ASIGNAR CADENA ${e.varname} ${e.length} ${e.indexes}`
        case S3.StatementKinds.Alias:
            return `${repetir(' ', nivel*espacios)}ALIAS ${e.varname} ${e.var_indexes} ${e.dimensions} ${e.local_alias}`
        case S3.StatementKinds.CopyVec:
            return `${repetir(' ', nivel*espacios)}CPYVEC ${e.target.name} ${e.target.dimensions} ${e.target.indexes} ${e.source.name} ${e.source.dimensions} ${e.source.indexes}`
    }
}

function procesar_si(e: S3.If, nivel: number) : string {
    let s = ''

    s += `${repetir(' ', (nivel - 1)*espacios)}SI VERDADERO:\n`
    /**
     * Procesar rama verdadera
     */
    let c = e.true_branch_entry
    while (c != null) {
        s += procesar_enunciado(c, nivel + 1) + '\n'
        c = c.exit_point
    }

    if (e.false_branch_entry) {
        s += `${repetir(' ', (nivel - 1)*espacios)}SI FALSO:\n`
        let c = e.false_branch_entry
        while (c != null) {
            s += procesar_enunciado(c, nivel + 1) + '\n'
            c = c.exit_point
        }   
    }

    s += `${repetir(' ', (nivel - 1)*espacios)}FIN SI`

    return s
}

function procesar_mientras(e: S3.While, nivel: number) : string {
    let s = ''

    s += `${repetir(' ', (nivel - 1)*espacios)}MIENTRAS VERDADERO:\n`
    /**
     * Procesar rama verdadera
     */
    let c = e.entry_point
    while (c != e) {
        s += procesar_enunciado(c, nivel + 1) + '\n'
        c = c.exit_point
    }

    s += `${repetir(' ', (nivel - 1)*espacios)}FIN MIENTRAS`

    return s
}

function repetir (c: string, n: number) {
    let s = ''
    for (let i = 0; i < n; i++) {
        s += c
    }
    return s
}