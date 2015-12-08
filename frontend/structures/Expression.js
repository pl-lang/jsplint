// based on https://www.lysator.liu.se/c/ANSI-C-grammar-y.html#primary-expression


'use strict'

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
    let exp = PrimaryExpression.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      let op_found = false
      let op
      let current = source.current()
      if (current.kind == 'times' || current.kind == 'divide' || current.kind == 'mod' || current.kind == 'div') {
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
    else {
      let unexpectedToken = current.kind
      let expectedToken   = ['verdadero', 'falso']
      let atColumn        = current.columnNumber
      let atLine          = current.lineNumber

      let error           = true
      let result          = {unexpectedToken, expectedToken, atColumn, atLine}

      return {error, result}
    }
  }
}

module.exports = LogicalOrExpression
