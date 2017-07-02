// Transforma un programa tipado para que pueda ser evaluado

import { Errors, Success, S0, S2, S3, N3, Typed } from '../interfaces'
import { drop, arr_counter, arr_counter_inc, arr_counter_dec, arr_minor, arr_major, arr_equal } from '../utility/helpers'

export default class TrasnformadorEvaluable {
    
    private ultimaLinea: number // Indica el numero de la ultima linea que fue generada

    /**
     * Para cada modulo, contiene dos arreglos: uno con los numeros de linea
     * de los enuciados del codigo fuente, y otro con los numeros de sub-enunciado correspondientes
     */
    private lineasPorModulo: {
        principal: { enunciados: number[], subEnunciados: number[] }
        [m: string]: { enunciados: number[], subEnunciados: number[] }
    }

    private nombreModuloActual: string

    constructor() {
        this.ultimaLinea = 0
        this.lineasPorModulo = { principal: { enunciados: [], subEnunciados: [] } }
        this.nombreModuloActual = ""
    }

    transformar(p: Typed.Program): Success<N3.ProgramaCompilado> {
        const resultadoFinal: N3.Programa = {
            modulos: {
                principal: []
            },
            variablesLocales: {
                main: {}
            }
        }

        for (let clave in p.modules) {
            const moduloOriginal = p.modules[clave]
            if (clave == 'main') {
                this.nombreModuloActual = "principal"
                resultadoFinal.modulos.principal = this.transformarModuloPrincipal(moduloOriginal)
            }
            else {
                this.nombreModuloActual = clave
                // resultadoFinal.modulos[clave] = this.transformarModulo(moduloOriginal)
            }
        }

        console.log(this.lineasPorModulo.principal.enunciados)
        console.log(this.lineasPorModulo.principal.subEnunciados)

        return { error: false, result: { programa: resultadoFinal, lineasPorModulo: this.lineasPorModulo } }
    }

    private transformarModuloPrincipal(m: Typed.Module): N3.Enunciado[] {
        this.nombreModuloActual = "principal"

        let enunciados: N3.Enunciado[] = []

        for (let enunciado of m.body) {
            const enunciadoTransformado = this.transformarEnunciado(enunciado)

            enunciados = [...enunciados, ...enunciadoTransformado]

            this.ultimaLinea += enunciadoTransformado.length
        }

        return enunciados
    }

    // private transformarModulo(m: Typed.Module): N3.Enunciado[] {
    //     // inicializar los parametros que no sean pasados por referencia primero
    //     for (let i = m.parameters.length - 1; i >= 0; i--) {
    //         const param = m.parameters[i]
    //         if (!param.by_ref && !param.is_array) {

    //         }
    //     }
    //     // luego transformar el cuerpo
    // }

    private transformarEnunciado(e: Typed.Statement): N3.Enunciado[] {
        switch (e.type) {
            case "assignment":
                return this.transformarAsignacion(e)
            case "if":
                return this.transformarSi(e)
            case "while":
                return this.transformarMientras(e)
            case "until":
                return this.transformarHastaQue(e)
            case "return":
                return this.transformarRetornar(e)
            case "for":
                return this.transformarPara(e)
            case "call":
                return this.transformarLlamado(e)
        }
    }

    private transformarAsignacion(e: Typed.Assignment): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        const variableObjetivo = e.left
        const expresionAsignada = e.right

        // La asignacion a un vector puede ser:
        // 1 - Asignar a una celda de un vector
        // 2 - Asinar a un rango de celdas de un vector
        //  2.a - Asignar una cadena "literal" a un vector
        //  2.b - Copiar un vector (o parte de un vector) a otro

        if (variableObjetivo.is_array) {
            if (variableObjetivo.dimensions.length == variableObjetivo.indexes.length) {
                // 1 - Asignar a una celda de un vector

                // Sub-enunciados que resultan de transformar cada una de las expresiones de los indices
                const apilarIndices = variableObjetivo.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                // Sub-enunciados que resultan de transformar la expresion
                const apilarExpresion = this.transformarExpresion(expresionAsignada)

                const cantidadIndices = variableObjetivo.indexes.length

                // sub-enunciado de asignacion
                const asignacion: N3.ASIGNAR_ARR = { tipo: N3.TipoEnunciado.ASIGNAR_ARR, nombreVariable: variableObjetivo.name, cantidadIndices }

                const enunciadoTransformado = [...apilarIndices, ...apilarExpresion, asignacion]

                return enunciadoTransformado
            }
            else {
                // 2 - A un rango de celdas
                if (e.typings.left instanceof Typed.StringType && e.typings.right instanceof Typed.StringType && e.typings.right.represents == "literal") {
                    //  2.a - Asignar una cadena "literal" a un vector

                    // Sub-enunciados que resultan de transformar la expresion
                    const apilarCadena = this.transformarExpresion(expresionAsignada)

                    const cantidadIndices = variableObjetivo.indexes.length

                    const longitudCadena = e.typings.right.length

                    const asignacion: N3.ASIGNAR_CAD = {
                        tipo: N3.TipoEnunciado.ASIGNAR_CAD,
                        nombreVariable: variableObjetivo.name,
                        cantidadIndices,
                        longitudCadena
                    }

                    const enunciadoTransformado = [...apilarCadena, asignacion]

                    return enunciadoTransformado
                }
                else {
                    //  2.b - Copiar un vector (o parte de un vector) a otro

                    // Sub-enunciados que resultan de transformar cada una de las expresiones de los indices
                    // del vector que recibe los datos
                    const apilarIndicesObjetivo = variableObjetivo.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                    /**
                     * Aclaracion: el type assert para e.right es correcto porque ya se verificó
                     * (en TSChecker) que el primer y unico componente de esa expresion sea una
                      * invocacion de un vector.
                     */
                    const vectorOrigen = e.right[0] as Typed.Invocation

                    // Sub-enunciados que resultan de transformar cada una de las expresiones de los indices
                    // del vector de donde se obtienen los datos
                    const apilarIndicesOrigen = vectorOrigen.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                    const arregloObjetivo: S3.VectorData = {
                        name: variableObjetivo.name,
                        indexes: variableObjetivo.indexes.length,
                        dimensions: variableObjetivo.dimensions
                    }

                    const arregloFuente: S3.VectorData = {
                        name: vectorOrigen.name,
                        indexes: vectorOrigen.indexes.length,
                        dimensions: vectorOrigen.dimensions
                    }

                    const asignacion: N3.COPIAR_ARR = { tipo: N3.TipoEnunciado.COPIAR_ARR, arregloObjetivo, arregloFuente }

                    const enunciadoTransformado = [...apilarIndicesObjetivo, ...apilarIndicesOrigen, asignacion]

                    return enunciadoTransformado
                }
            }
        }
        else {
            // Sub-enunciados que resultan de transformar la expresion
            const apilarExpresion = this.transformarExpresion(expresionAsignada)

            // sub-enunciado de asignacion
            const asignacion: N3.ASIGNAR = { tipo: N3.TipoEnunciado.ASIGNAR, nombreVariable: variableObjetivo.name }

            const enunciadoTransformado = [...apilarExpresion, asignacion]

            return enunciadoTransformado
        }
    }

    private transformarSi(e: Typed.If): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        // transformar condicion

        const apilarCondicion = this.transformarExpresion(e.condition)
        
        // transformar rama verdadera
        
        let subEnunciadosVerdadero: N3.Enunciado[] = []

        for (let enunciado of e.true_branch) {
            subEnunciadosVerdadero = [...subEnunciadosVerdadero, ...this.transformarEnunciado(enunciado)]
        }

        // transformar rama falsa

        let subEnunciadosFalso: N3.Enunciado[] = []

        for (let enunciado of e.false_branch) {
            subEnunciadosFalso = [...subEnunciadosFalso, ...this.transformarEnunciado(enunciado)]
        }

        // Agregar saltos segun sea necesario y retornar resultado
        if (subEnunciadosVerdadero.length == 0 && subEnunciadosFalso.length == 0) {
            // si ambas ramas estan vacias, no retornar ningun enunciado...
            return []
        }
        else if (subEnunciadosVerdadero.length > 0 && subEnunciadosFalso.length == 0) {
            // Si solo la rama verdadera tiene algo, agregar salto para los casos
            // en los que la condicion da falso

            const numeroLinea = this.ultimaLinea + apilarCondicion.length + subEnunciadosVerdadero.length + 1

            const saltoEnFalso: N3.JIF = { tipo: N3.TipoEnunciado.JIF, numeroLinea }

            const resultadoFinal: N3.Enunciado[] = [...apilarCondicion, saltoEnFalso, ...subEnunciadosVerdadero]

            return resultadoFinal
        }
        else if (subEnunciadosVerdadero.length == 0 && subEnunciadosFalso.length > 0) {
            // Si solo la rama verdadera tiene algo (por algun motivo...), agregar salto para los casos
            // en los que la condicion da verdadero

            const numeroLinea = this.ultimaLinea + apilarCondicion.length + subEnunciadosFalso.length + 1

            const saltoEnVerdadero: N3.JIT = { tipo: N3.TipoEnunciado.JIT, numeroLinea }

            const resultadoFinal: N3.Enunciado[] = [...apilarCondicion, saltoEnVerdadero, ...subEnunciadosFalso]

            return resultadoFinal
        }
        else {
            // Si ambas ramas tienen algo agregar:
            // Un salto condicional para cuando la condicion da falso que permita ir a la rama falsa
            // Un salto incondicional como ultimo enunciado de la rama verdadera para saltearse la rama falsa

            const inicioRamaFalsa = this.ultimaLinea + apilarCondicion.length + 1 + subEnunciadosVerdadero.length + 1

            const saltarARamaFalsa: N3.JIF = { tipo: N3.TipoEnunciado.JIF, numeroLinea: inicioRamaFalsa }

            const finRamaFalsa = this.ultimaLinea + apilarCondicion.length + 1 + subEnunciadosVerdadero.length + 1 + subEnunciadosFalso.length
            
            const saltearRamaFalsa: N3.JMP = { tipo: N3.TipoEnunciado.JMP, numeroLinea: finRamaFalsa }

            const resultadoFinal: N3.Enunciado[] = [
                ...apilarCondicion,
                saltarARamaFalsa,
                ...subEnunciadosVerdadero,
                saltearRamaFalsa,
                ...subEnunciadosFalso
            ]

            return resultadoFinal
        }
    }

    private transformarMientras(e: Typed.While): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        const apilarCondicion = this.transformarExpresion(e.condition)

        let enunciadosBucle: N3.Enunciado[] = []

        for (let enunciado of e.body) {
            enunciadosBucle = [...enunciadosBucle, ...this.transformarEnunciado(enunciado)]
        }

        // Salto condicional (solo salta si la condicion dio falso) para saltear el cuerpo del bucle
        const saltearBucle = this.ultimaLinea + apilarCondicion.length + 1 + enunciadosBucle.length + 1
        const saltoCondicional: N3.JIF = { tipo: N3.TipoEnunciado.JIF, numeroLinea: saltearBucle }

        // Salto incondicional al principio de la evaluacion de la condicion
        const volverACondicion = this.ultimaLinea
        const saltoIncondicional: N3.JMP = { tipo: N3.TipoEnunciado.JMP, numeroLinea: volverACondicion }

        return [...apilarCondicion, saltoCondicional, ...enunciadosBucle, saltoIncondicional]
    }

    private transformarHastaQue(e: Typed.Until): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        let enunciadosBucle: N3.Enunciado[] = []

        for (let enunciado of e.body) {
            enunciadosBucle = [...enunciadosBucle, ...this.transformarEnunciado(enunciado)]
        }

        const apilarCondicion = this.transformarExpresion(e.condition)

        // Salto condicional (solo si la condicion dio falso) para volver al tope del bucle
        const volverATope = this.ultimaLinea
        const saltoCondicional: N3.JIF = { tipo: N3.TipoEnunciado.JIF, numeroLinea: volverATope }

        return [...enunciadosBucle, ...apilarCondicion, saltoCondicional]
    }

    private transformarPara(e: Typed.For): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        // inicializacion
        // evaluacion de condicion
        // salto para evitar cuerpo de bucle
        // cuerpo de bucle
        // incremento
        // salto a evaluacion de condicion
        const inicializacion = this.transformarAsignacion(e.counter_init)

        const condicion = this.crearCondicionPara(e.counter_init.left, e.last_value)

        let enunciadosBucle: N3.Enunciado[] = []

        for (let enunciado of e.body) {
            enunciadosBucle = [...enunciadosBucle, ...this.transformarEnunciado(enunciado)]
        }

        const incremento = this.crearIncrementoPara(e.counter_init.left)

        const base = this.ultimaLinea + inicializacion.length + condicion.length

        const saltearBucle = base + enunciadosBucle.length + incremento.length + 1
        const saltoCondicional: N3.JIF = { tipo: N3.TipoEnunciado.JIF, numeroLinea: saltearBucle }

        const volverACondicion = this.ultimaLinea + inicializacion.length
        const saltoIncondicional: N3.JMP = { tipo: N3.TipoEnunciado.JMP, numeroLinea: volverACondicion }

        return [...inicializacion, ...condicion, saltoCondicional, ...enunciadosBucle, ...incremento, saltoIncondicional]
        
    }

    private transformarRetornar(e: Typed.Return): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        return this.transformarExpresion(e.expression)
    }

    private transformarLlamado(e: Typed.Call): N3.Enunciado[] {
        this.lineasPorModulo.principal.enunciados.push(e.pos.line)
        this.lineasPorModulo.principal.subEnunciados.push(this.ultimaLinea)

        // La transformacion para los llamados a "leer" y "escribir" es diferente
        // a la transformacion de llamados a modulos del usuario.

        if (e.name == "escribir") {
            // Hay que generar un llamado a escribir por cada
            // argumento
            let llamadosAEscribir: N3.Enunciado[] = []

            const apilarArgumentos = e.args.map(this.transformarExpresion)

            for (let argumento of apilarArgumentos) {
                const escribir: N3.ESCRIBIR = { tipo: N3.TipoEnunciado.ESCRIBIR }
                llamadosAEscribir = [...llamadosAEscribir, ...argumento, escribir]
            }

            return llamadosAEscribir
        }
        else if (e.name == "leer") {
            // Hay que generar un llamado a leer por cada argumento
            // De la misma manera, tiene que haber una asignacion
            // despues de cada lectura
            let llamadosALeer: N3.Enunciado[] = []

            for (let i = 0; i < e.args.length; i++) {
                /**
                 * El type assert es correcto porque esta garantizado por
                 * el TypeChecker que los argumentos de un llamado a leer
                 * son todos Typed.Invocation.
                 */
                const arg = e.args[i][0] as Typed.Invocation

                const leer: N3.LEER = {
                    tipo: N3.TipoEnunciado.LEER,
                    nombreVariable: arg.name,
                    tipoVariable: arg.typings.type as (Typed.AtomicType | Typed.StringType)
                }

                if (!arg.is_array) {
                    const asignacion: N3.ASIGNAR = { tipo: N3.TipoEnunciado.ASIGNAR, nombreVariable: arg.name }
                    
                    llamadosALeer = [...llamadosALeer, leer, asignacion]
                }
                else {
                    const apilarIndices = arg.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                    const asignacion: N3.ASIGNAR_ARR = {
                        tipo: N3.TipoEnunciado.ASIGNAR_ARR,
                        nombreVariable: arg.name,
                        cantidadIndices: arg.indexes.length
                    }

                    llamadosALeer = [...llamadosALeer, leer, ...apilarIndices, asignacion]
                }
            }

            return llamadosALeer
        }
        else {
            let argumentos: N3.Enunciado[] = []

            for (let i = 0; i < e.args.length; i++) {
                const arg = e.args[i]
                const param = e.parameters[i]

                if (param.by_ref) {
                    /**
                     * Aclaracion: el type assert para arg[0] es correcto porque ya se verificó
                     * (en TSChecker) que el primer y unico componente de esa expresion sea una
                         * invocacion de un vector.
                     */
                    const invocacion = arg[0] as Typed.Invocation

                    const apilarIndices = invocacion.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                    const hacerAlias: N3.ALIAS = {
                        tipo: N3.TipoEnunciado.ALIAS,
                        nombreAlias: param.name,
                        nombreVariable: invocacion.name,
                        cantidadIndices: invocacion.indexes.length
                    }

                    argumentos = [...argumentos, ...apilarIndices, hacerAlias]
                }
                else {
                    if (param.is_array) {
                        /**
                         * Aclaracion: el type assert para arg[0] es correcto porque ya se verificó
                         * (en TSChecker) que el primer y unico componente de esa expresion sea una
                          * invocacion de un vector.
                         */
                        const arregloFuente = arg[0] as Typed.Invocation

                        const apilarIndices = arregloFuente.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                        const datosArregloFuente: S3.VectorData = {
                            name: arregloFuente.name,
                            dimensions: arregloFuente.dimensions,
                            indexes: arregloFuente.indexes.length
                        }

                        const inicializarArreglo: N3.INIT_ARR = {
                            tipo: N3.TipoEnunciado.INIT_ARR,
                            nombreArregloObjetivo: param.name,
                            arregloFuente: datosArregloFuente
                        }

                        argumentos = [...argumentos, ...apilarIndices, inicializarArreglo]
                    }
                    else {
                        // Sub-enunciados que ponen el argumento en la pila
                        const apilarArgumento = this.transformarExpresion(arg)
                        argumentos = [...argumentos, ...apilarArgumento]
                    }
                }
            }

            const crearFrame: N3.MKFRAME = { tipo: N3.TipoEnunciado.MKFRAME, nombreModulo: e.name }

            const llamado: N3.LLAMAR = { tipo: N3.TipoEnunciado.LLAMAR, nombreModulo: e.name }

            return [...argumentos, crearFrame, llamado]
        }
    }

    private crearCondicionPara(i: Typed.Invocation, e: Typed.ExpElement[]): N3.Enunciado[] {
        const invocacion = this.transformarInvocacion(i)
        const valor = this.transformarExpresion(e)
        const comparacion: N3.IGUAL = { tipo: N3.TipoEnunciado.IGUAL }
        return [...invocacion, ...valor, comparacion]
    }

    private crearIncrementoPara(i: Typed.Invocation): N3.Enunciado[] {
        const invocacion = this.transformarInvocacion(i)
        const apilarUno: N3.APILAR = { tipo: N3.TipoEnunciado.APILAR, valor: 1 }
        const suma: N3.SUMAR = { tipo: N3.TipoEnunciado.SUMAR }

        if (i.is_array) {
            const apilarIndices = i.indexes.map(this.transformarExpresion).reduce(concatenarVectores)
            const cantidadIndices = i.indexes.length
            const nombreVariable = i.name
            const asignacion: N3.ASIGNAR_ARR = { tipo: N3.TipoEnunciado.ASIGNAR_ARR, nombreVariable, cantidadIndices}
            return [...invocacion, apilarUno, suma, ...apilarIndices, asignacion]
        }
        else {
            const asignacion: N3.ASIGNAR = { tipo: N3.TipoEnunciado.ASIGNAR, nombreVariable: i.name }
            return [...invocacion, apilarUno, suma, asignacion]
        }
    }

    private transformarExpresion(exp: Typed.ExpElement[]): N3.Enunciado[] {
        const resultado: N3.Enunciado[] = []
        for (let elemento of exp){
            switch (elemento.type) {
                case 'literal':
                    resultado.push({ tipo: N3.TipoEnunciado.APILAR, valor: elemento.value })
                break
                case 'invocation': {
                    const apilarInvocacion = this.transformarInvocacion(elemento)
                    for (let subEnunciado of apilarInvocacion) {
                        resultado.push(subEnunciado)
                    }
                }
                break
                case 'operator':
                    switch ((elemento as S0.OperatorElement).name) {
                        case 'times':
                            resultado.push({ tipo: N3.TipoEnunciado.MULTIPLICAR })
                            break
                        case 'slash':
                            resultado.push({ tipo: N3.TipoEnunciado.DIV_REAL })
                            break
                        case 'power':
                            resultado.push({ tipo: N3.TipoEnunciado.ELEVAR })
                            break
                        case 'div':
                            resultado.push({ tipo: N3.TipoEnunciado.DIV_ENTERO })
                            break
                        case 'mod':
                            resultado.push({ tipo: N3.TipoEnunciado.MODULO })
                            break
                        case 'minus':
                            resultado.push({ tipo: N3.TipoEnunciado.RESTAR })
                            break
                        case 'plus':
                            resultado.push({ tipo: N3.TipoEnunciado.SUMAR })
                            break
                        case 'minor':
                            resultado.push({ tipo: N3.TipoEnunciado.MENOR })
                            break
                        case 'minor-eq':
                            resultado.push({ tipo: N3.TipoEnunciado.MENORIGUAL })
                            break
                        case 'major':
                            resultado.push({ tipo: N3.TipoEnunciado.MAYOR })
                            break
                        case 'major-eq':
                            resultado.push({ tipo: N3.TipoEnunciado.MAYORIGUAL })
                            break
                        case 'equal':
                            resultado.push({ tipo: N3.TipoEnunciado.IGUAL })
                            break
                        case 'not':
                            resultado.push({ tipo: N3.TipoEnunciado.NOT })
                            break
                        case 'different':
                            resultado.push({ tipo: N3.TipoEnunciado.DIFERENTE })
                            break
                        case 'and':
                            resultado.push({ tipo: N3.TipoEnunciado.AND })
                            break
                        case 'or':
                            resultado.push({ tipo: N3.TipoEnunciado.OR })
                            break
                        case 'neg':
                            resultado.push({ tipo: N3.TipoEnunciado.NEGAR })
                            break
                    }
                break
                case 'call': {
                    const llamado = this.transformarLlamado(elemento)
                    for (let subEnunciado of llamado) {
                        resultado.push(subEnunciado)
                    }
                }
                break
            }
        }
        return resultado
    }

    private transformarInvocacion(i: Typed.Invocation): N3.Enunciado[] {
        // Hay dos alternativas:
        // 1 - Se invoca una variable
        // 2 - Se invoca un arreglo
        //  2.a - Se invoca un arreglo con la maxima cantidad de indices
        //  2.b - Se invoca un arreglo menos indices que la cantidad maxima

        if (i.is_array == false) {
            // 1 - Se invoca una variable
            const invocacion: N3.APILAR_VAR = { tipo: N3.TipoEnunciado.APILAR_VAR, nombreVariable: i.name }
            return [invocacion]
        }
        else {
            // 2 - Se invoca un arreglo
            if (i.dimensions.length == i.indexes.length) {
                // 2.a - Se invoca un arreglo con la maxima cantidad de indices

                const apilarIndices = i.indexes.map(this.transformarExpresion).reduce(concatenarVectores)

                const cantidadIndices = i.indexes.length

                const invocacion: N3.APILAR_ARR = { tipo: N3.TipoEnunciado.APILAR_ARR, nombreVariable: i.name, cantidadIndices }

                return [...apilarIndices, invocacion]
            }
            else {
                // 2.b - Se invoca un arreglo menos indices que la cantidad maxima
                // Eso significa, por ejemplo, que el arreglo "v" de dimensiones [2, 3] (matriz de 2 filas y 3 columnas)
                // fue invocado de la siguiente manera "v[1]". Como resultado deberian apilarse
                // las 3 celdas correspondientes a la primer fila. Es decir, hay que generar los
                // siguientes enunciados de invocacion: v[1, 1], v[1, 2], y v[1, 3]
                
                // Generar un juego de indices por cada invocacion necesaria. Siguiendo el ejemplo, hacen falta 3 juegos de indices.
                const indicesInvocaciones = this.generarIndices(i.indexes, i.dimensions)
                
                let resultadoFinal: N3.Enunciado[] = []

                const nombreVariable = i.name

                const cantidadIndices = i.indexes.length

                for (let indices of indicesInvocaciones) {
                    const apilarIndices = indices.map(this.transformarExpresion).reduce(concatenarVectores)

                    const invocacion: N3.APILAR_ARR = { tipo: N3.TipoEnunciado.APILAR_ARR, nombreVariable, cantidadIndices}

                    resultadoFinal = [...resultadoFinal, ...apilarIndices, invocacion]
                }

                return resultadoFinal
            }
        }
    }

    private generarIndices(indicesProvistos: (Typed.ExpElement[])[], dimensionesVector: number[]): Typed.ExpElement[][][] {
        const indicesFaltantes = drop(indicesProvistos.length, dimensionesVector)

        const resultadoFinal: (Typed.ExpElement[])[][] = []

        // contador vectorial iniciado en 1
        const contador = arr_counter(dimensionesVector.length - indicesProvistos.length, 1)

        for (; arr_minor(contador, indicesFaltantes) || arr_equal(contador, indicesFaltantes); arr_counter_inc(contador, indicesFaltantes, 1)) {

            const expresionesIndicesFaltantes = contador.map(i => [this.crearLiteralNumerico(i)])

            const indices = [...indicesProvistos, ...expresionesIndicesFaltantes]

            resultadoFinal.push(indices)
        }

        return resultadoFinal
    }

    private crearLiteralNumerico(n: number): Typed.Literal {
        const esReal = (n - Number.parseInt(n.toString())) > 0

        const literalNumerico: Typed.Literal = {
            type: "literal",
            value: n,
            typings: { type: new Typed.AtomicType("literal", esReal ? "real":"entero") }
        }

        return literalNumerico
    }
}

function concatenarVectores<A>(arrA: A[], arrB: A[]): A[] {
    return [...arrA, ...arrB]
} 