// based on https://www.lysator.liu.se/c/ANSI-C-grammar-y.html#primary-expression

'use strict'

let precedence_by_op = {
  'or'          : 0   ,
  'and'         : 1   ,
  'equal'       : 2   ,
  'diff-than'   : 3   ,
  'minor-than'  : 4   ,
  'minor-equal' : 5   ,
  'major-than'  : 6   ,
  'major-equal' : 7   ,
  'div'         : 8   ,
  'mod'         : 9   ,
  'power'       : 10  ,
  'times'       : 11  ,
  'divide'      : 12  ,
  'minus'       : 13  ,
  'plus'        : 14
}



function getOperandsAndOperators(operation) {
  let operators = []
  let operands = []
  operators.push(operation.op)
  for (let operand of operation.operands) {
    if (operand.expression_type == 'operation') {
      let r = getOperandsAndOperators(operand)
      operands = operands.concat(r.operands)
      operators = operators.concat(r.operators)
    }
    else {
      operands.push(operand)
    }
  }
  operators = operators.sort((a, b) => {return precedence_by_op[a] > precedence_by_op[b]})
  return {operators, operands}
}

function reorderOperation(data) {
  // data: operands and operators
  if (data.operators.length > 0) {
    let operand = data.operands.shift()
    return {expression_type:'operation', op:data.operators.pop(), operands:[operand, reorderOperation(data)]}
  }
  else {
    return data.operands.pop()
  }
}

class ReorderedExpression {
  static capture(source) {
    let exp = LogicalOrExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else if (exp.result.expression_type == 'operation') {
      console.log("OLD:", getOperandsAndOperators(exp.result))
      let new_op = reorderOperation(getOperandsAndOperators(exp.result))
      return {error:false, result:new_op}
    }
    else {
      return exp
    }
  }
}

class LogicalOrExpression {
  static capture(source) {
    let exp = LogicalAndExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      if (source.current().kind == 'or') {
        op_found = true
        source.next()
      }

      if (op_found) {
        let op = 'or'
        let other_exp = LogicalOrExpression.capture(source)

        if (other_exp.error) {
          return other_exp
        }
        else {
          let expression_type = 'operation'
          let operands = [exp.result, other_exp.result]
          let result = {expression_type, op, operands}
          let error = false
          return {error, result}
        }
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

class LogicalAndExpression {
  static capture(source) {
    let exp = EqualityExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      if (source.current().kind == 'and') {
        op_found = true
        source.next()
      }

      if (op_found) {
        let op = 'and'
        let other_exp = LogicalAndExpression.capture(source)

        if (other_exp.error) {
          return other_exp
        }
        else {
          let expression_type = 'operation'
          let operands = [exp.result, other_exp.result]
          let result = {expression_type, op, operands}
          let error = false
          return {error, result}
        }
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

class EqualityExpression {
  static capture(source) {
    let exp = RelationalExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      let op
      if (source.current().kind == 'equal' || source.current().kind == 'diff-than') {
        op_found = true
        op = source.current().kind
        source.next()
      }

      if (op_found) {
        let other_exp = EqualityExpression.capture(source)

        if (other_exp.error) {
          return other_exp
        }
        else {
          let expression_type = 'operation'
          let operands = [exp.result, other_exp.result]
          let result = {expression_type, op, operands}
          let error = false
          return {error, result}
        }
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

class RelationalExpression {
  static capture(source) {
    let exp = AdditiveExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      let op
      let current = source.current()
      if (current.kind == 'minor-than' || current.kind == 'minor-equal' || current.kind == 'major-than' || current.kind == 'major-equal') {
        op_found = true
        op = current.kind
        source.next()
      }

      if (op_found) {
        let other_exp = RelationalExpression.capture(source)

        if (other_exp.error) {
          return other_exp
        }
        else {
          let expression_type = 'operation'
          let operands = [exp.result, other_exp.result]
          let result = {expression_type, op, operands}
          let error = false
          return {error, result}
        }
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

class AdditiveExpression {
  static capture(source) {
    let exp = MultiplicativeExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      let op
      let current = source.current()
      if (current.kind == 'plus' || current.kind == 'minus') {
        op_found = true
        op = current.kind
        source.next()
      }

      if (op_found) {
        let other_exp = AdditiveExpression.capture(source)

        if (other_exp.error) {
          return other_exp
        }
        else {
          let expression_type = 'operation'
          let operands = [exp.result, other_exp.result]
          let result = {expression_type, op, operands}
          let error = false
          return {error, result}
        }
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

class MultiplicativeExpression {
  static capture(source) {
    let exp = UnaryExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      let op
      let current = source.current()
      if (current.kind == 'times' || current.kind == 'divide' || current.kind == 'mod' || current.kind == 'div' || current.kind == 'power') {
        op_found = true
        op = current.kind
        source.next()
      }

      if (op_found) {
        let other_exp = MultiplicativeExpression.capture(source)

        if (other_exp.error) {
          return other_exp
        }
        else {
          let expression_type = 'operation'
          let operands = [exp.result, other_exp.result]
          let result = {expression_type, op, operands}
          let error = false
          return {error, result}
        }
      }
      else {
        let error = false
        let result = exp.result
        return {error, result}
      }
    }
  }
}

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
    if (current.kind == 'verdadero' || current.kind == 'falso') {
      let error = false
      let expression_type = 'literal'
      let value = current.kind == 'verdadero'
      let type = 'logical'
      let result = {expression_type, value, type}
      source.next()
      return {error, result}
    }
    else if (current.kind == 'integer' || current.kind == 'float' || current.kind == 'string') {
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
      let exp = LogicalOrExpression.capture(source)
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

module.exports = ReorderedExpression
