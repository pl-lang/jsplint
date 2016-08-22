export class IntegerType {
  constructor(dimensions_sizes) {
    this.atomic = 'entero'
    this.dimensions = dimensions_sizes.length
    this.dimensions_sizes = dimensions_sizes
  }
}

export class FloatType {
  constructor(dimensions_sizes) {
    this.atomic = 'real'
    this.dimensions = dimensions_sizes.length
    this.dimensions_sizes = dimensions_sizes
  }
}

export class BoolType {
  constructor(dimensions_sizes) {
    this.atomic = 'logico'
    this.dimensions = dimensions_sizes.length
    this.dimensions_sizes = dimensions_sizes
  }
}

export class CharType {
  constructor(dimensions_sizes) {
    this.atomic = 'caracter'
    this.dimensions = dimensions_sizes.length
    this.dimensions_sizes = dimensions_sizes
  }
}

export const Integer = new IntegerType([1])

export const Float = new FloatType([1])

export const Bool = new BoolType([1])

export const Char = new CharType([1])
