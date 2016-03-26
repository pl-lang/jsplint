'use strict'

const Report = require('../misc/Report')

/**
 * Funcion que intenta capturar un token numerico
 * @param {TokenQueue} source Fuente en la que hay que buscar el numero
 * @return {Report} reporte con el resultado
 */
function Number(source) {
  let current = source.current()

  if (current.kind == 'real' || current.kind == 'entero') {
    source.next()
    let result = {value:current.value, type:current.kind}
    return new Report(false, result)
  }
  else {
    let unexpected  = current.kind
    let expected    = ['entero', 'real']
    let atColumn    = current.columnNumber
    let atLine      = current.lineNumber

    return new Report(true, {unexpected, expected, atColumn, atLine})
  }
}

/**
 * Captura un token de tipo 'entero'
 * @param {TokenQueue} source fuente desde la cual se debe capturar
 * @return {Report}
 */
function Integer(source) {
  let current = source.current()

  if (current.kind === 'entero') {
    // consumir el token actual y...
    source.next()
    // ...devolver los datos importantes o...
    return new Report(false, current.value)
  }
  else {
    // ...devolver informacion sobre el error
    let unexpected = current.kind
    let expected = 'entero'
    let atColumn = current.columnNumber
    let atLine = current.lineNumber

    return new Report(true, {unexpected, expected, atColumn, atLine})
  }
}

function ArrayDimension(source) {
  let indexes = []

  let index_report = Integer(source)

  if (index_report.error) {
    return index_report
  }
  else {
    indexes.push(index_report.result)
  }

  if (source.current().kind === 'comma') {
    source.next()

    let following_indexes = ArrayDimension(source)

    if (following_indexes.error) {
      return following_indexes
    }
    else {
      indexes = indexes.concat(following_indexes.result)
      return new Report(false, indexes)
    }
  }
  else {
    return new Report(false, indexes)
  }
}

function Word(source) {
  let current = source.current()

  if (current.kind === 'word') {
    source.next()
    return new Report(false, current.text)
  }
  else {
    let unexpected = current.kind
    let expected = 'word'
    let atColumn = current.columnNumber
    let atLine = current.lineNumber

    return new Report(true, {unexpected, expected, atColumn, atLine})
  }
}

function VariableDeclaration(source) {
  let variable = {
      data    : {isArray : false, type:'unknown'}
    , name    : ''
  }

  let text = Word(source)

  if (text.error) {
    return text
  }
  else {
    variable.name = text.result
    if (source.current().kind === 'left-bracket') {
      source.next()
      let dimension = ArrayDimension(source)
      if (dimension.error) {
        return dimension
      }
      else {
        variable.data.isArray = true
        variable.data.dimension = dimension.result
        if (source.current().kind === 'right-bracket') {
          source.next()
          return new Report(false, variable)
        }
        else {
          let current = source.current()

          let unexpected = current.kind
          let expected   = 'right-bracket'
          let atColumn        = current.columnNumber
          let atLine          = current.lineNumber

          return new Report(true, {unexpected, expected, atColumn, atLine})
        }
      }
    }
    else {
      return new Report(false, variable)
    }
  }
}

function VariableList(source) {
  let variables = []
  let partial_match = false

  let name_report = VariableDeclaration(source)

  if (name_report.error) {
    return name_report
  }
  else {
    variables.push(name_report.result)

    if (source.current().kind === 'comma') {
      source.next()
      let var_list_match = VariableList(source)

      if (var_list_match.error) {
        return new Report(false, variables)
      }
      else {
        return new Report(false, variables.concat(var_list_match.result))
      }
    }
    else {
      return new Report(false, variables)
    }
  }
}

let isType = string => {return /entero|real|logico|caracter/.test(string)}

function TypeName(source) {
  let current = source.current()

  if ( isType(current.kind) ) {
    source.next()
    return new Report(false, current.kind)
  }
  else {
    let unexpected = current.kind
    let expected  = ['entero', 'real', 'logico', 'caracter']
    let atColumn        = current.columnNumber
    let atLine          = current.lineNumber
    let reason          = 'nonexistent-type'

    return new Report(true, {unexpected, expected, atColumn, atLine, reason})
  }
}

function Declaration(source) {
  let declarations = {}

  let typename = TypeName(source)

  if (typename.error)
    return typename
  else {
    let var_list_match = VariableList(source)

    if (var_list_match.error) {
      return var_list_match
    }

    for (let variable of var_list_match.result) {
      let name = variable.name

      if (declarations.hasOwnProperty(name)) {
        return new Report(true, {reason:'repeatead-var-name', name})
      }

      let var_object = variable.data
      var_object.type = typename.result

      if (var_object.isArray === true) {
        let size = var_object.dimension.reduce((acumulador, elemento) => {
          return acumulador * elemento
        })
        var_object.values = new Array(size)
      }
      else {
        var_object.value = null
      }

      declarations[name] = var_object

    }
    let comma_found = false
    let eol_found = false

    if (source.current().kind === 'comma') {
      source.next()
      comma_found = true
    }
    else if (source.current().kind == 'eol') {
      source.next()
      eol_found = true
    }

    let nextDeclaration = Declaration(source)

    if ((comma_found || eol_found) && nextDeclaration.error && source.current().kind != 'inicio') {
      return nextDeclaration
    }
    else if (nextDeclaration.error === false) {
      for (let name in nextDeclaration.result) {
        if (declarations.hasOwnProperty(name)) {
          return new Report(true, {reason:'repeatead-var-name', name})
        }
        else {
          declarations[name] = nextDeclaration.result[name]
        }
      }
    }
    return new Report(false, declarations)
  }
}

/**
 * Funcion que, dada una funcion de captura y una fuente devuelve un reporte
 * @param {Function} pattern_matcher Funcion que captura tokens
 */
function match(pattern_matcher) {
  return {
    from: (source) => {
      return pattern_matcher(source)
    }
  }
}

module.exports = {
  match                   : match,
  Integer                 : Integer,
  ArrayDimension          : ArrayDimension,
  Word                    : Word,
  VariableDeclaration     : VariableDeclaration,
  VariableList            : VariableList,
  TypeName                : TypeName,
  Declaration             : Declaration
}
