'use strict'

let Expression = require('../intermediate/structures/Expression')

let math_operators = new Set([
    'plus'
  , 'minus'
  , 'times'
  , 'power'
])

let integer_operators = new Set([
    'mod'
  , 'div'
])

let comparison_operators = new Set([
    'equal'
  , 'diff-than'
  , 'major-than'
  , 'minor-than'
  , 'major-equal'
  , 'minor-equal'
])

let logical_operators = new Set([
    'and'
  , 'or'
  , 'not'
])

let type_data_by_category = {
  math_operators:{
    supported_types:new Set(['integer', 'float']),
    calculate_return_type: (a, b) => {
      let result = a === 'integer' && b === 'integer' ? 'integer' : 'float'
      return {error:false, result}
    }
  },

  integer_operators:{
    supported_types: new Set(['integer']),
    calculate_return_type: () => ({erro:false, result:'integer'})
  },

  comparison_operators:{
    supported_types:new Set(['integer', 'float', 'character', 'logical']),
    calculate_return_type: (a, b) => {
      let comparable_types = a === 'integer' && b === 'float' || a === 'float' && b === 'integer'
      let equal_types = a === b
      let result = comparable_types || equal_types ? 'logical':null
      let error = result === null ? true:false
      return {error, result}
    }
  },

  logical_operators:{
    supported_types: new Set(['logical']),
    calculate_return_type: () => {
      return {error:false, result:'logical'}
    }
  },

  unary_minus:{
    supported_types:new Set(['integer', 'float']),
    calculate_return_type:a => ({error:false, result:a})
  },

  divide:{
    supported_types:new Set(['float']),
    calculate_return_type: () => ({error:false, result:'float'})
  }
}

function getOperatorInfo(operator) {
  if (math_operators.has(operator))
    return type_data_by_category.math_operators;

  else if (integer_operators.has(operator))
    return type_data_by_category.integer_operators;

  else if (comparison_operators.has(operator))
    return type_data_by_category.comparison_operators;

  else if (logical_operators.has(operator))
    return type_data_by_category.logical_operators;

  else if (operator === 'divide')
    return type_data_by_category.divide;

  else
    return type_data_by_category.unary_minus;
}

// TODO: hacer que tenga en cuenta el tipo de retorno de funciones
function getExpressionReturnType(expression) {
  if (expression.expression_type === 'literal') {
    let error = false
    let result = expression.type
    return {error, result}
  }
  else if (expression.expression_type === 'expression') {
    return getExpressionReturnType(expression.expression)
  }
  else if (expression.expression_type === 'operation') {
    let operator_info = getOperatorInfo(expression.op)

    if (expression.op === 'unary-minus') {
      let type_report = getExpressionReturnType(expression.operand)

      if (type_report.error) {
        return type_report
      }
      else {
        let operand_type = type_report.result
        if (operator_info.supported_types.has(operand_type)) {
          let error = false
          let result = operator_info.calculate_return_type(operand_type)
          return {error, result}
        }
        else {
          let error = true
          let result = {
            reason:'incompatible-operator-types',
            expected:operator_info.supported_types,
            unexpected:operand_type
          }
          return {error, result}
        }
      }
    }
    else {
      let type_a_report = getExpressionReturnType(expression.operands[0])
      let type_b_report = getExpressionReturnType(expression.operands[1])

      if (type_a_report.error || type_b_report.error) {
        // TODO: cual hay q devolver si los dos tienen errores?
        return type_a_report.error ? type_a_report:type_b_report
      }
      else {
        let op_a_type = type_a_report.result
        let op_b_type = type_b_report.result

        if (operator_info.supported_types.has(op_a_type)) {
          if (operator_info.supported_types.has(op_b_type)) {
            let error = false, result = null
            let exp_type_report = operator_info.calculate_return_type(op_a_type, op_b_type)

            if (exp_type_report.error) {
              return exp_type_report
            }
            else {
              result = exp_type_report.result
            }
            return {error, result}
          }
          else {
            let error = true
            let result = {
              reason:'incompatible-operator-types',
              expected:operator_info.supported_types,
              unexpected:op_b_type
            }
            return {error, result}
          }
        }
        else {
          let error = true
          let result = {
            reason:'incompatible-operator-types',
            expected:operator_info.supported_types,
            unexpected:op_a_type,
          }
          return {error, result}
        }
      }
    }
  }
}

class TypeChecker {
  constructor(module_root, module_info, globals, locals) {
    this.module_info = module_info
    this.globals = globals
    this.locals = locals
    this.module_root = module_root
  }

  variableExists(varname) {
    let local_variable = varname in this.locals
    let global_variable = varname in this.globals

    if (local_variable === false && global_variable === false) return false;

    return true
  }

  getVariable(varname) {
    let variable

    if (varname in this.locals) return this.locals[varname];
    else return this.globals[varname];
  }

  typesAreCompatible(target_type, payload_type) {
    if (target_type === payload_type) {
      return true
    } else if (payload_type === 'float' && target_type === 'integer') {
      return true
    } else return false;
  }

  checkAssigmentNodes(module_root) {
    let result = []
    let current_node = module_root

    while (current_node !== null) {
      if (current_node.data.action === 'assigment') {
        let report = validateAssignment(current_node.data)
        if (report.error) {
          result.push(report.result)
        }
      }
      current_node = current_node.getNext()
    }
  }

  validateAssignment(assigment) {
    if (this.variableExists(assigment.target)) {
      let target_type = this.getVariable(assigment.target).type

      let payload_type_report = this.getExpressionReturnType(assigment.payload)

      if (payload_type_report.error) {
        return payload_type_report
      } else {

        let payload_type = payload_type_report.result

        if (!this.typesAreCompatible(target_type, payload_type)) {
          let error = true
          let reason = 'incompatible-types-at-assignment'
          let result = {reason, target_type, payload_type}
          return {error, result}
        }
      }
    } else {
      let error = true
      let reason = 'undefined-variable', result = reason
      // TODO: agregar el nombre de la variable (y el tipo que deberia tener?))
      // al error
      return {error, result}
    }
  }
}
