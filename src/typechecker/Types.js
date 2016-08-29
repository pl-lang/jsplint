export const Integer = {
  kind: 'atomic',
  atomic: 'entero'
}

export const Float = {
  kind: 'atomic',
  atomic: 'real'
}

export const Bool = {
  kind: 'atomic',
  atomic: 'logico'
}

export const Char = {
  kind: 'atomic',
  atomic: 'caracter'
}

export const None = {
  kind: 'atomic',
  atomic: 'ninguno'
}

export class ArrayType {
  constructor(element_type, length) {
    this.kind = 'array'
    this.length = length
    this.contains = element_type
  }
}

export class String extends ArrayType {
  constructor(length) {
    super(Char, length)
  }
}

export function Writable(type) {
  if (type instanceof String) return true
  else return is_atomic(type)
}

export function Readable(type) {
  if (type instanceof ArrayType) {
    if (type.contains == Char) return true
    else return false
  }
  else return is_atomic(type)
}

export const type_constraint = curry((a, b) => {
  return equals(a, b)
})

// tipo de la funcion `escribir`
export const WriteType = {
  kind: 'function',
  return_type: None,
  parameters: {
    amount: 1,
    constraints: [Writable]
  }
}

// tipo de la funcion `escribir_linea`
export const WriteLineType = {
  kind: 'function',
  return_type: None,
  parameters: {
    amount: 1,
    constraints: [Writable]
  }
}

// tipo de la funcion `leer`
export const ReadType = {
  kind: 'function',
  return_type: None,
  parameters: {
    amount: 1,
    constraints: [Readable]
  }
}
