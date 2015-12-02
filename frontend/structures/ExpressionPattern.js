'use strict'

var Source = require('../Source.js')

let Parser = require('../Parser.js')
let TokenQueue = require('../TokenQueue.js')

function queueFromSource(string) {
  let source = new Source(string)
  let tokenizer = new Parser(source)

  let tokenArray = []
  let t = tokenizer.nextToken()

  while ( t.kind !== 'eof') {
    tokenArray.push(t)
    t = tokenizer.nextToken()
  }
  tokenArray.push(t)

  let q = new TokenQueue(tokenArray)

  return q
}

let LiteralPattern = require('./LiteralPattern')
let BinaryOpPattern = require('./BinaryOpPattern')

class Expression {
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
  static capture(source) {
    let current = source.current()
    let factor_sign = 'plus'

    if (current.kind == 'plus' || current.kind == 'minus') {
      factor_sign = current.kind
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
      let e = Expression.capture(source)
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
    let term = {
      sign  : sign
    }
    let factor = Factor.capture(source)

    if (factor.error) {
      return factor
    }
    else {
      let op = BinaryOpPattern.capture(source)

      if (op.error) {
        term.content = factor.result
        term.expression_type = term.content.expression_type
        return {result:term, error:false}
      }
      else {
        let operands = [factor.result]

        let next_operand = Term.capture(source, 'plus')

        if (next_operand.error) {
          return next_operand
        }
        else {
          if (next_operand.result.expression_type == 'literal') {
            operands.unshift(next_operand.result.content)
          }
          else {
            operands.unshift(next_operand.result)
          }
          term.expression_type = 'operation'
          term.content = {operands:operands, op:op.result, expression_type:'operation'}
          return {result:term, error:false}
        }
      }
    }
  }
}

function getOperandsAndOperators(operation) {
  console.log("OP\n:", operation)
  let result = {operators:[], operands:[]}
  result.operators.push(operation.op)
  for (let operand of operation.operands) {
    if (operand.expression_type == 'operation') {
      let expression_term = operand
      let r = getOperandsAndOperators(expression_term.content)
      // expression_term.content = reorderOperation(r)
      result.operands = result.operands.concat(r.operands)
      result.operators = result.operators.concat(r.operators)
    }
    else {
      result.operands = result.operands.concat(operand)
    }
  }
  return result
}

function reorderOperation(data) {
  // data: operands and operators
  if (data.operators.length > 0) {
    return {expression_type:'operation', op:data.operators.pop(), operands:[data.operands.pop(), reorderOperation(data)]}
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
      if (first_term.result.expression_type == 'operation' && first_term.result.content.op == 'divide') {
        console.log("It's a division!:\n", first_term.result.content, "\n======\n")
        // console.log("operands and operators:\n", getOperandsAndOperators(first_term.result.content))
        // console.log("reordenada:\n", reorderOperation(getOperandsAndOperators(first_term.result.content)))
        let new_op = reorderOperation(getOperandsAndOperators(first_term.result.content))
        console.log("NEW_OP\n:",new_op)
        first_term.result.content = new_op
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

module.exports = Expression
