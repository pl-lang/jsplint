// similar como seria bind (>>=) de haskell si solo pudiera ser aplicado a
// Maybes
// En resumen, una funcion que toma una funcion y un reporte. Si el reporte indica
// un error, lo devuelve. Si no, aplica f sobre el valor que el reporte contiene
// (y sobre cualquier otro argumento pasado luego del reporte). Cabe aclarar que
// f es una funcion que tambien devuelve reportes. Un reporte es un objeto que
// contiene las propiedades `error` y `result`.
export function bind (f, report, ...rest) {
  return report.error ? report:f(report.result, ...rest)
}

// flatten :: [any] -> [[any]] -> [any]
export function flatten (accumulator, arr) {
  return [...accumulator, ...arr]
}

// toma dos objetos y devuelve uno nuevo que contiene las propiedades (y valores)
// de los dos anteriores. Si hay propiedades repetidas entre a y b, se toman las
// de b
export function mergeObjs (a, b) {
  let r = {}

  for (let prop in a) {
    r[prop] = a[prop]
  }

  for (let prop in b) {
    r[prop] = b[prop]
  }

  return r
}


// take, zip y zipObj estan basadas en funciones de haskell

// crea un nuevo objeto dadas una lista de valores y una lista de cadenas.
// Tendra tantos pares prop/valor como haya elementos en la lista mas
// corta

export function zipObj (values, names) {
  if (values.length > names.length) {
    values = take(names.length, values)
  }
  else if (values.length < names.length) {
    names = take(values.length, name)
  }

  let pairs = zip(names, values)

  let result = {}

  for (let [name, value] of pairs) {
    result[name] = value
  }

  return result
}

// toma dos listas y devuelve una lista de pares donde el primer elemento
// pertenece a "a" y el segundo a "b". La lista tendra tantos elementos
// como la mas corta entre a y b
export function zip (a, b) {
  if (a.length > b.length) {
    a = take(b.length, a)
  }
  else if (a.length < b.length) {
    b = take(a.length, b)
  }

  let result = []

  for (let i = 0; i < a.length; i++) {
    result.push([a[i], b[i]])
  }

  return result
}

// toma los primeros n elementos de un arreglo
export function take (n, list) {
  return list.slice(0, n)
}
