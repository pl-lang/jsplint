// Clase que se encarga de ejecutar un programa.

import { N3, Typed, Value } from './interfaces'

type EstadoEvaluador = EJECUTANDO_PROGRAMA | ESPERANDO_LECTURA | ESPERANDO_PASO | LECTURA_REALIZADA | PROGRAMA_FINALIZADO | ERROR_ENCONTRADO

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

interface ESPERANDO_PASO extends EstadoAbstracto {
    id: Estado.ESPERANDO_PASO
    numeroLinea: number
}

interface PROGRAMA_FINALIZADO extends EstadoAbstracto {
    id: Estado.PROGRAMA_FINALIZADO
    numeroLinea: number
}

interface ERROR_ENCONTRADO extends EstadoAbstracto {
    id: Estado.ERROR_ENCONTRADO
    numeroLinea: number
}

enum Estado {
    EJECUTANDO_PROGRAMA = 0,
    ESPERANDO_LECTURA, // luego de una llamada a leer
    LECTURA_REALIZADA, // luego de realizar una lectura
    ESPERANDO_PASO, // luego de haber ejecutado un paso o sub-paso
    PROGRAMA_FINALIZADO,
    ERROR_ENCONTRADO
}


export default class Evaluador {

    private programaActual: N3.Programa

    private estadoActual: EstadoEvaluador

    private contadorInstruccion: number // indica cual es la proxima instruccion que se ejecutara
    private pilaContadorInstruccion: number[]
    private pilaNombreModulo: string[]
    private breakpointsRegistrados: number[]
    private breakpointCumplido: boolean
    private lineaVisitada: boolean
    private lineasFuentePorLineaFinal: { [l: number]: number } // indica a que numero de linea fuente corresponde un numero de linea final
    private lineasFuente: number[] // indica los numeros de las instrucciones que se corresponden con enunciados del codigo fuente

    private pilaValores: Valor[]

    constructor(programa: N3.Programa, lineasFuentePorLineaFinal: { [l: number]: number }) {
        this.programaActual = programa
        this.lineasFuente = unicos(Object.keys(lineasFuentePorLineaFinal).map(k => lineasFuentePorLineaFinal[k]))
        this.lineaVisitada = true
        this.contadorInstruccion = 0
        this.pilaContadorInstruccion = []
        this.pilaNombreModulo = []
        this.breakpointsRegistrados = []
        this.breakpointCumplido = false
    }

    ejecutarPrograma(): EstadoEvaluador {
        while (this.sePuedeEjecutar()) {
            this.estadoActual = this.ejecutarEnunciadoSiguiente()
        }
        return this.estadoActual
    }

    ejecutarEnunciadoSiguiente(): EstadoEvaluador {
        if (this.sePuedeEjecutar()) { // solo para no sobrecargar la condicion del while...
            while (this.sePuedeEjecutar && (!existe(this.contadorInstruccion, this.lineasFuente) || this.lineaVisitada)) {
                this.estadoActual = this.ejecutarEnunciadoSiguiente()
            }
            this.lineaVisitada = true
        }
        return this.estadoActual
    }

    private ejecutarSubEnunciadoSiguiente(): EstadoEvaluador {
        if (this.sePuedeEjecutar()) {
            // ver si hay un breakpoint registrado para esta instruccion
            if (this.hayBreakpoint(this.contadorInstruccion) && !this.breakpointCumplido) {
                this.breakpointCumplido = true
                this.estadoActual = { id: Estado.ESPERANDO_PASO, numeroLinea: this.contadorInstruccion }
            }
            else {
                const enunciado = this.programaActual.modulos[this.pilaNombreModulo[0]][this.contadorInstruccion]
                this.contadorInstruccion++
                this.breakpointCumplido = false
                // const retorno = this.evaluarSubEnunciado(enunciado)
                // return retorno
            }
        }
        return this.estadoActual
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

    private evaluarSubEnunciado(enunciado: N3.Enunciado): EstadoEvaluador {
        switch (enunciado.tipo) {
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