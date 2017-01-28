import {Typed} from '../interfaces'

// flatten :: [any] -> [[any]] -> [any]
export function flatten<A> (accumulator : A[], arr: A[][]) : A[] {
  for (let a of arr) {
    for (let element of a) {
      accumulator.push(element)
    }
  }
  return accumulator
}

// toma dos objetos y devuelve uno nuevo que contiene las propiedades (y valores)
// de los dos anteriores. Si hay propiedades repetidas entre a y b, se toman las
// de b
export function mergeObjs<A, B>(a:{[p:string]:A}, b:{[q:string]: B}) : {[q:string]: (A|B)} {
  const r: {[q:string]: (A|B)} = {}

  for (let prop in a) {
    r[prop] = a[prop]
  }

  for (let prop in b) {
    r[prop] = b[prop]
  }

  return r
}

export function clone_obj<A>(a:{[p:string]:A}) : {[p:string]:A} {
  return mergeObjs({} as {[p:string]:A}, a)
} 


// take, zip y zipObj estan basadas en funciones de haskell

// crea un nuevo objeto dadas una lista de valores y una lista de cadenas.
// Tendra tantos pares prop/valor como haya elementos en la lista mas
// corta
export function zipObj<A> (values : A[], names : string[]) : { [prop: string]: A} {
  if (values.length > names.length) {
    values = take(names.length, values)
  }
  else if (values.length < names.length) {
    names = take(values.length, names)
  }

  let pairs = zip(names, values)

  /**
   * result es un objeto cuyas claves son cadenas y cuyos valores son de tipo A
   */
  let result : {[prop: string]: A} = {}

  for (let [prop, value] of pairs) {
    result[prop] = value
  }

  return result
}

// toma dos listas y devuelve una lista de pares donde el primer elemento
// pertenece a "a" y el segundo a "b". La lista tendra tantos elementos
// como la mas corta entre a y b
export function zip<A, B> (a : A[], b : B[]) : [A, B][] {
  if (a.length > b.length) {
    a = take(b.length, a)
  }
  else if (a.length < b.length) {
    b = take(a.length, b)
  }

  let result : [A, B][] = []

  for (let i = 0; i < a.length; i++) {
    result.push([a[i], b[i]])
  }

  return result
}

// toma los primeros n elementos de un arreglo
export function take<T> (n : number, list : T[]) : T[] {
  return list.slice(0, n)
}

/**
 * drop
 * quita los primeros n elementos de un arreglo
 */
export function drop<T> (n: number, list: T[]) : T[] {
  return list.slice(n)
}

/**
 * arr_counter
 * crea un arreglo numerico inicializado con una longitud especifica
 * para ser usado como contador
 */
export function arr_counter (length: number, init: number) {
  const arr: number[] = new Array(length)

  for (let i = 0; i < length; i++) {
    arr[i] = init
  }

  return arr
}

/**
 * arr_equal
 * compara dos arreglos para ver si son iguales
 */
export function arr_equal<A> (a: A[], b: A[]) {
  if (a.length != b.length) {
    return false
  }
  else {
    for (let i = 0; i < a.length; i++) {
      if (a[i] != b[i]) {
        return false
      }
    }
  }

  return true
}

/**
 * arr_less
 * compara dos arreglos numericos de la misma longitud
 * para ver si el primero es menor que el segundo.
 */
export function arr_minor (a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) {
      return false
    }
  }
  return true
}

/**
 * arr_major
 * compara dos arreglos numericos de la misma longitud
 * para ver si el primero es mayor que el segundo
 */
export function arr_major (a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) {
      return false
    }
  }
  return true
}

/**
 * arr_counter_inc
 * toma una arreglo de numeros usado como contador y lo incrementa `increment` unidades 
 */
export function arr_counter_inc (a: number[], lengths: number[], init: number) {
  let done = false
  for (let i = a.length - 1; i >= 0 && !done ; i--) {
    a[i]++
    done = true
    /**
     * Esto permite que el primer elemento del arreglo se incremente
     * indefinidamente. Es el unico que no es reseteado.
     */
    if (i > 0) {
      if (a[i] > lengths[i]) {
        a[i] = init
        done = false
      }
    }
  }
}

/**
 * arr_counter_inc
 * toma un arreglo numercio usado como contador y lo decrementa
 * `dec` unidades.
 */
export function arr_counter_dec (a: number[], lengths: number[]) {
  let done = false
  for (let i = a.length - 1; i >= 0 && !done; i--) {
    a[i]--
    done = true
    if (i > 0) {
      if (a[i] < 1) {
        a[i] = lengths[i]
        done = false
      }
    }
  }
}

export function types_are_equal (a: Typed.Type, b: Typed.Type): boolean {
    if (a.kind == b.kind) {
        switch (a.kind) {
            case 'array':
                if ((a as Typed.ArrayType).length == (b as Typed.ArrayType).length) {
                    return types_are_equal ((a as Typed.ArrayType).cell_type, (b as Typed.ArrayType).cell_type)
                }
                else {
                    return false
                }
            case 'atomic':
                return (a as Typed.AtomicType).typename == (b as Typed.AtomicType).typename
        }
    }
    else {
        return false
    }
}

export function stringify (type: Typed.Type): string {
  if (type.kind == 'array') {
    let dimensions = ''
    let ct: Typed.Type = type
    while (ct.kind == 'array') {
      dimensions += (ct as Typed.ArrayType).length
      if ((ct as Typed.ArrayType).cell_type.kind == 'array') {
          dimensions += ', '
      }
      ct = (ct as Typed.ArrayType).cell_type
    }
    const atomic = (ct as Typed.AtomicType).typename
    return `${atomic}[${dimensions}]`
  }
  else {
    return (type as Typed.AtomicType).typename
  }
}