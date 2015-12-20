'use strict'

let precedence_by_op = {
  '+':0,
  '-':0,
  '*':1,
  '/':1
}

let operators = new Set(Object.getOwnPropertyNames(precedence_by_op))

function infixtoRPN(exp_string) {
  let operator_stack = []
  let operands_stack = []
  let output_stack = []

  let tokens = exp_string.split('')

  while (tokens.length > 0) {
    if (operators.has(tokens[0])) {
      if (operator_stack.length > 0) {
        let current_token = tokens[0]
        let top_operator = operator_stack[operator_stack.length-1]
        let condicion = precedence_by_op[current_token] <= precedence_by_op[top_operator]
        while (operator_stack.length > 0 && condicion) {
          output_stack.push(operator_stack.pop())
          current_token = tokens[0]
          top_operator = operator_stack[operator_stack.length-1]
          condicion = precedence_by_op[current_token] <= precedence_by_op[top_operator]
        }
      }
      operator_stack.push(tokens.shift())
    }
    else {
      output_stack.push(tokens.shift())
    }
  }

  while (operator_stack.length > 0) {
    output_stack.push(operator_stack.pop())
  }

  return output_stack
}

function RPNtoTree(rpn_stack) {
  let last_token = rpn_stack.pop()

  if (operators.has(last_token)) {
    let operator = last_token
    let operands = [RPNtoTree(rpn_stack)]
    operands.unshift(RPNtoTree(rpn_stack))
    return {operator, operands}
  }
  else {
    return last_token
  }
}

console.log(infixtoRPN('2+8/2'))
console.log(RPNtoTree(infixtoRPN('2+8/2')))
