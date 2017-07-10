// Clase que se encarga de ejecutar un programa.

import { N3, Typed, Value, Memoria, Referencia, Escalar, Vector2, Failure, Success } from './interfaces'

export enum Estado {
    EJECUTANDO_PROGRAMA = 0,
    ESPERANDO_LECTURA, // luego de una llamada a leer
    ESPERANDO_ESCRITURA, // al hacer una llamada a "escribir"
    ESPERANDO_PASO, // luego de haber ejecutado un paso o sub-paso
    PROGRAMA_FINALIZADO,
    ERROR_ENCONTRADO
}

export class Evaluador {

    private programaActual: N3.Programa

    private moduloActual: { subEnunciados: N3.Enunciado[], nombre: string }

    private memoriaGlobal: Memoria

    private memoriaModuloActual: Memoria

    private estadoActual: Estado

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
    private pilaValores: Value[]
    private pilaModulos: { subEnunciados: N3.Enunciado[], nombre: string }[]
    private pilaMemoria: Memoria[]

    // E/S
    private lecturaPendiente: { nombreVariable: string, tipoVarible: Typed.AtomicType | Typed.StringType }
    private escrituraPendiente: Value

    constructor(programaCompilado: N3.ProgramaCompilado) {
        this.programaActual = programaCompilado.programa

        this.lineasPorModulo = programaCompilado.lineasPorModulo

        this.moduloActual = { nombre: "principal", subEnunciados: this.programaActual.modulos.principal }

        const memoriaModuloPrincipal = this.crearMemoriaModulo("principal")

        this.memoriaGlobal = memoriaModuloPrincipal

        this.memoriaModuloActual = memoriaModuloPrincipal

        this.lineaVisitada = true
        this.moduloLLamado = false

        this.breakpointsRegistrados = []
        this.breakpointCumplido = false

        this.contadorInstruccion = 0

        this.pilaContadorInstruccion = []
        this.pilaValores = []
        this.pilaModulos = []

        this.lecturaPendiente = null
        this.escrituraPendiente = null

        /**
         * Determinar el estado inicial
         */
        if (this.moduloActual.subEnunciados.length == 0) {
            this.estadoActual = Estado.PROGRAMA_FINALIZADO
        }
        else {
            this.estadoActual = Estado.EJECUTANDO_PROGRAMA
        }
    }

    agregarBreakpoint(numeroLinea: number) {
        let modulos = Object.keys(this.lineasPorModulo)
        let moduloEncontrado = false
        let i = 0
        let l = modulos.length

        /**
         * Buscar modulo al que pertenece la linea para la cual
         * se quiere establecer un breakpoint
         */        
        while (i < l && !moduloEncontrado) {
            const numerosLineaEnunciados = this.lineasPorModulo[modulos[i]].enunciados
            const indice = busquedaBinaria(numeroLinea, numerosLineaEnunciados)
            if (indice > -1) {
                moduloEncontrado = true
            }
            else {
                i++
            }
        }

        if (moduloEncontrado) {
            const modulo = this.lineasPorModulo[modulos[i]]
            const indice = busquedaBinaria(numeroLinea, modulo.enunciados)
            const numeroSubEnunciado = modulo.subEnunciados[indice]
            // insertar nuevo breakpoint ordenadamente
            const indiceMayor = encontrarMayor(numeroSubEnunciado, this.breakpointsRegistrados)
            this.breakpointsRegistrados = insertarEn(indiceMayor, numeroSubEnunciado, this.breakpointsRegistrados)
        }
    }

    quitarBreakpoint(numeroLinea: number) {
        let modulos = Object.keys(this.lineasPorModulo)
        let moduloEncontrado = false
        let i = 0
        let l = modulos.length

        /**
         * Buscar modulo al que pertenece la linea para la cual
         * se quiere establecer un breakpoint
         */
        while (i < l && !moduloEncontrado) {
            const numerosLineaEnunciados = this.lineasPorModulo[modulos[i]].enunciados
            const indice = busquedaBinaria(numeroLinea, numerosLineaEnunciados)
            if (indice > -1) {
                moduloEncontrado = true
            }
            else {
                i++
            }
        }

        if (moduloEncontrado) {
            const modulo = this.lineasPorModulo[modulos[i]]
            const indice = busquedaBinaria(numeroLinea, modulo.enunciados)
            const numeroSubEnunciado = modulo.subEnunciados[indice]
            // insertar nuevo breakpoint ordenadamente
            const indiceBreakpoint = busquedaBinaria(numeroSubEnunciado, this.breakpointsRegistrados)
            this.breakpointsRegistrados = removerDe(indiceBreakpoint, this.breakpointsRegistrados)
        }
    }

    /**
     * Dice si el valor de una variable escalar en ambito es igual al valor provisto
     * @param nombreVariable nombre de la variable cuyo valor se quiere consultar
     * @param valor valor que deberia tener dicha variable
     */
    consultarVariableEscalar(nombreVariable: string, valor: Value): boolean {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(nombreVariable) as (Referencia | Escalar)

        if (variableOReferencia.tipo == "escalar") {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const escalar = variableOReferencia as Escalar

            return escalar.valor == valor
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

                return variable.valor == valor
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

                return variable.valores[indice] == valor
            }
        }
    }

    /**
     * Dice si el valor de una celda de una variable vectorial en ambito es igual al valor provisto
     * @param nombreVariable nombre de la variable vectora que contiene la celda cuyo valor se quiere consultar
     * @param indices indices correspondientes a la celda cuyo valor se quiere consultar
     * @param valor valor que deberia tener dicha celda
     */
    consultarVariableVectorial(nombreVariable: string, indices: number[], valor: Value): boolean {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un vector
         * o una referencia a uno.
         */
        const variableOReferencia = this.recuperarVariable(nombreVariable) as (Referencia | Vector2)

        if (variableOReferencia.tipo == "vector") {
            const indice = this.calcularIndice(indices.map(i => i - 1), variableOReferencia.dimensiones)

            return variableOReferencia.valores[indice] == valor
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia

            const referenciaResuelta = this.resolverReferencia(referencia)

            const variable = referenciaResuelta.variable as Vector2

            const indiceCompleto = [...referenciaResuelta.indicesPrevios, ...indices].map(i => i - 1)

            const indice = this.calcularIndice(indiceCompleto, variable.dimensiones)

            return variable.valores[indice] == valor
        }
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

    ejecutarPrograma(): Failure<null> | Success<number> {
        /**
         * Bucle de ejecucion
         */
        while (this.sePuedeEjecutar() && (!this.hayBreakpoint(this.contadorInstruccion) || this.breakpointCumplido)) {
            /**
             * Si se llego hasta este punto, a pesar de que hay un breakpoint
             * hay que poner breakpointCumplido en falso para el siguiente breakpoint
             */
            if (this.hayBreakpoint(this.contadorInstruccion)) {
                this.breakpointCumplido = false
            }
            

            this.evaluarSubEnunciado(this.moduloActual.subEnunciados[this.contadorInstruccion])

            this.incrementarContadorInstruccion()
        }

        /**
         * Cuando se sale del bucle de ejecucion porque hay un breakpoint
         * hay que poner la bandera breakpointCumplido en verdadero.
         */
        if (this.hayBreakpoint(this.contadorInstruccion)) {
            this.breakpointCumplido = true
        }

        if (this.estadoActual != Estado.ERROR_ENCONTRADO) {
            const numeroLineaFuente = this.aLineaFuente(this.contadorInstruccion)
            return { error: false, result: numeroLineaFuente }
        }
        else {
            return { error: true, result: null }
        }
    }

    private aLineaFuente(numeroInstruccion: number): number {
        for (let nombreModulo in this.lineasPorModulo) {
            const modulo = this.lineasPorModulo[nombreModulo]
            const indice = busquedaBinaria(numeroInstruccion, modulo.subEnunciados)
            if (indice != -1) {
                return this.lineasPorModulo[nombreModulo].enunciados[indice]
            }
        }
        return -1
    }

    /**
     * Ejecuta sub-enunciados hasta encontrarse con uno que tiene un
     * enunciado correspondiente en el codigo fuente.
     */
    ejecutarEnunciadoSiguiente() {
        while (this.sePuedeEjecutar() && (!this.esLineaFuente(this.contadorInstruccion) || this.lineaVisitada)) {
            if (this.lineaVisitada) {
                this.lineaVisitada = false
            }
            this.ejecutarSubEnunciadoSiguiente()
        }
        
        if (this.esLineaFuente(this.contadorInstruccion)) {
            this.lineaVisitada = true
        }
    }

    /**
     * Dice si un numero de linea dado corresponde a una de las lineas de codigo fuente
     * @param n numero de linea que buscar entre las lineas del modulo
     */
    private esLineaFuente(n: number): boolean {
        const lineasFuenteModulo = this.lineasPorModulo[this.moduloActual.nombre].subEnunciados
        return existe(n, lineasFuenteModulo)
    }

    private ejecutarSubEnunciadoSiguiente() {
        if (this.hayBreakpoint(this.contadorInstruccion) && !this.breakpointCumplido) {
            this.breakpointCumplido = true
            this.estadoActual = Estado.ESPERANDO_PASO
        }
        else {
            this.breakpointCumplido = false

            this.evaluarSubEnunciado(this.moduloActual.subEnunciados[this.contadorInstruccion])

            this.incrementarContadorInstruccion()
        }
    }

    /**
     * Este metodo se encarga de incrementar el contador de instruccion.
     * Si luego del incremento el contador apunta a un sub-enunciado
     * que no existe en el modulo que esta en ejecucion, desapila dicho modulo
     * y pone en ejecucion al siguiente. Si no hay modulos que desapilar, entonces
     * significa que el programa ha finalizado.
     */
    private incrementarContadorInstruccion() {
        if (this.moduloLLamado == false) {
            this.contadorInstruccion++

            while (this.sePuedeEjecutar() && (this.contadorInstruccion >= this.moduloActual.subEnunciados.length)) {
                if (this.pilaModulos.length > 0) {

                    this.moduloActual = this.pilaModulos.pop()

                    this.contadorInstruccion = this.pilaContadorInstruccion.pop()

                    this.contadorInstruccion++
                }
                else {
                    this.estadoActual = Estado.PROGRAMA_FINALIZADO
                }
            }
        }
        else {
            this.moduloLLamado = false
        }
    }

    private sePuedeEjecutar(): boolean {
        return this.estadoActual == Estado.EJECUTANDO_PROGRAMA
            || this.estadoActual == Estado.ESPERANDO_PASO
            || this.estadoActual == Estado.ESPERANDO_LECTURA
    }

    private hayBreakpoint(numeroLinea: number): boolean {
        return existe(numeroLinea, this.breakpointsRegistrados)
    }

    private evaluarSubEnunciado(subEnunciado: N3.Enunciado) {
        switch (subEnunciado.tipo) {
            case N3.TipoEnunciado.SUMAR:
                this.SUMAR()
                break
            case N3.TipoEnunciado.RESTAR:
                this.RESTAR()
                break
            case N3.TipoEnunciado.DIV_REAL:
                this.DIV_REAL()
                break
            case N3.TipoEnunciado.DIV_ENTERO:
                this.DIV_ENTERO()
                break
            case N3.TipoEnunciado.MODULO:
                this.MODULO()
                break
            case N3.TipoEnunciado.MULTIPLICAR:
                this.MULTIPLICAR()
                break
            case N3.TipoEnunciado.ELEVAR:
                this.ELEVAR()
                break
            case N3.TipoEnunciado.NEGAR:
                this.NEGAR()
                break
            case N3.TipoEnunciado.NOT:
                this.NOT()
                break
            case N3.TipoEnunciado.AND:
                this.AND()
                break
            case N3.TipoEnunciado.OR:
                this.OR()
                break
            case N3.TipoEnunciado.MENOR:
                this.MENOR()
                break
            case N3.TipoEnunciado.MENORIGUAL:
                this.MENORIGUAL()
                break
            case N3.TipoEnunciado.MAYOR:
                this.MAYOR()
                break
            case N3.TipoEnunciado.MAYORIGUAL:
                this.MAYORIGUAL()
                break
            case N3.TipoEnunciado.IGUAL:
                this.IGUAL()
                break
            case N3.TipoEnunciado.DIFERENTE:
                this.DIFERENTE()
                break
            case N3.TipoEnunciado.APILAR:
                this.APILAR(subEnunciado)
                break
            case N3.TipoEnunciado.APILAR_VAR:
                this.APILAR_VAR(subEnunciado)
                break
            case N3.TipoEnunciado.APILAR_ARR:
                this.APILAR_ARR(subEnunciado)
                break
            case N3.TipoEnunciado.ASIGNAR:
                this.ASIGNAR(subEnunciado)
                break
            case N3.TipoEnunciado.ASIGNAR_ARR:
                this.ASIGNAR_ARR(subEnunciado)
                break
            case N3.TipoEnunciado.LLAMAR:
                this.LLAMAR(subEnunciado)
                break
            case N3.TipoEnunciado.JIF:
                this.JIF(subEnunciado)
                break
            case N3.TipoEnunciado.JIT:
                this.JIT(subEnunciado)
                break
            case N3.TipoEnunciado.JMP:
                this.JMP(subEnunciado)
                break
        }
    }

    private SUMAR() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a + b)
        return this.estadoActual
    }

    private RESTAR() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a - b)
        return this.estadoActual
    }

    private DIV_REAL() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a / b)
        return this.estadoActual
    }

    private DIV_ENTERO() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push((a - (a % b)) / b)
        return this.estadoActual
    }

    private MODULO() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a % b)
        return this.estadoActual
    }

    private MULTIPLICAR() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a * b)
        return this.estadoActual
    }

    private ELEVAR() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(Math.pow(a, b))
        return this.estadoActual
    }

    private NEGAR() {
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(-a)
        return this.estadoActual
    }

    private NOT() {
        const a = this.pilaValores.pop() as boolean
        this.pilaValores.push(!a)
        return this.estadoActual
    }

    private AND() {
        const a = this.pilaValores.pop() as boolean
        const b = this.pilaValores.pop() as boolean
        this.pilaValores.push(a && b)
        return this.estadoActual
    }

    private OR() {
        const a = this.pilaValores.pop() as boolean
        const b = this.pilaValores.pop() as boolean
        this.pilaValores.push(a || b)
        return this.estadoActual
    }
    
    private MENOR() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a < b)
        return this.estadoActual
    }

    private MENORIGUAL() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a <= b)
        return this.estadoActual
    }

    private MAYOR() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a > b)
        return this.estadoActual
    }

    private MAYORIGUAL() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a >= b)
        return this.estadoActual
    }

    private IGUAL() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a == b)
        return this.estadoActual
    }

    private DIFERENTE() {
        const a = this.pilaValores.pop() as number
        const b = this.pilaValores.pop() as number
        this.pilaValores.push(a != b)
        return this.estadoActual
    }

    private APILAR(subEnunciado: N3.APILAR) {
        this.pilaValores.push(subEnunciado.valor)
    }

    private APILAR_VAR(subEnunciado: N3.APILAR_VAR) {
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
    }

    private APILAR_ARR(subEnunciado: N3.APILAR_ARR) {
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
    }

    private ASIGNAR(subEnunciado: N3.ASIGNAR) {
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
    }

    private ASIGNAR_ARR(subEnunciado: N3.ASIGNAR_ARR) {
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
    }

    private LLAMAR(subEnunciado: N3.LLAMAR) {
        const moduloLLamado = this.programaActual.modulos[subEnunciado.nombreModulo]

        // apilar el modulo actual
        this.pilaModulos.push(this.moduloActual)

        // apilar el contador de instruccion
        this.pilaContadorInstruccion.push(this.contadorInstruccion)

        // apilar la memoria del modulo actual
        this.pilaMemoria.push(this.memoriaModuloActual)

        // crear espacio de memoria del modulo llamado
        this.memoriaModuloActual = this.crearMemoriaModulo(subEnunciado.nombreModulo)

        // poner contador instruccion en 0
        this.contadorInstruccion = 0

        // establecer moduloActual = moduloLLamado
        this.moduloActual = {
            subEnunciados: this.programaActual.modulos[subEnunciado.nombreModulo],
            nombre: subEnunciado.nombreModulo
        }

        // poner bandera moduloLlamado en verdadero
        this.moduloLLamado = true
    }

    private JIF(subEnunciado: N3.JIF) {
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
            if (this.contadorInstruccion >= moduloActual.subEnunciados.length) {
                this.pilaModulos.pop()
                if (this.pilaModulos.length > 0) {
                    this.contadorInstruccion = this.pilaContadorInstruccion[this.pilaContadorInstruccion.length - 1]
                    this.pilaContadorInstruccion.pop()
                }
                else {
                    this.estadoActual = Estado.PROGRAMA_FINALIZADO
                }
            }
        }
    }
    
    private JIT(subEnunciado: N3.JIT) {
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
            if (this.contadorInstruccion >= moduloActual.subEnunciados.length) {
                this.pilaModulos.pop()
                if (this.pilaModulos.length > 0) {
                    this.contadorInstruccion = this.pilaContadorInstruccion[this.pilaContadorInstruccion.length - 1]
                    this.pilaContadorInstruccion.pop()
                }
                else {
                    this.estadoActual = Estado.PROGRAMA_FINALIZADO
                }
            }
        }
    }

    private JMP(subEnunciado: N3.JMP) {
        this.contadorInstruccion = subEnunciado.numeroLinea

        const moduloActual = this.pilaModulos[this.pilaModulos.length - 1]

        /**
         * Si el contador de instruccion apunta a una linea que no existe
         * entonces la ejecución de este modulo terminó y hay que poner
         * en ejecución el anterior. Si no hay más modulos que ejecutar
         * entonces terminó la ejecución del programa.
         */
        if (this.contadorInstruccion >= moduloActual.subEnunciados.length) {
            this.pilaModulos.pop()
            if (this.pilaModulos.length > 0) {
                this.contadorInstruccion = this.pilaContadorInstruccion[this.pilaContadorInstruccion.length - 1]
                this.pilaContadorInstruccion.pop()
            }
            else {
                this.estadoActual = Estado.PROGRAMA_FINALIZADO
            }
        }
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
function unicos(arreglo : number[]): number[] {
    let resultado: number[] = []
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
function encontrarMayor(objetoBuscado: number, arreglo: number[]): number {
    let i = 0
    const l = arreglo.length
    let finalizado = false
    while (i < l && !finalizado) {
        if (objetoBuscado <= arreglo[i]) {
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
function insertarEn(indice: number, elemento: number, arreglo: number[]): number[] {
    if (indice == 0) {
        arreglo.unshift(elemento)
        return arreglo
    }
    else if (indice == arreglo.length) {
        arreglo.push(elemento)
        return arreglo
    }
    else {
        return [...arreglo.slice(0, indice), elemento, ...arreglo.slice(indice)]
    }
}

/**
 * Remueve el elemento de un indice especifico de un arreglo
 * @param indice Indice en del elemento a remover
 * @param arreglo Arreglo del cual removerlo
 */
function removerDe(indice: number, arreglo: number[]): number[] {
    if (indice == 0) {
        arreglo.shift()
        return arreglo
    }
    else if (indice == arreglo.length) {
        arreglo.pop()
        return arreglo
    }
    else {
        return [...arreglo.slice(0, indice), ...arreglo.slice(indice + 1)]
    }
}

/**
 * Determinar si un objeto existen en un arreglo
 * @param objetoBuscado El objeto a encontrar
 * @param arreglo El arreglo donde buscarlo
 */
function existe(objetoBuscado: number, arreglo: number[]): boolean {
    return busquedaBinaria(objetoBuscado, arreglo) > -1
}

/**
 * Realizar busqueda binaria sobre un arreglo ordenado y retornar el indice del objeto o -1.
 * @param objetoBuscado El objeto a encontrar
 * @param arreglo El arreglo donde buscarlo
 */
function busquedaBinaria(objetoBuscado: number, arreglo: number[]): number {
    let inicio = 0, fin = arreglo.length - 1

    while (inicio <= fin) {
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