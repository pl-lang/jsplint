// Clase que se encarga de ejecutar un programa.

import { N3, Estado, Typed, Value, Memoria, Referencia, Escalar, Vector2, Failure, Success } from './interfaces'

import { drop } from './utility/helpers'

export default class Evaluador {

    private programaActual: N3.ProgramaCompilado

    private nombreModuloActual: string

    private memoriaGlobal: Memoria

    private memoriaModuloActual: Memoria

    private memoriaProximoModulo: Memoria

    private estadoActual: Estado

    private contadorInstruccion: number // indica cual es la proxima instruccion que se ejecutara

    private breakpointsRegistrados: number[]

    // Banderas
    private breakpointCumplido: boolean
    private lineaVisitada: boolean
    private saltoRealizado: boolean
    /**
     * Cuando esta en verdadero indica que no se debe incrementar el contador de instruccion
     */
    private moduloLLamado: boolean
    
    // Pilas
    private pilaContadorInstruccion: number[]
    private pilaValores: Value[]
    private pilaNombresModulo: string[]
    private pilaMemoria: Memoria[]

    // Registro
    private registro: Value
    
    // E/S
    private lecturaPendiente: { nombreVariable: string, tipoVariable: Typed.AtomicType | Typed.StringType }
    private escrituraPendiente: Value

    // atributos necesarios para convertir un numero de instruccion a un numero de linea fuente
    private numerosInstrucciones: number[]
    private numerosLineasFuente:  number[]

    constructor(programaCompilado: N3.ProgramaCompilado) {
        this.programaActual = programaCompilado

        this.nombreModuloActual = "principal"

        const memoriaModuloPrincipal = this.crearMemoriaModulo("principal")

        this.memoriaGlobal = memoriaModuloPrincipal

        this.memoriaModuloActual = memoriaModuloPrincipal

        this.lineaVisitada = false
        this.moduloLLamado = false
        this.saltoRealizado = false

        this.breakpointsRegistrados = []
        this.breakpointCumplido = false

        this.contadorInstruccion = 0

        this.pilaContadorInstruccion = []
        this.pilaValores = []
        this.pilaNombresModulo = []
        this.pilaMemoria = []

        this.registro = null

        this.lecturaPendiente = null
        this.escrituraPendiente = null

        this.numerosLineasFuente = Object.keys(this.programaActual.lineaFuentePorNumeroInstruccion).map(i => Number(i))
        this.numerosInstrucciones = []
        for (let k in this.programaActual.lineaFuentePorNumeroInstruccion) {
            this.numerosInstrucciones.push(this.programaActual.lineaFuentePorNumeroInstruccion[k])
        }

        /**
         * Determinar el estado inicial, si el modulo principal no
         * tiene enunciados, no hay nada que ejecutar
         */
        if (this.programaActual.rangoModulo.principal.fin == 0) {
            this.estadoActual = Estado.PROGRAMA_FINALIZADO
        }
        else {
            this.estadoActual = Estado.EJECUTANDO_PROGRAMA
        }
    }

    programaFinalizado(): boolean {
        return this.estadoActual == Estado.PROGRAMA_FINALIZADO || this.estadoActual == Estado.ERROR_ENCONTRADO
    }

    hayLecturaPendiente():boolean {
        return this.estadoActual == Estado.ESPERANDO_LECTURA
    }

    obtenerLecturaPendiente(): { nombreVariable: string, tipoVariable: Typed.AtomicType | Typed.StringType } {
        return this.lecturaPendiente
    }

    leer(v: Value) {
        this.estadoActual = Estado.EJECUTANDO_PROGRAMA
        this.pilaValores.push(v)
        this.lecturaPendiente = null
    }

    hayEscrituraPendiente(): boolean {
        return this.estadoActual == Estado.ESPERANDO_ESCRITURA
    }

    obtenerEscrituraPendiente(): Value {
        /**
         * Cuando este metodo se ejecuta, en lo que al Evaluador respecta, la
         * escritura fue realizada. Ahora hay que determinar en que estado
         * queda el evaluador luego de esto.
         */
        if (this.contadorInstruccion == this.programaActual.instrucciones.length) {
            this.estadoActual = Estado.PROGRAMA_FINALIZADO
        }
        else {
            this.estadoActual = Estado.EJECUTANDO_PROGRAMA
        }
        const valorAEscribir = this.escrituraPendiente
        this.escrituraPendiente = null
        return valorAEscribir
    }

    agregarBreakpoint(numeroLinea: number) {
        /**
         * Si el numero de linea tiene un instruccion asociado, registrar un bp
         */
        if (numeroLinea in this.programaActual.lineaFuentePorNumeroInstruccion) {
            const numeroSubEnunciado = this.programaActual.lineaFuentePorNumeroInstruccion[numeroLinea]

            // insertar nuevo breakpoint ordenadamente
            const indiceMayor = encontrarMayor(numeroSubEnunciado, this.breakpointsRegistrados)
            this.breakpointsRegistrados = insertarEn(indiceMayor, numeroSubEnunciado, this.breakpointsRegistrados)
        }
        /**
         * Si no, buscar el siguiente numero de linea que tenga un instruccion
         * y registrar un bp para ese.
         */
        else {
            const lineasConSubEnunciado = Object.keys(this.programaActual.lineaFuentePorNumeroInstruccion).map(k => Number(k))

            /**
             * Buscar el indice de la siguiente linea que tiene un instruccion correspondiente.
             */
            const indiceLineaSiguiente = encontrarMayor(numeroLinea, lineasConSubEnunciado)

            /**
             * Registrar el bp
             */
            const numeroSubEnunciado = this.programaActual.lineaFuentePorNumeroInstruccion[lineasConSubEnunciado[indiceLineaSiguiente]]
            const indiceMayor = encontrarMayor(numeroSubEnunciado, this.breakpointsRegistrados)
            this.breakpointsRegistrados = insertarEn(indiceMayor, numeroSubEnunciado, this.breakpointsRegistrados)
        }
    }

    quitarBreakpoint(numeroLinea: number) {
        /**
         * Si el numero de linea tiene un instruccion asociado, registrar un bp
         */
        if (numeroLinea in this.programaActual.lineaFuentePorNumeroInstruccion) {
            const numeroSubEnunciado = this.programaActual.lineaFuentePorNumeroInstruccion[numeroLinea]

            // buscar el indice del breakpoint a eliminar
            const indice = busquedaBinaria(numeroSubEnunciado, this.breakpointsRegistrados)
            this.breakpointsRegistrados = removerDe(indice, this.breakpointsRegistrados)
        }
        /**
         * Si no, buscar el siguiente numero de linea que tenga un instruccion
         * y registrar un bp para ese.
         */
        else {
            const lineasConSubEnunciado = Object.keys(this.programaActual.lineaFuentePorNumeroInstruccion).map(k => Number(k))

            /**
             * Buscar el indice de la siguiente linea que tiene un instruccion correspondiente.
             */
            const indiceLineaSiguiente = encontrarMayor(numeroLinea, lineasConSubEnunciado)

            /**
             * Buscar el indice del bp a eliminar
             */
            const numeroSubEnunciado = this.programaActual.lineaFuentePorNumeroInstruccion[lineasConSubEnunciado[indiceLineaSiguiente]]
            const indice = busquedaBinaria(numeroSubEnunciado, this.breakpointsRegistrados)
            this.breakpointsRegistrados = removerDe(indice, this.breakpointsRegistrados)
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

    ejecutarPrograma(): Failure<null> | Success<{ numeroLineaFuente: number, numeroInstruccion: number }> {
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
            

            this.evaluarSubEnunciado(this.programaActual.instrucciones[this.contadorInstruccion])

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
            if (this.estadoActual == Estado.PROGRAMA_FINALIZADO) {
                const numeroLineaFuente = this.aLineaFuente(0)
                return { error: false, result: { numeroLineaFuente, numeroInstruccion: 0 } }
            }
            else {
                const numeroLineaFuente = this.aLineaFuente(this.contadorInstruccion)
                return { error: false, result: { numeroLineaFuente, numeroInstruccion: this.contadorInstruccion } }
            }
        }
        else {
            return { error: true, result: null }
        }
    }

    private aLineaFuente(numeroInstruccion: number): number {
        let indiceEncontrado = false

        let indice = 0

        let i = 0

        const l = this.numerosInstrucciones.length

        while (i < l && !indiceEncontrado) {
            if (numeroInstruccion > this.numerosInstrucciones[i]) {
                i++
            }
            else {
                indiceEncontrado = true
                if (numeroInstruccion == this.numerosInstrucciones[i]) {
                    indice = i
                }
                else {
                    indice = i - 1
                }
            }
        }

        return this.numerosLineasFuente[indice];
    }

    /**
     * Ejecuta instruccions hasta encontrarse con uno que tiene un
     * enunciado correspondiente en el codigo fuente.
     */
    ejecutarEnunciadoSiguiente(): Failure<null> | Success<{ numeroLineaFuente: number, numeroInstruccion: number }> {
        let esFuente = this.esLineaFuente(this.contadorInstruccion)
        let fueVisitada = this.lineaVisitada
        let esBP = this.hayBreakpoint(this.contadorInstruccion)
        let BPCumplido = this.breakpointCumplido

        while (this.sePuedeEjecutar() && (!esFuente || fueVisitada) && (!esBP || BPCumplido)) {
            if (esBP) {
                this.breakpointCumplido = false
            }
            /**
             * Si la instruccion que se esta por ejecutar corresponde a 
             * una linea fuente hay que poner lineaVisitada en falso.
             * De otra manera la ejecucion no se va a frenar cuando se
             * alcance la PROXIMA instruccion que correpsonda a una linea
             * fuente. Algo similar ocurre con el BP ahí arriba.
             */
            if (esFuente) {
                this.lineaVisitada = false
            }

            this.evaluarSubEnunciado(this.programaActual.instrucciones[this.contadorInstruccion])

            this.incrementarContadorInstruccion()

            esFuente = this.esLineaFuente(this.contadorInstruccion)
            fueVisitada = this.lineaVisitada
            esBP = this.hayBreakpoint(this.contadorInstruccion)
            BPCumplido = this.breakpointCumplido
        }
        
        /**
         * Cuando se sale del bucle de ejecucion porque la linea tiene un
         * breakpoint o corresponde a una linea fuente hay que poner la bandera
         * correspondiente en verdadero.
         */
        if (esBP) {
            this.breakpointCumplido = true
        }

        if (esFuente) {
            this.lineaVisitada = true
        }

        if (this.estadoActual != Estado.ERROR_ENCONTRADO) {
            if (this.estadoActual == Estado.PROGRAMA_FINALIZADO) {
                const numeroLineaFuente = this.aLineaFuente(0)
                return { error: false, result: { numeroLineaFuente, numeroInstruccion: 0 } }
            }
            else {
                const numeroLineaFuente = this.aLineaFuente(this.contadorInstruccion)
                return { error: false, result: { numeroLineaFuente, numeroInstruccion: this.contadorInstruccion } }
            }
        }
        else {
            return { error: true, result: null }
        }
    }

    ejecutarInstruccion(): Failure<null> | Success<{ numeroLineaFuente: number, numeroInstruccion: number }> {
        this.evaluarSubEnunciado(this.programaActual.instrucciones[this.contadorInstruccion])

        this.incrementarContadorInstruccion()

        if (this.estadoActual != Estado.ERROR_ENCONTRADO) {
            if (this.estadoActual == Estado.PROGRAMA_FINALIZADO) {
                const numeroLineaFuente = this.aLineaFuente(0)
                return { error: false, result: { numeroLineaFuente, numeroInstruccion: 0 } }
            }
            else {
                const numeroLineaFuente = this.aLineaFuente(this.contadorInstruccion)
                return { error: false, result: { numeroLineaFuente, numeroInstruccion: this.contadorInstruccion } }
            }
        }
        else {
            return { error: true, result: null }
        }
    }

    /**
     * Dice si un numero de linea dado corresponde a una de las lineas de codigo fuente
     * @param n numero de linea que buscar entre las lineas del modulo
     */
    private esLineaFuente(n: number): boolean {
        return existe(n, this.numerosInstrucciones)
    }

    private ejecutarSubEnunciadoSiguiente() {
        if (this.hayBreakpoint(this.contadorInstruccion) && !this.breakpointCumplido) {
            this.breakpointCumplido = true
            this.estadoActual = Estado.ESPERANDO_PASO
        }
        else {
            this.breakpointCumplido = false

            this.evaluarSubEnunciado(this.programaActual.instrucciones[this.contadorInstruccion])

            this.incrementarContadorInstruccion()
        }
    }

    /**
     * Este metodo se encarga de incrementar el contador de instruccion.
     * Si luego del incremento el contador apunta a un instruccion
     * que no existe en el modulo que esta en ejecucion, desapila dicho modulo
     * y pone en ejecucion al siguiente. Si no hay modulos que desapilar, entonces
     * significa que el programa ha finalizado.
     */
    private incrementarContadorInstruccion() {
        if (this.moduloLLamado == false) {
            if (this.saltoRealizado == false) {
                this.contadorInstruccion++
            }
            else {
                this.saltoRealizado = false
            }
        }
        else {
            this.moduloLLamado = false
        }
    }

    private sePuedeEjecutar(): boolean {
        return this.estadoActual == Estado.EJECUTANDO_PROGRAMA
            || this.estadoActual == Estado.ESPERANDO_PASO
    }

    private hayBreakpoint(numeroLinea: number): boolean {
        return existe(numeroLinea, this.breakpointsRegistrados)
    }

    private evaluarSubEnunciado(instruccion: N3.Instruccion) {
        switch (instruccion.tipo) {
            case N3.TipoInstruccion.SUMAR:
                this.SUMAR()
                break
            case N3.TipoInstruccion.RESTAR:
                this.RESTAR()
                break
            case N3.TipoInstruccion.DIV_REAL:
                this.DIV_REAL()
                break
            case N3.TipoInstruccion.DIV_ENTERO:
                this.DIV_ENTERO()
                break
            case N3.TipoInstruccion.MODULO:
                this.MODULO()
                break
            case N3.TipoInstruccion.MULTIPLICAR:
                this.MULTIPLICAR()
                break
            case N3.TipoInstruccion.ELEVAR:
                this.ELEVAR()
                break
            case N3.TipoInstruccion.NEGAR:
                this.NEGAR()
                break
            case N3.TipoInstruccion.NOT:
                this.NOT()
                break
            case N3.TipoInstruccion.AND:
                this.AND()
                break
            case N3.TipoInstruccion.OR:
                this.OR()
                break
            case N3.TipoInstruccion.MENOR:
                this.MENOR()
                break
            case N3.TipoInstruccion.MENORIGUAL:
                this.MENORIGUAL()
                break
            case N3.TipoInstruccion.MAYOR:
                this.MAYOR()
                break
            case N3.TipoInstruccion.MAYORIGUAL:
                this.MAYORIGUAL()
                break
            case N3.TipoInstruccion.IGUAL:
                this.IGUAL()
                break
            case N3.TipoInstruccion.DIFERENTE:
                this.DIFERENTE()
                break
            case N3.TipoInstruccion.APILAR:
                this.APILAR(instruccion)
                break
            case N3.TipoInstruccion.APILAR_VAR:
                this.APILAR_VAR(instruccion)
                break
            case N3.TipoInstruccion.APILAR_ARR:
                this.APILAR_ARR(instruccion)
                break
            case N3.TipoInstruccion.ASIGNAR:
                this.ASIGNAR(instruccion)
                break
            case N3.TipoInstruccion.ASIGNAR_ARR:
                this.ASIGNAR_ARR(instruccion)
                break
            case N3.TipoInstruccion.APILAR_R:
                this.APILAR_R()
                break
            case N3.TipoInstruccion.ASIGNAR_R:
                this.ASIGNAR_R()
                break
            case N3.TipoInstruccion.LLAMAR:
                this.LLAMAR(instruccion)
                break
            case N3.TipoInstruccion.RETORNAR:
                this.RETORNAR()
                break
            case N3.TipoInstruccion.LEER:
                this.LEER(instruccion)
                break
            case N3.TipoInstruccion.ESCRIBIR:
                this.ESCRIBIR()
                break
            case N3.TipoInstruccion.REFERENCIA:
                this.REFERENCIA(instruccion)
                break
            case N3.TipoInstruccion.CREAR_MEMORIA:
                this.CREAR_MEMORIA(instruccion)
                break
            case N3.TipoInstruccion.JIF:
                this.JIF(instruccion)
                break
            case N3.TipoInstruccion.JIT:
                this.JIT(instruccion)
                break
            case N3.TipoInstruccion.JMP:
                this.JMP(instruccion)
                break
            case N3.TipoInstruccion.COPIAR_ARR:
                this.COPIAR_ARR(instruccion)
                break
            case N3.TipoInstruccion.INIT_ARR:
                this.INIT_ARR(instruccion)
                break
            case N3.TipoInstruccion.DETENER:
                this.DETENER()
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
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(a - b)
        return this.estadoActual
    }

    private DIV_REAL() {
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(a / b)
        return this.estadoActual
    }

    private DIV_ENTERO() {
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
        this.pilaValores.push((a - (a % b)) / b)
        return this.estadoActual
    }

    private MODULO() {
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
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
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
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
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(a < b)
        return this.estadoActual
    }

    private MENORIGUAL() {
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(a <= b)
        return this.estadoActual
    }

    private MAYOR() {
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
        this.pilaValores.push(a > b)
        return this.estadoActual
    }

    private MAYORIGUAL() {
        const b = this.pilaValores.pop() as number
        const a = this.pilaValores.pop() as number
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

    private APILAR(instruccion: N3.APILAR) {
        this.pilaValores.push(instruccion.valor)
    }

    private APILAR_VAR(instruccion: N3.APILAR_VAR) {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(instruccion.nombreVariable) as (Referencia | Escalar)

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

    private APILAR_ARR(instruccion: N3.APILAR_ARR) {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un vector
         * o una referencia a uno.
         */
        const variableOReferencia = this.recuperarVariable(instruccion.nombreVariable) as (Referencia | Vector2)

        if (variableOReferencia.tipo == "vector") {
            const indices = this.recuperarIndices(instruccion.cantidadIndices).map(i => i - 1)

            const indice = this.calcularIndice(indices, variableOReferencia.dimensiones)

            this.pilaValores.push(variableOReferencia.valores[indice])
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia

            const referenciaResuelta = this.resolverReferencia(referencia)

            const variable = referenciaResuelta.variable as Vector2

            const indices = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(instruccion.cantidadIndices)].map(i => i - 1)

            const indice = this.calcularIndice(indices, variable.dimensiones)

            this.pilaValores.push(variable.valores[indice])
        }
    }

    private ASIGNAR(instruccion: N3.ASIGNAR) {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(instruccion.nombreVariable) as (Referencia | Escalar)

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
                variable.inicialiazado = true
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
                variable.inicialiazado = true
            }
        }
    }

    private ASIGNAR_ARR(instruccion: N3.ASIGNAR_ARR) {
        /**
         * El type assert es correcto porque el verificador de tipos
         * ya garantizó que la variable que se apilará es un escalar
         * o una referencia a uno
         */
        const variableOReferencia = this.recuperarVariable(instruccion.nombreVariable) as (Referencia | Vector2)

        if (variableOReferencia.tipo == "vector") {
            const indices = this.recuperarIndices(instruccion.cantidadIndices).map(i => i - 1)

            const indice = this.calcularIndice(indices, variableOReferencia.dimensiones)

            variableOReferencia.valores[indice] = this.pilaValores.pop()
            variableOReferencia.inicialiazado = true
        }
        else {
            // esto no es necesario, solo hace que el codigo sea mas legible (discutible...)
            const referencia = variableOReferencia

            const referenciaResuelta = this.resolverReferencia(referencia)

            const variable = referenciaResuelta.variable as Vector2

            const indices = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(instruccion.cantidadIndices)].map(i => i - 1)

            const indice = this.calcularIndice(indices, variable.dimensiones)

            variable.valores[indice] = this.pilaValores.pop()
            variable.inicialiazado = true
        }
    }

    private APILAR_R() {
        this.pilaValores.push(this.registro)
    }
    private ASIGNAR_R() {
        this.registro = this.pilaValores.pop()
    }

    private LLAMAR(instruccion: N3.LLAMAR) {
        // apilar el modulo actual
        this.pilaNombresModulo.push(this.nombreModuloActual)

        this.pilaContadorInstruccion.push(this.contadorInstruccion)

        // apilar la memoria del modulo actual
        this.pilaMemoria.push(this.memoriaModuloActual)

        // cargar la memoria del modulo
        this.memoriaModuloActual = this.memoriaProximoModulo

        this.memoriaProximoModulo = null

        // poner contador instruccion en el primer instruccion del modulo llamado
        const rangoModuloLlamado = this.programaActual.rangoModulo[instruccion.nombreModulo]
        this.contadorInstruccion = rangoModuloLlamado.inicio

        // establecer moduloActual = moduloLLamado
        this.nombreModuloActual = instruccion.nombreModulo

        // poner bandera moduloLlamado en verdadero
        this.moduloLLamado = true
    }

    private RETORNAR() {
        this.nombreModuloActual = this.pilaNombresModulo.pop()

        this.contadorInstruccion = this.pilaContadorInstruccion.pop()

        this.memoriaModuloActual = this.pilaMemoria.pop()
    }

    private LEER(instruccion: N3.LEER) {
        this.lecturaPendiente = { nombreVariable: instruccion.nombreVariable, tipoVariable: instruccion.tipoVariable }
        this.estadoActual = Estado.ESPERANDO_LECTURA
    }

    private ESCRIBIR() {
        this.escrituraPendiente = this.pilaValores.pop()
        this.estadoActual = Estado.ESPERANDO_ESCRITURA
    }

    private REFERENCIA(instruccion: N3.REFERENCIA) {
        const indices = this.recuperarIndices(instruccion.cantidadIndices)
        const referencia = this.memoriaProximoModulo[instruccion.nombreReferencia] as Referencia
        // Cargar la referencia con los datos necesarios. La referencia en si fue creada durante un llamado a CREAR_MEMORIA.
        referencia.indices = indices
        referencia.nombreVariable = instruccion.nombreVariable
    }

    private CREAR_MEMORIA(instruccion: N3.CREAR_MEMORIA) {
        // crear espacio de memoria del modulo que va a ser llamado
        this.memoriaProximoModulo = this.crearMemoriaModulo(instruccion.nombreModulo)
    }

    private JIF(instruccion: N3.JIF) {
        const condicion = this.pilaValores.pop() as boolean

        /**
         * Saltar solo si la condicion evaluó a "falso"
         */
        if (condicion == false) {
            this.contadorInstruccion = instruccion.numeroLinea
            this.saltoRealizado = true
        }
    }
    
    private JIT(instruccion: N3.JIT) {
        const condicion = this.pilaValores.pop() as boolean

        /**
         * Saltar solo si la condicion evaluó a "verdadero"
         */
        if (condicion == true) {
            this.contadorInstruccion = instruccion.numeroLinea
            this.saltoRealizado = true
        }
    }

    private JMP(instruccion: N3.JMP) {
        this.contadorInstruccion = instruccion.numeroLinea
        this.saltoRealizado = true
    }

    private COPIAR_ARR(instruccion: N3.COPIAR_ARR) {
        // Vector objetivo (al cual se copian los datos)
        let vectorA: Vector2

        // Indices para el vector objetivo
        let indicesA: number[]

        // Vector fuente (del cual se obtienen los datos)
        let vectorB: Vector2

        // Indices para el vector fuente
        let indicesB: number[]

        const variableOReferenciaA = this.recuperarVariable(instruccion.nombreObjetivo) as (Referencia | Vector2)

        const variableOReferenciaB = this.recuperarVariable(instruccion.nombreFuente) as (Referencia | Vector2)

        // Resvoler el vector fuente primero porque sus indices estan al tope de la pila
        if (variableOReferenciaB.tipo == "referencia") {
            const referenciaResuelta = this.resolverReferencia(variableOReferenciaB)

            vectorB = referenciaResuelta.variable as Vector2

            indicesB = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(instruccion.cantidadIndicesFuente)].map(i => i - 1)
        }
        else {
            vectorB = variableOReferenciaB
            indicesB = this.recuperarIndices(instruccion.cantidadIndicesFuente).map(i => i - 1)
        }

        // Resolver el vector objetivo
        if (variableOReferenciaA.tipo == "referencia") {
            const referenciaResuelta = this.resolverReferencia(variableOReferenciaA)

            vectorA = referenciaResuelta.variable as Vector2

            indicesA = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(instruccion.cantidadIndicesObjetivo)].map(i => i - 1)
        }
        else {
            vectorA = variableOReferenciaA
            indicesA = this.recuperarIndices(instruccion.cantidadIndicesObjetivo).map(i => i - 1)
        }

        // Indice de la primer celda de A a la que se copia un valor...
        const indiceBaseObjetivo = this.calcularIndice([...indicesA, ...repetir(0, vectorA.dimensiones.length - indicesA.length)], vectorA.dimensiones)

        // Indice de la primer celda de B de la que se copia un valor...
        const indiceBaseFuente = this.calcularIndice([...indicesB, ...repetir(0, vectorB.dimensiones.length - indicesB.length)], vectorB.dimensiones)

        // Indice de la ultima celda a copiar
        const indiceUltimaCelda = this.calcularIndice([...indicesB, ...drop(indicesB.length, vectorB.dimensiones).map(i => i - 1)], vectorB.dimensiones)

        for (let i = 0; (i + indiceBaseFuente) <= indiceUltimaCelda; i++) {
            vectorA.valores[indiceBaseObjetivo + i] = vectorB.valores[indiceBaseFuente + i]
        }
    }

    private INIT_ARR(instruccion: N3.INIT_ARR) {
        const vectorObjetivo = this.memoriaProximoModulo[instruccion.nombreArregloObjetivo] as Vector2

        let vectorFuente: Vector2
        let indicesVectorFuente

        // variable o referencia al vector fuente
        const variableOReferencia = this.recuperarVariable(instruccion.nombreArregloFuente) as Vector2 | Referencia

        if (variableOReferencia.tipo == "referencia") {
            const referenciaResuelta = this.resolverReferencia(variableOReferencia)

            vectorFuente = referenciaResuelta.variable as Vector2

            indicesVectorFuente = [...referenciaResuelta.indicesPrevios, ...this.recuperarIndices(instruccion.cantidadIndices)].map(i => i - 1)
        }
        else {
            vectorFuente = variableOReferencia

            indicesVectorFuente = this.recuperarIndices(instruccion.cantidadIndices).map(i => i - 1)
        }

        const indiceBase = this.calcularIndice(indicesVectorFuente, vectorFuente.dimensiones)

        /**
         * Como los arreglos tiene el mismo tamaño (garantizado por el verificador de tipado)
         * solo hay que copiar tantas celdas como haya en el arreglo objetivo.
         */
        for (let i = 0, l = vectorObjetivo.valores.length; i < l; i++) {
            vectorObjetivo.valores[i] = vectorFuente.valores[indiceBase + i]
        }
    }

    private DETENER() {
        this.estadoActual = Estado.PROGRAMA_FINALIZADO
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
 * Devuelve un arreglo donde 'a' se repite 'n' veces
 * @param a elemento a repetir
 * @param n cuantas veces hay que repetirlo
 */
function repetir<A>(a: A, n: number): A[] {
    const r = new Array<A>(n)
    for (let i = 0; i < n; i++) {
        r[i] = a
    }
    return r
}

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