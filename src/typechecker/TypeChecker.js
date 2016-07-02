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
  return token_name === 'and' || token_name === 'or' || token_name === 'not' ? true: false
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
  constructor() {
    super(['type-check-started', 'type-error', 'type-check-finished'])
    this.locals_by_module = {
      main : {}
    }
    this.globals = this.locals_by_module.main
    this.current_module_name = ''
  }

  variableExists(varname) {
    let is_local_variable = varname in this.locals_by_module[this.current_module_name]
    let is_global_variable = varname in this.globals

    return is_local_variable || is_global_variable
  }

  /**
   * Busca y devuelve el objeto que representa a una variable especifica
   * @param  {string} varname el nombre de la variable deseada
   * @return {object}         el objeto que representa a la variable
   */
  getVariable(varname) {
    if (varname in this.locals_by_module[this.current_module_name]) {
      return this.locals_by_module[this.current_module_name][varname]
    }
    else {
      return this.globals[varname]
    }
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
  check(program) {
    this.emit('type-check-started')

    for (let module of program.modules) {
      this.current_module_name = module.name
      for (let statement of module.body) {
        this.checkStatement(statement)
      }
    }

    this.emit('type-check-finished')

    // esto elimina todas las variables que fueron registradas
    this.locals_by_module = {main : {}}
    this.globals = this.locals_by_module.main
    this.current_module_name = ''
  }

  checkStatement(statement) {
    switch (statement.type) {
      case 'declaration':
        this.DeclareVariable(statement)
        break
      case 'assignment':
        this.checkAssignment(statement)
        break
      case 'if':
        this.checkIf(statement)
        break
      case 'while':
        this.checkWhile(statement)
        break
      case 'until':
        this.checkUntil(statement)
        break
      case 'for':
        this.checkFor(statement)
        break
      case 'call':
        if (statement.name === 'leer') {
          this.checkLeer(statement)
        }
        break
      default:
        break
    }
  }

  DeclareVariable(declaration) {
    for (let variable of declaration.variables) {
      if (variable.name in this.locals_by_module[this.current_module_name]) {
        let original = this.locals_by_module[this.current_module_name][variable.name]
        let repeated = variable
        this.emit('type-error', {cause:'repeated-variable', original, repeated})
      }
      else {
        this.locals_by_module[this.current_module_name][variable.name] = variable
      }
    }
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
  checkIf (if_statement) {
    let condition_report = this.checkCondition(if_statement.condition)

    if (condition_report.error === true) {
      this.emit('type-error', condition_report.result)
    }

    for (let statement of if_statement.true_branch) {
      this.checkStatement(statement)
    }

    for (let statement of if_statement.false_branch) {
      this.checkStatement(statement)
    }
  }

  /**
   * Revisa un WhileNode en busca de errores
   * @emits TypeChecker#type-error
   * @param {WhileNode} node El nodo en cuestion
   * @return {Report} Si se encontró algun error la propiedad "error" será true
   */
  checkWhile (while_statement) {
    let condition_report = this.checkCondition(while_statement.condition)

    if (condition_report.error === true) {
      this.emit('type-error', condition_report.result)
    }

    for (let statement of while_statement.body) {
      this.checkStatement(statement)
    }
  }

  /**
   * Revisa un UntilNode en busca de errores
   * @emits TypeChecker#type-error
   * @param {UntilNode} node El nodo en cuestion
   * @return {Report} Si se encontró algun error la propiedad "error" será true
   */
  checkUntil (until_statement) {
    let condition_report = this.checkCondition(until_statement.condition)

    if (condition_report.error === true) {
      this.emit('type-error', condition_report.result)
    }

    for (let statement of until_statement.body) {
      this.checkStatement(statement)
    }
  }

  checkFor (for_statement) {
    let counter_var = for_statement.counter_init.left

    let fake_exp = {expression_type: 'invocation', name:counter_var.name, indexes:counter_var.indexes, isArray:counter_var.indexes}

    let type_report = this.getExpressionReturnType(fake_exp)
    // comprobar que el tipo del contador sea 'entero'
    if (type_report.error) {
      this.emit('type-error', type_report.result)
    }
    else {
      if (type_report.result !== 'entero') {
        this.emit('type-error', '@for-counter-must-be-entero')
      }
    }

    let init_value_type = this.getExpressionReturnType(for_statement.counter_init.right)

    // comprobar que el valor que inicializa al contador sea 'entero'
    if (init_value_type.error) {
      this.emit('type-error', init_value_type.result)
    }
    else {
      if (init_value_type.result !== 'entero') {
        this.emit('type-error', '@for-init-value-must-be-entero')
      }
    }

    let last_value_type = this.getExpressionReturnType(for_statement.last_value)

    // comprobar que el valor que debe alcanzar el contador sea 'entero'
    if (last_value_type.error) {
      this.emit('type-error', last_value_type.result)
    }
    else {
      if (last_value_type.result !== 'entero') {
        this.emit('type-error', '@for-last-value-must-be-entero')
      }
    }

    // buscar errores en el cuerpo del bucle
    for (let statement of for_statement.body) {
      this.checkStatement(statement)
    }
  }

  checkLeer(leer_call) {
    for (let argument of leer_call.args) {
      if (argument.expression_type !== 'invocation') {
        let report = {
          cause: '@leer-non-invocation-argument'
          // column
          // line
        }
        this.emit('type-error', report)
      }
      else {
        if (this.variableExists(argument.name) === false) {
          let report = {
            cause: '@leer-variable-doesnt-exist',
            name: argument.name
            // column
            // line
          }
          this.emit('type-error', report)
        }
      }
    }
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
        let cause = 'invalid-type-at-condition'
        let expected = 'logico'
        let unexpected = condition_type.result

        return {error:true, result:{cause, expected, unexpected}}
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
  checkAssignment(assignment) {
    if (this.variableExists(assignment.left.name) === true) {
      let target = this.getVariable(assignment.left.name)

      if (target.isArray === true || assignment.left.isArray === true) {
        let report = this.checkArrayInvocation(target, assignment.left)

        if (report.error === true) {
          this.emit('type-error', report.result)
        }
      }

      let expression_type_report = this.getExpressionReturnType(assignment.right)

      if (expression_type_report.error === true) {
        this.emit('type-error', expression_type_report.result)
      }
      else {
        let payload_data_type = expression_type_report.result

        if (this.typesAreCompatible(target.type, payload_data_type) === false) {
          let cause = 'incompatible-types-at-assignment'
          let target_type = target.type, payload_type = payload_data_type
          let error_info = {cause, target_type, payload_type}
          this.emit('type-error', error_info)
        }
      }

    }
    else {
      this.emit('type-error', {
        cause:'undeclared-variable',
        name:assignment.left.name
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
          let cause = 'non-integer-index', bad_index = i
          return {error:true, result:{cause, bad_index}}
        }
        else {
          if (this.canCheckBounds(invocation_info.indexes) === true) {
            let index_values = invocation_info.indexes.map(index => index.value)
            let i = 0, out_of_bounds_index = false

            while (i < index_values.length && !out_of_bounds_index) {
              if (index_values[i] < 1) {
                let cause = 'index-less-than-one'
                let bad_index = i
                return {error:true, result:{cause, bad_index}}
              }
              else if (index_values[i] > variable.dimension[i]) {
                let cause = 'index-out-of-bounds'
                let bad_index = i
                let expected = variable.dimension[i]
                return {error:true, result:{cause, bad_index, expected}}
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
        let cause = 'dimension-length-diff-than-indexes-length'
        let dimensions = variable.dimension.length
        let indexes = invocation_info.indexes.length

        return {error:true, result:{cause, dimensions, indexes}}
      }
    }
    else {
      let name = invocation_info.name
      if (variable.isArray === true) {
        let cause = 'missing-index'

        return {error:true, result:{cause, name}}
      }
      else {
        let cause = 'var-isnt-array'

        return {error:true, result:{cause, name}}
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
          let cause = 'incompatible-types-at-assignment'
          let result = {cause, target_type, payload_type}
          return {error, result}
        }
        else {
          return {error:false}
        }
      }
    }
    else {
      let error = true
      let cause = 'undefined-variable', result = cause
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
        let cause = 'undefined-variable', result = cause
        return {error, result}
      }
    }
    else if (expression.expression_type === 'expression') {
      return this.getExpressionReturnType(expression.expression)
    }
    else if (expression.expression_type === 'operation' || expression.expression_type === 'unary-operation') {
      let operator_info = getOperatorInfo(expression.op)

      if (expression.op === 'unary-minus' || expression.op === 'not') {
        let type_report = this.getExpressionReturnType(expression.operand)

        if (type_report.error) {
          return type_report
        }
        else {
          let operand_type = type_report.result
          if (includes(operator_info.supported_types, operand_type)) {
            let error = false
            let result = operator_info.calculate_return_type(operand_type).result
            return {error, result}
          }
          else {
            let error = true
            let result = {
              cause:'incompatible-operator-types',
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
                cause:'incompatible-operator-types',
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
              cause:'incompatible-operator-types',
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
