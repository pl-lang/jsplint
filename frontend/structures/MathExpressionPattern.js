'use strict'

const LiteralPattern = require('./LiteralPattern')
const BinaryOpPattern = require('./BinaryOpPattern')

class MathExpression {
  static capture(source) {
    let term_sign = 'plus'
    if (source.current().kind == 'plus' || source.current().kind == 'minus') {
      term_sign = source.current().kind
      source.next()
    }

    let term_list = TermList.capture(source, term_sign)

    if (term_list.error) {
      return term_list
    }
    else if (term_list.error && !sign_found) {
      return {
          result : {
              unexpectedToken : source.current().kind
            , expectedToken   : ['plus', 'minus', 'term-list']
            , atColumn        : source.current().columnNumber
            , atLine          : source.current().lineNumber
            , reason          : 'missing-right-par-at-exp'
          }
        , error  : true
      }
    }
    else {
      return {result:term_list.result, error:false}
    }
  }
}

class Factor {
  static capture(source, sign) {
    let current = source.current()
    let factor_sign = sign

    if (current.kind == 'plus' || current.kind == 'minus') {
      factor_sign = sign == 'plus' ? current.kind:(current.kind == 'minus' ? 'plus':'minus')
      current = source.next()
    }

    if (current.kind == 'integer' || current.kind == 'float' || current.kind == 'string') {
      let f = LiteralPattern.capture(source)
      return {result:{value:f.result.value, type:f.result.type, expression_type:'literal', sign:factor_sign}, error:false}
    }
    // else if (current.kind == 'word') {
    //   // Llamada
    // }
    else if (current.kind == 'left-par') {
      source.next()
      let e = MathExpression.capture(source)
      if (e.error) {
        return e
      }
      else {
        current = source.current()
        if (current.kind == 'right-par') {
          source.next()
          e.result.sign = factor_sign
          return {result:e.result, error:false}
        }
        else {
          return {
              result : {
                  unexpectedToken : source.current().kind
                , expectedToken   : 'right-par'
                , atColumn        : source.current().columnNumber
                , atLine          : source.current().lineNumber
                , reason          : 'missing-right-par-at-exp'
              }
            , error  : true
          }
        }
      }
    }
    else {
      return {
          result : {
              unexpectedToken : source.current().kind
            , expectedToken   : ['number', '(expression)',  'call', 'word']
            , atColumn        : source.current().columnNumber
            , atLine          : source.current().lineNumber
            , reason          : 'unexpected-token-at-exp'
          }
        , error  : true
      }
    }
  }
}

class Term {
  static capture(source, sign) {
    let factor = Factor.capture(source, sign)

    if (factor.error) {
      return factor
    }
    else {
      let op = BinaryOpPattern.capture(source)

      if (op.error) {
        return {result:factor.result, error:false}
      }
      else {
        let operands = [factor.result]

        let next_operand = Term.capture(source, 'plus')

        if (next_operand.error) {
          return next_operand
        }
        else {
          if (next_operand.result.expression_type == 'literal') {
            operands.unshift(next_operand.result)
          }
          else {
            operands.push(next_operand.result)
          }
          return {result:{operands:operands, op:op.result, expression_type:'operation'}, error:false}
        }
      }
    }
  }
}

function getOperandsAndOperators(operation) {
  let result = {operators:[], operands:[]}
  result.operators.push(operation.op)
  for (let operand of operation.operands) {
    if (operand.expression_type == 'operation') {
      let r = getOperandsAndOperators(operand)
      for (let i = 0; i < r.operands.length; i++) {
        result.operands.unshift(r.operands[i])
      }
      for (let i = 0; i < r.operators.length; i++) {
        result.operators.unshift(r.operators[i])
      }
      // result.operands = result.operands.concat(r.operands)
      // result.operators = result.operators.concat(r.operators)
    }
    else {
      result.operands.push(operand)
    }
  }
  return result
}

function reorderOperation(data) {
  // data: operands and operators
  if (data.operators.length > 0) {
    return {expression_type:'operation', op:data.operators.pop(), operands:[reorderOperation(data), data.operands.pop()]}
  }
  else {
    return data.operands.pop()
  }
}

class TermList {
  static capture(source, sign) {
    let first_term = Term.capture(source, sign)

    if (first_term.error) {
      return first_term
    }
    else {
      if (first_term.result.expression_type == 'operation' && first_term.result.op == 'divide') {
        let new_op = reorderOperation(getOperandsAndOperators(first_term.result))
        first_term.result = new_op
      }

      if (source.current().kind != 'plus' && source.current().kind != 'minus') {
        return {result:{terms:[first_term.result], expression_type:'term-list'}, error:false}
      }
      else {
        let term_sign = source.current().kind
        source.next()
        let following_terms = TermList.capture(source, term_sign)
        if (following_terms.error) {
          return following_terms
        }
        else {
          let term_vector = [first_term.result]
          term_vector = term_vector.concat(following_terms.result.terms)

          return {result:{terms:term_vector, expression_type:'term-list'}, error:false}
        }
      }
    }
  }
}

module.exports = MathExpression
