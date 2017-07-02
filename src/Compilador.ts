import Parser from './parser/Parser'

import { Failure, Errors, Success, N3 } from './interfaces'

import declararVariables from '../src/transforms/Declarator' // Nivel 1

import decorarLlamados from '../src/transforms/CallDecorator' // Nivel 2

import TransformadorEvaluable from '../src/transforms/TransformacionEvaluable'

import revisarTipos from '../src/typechecker/TSChecker'

import asignarTipos from '../src/transforms/TSTyper'

export default class Compilador {
    private parser: Parser

    constructor() {
        this.parser = new Parser()
    }

    compilar(fuente: string): Failure<Errors.Compilation[]> | Success<N3.ProgramaCompilado> {
        const fuenteAnalizada = this.parser.parse(fuente)

        if (fuenteAnalizada.error == false) {
            const programaConVariables = declararVariables(fuenteAnalizada.result)

            if (programaConVariables.error == false) {
                const programaConLlamados = decorarLlamados(programaConVariables.result)

                if (programaConLlamados.error == false) {
                    const programaTipado = asignarTipos(programaConLlamados.result)

                    if (programaTipado.error == false) {
                        const erroresTipado = revisarTipos(programaTipado.result)

                        if (erroresTipado.length == 0) {
                            const transformador = new TransformadorEvaluable()

                            const programaCompilado = transformador.transformar(programaTipado.result)

                            return programaCompilado
                        }
                        else {
                            return { error: true, result: erroresTipado }
                        }
                    }
                    else {
                        return programaTipado
                    }
                }
                else if (programaConLlamados.error == true) {
                    return programaConLlamados
                }
            }
            else if (programaConVariables.error == true) {
                return programaConVariables
            }
        }
        else if (fuenteAnalizada.error == true) {
            return fuenteAnalizada
        }
    }
}