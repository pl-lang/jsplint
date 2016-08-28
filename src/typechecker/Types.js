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
