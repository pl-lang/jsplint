// Estas dos funciones quedan comentadas como referencia
// export function bindN (f, ...args) {
//   let func = f
//   let output

//   for (let i = 0; i < args.length - 1; i++) {
//     if (args[i].error)
//       return args[i]
//     else
//       func = func(args[i].result)
//   }

//   return bind(func, last(args))
// }

// similar como seria bind (>>=) de haskell si solo pudiera ser aplicado a
// Maybes
// En resumen, una funcion que toma una funcion y un reporte. Si el reporte indica
// un error, lo devuelve. Si no, aplica f sobre el valor que el reporte contiene
// Cabe aclarar que f es una funcion que tambien devuelve reportes.
// Un reporte es un objeto que contiene las propiedades `error` y `result`.
// export const bind = curry((f : any, r : any) => r.error ? r:f(r.result))

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
 * toma los ultimos n elementos de un arreglo
 */
export function drop<T> (n: number, list: T[]) : T[] {
  return list.slice(list.length - n)
}
