'use strict'

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

export default class Evaluator {
  constructor(modules) {
    this._modules = modules

    this._current_node = modules.main.root
    this._current_statement = null
    this._current_module = modules.main

    this._globals = modules.main.locals

    this.getLocals = (module_name) => {
      return this._modules[module_name].locals
    }

    this.getGlobals = () => {
      return this._globals
    }

    this._state = {
      done: modules.main.root === null ? true:false,
      error: false,
      output: null,
      expression_stack: [],
      module_stack: [],
      node_stack: [],
    }
  }

  input(value) {
    this._state.expression_stack.push(value)
  }

  step() {
    if (this._state.done || this._state.error) {
      return {done:this._state.done, error:this._state.error, output:this._state.output}
    }
    else {

      let output


      try {
        output = this.evaluate(this._current_node.data)
      }
      catch (exception) {
        if (exception.name == 'EvaluatorError') {
          output = {error:true, result:exception.info}
        }
        else throw exception;
      }
      finally {}

      this._state.error = output.error
      this._state.output = output.result

      this._current_node = this._current_node.getNext()

      if (this._current_node == null) {
        while (this._current_node == null && this._state.node_stack.length > 0 && this._state.module_stack.length > 0) {
          this._current_node = this._state.node_stack.pop()
          this._current_module = this._state.module_stack.pop()
        }
      }

      if (this._current_node == null) this._state.done = true;

      return {done:this._state.done, error:this._state.error, output:output.result}
    }
  }

  evaluate (statement) {
    switch (statement.action) {
      case 'push':
        this.pushStatement(statement)
        break
      case 'if':
        this.ifStatement(statement)
        break
      case 'while':
        this.whileStatement(statement)
        break
      case 'module_call':
        return this.callStatement(statement)
      case 'dummy':
        throw new Error('Esto no deberia ejecutarse')
      case 'values':
        this.values(statement)
        break
      case 'assign':
        this.assign(statement)
        break
      case 'subscript':
        this.subscript(statement)
        break
      case 'times':
        this.times()
        break
      case 'unary-minus':
        this.uminus()
        break
      case 'division':
        this.division()
        break
      case 'power':
        this.power()
        break
      case 'div':
        this.div()
        break
      case 'mod':
        this.mod()
        break
      case 'divide':
        this.divide()
        break
      case 'minus':
        this.minus()
        break
      case 'plus':
        this.plus()
        break
      case 'minor-than':
        this.less()
        break
      case 'minor-equal':
        this.less_o_equal()
        break
      case 'major-than':
        this.greater()
        break
      case 'major-equal':
        this.greate_or_equal()
        break
      case 'equal':
        this.equal()
        break
      case 'not':
        this.not()
        break
      case 'diff-than':
        this.different()
        break
      case 'and':
        this.and()
        break
      case 'or':
        this.or()
        break
      default:
        throw new Error(`En Evaluator.evaluate --> no se reconoce el enunciado ${statement.action}`)
    }
    return {error:false, result:null}
  }

  pushStatement (statement) {
    this._state.expression_stack.push(statement.value)
  }

  subscript (statement) {
    let variable = this.getVariable(statement.name)

    let indexes = []

    for (let i = 0; i < statement.total_indexes; i++) {
      indexes.unshift(this._state.expression_stack.pop() - 1)
    }

    if (this.indexWithinBounds(indexes, variable.dimension)) {
      let index = this.calculateIndex(indexes, variable.dimension)
      this._state.expression_stack.push(variable.values[index])
    }
    else {
      let result = {
        reason: '@invocation-index-out-of-bounds',
        // index: index_list,
        name: variable.name,
        dimension: variable.dimension
        // line
        // column
      }
      return {error:true, finished:true, result}
    }

    return {error:false, result:null}
  }

  assign (statement) {
    let variable = this.getVariable(statement.varname)

    let new_value = this._state.expression_stack.pop()

    let indexes = []

    for (let i = 0; i < statement.total_indexes; i++) {
      indexes.unshift(this._state.expression_stack.pop() - 1)
    }

    if (statement.bounds_checked || this.indexWithinBounds(indexes, variable.dimension)) {
      let index = this.calculateIndex(indexes, variable.dimension)
      variable.values[index] = new_value
    }
    else {
      let result = {
        reason: '@assignment-index-out-of-bounds',
        // index: index_list,
        name: variable.name,
        dimension: variable.dimension
        // line
        // column
      }
      return {error:true, finished:true, result}
    }

    return {error:false, result:null}
  }

  values (statement) {
    let variable = this.getVariable(statement.name)

    this._state.expression_stack.push(variable.values)
  }

  callStatement (statement) {
    if (statement.name == 'leer') {
      let targer_variable = this.getVariable(statement.variable_name)

      let type = targer_variable.type

      return {error:false, finished:true, result:{action:'read', type}}
    }
    else if (statement.name == 'escribir') {
      let value = this._state.expression_stack.pop()

      return {error:false, finished:true, result:{action:'write', value}}
    }
    else {
      this._state.node_stack.push(this._current_node.getNext())
      this._state.module_stack.push(this._current_module)

      this._current_node = this._modules[statement.name].root
      this._current_module = this._modules[statement.name]

      let args = []

      for (let i = 0; i < statement.total_arguments; i++) {
        args.unshift(this._state.expression_stack.pop())
      }

      for (let i = 0; i < statement.total_arguments; i++) {
        let value = args[i]
        let variable = this.getVariable(this._current_module.parameters[i])

        // HACK: De momento, los parametros de las funciones/procedimientos NO pueden
        // ser arreglos

        variable.values[0] = value
      }

      return {error:false, finished:true, result:null}
    }
  }

  ifStatement (statement) {
    let condition_result = this._state.expression_stack.pop()

    this._current_node.setCurrentBranchTo(condition_result ? 'true_branch':'false_branch')

    return {error:false, finished:true, result:null}
  }

  whileStatement (statement) {
    let condition_result = this._state.expression_stack.pop()

    this._current_node.setCurrentBranchTo(condition_result ? 'loop_body':'program_body')

    return {error:false, finished:true, result:null}
  }

  untilStatement (statement) {
    let condition_result = this._state.expression_stack.pop()

    this._current_node.setCurrentBranchTo(!condition_result ? 'loop_body':'program_body')

    return {error:false, finished:true, result:null}
  }

  getVariable(varname) {
    let current_locals = this.getLocals(this._current_module.name)

    return varname in current_locals ? current_locals[varname]:this._globals[varname]
  }

  times() {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a*b)
  }

  uminus() {
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(-a)
  }

  power () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(Math.pow(a, b))
  }

  div () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push((a - (a % b)) / b)
  }

  mod () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a % b)
  }

  divide () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a/b)
  }

  minus () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a - b)
  }

  plus () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a + b)
  }

  less () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a < b)
  }

  less_o_equal () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a <= b)
  }

  greater () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a > b)
  }

  greate_or_equal () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a >= b)
  }

  equal () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a == b)
  }

  not () {
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(!a)
  }

  different () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a != b)
  }

  and () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a && b)
  }

  or () {
    let b = this._state.expression_stack.pop()
    let a = this._state.expression_stack.pop()

    this._state.expression_stack.push(a || b)
  }

  pushVariableValue (info) {
    let variable = this.getVariable(info.name)

    let indexes = []

    for (let index_expression of info.indexes) {
      let index_value = this.evaluateExpression(index_expression) - 1
      indexes.push(index_value)
    }

    if (info.bounds_checked || this.indexWithinBounds(indexes, variable.dimension)) {

      let index = this.calculateIndex(indexes, variable.dimension)

      this._state.expression_stack.push(variable.values[index])

    }
    else {
      let out_of_bunds_info = this.getBoundsError(index_values, variable.dimension)

      let exception = {name:'EvaluatorError', info:out_of_bunds_info}

      throw exception
    }
  }

  indexWithinBounds (index_values, dimension_lengths) {
    let i = 0

    // NOTE: en las condiciones de abajo sumo 1 porque en index_values se le
    // restó 1 a cada elemento para que sea un indice válido en JS

    while (i < index_values.length) {
      if ((index_values[i] + 1) < 1) {
        return false
      }
      else if ((index_values[i] + 1) > dimension_lengths[i]) {
        return false
      }
      else {
        i++
      }
    }
    return true
  }

  getBoundsError (index_values, dimension_lengths) {
    let i = 0
    while (i < index_values.length) {
      if ((index_values[i] + 1) < 1) {
        this.running = false
        let reason = 'index-less-than-one'
        let bad_index = i
        return {error:true, result:{reason, bad_index}}
      }
      else if ((index_values[i] + 1) > dimension_lengths[i]) {
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
  }

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
