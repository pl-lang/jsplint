'use strict'

const Source = require('../../frontend/Source')
const Parser = require('../../frontend/Parser')
const TokenQueue = require('../TokenQueue')

let precedence_by_op = {
  'or'          : 6  ,
  'and'         : 5  ,
  'equal'       : 4  ,
  'diff-than'   : 4  ,
  'minor-than'  : 3  ,
  'minor-equal' : 3  ,
  'major-than'  : 3  ,
  'major-equal' : 3  ,
  'power'       : 2  ,
  'div'         : 1  ,
  'mod'         : 1  ,
  'times'       : 1  ,
  'divide'      : 1  ,
  'minus'       : 0  ,
  'plus'        : 0
}

let operator_names = new Set(Object.getOwnPropertyNames(precedence_by_op))

class UnaryExpression {
  static capture(source) {
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

    let exp = PrimaryExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      if (op_found) {
        let expression_type = 'unary-operation'
        let operand = exp.result
        let result = {expression_type, op, operand}
        let error = false
        return {error, result}
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

class PrimaryExpression {
  static capture(source) {
    let current = source.current()
    if (current.kind == 'word') {
      if (source.peek().kind != 'left-par') {

        // NOTE: Es necesario requerir VariablePattern acá para evitar que
        // Expression exporte un objeto vacio ( {} )
        //
        // El problema con esto es que se hace una llamada a require cada vez
        // que se usa esta funcion. Esta funcion (PrimaryExpression.capture) se
        // usa cada vez q se debe leer una expresion (al compilar y al ejecutar)
        //
        // No se que impacto tendrá esto en el desempeño.
        //
        // Otra solución es meter los contendiso de VariablePattern en este
        // archivo

        const VariablePattern = require('./VariablePattern')

        let report = VariablePattern.capture(source)

        if (report.error === true) {
          return report
        }

        let name    = report.result.name
        let isArray = report.result.isArray
        let indexes = report.result.indexes

        let error = false
        let expression_type = 'invocation'
        let result = {expression_type, name, isArray, indexes}

        return {error, result}

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
      return {error, result}
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
      return {error, result}
    }
    else if (current.kind == 'left-par') {
      source.next()
      let exp = ExpressionAST.fromQueue(source)
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
          return {error, result}
        }
        else {
          let unexpectedToken = source.current().kind
          let expectedToken   = 'right-par'
          let atColumn        = source.current().columnNumber
          let atLine          = source.current().lineNumber

          let error = false
          let result = {unexpectedToken, expectedToken, atColumn, atLine}

          return {error, result}
        }
      }
    }
    else {
      let unexpectedToken = current.kind
      let expectedToken   = ['entero', 'real', 'cadena', 'verdadero', 'falso', '(expresion)']
      let atColumn        = current.columnNumber
      let atLine          = current.lineNumber

      let error           = true
      let result          = {unexpectedToken, expectedToken, atColumn, atLine}

      return {error, result}
    }
  }
}

class streamToRPN {
  static capture(source) {
    let operator_stack = []
    let output_stack = []

    while ( source.current().kind != 'eol' && source.current().kind != 'eof' && source.current().kind != 'comma' && source.current().kind != 'right-par' && source.current().kind != 'right-bracket') {
      let operand_exp  = UnaryExpression.capture(source)
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

    return {error:false, result:output_stack}
  }
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

class ExpressionAST {
  static fromQueue(source) {
    let rpn = streamToRPN.capture(source)

    if (rpn.error) {
      return rpn
    }
    else {
      let tree = RPNtoTree(rpn.result)
      return {error:false, result:tree}
    }
  }

  static fromString(string) {
    let source = new Source(string)
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let tokenq = new TokenQueue(tokenArray)

    return ExpressionAST.fromQueue(tokenq)
  }
}

module.exports = ExpressionAST
