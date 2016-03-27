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

function IndexExpression(source) {
  let indexes = []

  let index_report = Expression(source)

  if (index_report.error === true) {
    return index_report
  }
  else {
    indexes.push(index_report.result)

    if (source.current().kind === 'comma') {
      source.next()

      let another_index_report = Expression(source)

      if (another_index_report.error === true) {
        return another_index_report
      }
      else {
        indexes = indexes.concat(another_index_report.result)

        return new Report(false, indexes)
      }
    }
    else {
      return new Report(false, indexes)
    }
  }
}

function Variable(source) {
  let name = '', isArray = false, indexes = null

  let word_match = Word(source)

  if (word_match.error === true) {
    return word_match
  }
  else {
    name = word_match.result

    if (source.current().kind === 'left-bracket') {
      source.next()

      let index_expressions_match = IndexExpression(source)

      if (index_expressions_match.error === true) {
        return index_expressions_match
      }

      isArray = true
      indexes = index_expressions_match.result

      if (source.current().kind === 'right-bracket') {
        source.next()

        return new Report(false, {name, isArray, indexes})
      }
      else {
        let current = source.current()

        let unexpected  = current.kind
        let expected    = 'right-bracket'
        let atColumn    = current.columnNumber
        let atLine      = current.lineNumber

        return new Report(true, {unexpected, expected, atColumn, atLine})
      }
    }
    else {
      return new Report(false, {name, isArray, indexes})
    }
  }
}

let precedence_by_op = {
  'power'       : 6 ,
  'div'         : 5 ,
  'mod'         : 5 ,
  'times'       : 5 ,
  'divide'      : 5 ,
  'minus'       : 4 ,
  'plus'        : 4 ,
  'minor-than'  : 3 ,
  'minor-equal' : 3 ,
  'major-than'  : 3 ,
  'major-equal' : 3 ,
  'equal'       : 2 ,
  'diff-than'   : 2 ,
  'and'         : 1 ,
  'or'          : 0
}

let operator_names = new Set(Object.getOwnPropertyNames(precedence_by_op))

function UnaryExpression(source) {
  let op_found = false
  let op
  let current = source.current()
  if (current.kind == 'minus' || current.kind == 'not' || current.kind == 'plus') {
    op_found = true
    if (current.kind == 'plus') {
      op_found = false
    }
    else {
      op = current.kind == 'minus' ? 'unary-minus' : 'not'
    }
    source.next()
  }

  let exp = PrimaryExpression(source)

  if (exp.error) {
    return exp
  }
  else {
    if (op_found) {
      let expression_type = 'unary-operation'
      let operand = exp.result
      let result = {expression_type, op, operand}
      let error = false
      return new Report(error, result)
    }
    else {
      let error = false
      let result = exp.result
      return new Report(error, result)
    }
  }
}

function PrimaryExpression(source) {
  let current = source.current()
  if (current.kind == 'word') {
    if (source.peek().kind != 'left-par') {

      let variable_match = Variable(source)

      if (variable_match.error === true) {
        return variable_match
      }

      let name    = variable_match.result.name
      let isArray = variable_match.result.isArray
      let indexes = variable_match.result.indexes

      let error = false
      let expression_type = 'invocation'
      let result = {expression_type, name, isArray, indexes}

      return new Report(error, result)
    }
    else {

    }
  }
  else if (current.kind == 'verdadero' || current.kind == 'falso') {
    let error = false
    let expression_type = 'literal'
    let value = current.kind == 'verdadero'
    let type = 'logico'
    let result = {expression_type, value, type}
    source.next()
    return new Report(error, result)
  }
  else if (current.kind == 'entero' || current.kind == 'real' || current.kind == 'string') {
    let error = false
    let expression_type = 'literal'
    let value = current.value
    let type = current.kind
    let result = {expression_type, value, type}

    if (type == 'string') {
      result.length = value.length
    }

    source.next()

    return new Report(error, result)
  }
  else if (current.kind == 'left-par') {
    source.next()
    let exp = Expression(source)
    if (exp.error) {
      return exp
    }
    else {
      if (source.current().kind == 'right-par') {
        source.next()
        let error = false
        let expression_type = 'expression'
        let expression = exp.result
        let result = {expression_type, expression}
        return new Report(error, result)
      }
      else {
        let unexpected = source.current().kind
        let expected   = 'right-par'
        let atColumn        = source.current().columnNumber
        let atLine          = source.current().lineNumber

        let error = false
        let result = {unexpected, expected, atColumn, atLine}

        return new Report(error, result)
      }
    }
  }
  else {
    let unexpected = current.kind
    let expected   = ['entero', 'real', 'cadena', 'verdadero', 'falso', '(expresion)']
    let atColumn        = current.columnNumber
    let atLine          = current.lineNumber

    let error           = true
    let result          = {unexpected, expected, atColumn, atLine}

    return new Report(error, result)
  }
}

function queueToRPN(source) {
  let operator_stack = []
  let output_stack = []

  while ( source.current().kind != 'eol' && source.current().kind != 'eof' && source.current().kind != 'comma' && source.current().kind != 'right-par' && source.current().kind != 'right-bracket') {
    let operand_exp  = UnaryExpression(source)
    if (operand_exp.error) {
      return operand_exp
    }
    else {
      output_stack.push(operand_exp.result)
    }

    if (operator_names.has(source.current().kind)) {
      while (operator_stack.length > 0 && precedence_by_op[source.current().kind] <= precedence_by_op[operator_stack[operator_stack.length-1]]) {
        output_stack.push(operator_stack.pop())
      }
      operator_stack.push(source.current().kind)
      source.next()
    }
  }

  while (operator_stack.length > 0) {
    output_stack.push(operator_stack.pop())
  }

  return new Report(false, output_stack)
}

function RPNtoTree(rpn_stack) {
  let last_token = rpn_stack.pop()

  if (operator_names.has(last_token)) {
    let op = last_token
    let operands = [RPNtoTree(rpn_stack)]
    operands.unshift(RPNtoTree(rpn_stack))
    let expression_type = 'operation'
    return {expression_type, op, operands}
  }
  else {
    return last_token
  }
}

function Expression(source) {
  let rpn = queueToRPN(source)

  if (rpn.error) {
    return rpn
  }
  else {
    let tree = RPNtoTree(rpn.result)
    return new Report(false, tree)
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
  Declaration             : Declaration,
  IndexExpression         : IndexExpression,
  Variable                : Variable,
  Expression              : Expression
}
