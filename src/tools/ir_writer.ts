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

let total = 0

if (args.length > 0) {
    for (let arg of args) {
        console.log(`Procesando el archivo ${total + 1}`)
        const contenido = readFileSync(arg, 'utf8')
        const parsed = parse(contenido)
        if (parsed.error) {
            console.log(`Error al procesar el archivo ${total + 1}`)
        }
        else if (parsed.error == false) {
            const ir = transform(parsed.result)
            if ('error' in ir) {
                console.log(`Error al procesar el archivo ${total + 1} durante las transformaciones`)
                console.log(ir)
            }
            else {
                console.log(`Archivo ${total + 1} procesado exitosamente`)
                const irs = procesar(ir as S4.Program)
                writeFileSync(arg + '_procesado', irs, {encoding:'utf8'})
            }
        }
        total++
    }
}

console.log(`Se ${total == 1 ? 'proceso':'procesaron'} ${total} ${total == 1 ? 'archivo':'archivos'}.`)

function procesar (p: S4.Program) : string {
    let s = 'INICIO\n'

    /**
     * Procesar main
     */
    let c = p.entry_point
    while (c != null) {
        s += procesar_enunciado(c, 0) + '\n'
        c = c.exit_point
    }

    s += `FIN`

    return s
}

function procesar_enunciado (e: S4.Statement, nivel: number) : string {
    switch (e.kind) {
        case S4.StatementKinds.Plus:
            return `${repetir(' ', nivel*2)} SUMAR`
        case S4.StatementKinds.Minus:
            return `${repetir(' ', nivel*2)} REPETIR`
        case S4.StatementKinds.Times:
            return `${repetir(' ', nivel*2)} MULTIPLICAR`
        case S4.StatementKinds.Slash:
            return `${repetir(' ', nivel*2)} DIVIDIR`
        case S4.StatementKinds.Div:
            return `${repetir(' ', nivel*2)} DIV`
        case S4.StatementKinds.Mod:
            return `${repetir(' ', nivel*2)} MODULO`
        case S4.StatementKinds.Power:
            return `${repetir(' ', nivel*2)} POTENCIA`
        case S4.StatementKinds.Assign:
            return `${repetir(' ', nivel*2)} ASIGNAR ${e.varname}`
        case S4.StatementKinds.Get:
            return `${repetir(' ', nivel*2)} INVOCAR ${e.varname}`
        case S4.StatementKinds.AssignV:
            return `${repetir(' ', nivel*2)} ASIGNARV ${e.varname} ${e.total_indexes}`
        case S4.StatementKinds.GetV:
            return `${repetir(' ', nivel*2)} INVOCARV ${e.varname} ${e.total_indexes}`
        case S4.StatementKinds.Push:
            return `${repetir(' ', nivel*2)} APILAR ${e.value}`
        case S4.StatementKinds.Pop:
            return `${repetir(' ', nivel*2)} DESAPILAR`
        case S4.StatementKinds.Minor:
            return `${repetir(' ', nivel*2)} MENOR`
        case S4.StatementKinds.MinorEq:
            return `${repetir(' ', nivel*2)} MENOR IGUAL`
        case S4.StatementKinds.Different:
            return `${repetir(' ', nivel*2)} DISTINTO`
        case S4.StatementKinds.Equal:
            return `${repetir(' ', nivel*2)} IGUAL`
        case S4.StatementKinds.Major:
            return `${repetir(' ', nivel*2)} MAYOR`
        case S4.StatementKinds.MajorEq:
            return `${repetir(' ', nivel*2)} MAYOR IGUAL`
        case S4.StatementKinds.Not:
            return `${repetir(' ', nivel*2)} NOT`
        case S4.StatementKinds.And:
            return `${repetir(' ', nivel*2)} AND`
        case S4.StatementKinds.Or:
            return `${repetir(' ', nivel*2)} O`
        case S4.StatementKinds.If:
            return procesar_si(e, nivel + 1)
        case S4.StatementKinds.While:
            return procesar_mientras(e, nivel + 1)
        case S4.StatementKinds.Until:
            // return procesar_hasta(e, nivel + 1)
            return '"REPETIR HASTA QUE" NO IMPLEMENTADO'
        case S4.StatementKinds.UserModuleCall:
            return `${repetir(' ', nivel*2)} LLAMAR ${e.name} ${e.total_args}`
        case S4.StatementKinds.ReadCall:
            return `${repetir(' ', nivel*2)} LEER ${e.varname}`
        case S4.StatementKinds.WriteCall:
            return `${repetir(' ', nivel*2)} ESCRIBIR`
    }
}

function procesar_si(e: S4.If, nivel: number) : string {
    let s = ''

    s += `${repetir(' ', (nivel - 1)*2)}SI VERDADERO:`
    /**
     * Procesar rama verdadera
     */
    let c = e.true_branch_entry
    while (c.exit_point != null) {
        s += repetir(' ', nivel*2) + procesar_enunciado(c, 0)
        c = c.exit_point
    }

    if (e.false_branch_entry) {
        s += `${repetir(' ', (nivel - 1)*2)}SI FALSO:`
        let c = e.true_branch_entry
        while (c.exit_point != null) {
            s += repetir(' ', nivel*2) + procesar_enunciado(c, 0)
            c = c.exit_point
        }   
    }

    s += `${repetir(' ', (nivel - 1)*2)}FIN SI:`

    return s
}

function procesar_mientras(e: S4.While, nivel: number) : string {
    let s = ''

    s += `${repetir(' ', (nivel - 1)*2)}MIENTRAS VERDADERO:`
    /**
     * Procesar rama verdadera
     */
    let c = e.entry_point
    while (c.exit_point != null) {
        s += repetir(' ', nivel*2) + procesar_enunciado(c, 0)
        c = c.exit_point
    }

    s += `${repetir(' ', (nivel - 1)*2)}FIN MIENTRAS:`

    return s
}

function repetir (c: string, n: number) {
    let s = ''
    for (let i = 0; i < n; i++) {
        s += c
    }
    return s
}