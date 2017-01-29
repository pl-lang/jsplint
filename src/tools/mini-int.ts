/**
 * Script que ejecuta un programa pli. No soporta lecturas.
 */

import {readdirSync, readFileSync} from 'fs'
import Parser from '../parser/Parser'
import {Failure, Success, ParsedProgram} from '../interfaces'
import Interpreter from '../interpreter/Interpreter'
import transform from '../transformer/transform'
import typecheck from '../typechecker/TSChecker'

function parse (s: string) {
    const p = new Parser()

    p.on('syntax-error', console.log)

    return p.parse(s)
}

const args = process.argv.slice(2)

if (args.length > 0) {
    for (let arg of args) {
        const contenido = readFileSync(arg, 'utf8')
        const parsed = parse(contenido)
        if (parsed.error) {
            console.log('El programa tiene un error lexico o de sintaxis')
        } 
        else if (parsed.error == false) {
            const p = transform(parsed.result)
            if (p.error == true) {
                console.log('Hubo un error al transformar el programa')
                console.log(p)
            }
            else if (p.error == false) {
                const interpreter = new Interpreter(p.result)

                interpreter.on('program-started', () => {
                    console.log('Evento: program-started\n')
                })

                interpreter.on('program-paused', () => {
                    console.log('Evento: program-paused\n')
                })

                interpreter.on('program-finished', () => {
                    console.log('Evento: program-finished\n')
                })

                interpreter.on('evaluation-error', () => {
                    console.log('Evento: evaluation-error\n')
                })

                interpreter.on('write', (v) => {
                    console.log(v)
                })

                interpreter.run()
            }
        }
    }
}