'use strict'

import Report from '../utility/Report.js'

import {take, zipObj} from '../utility/helpers.js'

import TokenQueue from './TokenQueue.js'

/**
 * Funcion que intenta capturar un token numerico
 * @param {TokenQueue} source Fuente en la que hay que buscar el numero
 * @return {Report} reporte con el resultado
 */
export function Number(source) {
  let current = source.current()

  if (current.kind == 'real' || current.kind == 'entero') {
    source.next()
    let result = {value:current.value, type:current.kind}
    return new Report(false, result)
  }
  else {
    let unexpected  = current.kind
    let expected    = ['entero', 'real']
    let column    = current.columnNumber
    let line      = current.lineNumber

    return new Report(true, {unexpected, expected, column, line})
  }
}

/**
 * Captura un token de tipo 'entero'
 * @param {TokenQueue} source fuente desde la cual se debe capturar
 * @return {Report}
 */
export function Integer(source) {
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
    let column = current.columnNumber
    let line = current.lineNumber

    return new Report(true, {unexpected, expected, column, line})
  }
}

export function ArrayDimension(source) {
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

export function Word(source) {
  let current = source.current()

  if (current.kind === 'word') {
    source.next()
    return new Report(false, current.text)
  }
  else {
    let unexpected = current.kind
    let expected = 'word'
    let column = current.columnNumber
    let line = current.lineNumber

    return new Report(true, {unexpected, expected, column, line})
  }
}

// crea un patron que busca un token de tipo "kind"
// esta funcion no es una patron, si no que devuelve una funcion que lo es
export function Kind(kind) {
  function KindMatcher (source) {
    let expected_kind = kind
    if (source.current().kind == expected_kind) {
      source.next()
      return {error:false, result:expected_kind}
    }
    else {
      return {error:true, result:{reason:"unexpected-token", expected:expected_kind, unexpected:source.current().kind}}
    }
  }
  return KindMatcher
}

export function VariableDeclaration(source) {
  let variable = {
    name    : '',
    isArray : false,
    dimension:null
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
        variable.isArray = true
        variable.dimension = dimension.result
        if (source.current().kind === 'right-bracket') {
          source.next()
          return new Report(false, variable)
        }
        else {
          let current = source.current()

          let unexpected = current.kind
          let expected   = 'right-bracket'
          let column        = current.columnNumber
          let line          = current.lineNumber

          return new Report(true, {unexpected, expected, column, line})
        }
      }
    }
    else {
      return new Report(false, variable)
    }
  }
}

export function VariableList(source) {
  let variables = []
  let partial_match = false

  let name_report = VariableDeclaration(source)

  if (name_report.error) {
    return name_report
  }
  else {
    variables.push(name_report.result)

    if (source.current().kind === 'comma' && source.peek().kind === 'word') {
      source.next()
      let var_list_match = VariableList(source)

      if (var_list_match.error) {
        return var_list_match
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

export function TypeName(source) {
  let current = source.current()

  if ( isType(current.kind) ) {
    source.next()
    return new Report(false, current.kind)
  }
  else {
    let unexpected = current.kind
    let expected  = ['entero', 'real', 'logico', 'caracter']
    let column        = current.columnNumber
    let line          = current.lineNumber
    let reason          = 'nonexistent-type'

    return new Report(true, {unexpected, expected, column, line, reason})
  }
}

export function IndexExpression(source) {
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

export function Variable(source) {
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
        let column    = current.columnNumber
        let line      = current.lineNumber

        return new Report(true, {unexpected, expected, column, line})
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
        let column        = source.current().columnNumber
        let line          = source.current().lineNumber

        let error = false
        let result = {unexpected, expected, column, line}

        return new Report(error, result)
      }
    }
  }
  else {
    let unexpected = current.kind
    let expected   = ['entero', 'real', 'cadena', 'verdadero', 'falso', '(expresion)']
    let column        = current.columnNumber
    let line          = current.lineNumber

    let error           = true
    let result          = {unexpected, expected, column, line}

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

export function Expression(source) {
  let rpn = queueToRPN(source)

  if (rpn.error) {
    return rpn
  }
  else {
    let tree = RPNtoTree(rpn.result)
    return new Report(false, tree)
  }
}

export function Assignment(source) {

  let variable_match = Variable(source)

  if (variable_match.error === true) {
    return variable_match
  }

  let target = variable_match.result

  let current = source.current()

  if (current.kind === 'assignment') {
    source.next()

    let payload_variable_match = Expression(source)

    if (payload_variable_match.error === true) {
      return payload
    }
    else {
      let payload = payload_variable_match.result
      let data = {action:'assignment', target, payload}
      return new Report(false, data)
    }
  }
  else {
    let unexpected      = source.current().kind
    let expected        = 'assignment'
    let column        = source.current().columnNumber
    let line          = source.current().lineNumber

    let result = {unexpected, expected, column, line}

    return new Report(true, result)
  }
}

export function ArgumentList(source) {
  let args = []
  let exp = Expression(source)

  if (exp.error) {
    return exp
  }
  else {
    args.push(exp.result)

    if (source.current().kind == 'comma') {
      source.next()
      let next_args = ArgumentList(source)
      if (next_args.error) {
        return next_args
      }
      else {
        args = args.concat(next_args.result)
        return new Report(false, args)
      }
    }
    else {
      return new Report(false, args)
    }
  }
}

export function ModuleCall(source) {
  let name = Word(source)

  if (source.current().kind != 'left-par') {
    let current = source.current()
    let unexpected  = current.kind
    let expected    = 'right-par'
    let column    = current.columnNumber
    let line      = current.lineNumber

    return new Report(true, {unexpected, expected, column, line})
  }
  else {
    source.next()
  }

  if (source.current().kind != 'right-par') {

    let args = ArgumentList(source)

    if (args.error) {
      return arguments
    }
    else {
      if (source.current().kind == 'right-par') {
        source.next()
        let data = {
          type:'call',
          args:args.result,
          name:name.result,
          expression_type:'module_call'
        }
        return new Report(false, data)
      }
      else {
        let current = source.current()
        let unexpected  = current.kind
        let expected    = 'right-par'
        let column    = current.columnNumber
        let line      = current.lineNumber

        return new Report(true, {unexpected, expected, column, line})
      }
    }
  }
  else {
    source.next()
    let data = {
      type:'call',
      args:[],
      name:name.result,
      expression_type:'module_call'
    }
    return new Report(false, data)
  }
}

export function NewAssignment(source) {
  let result = {
    type : 'assignment',
    left : null,
    right : null
  }

  let left_hand_match = Variable(source)

  if (left_hand_match.error) {
    return left_hand_match.result
  }

  result.left = left_hand_match.result

  if (source.current().kind !== 'assignment') {
    let current = source.current()
    let unexpected = current.kind
    let expected = '<-'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'bad-assignment-operator'
    return new Report(true, {unexpected, expected, line, column, reason})
  }
  else {
    source.next()
  }

  let right_hand_match = Expression(source)

  if (right_hand_match.error) {
    return right_hand_match.result
  }

  result.right = right_hand_match.result

  return new Report(false, result)
}

export function If(source) {
  let result = {
    type : 'if',
    condition : null,
    true_branch : [],
    false_branch :[]
  }

  if (source.current().kind === 'si') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'si'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-si'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'left-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = '('
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }


  let queue = []
  while ( /right\-par|eof|eol/.test(source.current().kind) === false ) {
    queue.push(source.current())
    source.next()
  }

  let expression_match = Expression(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match.result
  }
  else {
    result.condition = expression_match.result
  }

  if (source.current().kind === 'right-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ')'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'entonces') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'entonces'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-entonces'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  skipWhiteSpace(source)

  while ( /finsi|sino|eof/.test(source.current().kind) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match.result
    }

    result.true_branch.push(statement_match.result)

    skipWhiteSpace(source)
  }

  if (source.current().kind === 'sino') {
    source.next()

    skipWhiteSpace(source)

    while ( /finsi|eof/.test(source.current().kind) === false ) {
      let statement_match = Statement(source)

      if (statement_match.error) {
        return statement_match.result
      }

      result.false_branch.push(statement_match.result)

      skipWhiteSpace(source)
    }
  }

  if (source.current().kind === 'finsi') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'finsi'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-finsi'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'eol') {
    source.next()
  }

  return new Report(false, result)
}

export function While(source) {
  let result = {
    type : 'while',
    condition : null,
    body : []
  }

  if (source.current().kind === 'mientras') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'mientras'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-mientras'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'left-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = '('
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  let queue = []
  while ( /right\-par|eof|eol/.test(source.current().kind) === false ) {
    queue.push(source.current())
    source.next()
  }

  let expression_match = Expression(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match.result
  }
  else {
    result.condition = expression_match.result
  }

  if (source.current().kind === 'right-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ')'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  skipWhiteSpace(source)

  while ( /finmientras|eof/.test(source.current().kind) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match.result
    }

    result.body.push(statement_match.result)

    skipWhiteSpace(source)
  }

  if (source.current().kind === 'finmientras') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'finmientras'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-finmientras'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'eol') {
    source.next()
  }

  return new Report(false, result)
}


// para i <- 0 hasta 5
//  ...
// finpara
//
// 'para' <expresion> 'hasta' <expresion.entera>
//    [<enunciado>]
// 'finpara'
export function For(source) {
  let result = {
    type: 'for',
    counter_init: null,
    last_value: null,
    body: []
  }

  if (source.current().kind === 'para') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'para'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-para'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  let queue = []
  while (source.current().kind !== 'hasta') {
    queue.push(source.current())
    source.next()
  }

  let init_statement = NewAssignment(new TokenQueue(queue))

  if (init_statement.error) {
    return counter_exp
  }

  result.counter_init = init_statement.result

  if (source.current().kind === 'hasta') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'hasta'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-hasta'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  let last_val_exp = Expression(source)

  if (last_val_exp.error) {
    return last_val_exp
  }
  else {
    result.last_value = last_val_exp.result
  }

  skipWhiteSpace(source)

  while ( /finpara|eof/.test(source.current().kind) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match.result
    }

    result.body.push(statement_match.result)

    skipWhiteSpace(source)
  }

  if (source.current().kind === 'finpara') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'finpara'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-finpara'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  skipWhiteSpace(source)

  return new Report(false, result)
}

export function Until(source) {
  let result = {
    type : 'until',
    condition : null,
    body : []
  }

  if (source.current().kind === 'repetir') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'repetir'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-repetir'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  skipWhiteSpace(source)

  // TODO: hacer que "hasta que" sea un solo token ("hastaque")
  while ( /hasta|que|eof/.test(source.current().kind) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match.result
    }

    if (statement_match.result !== null) {
      result.body.push(statement_match.result)
    }

    skipWhiteSpace(source)
  }

  if (source.current().kind === 'hasta') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'hasta'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-hasta'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'que') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'que'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-que'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'left-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = '('
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  let queue = []
  while ( /right\-par|eof|eol/.test(source.current().kind) === false ) {
    queue.push(source.current())
    source.next()
  }

  let expression_match = Expression(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match.result
  }
  else {
    result.condition = expression_match.result
  }

  if (source.current().kind === 'right-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ')'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'eol') {
    source.next()
  }

  return new Report(false, result)
}

export function Statement(source) {
  switch (source.current().kind) {
    case 'word':
      if (source.peek().kind === 'left-par') {
        return ModuleCall(source)
      }
      else {
        return NewAssignment(source)
      }
      break;
    case 'si':
      return If(source)
    case 'mientras':
      return While(source)
    case 'repetir':
      return Until(source)
    case 'para':
      return For(source)
    default: {
      let current = source.current()
      let reason = 'missing-statement'
      let expected = 'variable|funcion|procedimiento|si|mientras|repetir'
      return UnexpectedTokenReport(current, expected, reason)
    }
  }
}

export function MainModule(source) {
  let result = {
    type:'module',
    name:'main',
    body:[]
  }

  if (source.current().kind === 'variables') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'variables'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-variables'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  skipWhiteSpace(source)

  while (/inicio|eof/.test(source.current().kind) === false) {
    let var_declaration_match = DeclarationStatement(source)

    if (var_declaration_match.error) {
      return var_declaration_match
    }
    else {
      result.body.push(var_declaration_match.result)
    }

    skipWhiteSpace(source)
  }

  if (source.current().kind === 'inicio') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'inicio'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-inicio'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  skipWhiteSpace(source)

  while (/fin|eof/.test(source.current().kind) === false) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match
    }
    else {
      result.body.push(statement_match.result)
    }

    skipWhiteSpace(source)
  }

  if (source.current().kind === 'fin') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'fin'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-fin'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'eol') {
    source.next()
  }

  return new Report(false, result)
}

export function FunctionModule (source) {
  let header = concat([
    TypeName,
    Kind('funcion'),
    Word
  ])

  return header(source)
}

export function DeclarationStatement(source) {
  let result = {
    type:'declaration',
    variables:[]
  }

  let type_match = TypeName(source)
  let current_type = null

  if (type_match.error) {
    return type_match
  }
  else {
    current_type = type_match.result
  }

  let variables_match = VariableList(source)

  if (variables_match.error) {
    return variables_match
  }
  else {
    for (let variable of variables_match.result) {
      variable.type = current_type
      result.variables.push(variable)
    }
  }

  let eol_found = false, comma_found = false

  switch (source.current().kind) {
    case 'comma':
      comma_found = true
      break
    case 'eol':
      eol_found = true
      break
    default:
      return UnexpectedTokenReport(source.current(), 'eol|comma', 'unexpected-token-at-declaration')
  }

  source.next()

  if (comma_found) {
    let next_declaration_match = DeclarationStatement(source)

    if (next_declaration_match.error) {
      return next_declaration_match
    }
    else {
      result.variables = [...result.variables, ...next_declaration_match.result.variables]
      return new Report(false, result)
    }
  }

  if (eol_found) {
    return new Report(false, result)
  }
}

export function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind === 'eol') {
    current = source.next()
  }
}

function UnexpectedTokenReport(current_token, expected, reason) {
  let result = {}

  result.unexpected = current_token.kind
  result.line = current_token.lineNumber
  result.column = current_token.columnNumber

  if (expected) {
    result.expected = expected
  }

  if (reason) {
    result.reason = reason
  }

  return new Report(true, result)
}

/**
 * Funcion que, dada una funcion de captura y una fuente devuelve un reporte
 * @param {Function} pattern_matcher Funcion que captura tokens
 */
export function match(pattern_matcher) {
  return {
    from: (source) => {
      return pattern_matcher(source)
    }
  }
}

// concat es una funcion que toma una lista de "patrones" y produce uno nuevo.
// El patron que produce concat falla cuando el primero de sus componentes lo hace
// y devuelve el reporte de dicha falla. Si ninguno de los patrones componentes
// produce un error, se devuelve una lista de los resultados

// match(concat([TypeName, "funcion", Word, ParameterList])).from(source).to([
// 'return_type',
// '_',
// 'name',
// 'parameter_list'
// ])

function concat (func_list) {

  function new_pattern (source) {
    let functions = func_list
    let result = []
    for (let f of functions) {
      let report = f(source)
      if (report.error) {
        return report
      }
      else {
        result.push(report.result)
      }
    }
    return {error:false, result}
  }

  return new_pattern
}
