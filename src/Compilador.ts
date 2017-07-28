import Parser from './parser/Parser'

import { Failure, Errors, Success, S1, S2, S3, Typed, N3 } from './interfaces'

import declararVariables from '../src/transforms/Declarator' // Nivel 1

import { transform as decorarLlamados, transform_expression as decorarExpresion} from '../src/transforms/CallDecorator' // Nivel 2

import TransformadorEvaluable from '../src/transforms/TransformacionEvaluable'

import { check as revisarTipos, revisarInspeccion } from '../src/typechecker/TSChecker'

import { transform as asignarTipos, type_expression as tiparExpresion, calculate_type as calcularTipo } from '../src/transforms/TSTyper'

export default class Compilador {
    private parser: Parser

    /**
     * El ultimo programa compilado, en cada una de las etapas de compilacion
     */
    private programaConVariables: S1.AST
    private programaDecorado: S2.AST
    private programaTipado: Typed.Program

    // Indica si hay un programa cargado en los atributos anteriores.
    // Se pone en verdadero una vez que se compila un programa exitosamente.
    private programaCargado: boolean

    private transformadorEvaluable: TransformadorEvaluable

    constructor() {
        this.parser = new Parser()
        this.programaConVariables = null
        this.programaDecorado = null
        this.programaTipado = null
        this.programaCargado = false
        this.transformadorEvaluable = new TransformadorEvaluable()
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
                            const programaCompilado = this.transformadorEvaluable.transformar(programaTipado.result)
                            
                            this.programaConVariables = programaConVariables.result
                            this.programaDecorado = programaConLlamados.result
                            this.programaTipado = programaTipado.result

                            this.programaCargado = true

                            return programaCompilado
                        }
                        else {
                            return { error: true, result: erroresTipado }
                        }
                    }
                    else {
                        this.programaCargado = false
                        return programaTipado
                    }
                }
                else if (programaConLlamados.error == true) {
                    this.programaCargado = false
                    return programaConLlamados
                }
            }
            else if (programaConVariables.error == true) {
                this.programaCargado = false
                return programaConVariables
            }
        }
        else if (fuenteAnalizada.error == true) {
            this.programaCargado = false
            return fuenteAnalizada
        }
    }

    /**
     * Compila una expresion a una serie de instrucciones
     * @param cadenaExpresion cadena de la expresion a compilar
     * @param ambito modulo en el cual se ejecuta esta expresion
     */
    compilarExpresion(cadenaExpresion: string, ambito: string): Failure<(Errors.Pattern | Errors.Lexical | S2.Error | Typed.Error | Errors.TypeError)[]> | Success<N3.ExpresionCompilada> {
        if (ambito == 'principal') {
            ambito = 'main'
        }
        if (this.programaCargado) {
            const expresionCompilada = this.parser.leerExpresion(cadenaExpresion)

            if (expresionCompilada.error == false) {
                const expresionDecorada = decorarExpresion(expresionCompilada.result, this.programaConVariables, ambito)

                if (expresionDecorada.error == false) {
                    const expresionTipada = tiparExpresion(expresionDecorada.result, ambito, this.programaDecorado)

                    if (expresionTipada.error == false) {
                        const erroresTipado = revisarInspeccion(expresionTipada.result, this.programaTipado)
                        if (erroresTipado.length == 0) {
                            const tipo = calcularTipo(expresionTipada.result)
                            if (tipo.error == false) {
                                const instrucciones = this.transformadorEvaluable.transformarExpresion(expresionTipada.result)
                                // const instrucciones = new TransformadorEvaluable().transformarExpresion(expresionTipada.result)
                                return { error: false, result: { tipo: tipo.result, instrucciones } }
                            }
                            else {
                                return tipo
                            }
                        }
                        else {
                            return { error: true, result: erroresTipado }
                        }
                    }
                    else {
                        return expresionTipada
                    }
                }
                else {
                    return expresionDecorada
                }
            }
            else {
                return expresionCompilada
            }
        }
        else {
            throw new Error('No hay ningun progama cargado, no se puede compilar la expresion.')
        }
    }
}