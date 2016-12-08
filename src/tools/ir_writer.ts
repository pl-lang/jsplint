import {readdirSync, readFileSync, writeFileSync} from 'fs'
import Parser from '../parser/Parser'
import {IError, ISuccess} from '../interfaces/Utility'
import {ParsedProgram} from '../interfaces/ParsingInterfaces'
import * as S4 from '../interfaces/Program'
import transform from '../transformer/transform'

function parse (s: string) {
    const p = new Parser()

    p.on('syntax-error', console.log)

    return p.parse(s)
}

const args = process.argv.slice(2)
const espacios = 2
let guardar_resultado = false

let total = 0

if (args.length > 0) {
    /**
     * buscar banderas de configuracion
     */
    for (let arg of args) {
        if (arg == '-s' || arg == '-g') {
            guardar_resultado = true
        }
    }

    for (let arg of args) {
        console.log(`Procesando el archivo ${total + 1}`)
        const contenido = readFileSync(arg, 'utf8')
        const parsed = parse(contenido)
        if (parsed.error) {
            console.log(`Error al procesar el archivo ${total + 1}`)
        }
        else if (parsed.error == false) {
            const ir = transform(parsed.result)
            if (ir.error == true) {
                console.log(`Error al procesar el archivo ${total + 1} durante las transformaciones`)
                console.log(ir)
            }
            else if (ir.error == false) {
                const irs = procesar(ir.result)
                console.log(`Archivo ${total + 1} procesado exitosamente`)
                if (guardar_resultado) {
                    writeFileSync(arg + '_procesado', irs, {encoding:'utf8'})
                }
                else {
                    console.log(irs)
                }
                total++
            }
        }
    }
}

console.log(`Se ${total == 1 ? 'proceso':'procesaron'} ${total} ${total == 1 ? 'archivo':'archivos'}.`)

function procesar (p: S4.Program) : string {
    let variables = 'VARIABLES\n'

    for (let vn in p.local_variables['main']) {
        const v = p.local_variables['main'][vn] 
        variables += `${repetir(' ', espacios*2)}${v.datatype} ${vn}`
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
            variables += `${repetir(' ', espacios*2)}${v.datatype} ${vn}`
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

function procesar_parametros (ps: {[p: string]: S4.Parameter}) {
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

function procesar_enunciado (e: S4.Statement, nivel: number) : string {
    switch (e.kind) {
        case S4.StatementKinds.Plus:
            return `${repetir(' ', nivel*espacios)} SUMAR`
        case S4.StatementKinds.Minus:
            return `${repetir(' ', nivel*espacios)} RESTAR`
        case S4.StatementKinds.Times:
            return `${repetir(' ', nivel*espacios)} MULTIPLICAR`
        case S4.StatementKinds.Slash:
            return `${repetir(' ', nivel*espacios)} DIVIDIR`
        case S4.StatementKinds.Div:
            return `${repetir(' ', nivel*espacios)} DIV`
        case S4.StatementKinds.Mod:
            return `${repetir(' ', nivel*espacios)} MODULO`
        case S4.StatementKinds.Power:
            return `${repetir(' ', nivel*espacios)} POTENCIA`
        case S4.StatementKinds.Assign:
            return `${repetir(' ', nivel*espacios)} ASIGNAR ${e.varname}`
        case S4.StatementKinds.Get:
            return `${repetir(' ', nivel*espacios)} INVOCAR ${e.varname}`
        case S4.StatementKinds.AssignV:
            return `${repetir(' ', nivel*espacios)} ASIGNARV ${e.varname} ${e.total_indexes}`
        case S4.StatementKinds.GetV:
            return `${repetir(' ', nivel*espacios)} INVOCARV ${e.varname} ${e.total_indexes}`
        case S4.StatementKinds.Push:
            return `${repetir(' ', nivel*espacios)} APILAR ${e.value}`
        case S4.StatementKinds.Pop:
            return `${repetir(' ', nivel*espacios)} DESAPILAR`
        case S4.StatementKinds.Minor:
            return `${repetir(' ', nivel*espacios)} MENOR`
        case S4.StatementKinds.MinorEq:
            return `${repetir(' ', nivel*espacios)} MENOR IGUAL`
        case S4.StatementKinds.Different:
            return `${repetir(' ', nivel*espacios)} DISTINTO`
        case S4.StatementKinds.Equal:
            return `${repetir(' ', nivel*espacios)} IGUAL`
        case S4.StatementKinds.Major:
            return `${repetir(' ', nivel*espacios)} MAYOR`
        case S4.StatementKinds.MajorEq:
            return `${repetir(' ', nivel*espacios)} MAYOR IGUAL`
        case S4.StatementKinds.Not:
            return `${repetir(' ', nivel*espacios)} NOT`
        case S4.StatementKinds.And:
            return `${repetir(' ', nivel*espacios)} AND`
        case S4.StatementKinds.Or:
            return `${repetir(' ', nivel*espacios)} O`
        case S4.StatementKinds.If:
            return procesar_si(e, nivel + 1)
        case S4.StatementKinds.While:
            return procesar_mientras(e, nivel + 1)
        case S4.StatementKinds.Until:
            // return procesar_hasta(e, nivel + 1)
            return '"REPETIR HASTA QUE" NO IMPLEMENTADO'
        case S4.StatementKinds.UserModuleCall:
            return `${repetir(' ', nivel*espacios)} LLAMAR ${e.name} ${e.total_args}`
        case S4.StatementKinds.ReadCall:
            return `${repetir(' ', nivel*espacios)} LEER ${e.varname}`
        case S4.StatementKinds.WriteCall:
            return `${repetir(' ', nivel*espacios)} ESCRIBIR`
    }
}

function procesar_si(e: S4.If, nivel: number) : string {
    let s = ''

    s += `${repetir(' ', (nivel - 1)*espacios)}SI VERDADERO:\n`
    /**
     * Procesar rama verdadera
     */
    let c = e.true_branch_entry
    while (c != null) {
        s += repetir(' ', nivel*espacios) + procesar_enunciado(c, 0) + '\n'
        c = c.exit_point
    }

    if (e.false_branch_entry) {
        s += `${repetir(' ', (nivel - 1)*espacios)}SI FALSO:\n`
        let c = e.false_branch_entry
        while (c != null) {
            s += repetir(' ', nivel*espacios) + procesar_enunciado(c, 0) + '\n'
            c = c.exit_point
        }   
    }

    s += `${repetir(' ', (nivel - 1)*espacios)}FIN SI`

    return s
}

function procesar_mientras(e: S4.While, nivel: number) : string {
    let s = ''

    s += `${repetir(' ', (nivel - 1)*espacios)}MIENTRAS VERDADERO:\n`
    /**
     * Procesar rama verdadera
     */
    let c = e.entry_point
    while (c != null) {
        s += repetir(' ', nivel*espacios) + procesar_enunciado(c, 0) + '\n'
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