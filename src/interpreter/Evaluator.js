'use strict'

import Emitter from '../misc/Emitter.js'

import expressionFromString from '../intermediate/expressionFromString.js'

/*
  Un evaluador sirve para ejecutar las acciones/enunciados de un modulo.
  Se crea con la info necesaria para dicha tarea. El retorno de su modulo se
  devuelve a traves de la funcion run.
*/

/*
  Los evaluadores son eleiminados cuando terminan de ejecutar su modulo. Son de
  un solo uso.
*/

/**
 * Eventos que emite:
 * 	- read
 * 	- write
 * 	- evaluation-error
 * 	- module-call
 */

export default class Evaluator extends Emitter {
  constructor(globals, locals, body_root_node, modules_info ) {
    super(['read', 'write', 'evaluation-error'])
    this.globals = globals
    this.locals = locals
    this.current_node = body_root_node
    this.modules_info = modules_info
    this.error = false
    this.return_value = null // para mas adelante
    this.running = true
  }

  /**
   * Funcion que ejecuta un programa
   * @return {[type]} [description]
   */
  run() {

    while (this.current_node !== null && this.running) {

      let statement = this.current_node.data

      switch (statement.action) {
        case  'assignment':
        this.assignToVar(statement.target, statement.payload)
        break

        case  'module_call':
        if (statement.name == 'escribir') {
          this.writeCall(statement)
        }
        else if (statement.name == 'leer') {
          this.sendReadEvent(statement)
        }
        break

        case 'if':{
          let branch_name = this.evaluateExp(statement.condition) ? 'true_branch':'false_branch'
          this.current_node.setCurrentBranchTo(branch_name)
        }
        break

        case 'repeat': {
          let branch_name = !this.evaluateExp(statement.condition) ? 'loop_body':'program_body'
          this.current_node.setCurrentBranchTo(branch_name)
        }
        break

        case 'while': {
          let branch_name = this.evaluateExp(statement.condition) ? 'loop_body':'program_body'
          this.current_node.setCurrentBranchTo(branch_name)
        }
        break
      }

      this.current_node = this.current_node.getNext()
    }

    // TODO: hacer que esta funcion reporte error:true cuando ocurran errores de evaluacion
    return {error:this.error}
  }

  writeCall(call) {
    let value_list = call.args.map((expression) => {
      return this.evaluateExp(expression, expression.expression_type)
    })

    this.emit('write', value_list)
  }

  sendReadEvent(call) {
    let varname_list = call.args

    this.emit('read', varname_list)

    // pausar la ejecucion (hasta q se reciban los datos de la lectura)
    this.running = false
  }

  /**
   * Asigna el resultado de una expresión a una variable o a un elemento de un
   * arreglo.
   * @param  {[type]} target_info [description]
   * @param  {[type]} expression  [description]
   * @return {[type]}             [description]
   */
  assignToVar(target_info, expression) {
    let target_variable = this.getVariable(target_info.name)

    if (target_info.isArray === true) {
      let index_list = target_info.indexes.map(expression => this.evaluateExp(expression) - 1)

      if (target_info.bounds_checked === false)  {
        let bound_check = this.indexWithinBounds(index_list, target_variable.dimension)
        if (bound_check.error === true) {
          this.running = false
          this.emit('evaluation-error', bound_check.result)
          return
        }
      }
      // NOTE: Por ahora, no se revisa si hay un error al evaluar un indice

      let index = this.calculateIndex(target_info.indexes.map(a => this.evaluateExp(a) - 1), target_variable.dimension)
      target_variable.values[index] = this.evaluateExp(expression)
    }
    else {
      target_variable.value = this.evaluateExp(expression)
    }

    // Por ahora...
    return {error:false}
  }

  /**
   * Crea expresiones con los resultados de una lectura, las evalua, y las asigna
   * a la variable/elemento de arreglo correspondiente.
   * @param  {[type]} varname_list [description]
   * @param  {[type]} data_list    [description]
   * @return {[type]}              [description]
   */
  assignReadData(varname_list, data_list) {
    let error = 0
    let i = 0
    while (i < varname_list.length && !error) {
      // TODO: mover el parseo de la expreson al compilador
      let exp = expressionFromString(data_list[i])

      if (exp.error) {
        // TODO
      }
      else {
        // NOTE: assignToVar debe chequear los tipos
        let assignment_report = this.assignToVar(varname_list[i], exp.result)
      }

      i++
    }

    // Si no hubo un error durante la lectura poner running en verdadero
    // para que el evaluador pueda ser reanudado
    if (!error) {
      this.running = true
    }
  }

  /**
   * Delega la evaluación de una expresión a la función apropiada según el tipo
   * de dicha expresión
   * @param  {object} exp una expresión
   * @return {bool|number|string}     el resultado de la evaluación de la expresión
   */
  evaluateExp(exp) {
    switch (exp.expression_type) {
      case 'invocation':{
        let invocation = exp
        return this.getValue(invocation)
      }
      case  'literal':
        return exp.value
      case  'operation':
        return this.evaluateOperation(exp)
      case  'unary-operation':
        return this.evaluateUnaryOperation(exp)
      case  'expression':
        return this.evaluateExp(exp.expression)
    }
  }

  /**
   * Obtiene y devuelve el valor de una variable
   * @param  {invocation}  info una expresión de invocación con los datos necesarios para acceder a la variable
   * @return {number|string|boolean}          valor de la variable
   */
  getValue(info) {
    let variable = this.getVariable(info.name)

    // NOTE: No se chequea que indexes exista porque si no existiera (si el usuario
    // no lo hubiera escrito) no se hubiera llegado a este punto ya que el
    // TypeChecker se hubiera dado cuenta.

    if (variable.isArray) {
      let index_values = info.indexes.map(expression => this.evaluateExp(expression) - 1)

      if (info.bounds_checked === false) {
        let bound_check = this.indexWithinBounds(index_values, variable.dimension)

        if (bound_check.error === true) {
          this.running = false
          this.emit('evaluation-error', bound_check.result)
        }
      }

      let index = this.calculateIndex(index_values, variable.dimension)
      if (variable.values[index] === undefined) {
        this.running = false
        this.emit('evaluation-error')
      }
      else {
        return variable.values[index]
      }
    }
    else {
      if (variable.value === null) {
        this.running = false
        this.emit('evaluation-error')
      }
      else {
        return variable.value
      }
    }
  }

  /**
   * Evalua operaciones binarias
   * @param  {object} exp una expresión de tipo 'operation'
   * @return {number|bool|string}     el resultado de la evaluación de la expresión
   */
  evaluateOperation(exp) {
    let operand_a = this.evaluateExp(exp.operands[0])
    let operand_b = this.evaluateExp(exp.operands[1])
    switch (exp.op) {
      case  'plus':
      return operand_a + operand_b

      case  'minus':
      return operand_a - operand_b

      case  'times':
      return operand_a * operand_b

      case  'divide':
      return operand_a / operand_b

      case  'div':
      return (operand_a - (operand_a % operand_b)) / operand_b

      case  'mod':
      return operand_a % operand_b

      case  'power':
      return Math.pow(operand_a, operand_b)

      case 'equal':
        return operand_a === operand_b

      case 'diff-than':
        return operand_a != operand_b

      case 'minor-than':
        return operand_a < operand_b

      case 'major-than':
        return operand_a > operand_b

      case 'minor-equal':
        return operand_a <= operand_b

      case 'major-equal':
        return operand_a >= operand_b

      case 'and':
        return operand_a && operand_b

      case 'or':
        return operand_a || operand_b
    }
  }

  /**
   * Evalúa una expresión unaria
   * @param  {object} exp una expresión de tipo 'unary-operation'
   * @return {number|bool}     El resultado de la evaluación de la expresión
   */
  evaluateUnaryOperation(exp) {
    let operand = this.evaluateExp(exp.operand)

    switch (exp.op) {
      case 'unary-minus':
      return (-1)*operand

      case 'not':
      return !operand
    }
  }

  /**
   * Dice si un juego de indices dados se encuentra dentro de los límites de un arreglo
   * @param  {[int]} index_values       indices para acceder al arreglo
   * @param  {[int]} dimensions_lengths longitud de cada dimensión del arreglo
   * @return {bool}                    true si ningún índice está fuera de límite, si no falso
   */
  indexWithinBounds(index_values, dimensions_lengths) {
    let i = 0

    // NOTE: en las condiciones de abajo sumo 1 porque en index_values se le
    // restó 1 a cada elemento para que sea un indice válido en JS

    while (i < index_values.length) {
      if ((index_values[i] + 1) < 1) {
        this.running = false
        let reason = 'index-less-than-one'
        let bad_index = i
        return {error:true, result:{reason, bad_index}}
      }
      else if ((index_values[i] + 1) > dimensions_lengths[i]) {
        out_of_bounds_index = true
        let reason = 'index-out-of-bounds'
        let bad_index = i
        let expected = variable.dimension[i]
        return {error:true, result:{reason, bad_index, expected}}
      }
      else {
        i++
      }
    }

    return {error:false}
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
   * Calcula el indice en un vector que representa a un arreglo multi-dimensional
   * @param  {int[]} index_array indice del elemento en el arreglo
   * @param  {int[]} dimensions  tamaño de las dimensiones del arreglo
   * @return {int}             indice del elemento del arreglo en el vector
   */
  calculateIndex(index_array, dimensions) {
    let result = 0
    let index_amount = index_array.length
    let i = 0

    while (i < index_amount) {
      let term = 1
      let j = i + 1
      while (j < index_amount) {
        term *= dimensions[j]
        j++
      }
      term *= index_array[i]
      result += term
      i++
    }

    return result
  }
}