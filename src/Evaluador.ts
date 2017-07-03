// Clase que se encarga de ejecutar un programa.

import { N3, Typed, Value, Memoria, Referencia, Escalar, Vector2 } from './interfaces'

type EstadoEvaluador = EJECUTANDO_PROGRAMA | ESPERANDO_LECTURA | ESPERANDO_PASO | LECTURA_REALIZADA | ESCRIBIENDO_VALOR | PROGRAMA_FINALIZADO | ERROR_ENCONTRADO

type Valor = Value

interface EstadoAbstracto {
    id: Estado
    numeroLinea?: number // numero de linea que se ejecutará al reanudar la ejecución
}

interface EJECUTANDO_PROGRAMA extends EstadoAbstracto {
    id: Estado.EJECUTANDO_PROGRAMA
}

interface ESPERANDO_LECTURA extends EstadoAbstracto {
    id: Estado.ESPERANDO_LECTURA
    nombreVariable: string
    tipoVariable: Typed.AtomicType | Typed.StringType
    numeroLinea: number
}

interface LECTURA_REALIZADA extends EstadoAbstracto {
    id: Estado.LECTURA_REALIZADA
}

interface ESCRIBIENDO_VALOR extends EstadoAbstracto {
    id: Estado.ESCRIBIENDO_VALOR
    numeroLinea: number
    valor: Valor
}

interface ESPERANDO_PASO extends EstadoAbstracto {
    id: Estado.ESPERANDO_PASO
    numeroLinea: number
}

interface PROGRAMA_FINALIZADO extends EstadoAbstracto {
    id: Estado.PROGRAMA_FINALIZADO
}

interface ERROR_ENCONTRADO extends EstadoAbstracto {
    id: Estado.ERROR_ENCONTRADO
    numeroLinea: number
}

enum Estado {
    EJECUTANDO_PROGRAMA = 0,
    ESPERANDO_LECTURA, // luego de una llamada a leer
    LECTURA_REALIZADA, // luego de realizar una lectura
    ESCRIBIENDO_VALOR, // al hacer una llamada a "escribir"
    ESPERANDO_PASO, // luego de haber ejecutado un paso o sub-paso
    PROGRAMA_FINALIZADO,
    ERROR_ENCONTRADO
}


export default class Evaluador {

    private programaActual: N3.Programa

    private moduloActual: { subEnunciados: N3.Enunciado[], nombre: string }

    private memoriaGlobal: Memoria

    private memoriaModuloActual: Memoria

    private estadoActual: EstadoEvaluador

    private contadorInstruccion: number // indica cual es la proxima instruccion que se ejecutara

    private breakpointsRegistrados: number[]

    private lineasPorModulo: N3.lineasPorModulo

    // Banderas
    private breakpointCumplido: boolean
    private lineaVisitada: boolean
    /**
     * Cuando esta en verdadero indica que no se debe incrementar el contador de instruccion
     */
    private moduloLLamado: boolean
    
    // Pilas
    private pilaContadorInstruccion: number[]
    private pilaValores: Valor[]
    private pilaModulos: N3.Enunciado[][]
    private pilaNombresModulo: string[]
    private pilaMemoria: Memoria[]

    constructor(programaCompilado: N3.ProgramaCompilado) {
        this.programaActual = programaCompilado.programa

        this.lineasPorModulo = programaCompilado.lineasPorModulo

        this.moduloActual = { nombre: "principal", subEnunciados: this.programaActual.modulos.principal }

        const memoriaModuloPrincipal = this.crearMemoriaModulo("principal")

        this.memoriaGlobal = memoriaModuloPrincipal

        this.memoriaModuloActual = memoriaModuloPrincipal

        this.estadoActual = { id: Estado.EJECUTANDO_PROGRAMA }

        this.lineaVisitada = true

        this.breakpointsRegistrados = []
        this.breakpointCumplido = false

        this.contadorInstruccion = 0

        this.pilaContadorInstruccion = []
        this.pilaValores = []
        this.pilaModulos = []
        this.pilaNombresModulo = []
    }

    private crearMemoriaModulo(nombreModulo: string): Memoria {
        const plantillaMemoria = this.programaActual.variablesLocales[nombreModulo]

        const memoriaModulo: Memoria = {}
        
        for (let nombrePlantilla in plantillaMemoria) {

            const plantilla = plantillaMemoria[nombrePlantilla]

            if (plantilla.by_ref) {
                const referencia: Referencia = { tipo: "referencia", nombreVariable: "", indices: [] }
                memoriaModulo[nombrePlantilla] = referencia
            }
            else {
                if (plantilla.type == "scalar") {
                    const escalar: Escalar = { tipo: "escalar", inicialiazado: false, valor: null }
                    memoriaModulo[nombrePlantilla] = escalar
                }
                else {
                    /**
                     * Crear un vector con suficientes celdas
                     */
                    const valores = new Array<Value>(plantilla.dimensions.reduce((a, b) => a * b))

                    const vector: Vector2 = { tipo: "vector", inicialiazado: false, valores,  dimensiones: plantilla.dimensions }

                    memoriaModulo[nombrePlantilla] = vector
                }
            }
        }

        return memoriaModulo
    }

    ejecutarPrograma(): EstadoEvaluador {
        while (this.sePuedeEjecutar()) {
            this.estadoActual = this.ejecutarEnunciadoSiguiente()
        }
        return this.estadoActual
    }

    /**
     * Ejecuta sub-enunciados hasta encontrarse con uno que tiene un
     * enunciado correspondiente en el codigo fuente.
     */
    ejecutarEnunciadoSiguiente(): EstadoEvaluador {
        if (this.sePuedeEjecutar()) {
            while (!this.esLineaFuente(this.contadorInstruccion) || this.lineaVisitada) {
                if (this.lineaVisitada) {
                    this.lineaVisitada = false
                }
                this.estadoActual = this.ejecutarEnunciadoSiguiente()
            }
            this.lineaVisitada = true
        }
        return this.estadoActual
    }

    /**
     * Dice si un numero de linea dado corresponde a una de las lineas de codigo fuente
     * @param n numero de linea que buscar entre las lineas del modulo
     */
    private esLineaFuente(n: number): boolean {
        const nombreModuloActual = this.pilaNombresModulo[this.pilaNombresModulo.length - 1]
        const lineasFuenteModulo = this.lineasPorModulo[nombreModuloActual].subEnunciados
        return existe(n, lineasFuenteModulo)
    }

    private ejecutarSubEnunciadoSiguiente(): EstadoEvaluador {
        if (this.sePuedeEjecutar()) {
            // ver si hay un breakpoint registrado para esta instruccion
            if (this.hayBreakpoint(this.contadorInstruccion) && !this.breakpointCumplido) {
                this.breakpointCumplido = true
                this.estadoActual = { id: Estado.ESPERANDO_PASO, numeroLinea: this.contadorInstruccion }
            }
            else {
                this.breakpointCumplido = false

                const nuevoEstado = this.evaluarSubEnunciado(this.moduloActual.subEnunciados[this.contadorInstruccion])

                this.incrementarContadorInstruccion()

                return nuevoEstado
            }
        }
        return this.estadoActual
    }

    /**
     * Este metodo se encarga de incrementar el contador de instruccion.
     * Si luego del incremento el contador apunta a un sub-enunciado
     * que no existe en el modulo que esta en ejecucion, desapila dicho modulo
     * y pone en ejecucion al siguiente. Si no hay modulos que desapilar, entonces
     * significa que el programa ha finalizado.
     */
    private incrementarContadorInstruccion() {
        this.contadorInstruccion++

        while (this.sePuedeEjecutar() && (this.contadorInstruccion >= this.moduloActual.subEnunciados.length)) {
            if (this.pilaModulos.length > 0) {

                const subEnunciadosProximoModulo = this.pilaModulos.pop()
                const nombreProximoModulo = this.pilaNombresModulo.pop()

                this.moduloActual = { nombre: nombreProximoModulo, subEnunciados: subEnunciadosProximoModulo }

                this.contadorInstruccion = this.pilaContadorInstruccion.pop()

                this.contadorInstruccion++
            }
            else {
                this.estadoActual = { id: Estado.PROGRAMA_FINALIZADO }
            }
        }
    }

    private sePuedeEjecutar(): boolean {
        return this.estadoActual.id == Estado.EJECUTANDO_PROGRAMA
            || this.estadoActual.id == Estado.ESPERANDO_PASO
            || this.estadoActual.id == Estado.ESPERANDO_LECTURA
    }

    private hayBreakpoint(numeroLinea: number): boolean {
        // hacer busqueda binaria de numeroLinea en el arreglo this.breakpointsRegistrados
        let inicio = 0, fin = this.breakpointsRegistrados.length - 1

        while (inicio < fin) {
            const medio = Math.floor(fin - inicio / 2) + inicio
            if (numeroLinea == this.breakpointsRegistrados[medio]) {
                return true
            }
            else if (numeroLinea > this.breakpointsRegistrados[medio]) {
                inicio = medio + 1
            }
            else {
                fin = medio - 1
            }
        }

        return false
    }

    private evaluarSubEnunciado(subEnunciado: N3.Enunciado): EstadoEvaluador {
        switch (subEnunciado.tipo) {
            case N3.TipoEnunciado.SUMAR:
                return this.SUMAR()
            case N3.TipoEnunciado.RESTAR:
                return this.RESTAR()
            case N3.TipoEnunciado.DIV_REAL:
                return this.DIV_REAL()
            case N3.TipoEnunciado.DIV_ENTERO:
                return this.DIV_ENTERO()
            case N3.TipoEnunciado.MODULO:
                return this.MODULO()
            case N3.TipoEnunciado.MULTIPLICAR:
                return this.MULTIPLICAR()
            case N3.TipoEnunciado.ELEVAR:
                return this.ELEVAR()
            case N3.TipoEnunciado.NEGAR:
                return this.NEGAR()
            case N3.TipoEnunciado.NOT:
                return this.NOT()
            case N3.TipoEnunciado.AND:
                return this.AND()
            case N3.TipoEnunciado.OR:
                return this.OR()
            case N3.TipoEnunciado.MENOR:
                return this.MENOR()
            case N3.TipoEnunciado.MENORIGUAL:
                return this.MENORIGUAL()
            case N3.TipoEnunciado.MAYOR:
                return this.MAYOR()
            case N3.TipoEnunciado.MAYORIGUAL:
                return this.MAYORIGUAL()
            case N3.TipoEnunciado.IGUAL:
                return this.IGUAL()
            case N3.TipoEnunciado.DIFERENTE:
                return this.DIFERENTE()
            case N3.TipoEnunciado.APILAR:
                return this.APILAR(subEnunciado)
            case N3.TipoEnunciado.APILAR_VAR:
                return this.APILAR_VAR(subEnunciado)
            case N3.TipoEnunciado.APILAR_ARR:
                return this.APILAR_ARR(subEnunciado)
            case N3.TipoEnunciado.ASIGNAR:
                return this.ASIGNAR(subEnunciado)
            case N3.TipoEnunciado.ASIGNAR_ARR:
                return this.ASIGNAR_ARR(subEnunciado)
            case N3.TipoEnunciado.LLAMAR:
                return this.LLAMAR(subEnunciado)
            case N3.TipoEnunciado.JIF:
                return this.JIF(subEnunciado)
            case N3.TipoEnunciado.JIT:
                return this.JIT(subEnunciado)
            case N3.TipoEnunciado.JMP:
                return this.JMP(subEnunciado)
        }
    }

    private SUMAR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a + b)
        return this.estadoActual
    }

    private RESTAR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a - b)
        return this.estadoActual
    }

    private DIV_REAL(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a / b)
        return this.estadoActual
    }

    private DIV_ENTERO(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push((a - (a % b)) / b)
        return this.estadoActual
    }

    private MODULO(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a % b)
        return this.estadoActual
    }

    private MULTIPLICAR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a * b)
        return this.estadoActual
    }

    private ELEVAR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(Math.pow(a, b))
        return this.estadoActual
    }

    private NEGAR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(-a)
        return this.estadoActual
    }

    private NOT(): EstadoEvaluador {
        const a = this.pilaValores.pop() as boolean
        this.pilaValores.push(!a)
        return this.estadoActual
    }

    private AND(): EstadoEvaluador {
        const a = this.pilaValores.pop() as boolean
        const b = this.pilaValores.pop() as boolean
        this.pilaValores.push(a && b)
        return this.estadoActual
    }

    private OR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as boolean
        const b = this.pilaValores.pop() as boolean
        this.pilaValores.push(a || b)
        return this.estadoActual
    }
    
    private MENOR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a < b)
        return this.estadoActual
    }

    private MENORIGUAL(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a <= b)
        return this.estadoActual
    }

    private MAYOR(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a > b)
        return this.estadoActual
    }

    private MAYORIGUAL(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a >= b)
        return this.estadoActual
    }

    private IGUAL(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a == b)
        return this.estadoActual
    }

    private DIFERENTE(): EstadoEvaluador {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a != b)
        return this.estadoActual
    }

    private APILAR(subEnunciado: N3.APILAR): EstadoEvaluador {
        this.pilaValores.push(subEnunciado.valor)
        return this.estadoActual
    }

    private APILAR_VAR(subEnunciado: N3.APILAR_VAR): EstadoEvaluador {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(subEnunciado.nombreVariable) as (Referencia | Escalar)

        if (variableOReferencia.tipo == "escalar") {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const escalar = variableOReferencia as Escalar

            this.pilaValores.push(escalar.valor)
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia
            
            const referenciaResuelta = this.resolverReferencia(referencia)

            if (referenciaResuelta.indicesPrevios.length == 0) {
                /**
                 * Si la referencia resuelta no trae indices, entonces era una referencia
                 * hacia otro escalar.
                 */
                const variable = referenciaResuelta.variable as Escalar

                this.pilaValores.push(variable.valor)
            }
            else {
                /**
                 * En cambio, si la referencia resuelta trae indices, entonces era una
                 * referencia hacia una celda de un arreglo.
                 */
                const variable = referenciaResuelta.variable as Vector2

                /**
                 * Sobre el "map(i => i - 1)":
                 * Los indices de un arreglo de N elementos del lenguaje
                 * que este Evaluador...evalua...van de 1 a N, mientras que los
                 * de JS van de 0 a N-1. De ahi que es necesario restarle 1 a cada
                 * indice para convertirlos en un indice de JS valido.
                 */
                const indice = this.calcularIndice(referenciaResuelta.indicesPrevios.map(i => i - 1), variable.dimensiones)

                this.pilaValores.push(variable.valores[indice])
            }
        }

        return this.estadoActual
    }

    private APILAR_ARR(subEnunciado: N3.APILAR_ARR): EstadoEvaluador {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un vector
         * o una referencia a uno.
         */
        const variableOReferencia = this.recuperarVariable(subEnunciado.nombreVariable) as (Referencia | Vector2)

        if (variableOReferencia.tipo == "vector") {
            const indices = this.recuperarIndices(subEnunciado.cantidadIndices).map(i => i - 1)

            const indice = this.calcularIndice(indices, variableOReferencia.dimensiones)

            this.pilaValores.push(variableOReferencia.valores[indice])
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia

            const referenciaResuelta = this.resolverReferencia(referencia)

            const variable = referenciaResuelta.variable as Vector2

            const indices = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(subEnunciado.cantidadIndices)].map(i => i - 1)

            const indice = this.calcularIndice(indices, variable.dimensiones)

            this.pilaValores.push(variable.valores[indice])
        }

        return this.estadoActual
    }

    private ASIGNAR(subEnunciado: N3.ASIGNAR): EstadoEvaluador {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(subEnunciado.nombreVariable) as (Referencia | Escalar)

        if (variableOReferencia.tipo == "escalar") {
            variableOReferencia.valor = this.pilaValores.pop()
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia

            const referenciaResuelta = this.resolverReferencia(referencia)

            if (referenciaResuelta.indicesPrevios.length == 0) {
                /**
                 * Si la referencia resuelta no trae indices, entonces era una referencia
                 * hacia otro escalar.
                 */
                const variable = referenciaResuelta.variable as Escalar

                variable.valor = this.pilaValores.pop()
            }
            else {
                /**
                 * En cambio, si la referencia resuelta trae indices, entonces era una
                 * referencia hacia una celda de un arreglo.
                 */
                const variable = referenciaResuelta.variable as Vector2

                /**
                 * Sobre el "map(i => i - 1)":
                 * Los indices de un arreglo de N elementos del lenguaje
                 * que este Evaluador...evalua...van de 1 a N, mientras que los
                 * de JS van de 0 a N-1. De ahi que es necesario restarle 1 a cada
                 * indice para convertirlos en un indice de JS valido.
                 */
                const indice = this.calcularIndice(referenciaResuelta.indicesPrevios.map(i => i - 1), variable.dimensiones)

                variable.valores[indice] = this.pilaValores.pop()
            }
        }

        return this.estadoActual
    }

    private ASIGNAR_ARR(subEnunciado: N3.ASIGNAR_ARR): EstadoEvaluador {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(subEnunciado.nombreVariable) as (Referencia | Vector2)

        if (variableOReferencia.tipo == "vector") {
            const indices = this.recuperarIndices(subEnunciado.cantidadIndices).map(i => i - 1)

            const indice = this.calcularIndice(indices, variableOReferencia.dimensiones)

            variableOReferencia.valores[indice] = this.pilaValores.pop()
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia

            const referenciaResuelta = this.resolverReferencia(referencia)

            const variable = referenciaResuelta.variable as Vector2

            const indices = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(subEnunciado.cantidadIndices)].map(i => i - 1)

            const indice = this.calcularIndice(indices, variable.dimensiones)

            variable.valores[indice] = this.pilaValores.pop()
        }

        return this.estadoActual
    }

    private LLAMAR(subEnunciado: N3.LLAMAR): EstadoEvaluador {
        const moduloLLamado = this.programaActual.modulos[subEnunciado.nombreModulo]



        return this.estadoActual
    }

    private JIF(subEnunciado: N3.JIF): EstadoEvaluador {
        const condicion = this.pilaValores.pop() as boolean

        /**
         * Saltar solo si la condicion evaluó a "falso"
         */
        if (condicion == false) {
            this.contadorInstruccion = subEnunciado.numeroLinea

            const moduloActual = this.pilaModulos[this.pilaModulos.length - 1]

            /**
             * Si el contador de instruccion apunta a una linea que no existe
             * entonces la ejecución de este modulo terminó y hay que poner
             * en ejecución el anterior. Si no hay más modulos que ejecutar
             * entonces terminó la ejecución del programa.
             */
            if (this.contadorInstruccion >= moduloActual.length) {
                this.pilaModulos.pop()
                if (this.pilaModulos.length > 0) {
                    this.contadorInstruccion = this.pilaContadorInstruccion[this.pilaContadorInstruccion.length - 1]
                    this.pilaContadorInstruccion.pop()
                }
                else {
                    this.estadoActual = { id: Estado.PROGRAMA_FINALIZADO }
                }
            }
        }

        return this.estadoActual
    }
    
    private JIT(subEnunciado: N3.JIT): EstadoEvaluador {
        const condicion = this.pilaValores.pop() as boolean

        /**
         * Saltar solo si la condicion evaluó a "verdadero"
         */
        if (condicion == true) {
            this.contadorInstruccion = subEnunciado.numeroLinea

            const moduloActual = this.pilaModulos[this.pilaModulos.length - 1]

            /**
             * Si el contador de instruccion apunta a una linea que no existe
             * entonces la ejecución de este modulo terminó y hay que poner
             * en ejecución el anterior. Si no hay más modulos que ejecutar
             * entonces terminó la ejecución del programa.
             */
            if (this.contadorInstruccion >= moduloActual.length) {
                this.pilaModulos.pop()
                if (this.pilaModulos.length > 0) {
                    this.contadorInstruccion = this.pilaContadorInstruccion[this.pilaContadorInstruccion.length - 1]
                    this.pilaContadorInstruccion.pop()
                }
                else {
                    this.estadoActual = { id: Estado.PROGRAMA_FINALIZADO }
                }
            }
        }

        return this.estadoActual
    }

    private JMP(subEnunciado: N3.JMP): EstadoEvaluador {
        this.contadorInstruccion = subEnunciado.numeroLinea

        const moduloActual = this.pilaModulos[this.pilaModulos.length - 1]

        /**
         * Si el contador de instruccion apunta a una linea que no existe
         * entonces la ejecución de este modulo terminó y hay que poner
         * en ejecución el anterior. Si no hay más modulos que ejecutar
         * entonces terminó la ejecución del programa.
         */
        if (this.contadorInstruccion >= moduloActual.length) {
            this.pilaModulos.pop()
            if (this.pilaModulos.length > 0) {
                this.contadorInstruccion = this.pilaContadorInstruccion[this.pilaContadorInstruccion.length - 1]
                this.pilaContadorInstruccion.pop()
            }
            else {
                this.estadoActual = { id: Estado.PROGRAMA_FINALIZADO }
            }
        }

        return this.estadoActual
    }

    private recuperarVariable(nombreVariable: string): Escalar | Vector2 | Referencia {
        // buscar en locales
        if (nombreVariable in this.memoriaModuloActual) {
            return this.memoriaModuloActual[nombreVariable]
        }
        // buscar en globales
        else {
            return this.memoriaGlobal[nombreVariable]
        }
    }

    private resolverReferencia(referencia: Referencia): { variable: Escalar | Vector2, indicesPrevios: number[] } {
        let nombreVariableBuscada = referencia.nombreVariable

        let variable: Escalar | Vector2

        let indicesPrevios: number[] = []
        
        let variableEncontrada = false

        for (let i = this.pilaMemoria.length - 1; i >= 0 && variableEncontrada == false; i--) {
            const memoria = this.pilaMemoria[i]
            const variableOReferencia = memoria[nombreVariableBuscada]
            if (variableOReferencia.tipo == "referencia") {
                indicesPrevios = [...indicesPrevios, ...variableOReferencia.indices]
                nombreVariableBuscada = variableOReferencia.nombreVariable
            }
            else {
                variable = variableOReferencia
                variableEncontrada = true
            }
        }

        return { variable, indicesPrevios }
    }

    private calcularIndice(indices: number[], dimensiones: number[]) {
        let indice = 0
        let cantidadIndices = indices.length
        let i = 0

        while (i < cantidadIndices) {
            let term = 1
            let j = i + 1
            while (j < cantidadIndices) {
                term *= dimensiones[j]
                j++
            }
            term *= indices[i]
            indice += term
            i++
        }
        return indice
    }

    private recuperarIndices(cantidadIndices: number): number[] {
        let indices: number[] = []

        for (let i = 0; i < cantidadIndices; i++) {
            indices.unshift(this.pilaValores.pop() as number)
        }

        return indices
    }
}

// funciones auxiliares

/**
 * Elimina los elementos repetidos de un arreglo
 * @param arreglo Arreglo a filtrar
 */
function unicos<A>(arreglo : A[]): A[] {
    let resultado: A[] = []
    for (let elemento of arreglo) {
        if (!existe(elemento, arreglo)) {
            const indiceMayor = encontrarMayor(elemento, resultado)
            resultado = insertarEn(indiceMayor, elemento, arreglo)
        }
    }
    return resultado
}

/**
 * Encuentra el indice del primer elemento mayor al objeto buscado
 * @param objetoBuscado El objeto a buscar
 * @param arreglo El arreglo donde buscarlo
 */
function encontrarMayor<A>(objetoBuscado: A, arreglo: A[]): number {
    let i = 0
    const l = arreglo.length
    let finalizado = false
    while (i < l && !finalizado) {
        if (objetoBuscado < arreglo[i]) {
            finalizado = true
        }
        else {
            i++
        }
    }
    return i
}

/**
 * Inserta un elemento en un indice especifico de un arreglo
 * @param indice Indice en el cual insertar el elemento
 * @param elemento Elemento a insertar
 * @param arreglo Arreglo en el cual insertarlo
 */
function insertarEn<A>(indice: number, elemento: A, arreglo: A[]): A[] {
    if (indice == 0) {
        arreglo.unshift(elemento)
        return arreglo
    }
    else if (indice == arreglo.length) {
        arreglo.push(elemento)
        return arreglo
    }
    else {
        return [...arreglo.slice(0, indice + 1), elemento, ...arreglo.slice(indice + 1)]
    }
}

/**
 * Determinar si un objeto existen en un arreglo
 * @param objetoBuscado El objeto a encontrar
 * @param arreglo El arreglo donde buscarlo
 */
function existe<A>(objetoBuscado: A, arreglo: A[]): boolean {
    return busquedaBinaria(objetoBuscado, arreglo) > -1
}

/**
 * Realizar busqueda binaria sobre un arreglo ordenado y retornar el indice del objeto o -1.
 * @param objetoBuscado El objeto a encontrar
 * @param arreglo El arreglo donde buscarlo
 */
function busquedaBinaria<A>(objetoBuscado: A, arreglo: A[]): number {
    let inicio = 0, fin = arreglo.length - 1

    while (inicio < fin) {
        const medio = Math.floor(fin - inicio / 2) + inicio
        if (objetoBuscado == arreglo[medio]) {
            return medio
        }
        else if (objetoBuscado > arreglo[medio]) {
            inicio = medio + 1
        }
        else {
            fin = medio - 1
        }
    }

    return -1
}