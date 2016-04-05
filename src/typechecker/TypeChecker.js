'use strict'

// TODO: agregar el nombre de la variable (y el tipo que deberia tener?))
// al error (renglon 170)

// TODO: hacer que tenga en cuenta el tipo de retorno de funciones (renglon 176)

// TODO: agregar el nombre de la variable (y el tipo que deberia tener?))
// al error (renglon 192)

// TODO: cual hay q devolver si los dos tienen errores? (renglon 232)

import { WhileNode, UntilNode, IfNode } from '../parser/ast/Nodes.js'

import Emitter   from '../utility/Emitter.js'

let math_operators = [
    'plus'
  , 'minus'
  , 'times'
  , 'power'
]

function isMathOperator(token_name) {
  switch (token_name) {
    case 'plus':
    case 'minus':
    case 'times':
    case 'power':
      return true
    default:
      return false
  }
}

let integer_operators = [
    'mod'
  , 'div'
]

function isIntegerOperator(token_name) {
  return token_name === 'mod' || token_name === 'div' ? true:false
}

let comparison_operators = [
    'equal'
  , 'diff-than'
  , 'major-than'
  , 'minor-than'
  , 'major-equal'
  , 'minor-equal'
]

function isComparisonOperator(token_name) {
  switch (token_name) {
    case 'equal':
    case 'diff-than':
    case 'major-than':
    case 'minor-than':
    case 'major-equal':
    case 'minor-equal':
      return true
    default:
      return false
  }
}

let logico_operators = [
    'and'
  , 'or'
  , 'not'
]

function isLogicOperator(token_name) {
  return token_name === 'and' || token_name === 'or' || token_name === 'or' ? true: false
}

let type_data_by_category = {
  math_operators:{
    supported_types:['entero', 'real'],
    calculate_return_type: (a, b) => {
      let result = a === 'entero' && b === 'entero' ? 'entero' : 'real'
      return {error:false, result}
    }
  },

  integer_operators:{
    supported_types: ['entero'],
    calculate_return_type: () => ({error:false, result:'entero'})
  },

  comparison_operators:{
    supported_types:['entero', 'real', 'character', 'logico'],
    calculate_return_type: (a, b) => {
      let comparable_types = a === 'entero' && b === 'real' || a === 'real' && b === 'entero'
      let equal_types = a === b
      let result = comparable_types || equal_types ? 'logico':null
      let error = result === null ? true:false
      return {error, result}
    }
  },

  logico_operators:{
    supported_types: ['logico'],
    calculate_return_type: () => {
      return {error:false, result:'logico'}
    }
  },

  unary_minus:{
    supported_types:['entero', 'real'],
    calculate_return_type:a => ({error:false, result:a})
  },

  divide:{
    supported_types:['real'],
    calculate_return_type: () => ({error:false, result:'real'})
  }
}

function getOperatorInfo(operator) {
  if (isMathOperator(operator))
    return type_data_by_category.math_operators;

  else if (isIntegerOperator(operator))
    return type_data_by_category.integer_operators;

  else if (isComparisonOperator(operator))
    return type_data_by_category.comparison_operators;

  else if (isLogicOperator(operator))
    return type_data_by_category.logico_operators;

  else if (operator === 'divide')
    return type_data_by_category.divide;

  else
    return type_data_by_category.unary_minus;
}

function includes(array, target_value) {

  for (let value of array) {
    if (value === target_value) return true;
  }

  return false
}

export default class TypeChecker extends Emitter {
  constructor(module_root, module_info, globals, locals) {
    super(['type-check-started', 'type-error', 'type-check-finished'])
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

  /**
   * Busca y devuelve el objeto que representa a una variable especifica
   * @param  {string} varname el nombre de la variable deseada
   * @return {object}         el objeto que representa a la variable
   */
  getVariable(varname) {
    let variable

    if (varname in this.locals) return this.locals[varname];
    else return this.globals[varname];
  }

  /**
   * Dice si el tipo de una variable es compatible con lo que se le quiere
   * asignar
   * @param  {string} target_type  el tipo de la variable objetvio
   * @param  {string} payload_type el tipo de la expresion que se quiere asignar
   * @return {boolean}              true cuando son compatibles, si no, falso
   */
  typesAreCompatible(target_type, payload_type) {
    if (target_type === payload_type) {
      return true
    } else if (target_type === 'real' && payload_type === 'entero') {
      return true
    } else return false;
  }

  /**
   * Revisa todos los nodos de un programa en busca de errores
   * @emits TypeChecker#type-error
   * @emits TypeChecker#type-check-started
   * @emits TypeChecker#type-check-finished
   * @return {Report} Si se encontró algun error la propiedad "error" será true
   */
  lookForErrors() {
    let current_node = this.module_root

    this.emit('type-check-started')

    while (current_node !== null) {
      this.checkNode(current_node)
      current_node = current_node.getNext()
    }

    this.emit('type-check-finished')
  }

  /**
   * Revisa un nodo en busca de errores
   * @param  {Node|IfNode|WhileNode|UntilNode} node nodo de un programa
   * @emits TypeChecker#type-error
   * @return {void}
   */
  checkNode(node) {
    if (node instanceof IfNode) {
      this.checkIfNode(node)
    }
    else if (node instanceof WhileNode) {
      this.checkWhileNode(node)
    }
    else if (node instanceof UntilNode) {
      this.checkUntilNode(node)
    }
    else if (node.data.action === 'assignment') {
      this.checkAssignment(node.data)
    }
  }

  /**
   * Revisa un IfNode en busca de errores
   * @emits TypeChecker#type-error
   * @param {IfNode} node El nodo en cuestion
   * @return {Report} Si se encontró algun error la propiedad "error" será true
   */
  checkIfNode (node) {
    let condition_report = this.checkCondition(node.data.condition)

    if (condition_report.error === true) {
      this.emit('type-error', condition_report.result)
    }

    let current_node = node.rightBranchNode

    let next_statement = node.getNextStatementNode()

    while (current_node !== next_statement) {
      this.checkNode(current_node)
      current_node = current_node.getNext()
    }

    current_node = node.leftBranchNode
    if (current_node !== null) {
      while (current_node !== next_statement) {
        this.checkNode(current_node)
        current_node = current_node.getNext()
      }
    }

    node.setCurrentBranchTo('next_statement')
  }

  /**
   * Revisa un WhileNode en busca de errores
   * @emits TypeChecker#type-error
   * @param {WhileNode} node El nodo en cuestion
   * @return {Report} Si se encontró algun error la propiedad "error" será true
   */
  checkWhileNode (node) {
    let condition_report = this.checkCondition(node.data.condition)

    if (condition_report.error === true) {
      this.emit('type-error', condition_report.result)
    }

    let current_node = node.loop_body_root

    let next_statement = node.getNextStatementNode()

    while (current_node !== next_statement && current_node !== node) {
      this.checkNode(current_node)
      current_node = current_node.getNext()
    }

    node.setCurrentBranchTo('program_body')

  }

  /**
   * Revisa un UntilNode en busca de errores
   * @emits TypeChecker#type-error
   * @param {UntilNode} node El nodo en cuestion
   * @return {Report} Si se encontró algun error la propiedad "error" será true
   */
  checkUntilNode (node) {
    let condition_report = this.checkCondition(node.data.condition)

    if (condition_report.error === true) {
      this.emit('type-error', condition_report.result)
    }

    node.setCurrentBranchTo('program_body')
  }

  /**
   * Revisa que la expresion de la condicion de una estructura de control sea
   * correcta
   * @param  {expression} condition la condicion de la estructura
   * @return {Report}
   */
  checkCondition(condition) {
    let condition_type = this.getExpressionReturnType(condition)

    if (condition_type.error) {
      return {error:true, result:condition_type.result}
    }
    else {
      if (condition_type.result !== 'logico') {
        let reason = 'invalid-type-at-condition'
        let expected = 'logico'
        let unexpected = condition_type.result

        return {error:true, result:{reason, expected, unexpected}}
      }
      else {
        return {error:false}
      }
    }
  }

  /**
   * Revisa que no haya errores en un enunciado de asignacion dado
   * @param  {object} assignment_data propiedad data de un nodo de asignacion
   * @return {void}
   */
  checkAssignment(assignment_data) {
    if (this.variableExists(assignment_data.target.name) === true) {
      let target = this.getVariable(assignment_data.target.name)

      if (target.isArray === true || assignment_data.target.isArray === true) {
        let report = this.checkArrayInvocation(target, assignment_data.target)

        if (report.error === true) {
          this.emit('type-error', report.result)
        }
      }

      let expression_type_report = this.getExpressionReturnType(assignment_data.payload)

      if (expression_type_report.error === true) {
        this.emit('type-error', expression_type_report.result)
      }
      else {
        let payload_data_type = expression_type_report.result

        if (this.typesAreCompatible(target.type, payload_data_type) === false) {
          let reason = 'incompatible-types-at-assignment'
          let target_type = target.type, payload_type = payload_data_type
          let error_info = {reason, target_type, payload_type}
          this.emit('type-error', error_info)
        }
      }

    }
    else {
      this.emit('type-error', {
        reason:'undeclared-variable',
        name:assignment_data.target.name
      })
    }
  }

  /**
   * Revisa que no haya errores en una invocacion a un arreglo
   * @param  {object} variable        la variable  que se quiere invocar como arreglo
   * @param  {object} invocation_info datos para la invocacion (indices y demas)
   * @return {Report}                 si la propiedad error es true entonces result contiene info sobre el error
   */
  checkArrayInvocation(variable, invocation_info) {
    if (variable.isArray === true && invocation_info.isArray === true) {
      if (variable.dimension.length === invocation_info.indexes.length) {
        let indexes_types = invocation_info.indexes.map(exp => this.getExpressionReturnType(exp)).map(report => report.result)

        let invalid_type_found = false, i = 0

        while (!invalid_type_found && i < indexes_types.length) {
          if (indexes_types[i] !== 'entero') {
            invalid_type_found = true
          }
          else {
            i++
          }
        }

        if (invalid_type_found === true) {
          let reason = 'non-integer-index', bad_index = i
          return {error:true, result:{reason, bad_index}}
        }
        else {
          if (this.canCheckBounds(invocation_info.indexes) === true) {
            let index_values = invocation_info.indexes.map(index => index.value)
            let i = 0, out_of_bounds_index = false

            while (i < index_values.length && !out_of_bounds_index) {
              if (index_values[i] < 1) {
                let reason = 'index-less-than-one'
                let bad_index = i
                return {error:true, result:{reason, bad_index}}
              }
              else if (index_values[i] > variable.dimension[i]) {
                let reason = 'index-out-of-bounds'
                let bad_index = i
                let expected = variable.dimension[i]
                return {error:true, result:{reason, bad_index, expected}}
              }
              i++
            }
            invocation_info.bounds_checked = true
          }
          else {
            invocation_info.bounds_checked = false
          }

          return {error:false}
        }
      }
      else {
        let reason = 'dimension-length-diff-than-indexes-length'
        let dimensions = variable.dimension.length
        let indexes = invocation_info.indexes.length

        return {error:true, result:{reason, dimensions, indexes}}
      }
    }
    else {
      let name = invocation_info.name
      if (variable.isArray === true) {
        let reason = 'missing-index'

        return {error:true, result:{reason, name}}
      }
      else {
        let reason = 'var-isnt-array'

        return {error:true, result:{reason, name}}
      }
    }
  }

  checkAssigmentNodes(module_root) {
    let current_node = module_root

    let error_found = false

    this.emit('type-check-started')

    while (current_node !== null) {
      if (current_node.data.action === 'assignment') {
        let report = this.validateAssignment(current_node.data)
        if (report.error) {
          error_found = true
          this.emit('type-error', report.result)
        }
      }
      current_node = current_node.getNext()
    }

    this.emit('type-check-started')

    return {errof:error_found}

  }

  validateAssignment(assignment) {
    if (this.variableExists(assignment.target.name)) {
      let target = this.getVariable(assignment.target.name)

      let target_type = target.type

      let payload_type_report = this.getExpressionReturnType(assignment.payload)

      if (payload_type_report.error) {
        return payload_type_report
      }
      else {
        let payload_type = payload_type_report.result
        if (!this.typesAreCompatible(target_type, payload_type)) {
          let error = true
          let reason = 'incompatible-types-at-assignment'
          let result = {reason, target_type, payload_type}
          return {error, result}
        }
        else {
          return {error:false}
        }
      }
    }
    else {
      let error = true
      let reason = 'undefined-variable', result = reason
      return {error, result}
    }
  }

  /**
   * Dado un arreglo de indices para un arreglo, revisa si se puede garantizar
   * (antes de ejecutar el programa) que dichos indices estén dentro del rango
   * dado por las dimensiones del arreglo.
   * @param  {[expression]} index_array indices que se usan para acceder al arreglo
   * @return {bool}             true si se puede garantizar, falso si no.
   */
  canCheckBounds(index_array) {
    // La condicion para devolver true es que todas las expresiones dentro del
    // arreglo sean de tipo 'literal'

    for (let exp of index_array) {
      if (exp.expression_type !== 'literal') {
        return false
      }
    }

    return true
  }

  getExpressionReturnType(expression) {
    if (expression.expression_type === 'literal') {
      let error = false
      let result = expression.type
      return {error, result}
    }
    else if (expression.expression_type === 'invocation') {
      if (this.variableExists(expression.name)) {
        let error = false
        let result = this.getVariable(expression.name).type
        return {error, result}
      } else {
        let error = true
        let reason = 'undefined-variable', result = reason
        return {error, result}
      }
    }
    else if (expression.expression_type === 'expression') {
      return this.getExpressionReturnType(expression.expression)
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
          if (includes(operator_info.supported_types, operand_type)) {
            let error = false
            let result = operator_info.calculate_return_type(operand_type)
            return {error, result}
          }
          else {
            let error = true
            let result = {
              reason:'incompatible-operator-types',
              expected:operator_info.supported_types,
              unexpected:operand_type,
              operator:expression.op
            }
            return {error, result}
          }
        }
      }
      else {
        let type_a_report = this.getExpressionReturnType(expression.operands[0])
        let type_b_report = this.getExpressionReturnType(expression.operands[1])

        if (type_a_report.error || type_b_report.error) {
          return type_a_report.error ? type_a_report:type_b_report
        }
        else {
          let op_a_type = type_a_report.result
          let op_b_type = type_b_report.result

          if (includes(operator_info.supported_types, op_a_type)) {
            if (includes(operator_info.supported_types, op_b_type)) {
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
                unexpected:op_b_type,
                operator:expression.op
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
              operator:expression.op
            }
            return {error, result}
          }
        }
      }
    }
  }
}
