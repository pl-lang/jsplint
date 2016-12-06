'use strict'

import {Variable, RegularVariable, ArrayVariable, VariableDict} from '../interfaces/Stage1'
import {IError as Failure, ISuccess as Success} from '../interfaces/Utility'
import * as S4 from '../interfaces/Program'

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
 * Value
 * representa un valor resultante de una expresion
 */
export type Value = boolean | number | string 

export interface OutOfBounds {
  reason: '@invocation-index-out-of-bounds' | '@assignment-index-out-of-bounds'
  // agregar estas mas adelante 
  // line: number
  // column: number
  name: string
  bad_index: number
  dimensions: number[]
}

export interface Read {
  action: 'read'
  // agregar esto mas adelante
  // type: 'entero' | 'real' | 'caracter' | 'cadena'
}

export interface Write {
  action: 'write',
  value: Value
}

export interface NullAction {
  action: 'none'
}

export interface Paused {
  paused: boolean
}

export type SuccessfulReturn = Success<Read> | Success<Write> | Success<NullAction>

export default class Evaluator {
  private readonly modules: {[p:string]: S4.Module}
  private readonly entry_point: S4.Statement
  private current_statement: S4.Statement
  private current_module: string
  private readonly globals: VariableDict
  private readonly locals: {[p:string]: VariableDict}
  private readonly state: {
    done: boolean
    error: boolean
    value_stack: Value[]
    module_stack: string[]
    statement_stack: S4.Statement[]
    last_report: Failure<OutOfBounds> | SuccessfulReturn | Success<Paused>
    next_statement: S4.Statement
    paused: boolean
  }

  constructor (program: S4.Program) {
    this.entry_point = program.entry_point
    this.modules = program.modules
    this.globals = program.local_variables.main
    this.locals = program.local_variables
    this.current_statement = this.entry_point
    this.current_module = 'main'

    this.state = {
      done: this.entry_point === null ? true:false,
      error: false,
      value_stack: [],
      module_stack: [],
      statement_stack: [],
      last_report: null,
      next_statement: null,
      paused: false
    }
  }

  /**
   * get_locals
   * devuelve las variables locales de un modulo.
   */
  public get_locals (module_name: string) {
    return this.locals[module_name]
  }

  /**
   * get_globals
   * devuelve las variables globales de este evaluador.
   */
  public get_globals() {
    return this.globals
  }

  input (v: Value) {
    /**
     * Esto resume el evaluador en caso de que haya estado en pausa.
     */
    this.state.paused = false
    this.state.value_stack.push(v)
  }

  step2 () : Failure<OutOfBounds> | SuccessfulReturn | Success<Paused> {
    /**
     * El evaluador esta en pausa cuando esta esperando que sea realice alguna lectura.
     */
    if (this.state.paused) {
      return {error: false, result: {paused: true}}
    }

    if (this.state.done || this.state.error || this.state.next_statement === null) {
      return this.state.last_report
    }
    else {
      this.current_statement = this.state.next_statement
    }

    const report = this.evaluate2(this.current_statement)

    this.state.last_report = report

    /**
     * Determinar si se llegó al final del programa.
     */
    if (report.error || this.state.next_statement == null) {
      /**
       * Si hay enunciados en la pila...
       */
      if (this.state.statement_stack.length > 0) {
        let next_statement = this.state.statement_stack.pop()
        /**
         * Buscar un enunciado ejecutable
         */
        while (this.state.statement_stack.length > 0 && next_statement == null) {
          next_statement = this.state.statement_stack.pop()
          this.state.module_stack.pop()
        }
        /**
         * Si hay uno, establecerlo como el siguiente
         */
        if (next_statement == null) {
          this.state.next_statement = next_statement
        }
        else {
          /**
           * Si no, se llego al fin del programa
           */
          this.state.done = true
        }
      }
      else {
        this.state.done = true
      }
    }

    return report
  }

  /**
   * evaluate
   * ejecuta los enunciados y establece el proximo enunciado
   */
  evaluate2 (s: S4.Statement) : Failure<OutOfBounds> | SuccessfulReturn {
    switch (s.kind) {
       case S4.StatementKinds.Plus:
        return this.plus()
       case S4.StatementKinds.Minus:
        return this.minus()
       case S4.StatementKinds.Times:
        return this.times()
       case S4.StatementKinds.Slash:
        return this.divide()
       case S4.StatementKinds.Div:
        return  this.div()
       case S4.StatementKinds.Mod:
        return this.mod()
       case S4.StatementKinds.Power:
        return this.power()
       case S4.StatementKinds.Assign:
        return this.assign(s)
       case S4.StatementKinds.Get:
        return this.get_value(s)
       case S4.StatementKinds.AssignV:
        return this.assignv(s)
       case S4.StatementKinds.GetV:
        return this.getv_value(s)
       case S4.StatementKinds.Push:
        return this.push(s)
       case S4.StatementKinds.Pop:
        return this.pop(s)
       case S4.StatementKinds.Minor:
        return this.less()
       case S4.StatementKinds.MinorEq:
        return this.less_or_equal()
       case S4.StatementKinds.Different:
        return this.different()
       case S4.StatementKinds.Equal:
        return this.equal()
       case S4.StatementKinds.Major:
        return this.greater()
       case S4.StatementKinds.MajorEq:
        return this.greater_or_equal()
       case S4.StatementKinds.Not:
        return this.not()
       case S4.StatementKinds.And:
        return this.and()
       case S4.StatementKinds.Or:
        return this.or()
       case S4.StatementKinds.If:
        return this.if_st(s)
       case S4.StatementKinds.While:
        return this.while_st(s)
       case S4.StatementKinds.Until:
        return this.until_st(s)
       case S4.StatementKinds.UserModuleCall:
        break
       case S4.StatementKinds.ReadCall:
        return this.read(s)
       case S4.StatementKinds.WriteCall:
        return this.write(s)
    }
  }

  private push (s: S4.Push) : Success<NullAction> {
    this.state.value_stack.push(s.value)
    return {error: false, result: {action: 'none'}}
  }

  /**
   * Creo que esta funcion no sirve. No se usa nunca.
   */
  private pop (s: S4.Pop) : Success<NullAction> {
    this.state.value_stack.pop()
    return {error: false, result: {action: 'none'}}
  }

  private assign (s: S4.Assign) : Success<NullAction> {
    const variable = this.get_var(s.varname) as RegularVariable

    variable.value = this.state.value_stack.pop()

    return {error: false, result: {action: 'none'}}
  }

  private get_value (s: S4.Get) : Success<NullAction> {
    const variable = this.get_var(s.varname) as RegularVariable

    this.state.value_stack.push(variable.value)

    return {error: false, result: {action: 'none'}}
  }

  private assignv (s: S4.AssignV) : Failure<OutOfBounds> | Success<NullAction> {
    const indexes = this.pop_indexes(s.total_indexes)
    
    if (this.is_whithin_bounds(indexes, s.dimensions)) {
      /**
       * Calcular indice final y asignar el valor a la variable.
       * 
       * Nota: hay que restarle 1 a cada indice para que inicien en 0
       * (como los indices de JS) y no en 1
       */
      const index = this.calculate_index(indexes.map(i => i-1), s.dimensions)
      const value = this.state.value_stack.pop()
      const variable = this.get_var(s.varname) as ArrayVariable
      variable.values[index] = value
    }
    else {
      const bad_index = this.get_bad_index(indexes, s.dimensions)

      const result: OutOfBounds = {
        bad_index: bad_index,
        dimensions: s.dimensions,
        name: s.varname,
        reason: '@assignment-index-out-of-bounds' 
      }

      return {error: true, result}
    }
  }

  private getv_value (s: S4.GetV) : Failure<OutOfBounds> | Success<NullAction> {
    const indexes = this.pop_indexes(s.total_indexes)
    
    if (this.is_whithin_bounds(indexes, s.dimensions)) {
      /**
       * Calcular indice final y apilar el valor de la variable.
       * 
       * Nota: hay que restarle 1 a cada indice para que inicien en 0
       * (como los indices de JS) y no en 1
       */
      const index = this.calculate_index(indexes.map(i => i-1), s.dimensions)
      const value = this.state.value_stack.pop()
      this.state.value_stack.push(value)
    }
    else {
      const bad_index = this.get_bad_index(indexes, s.dimensions)

      const result: OutOfBounds = {
        bad_index: bad_index,
        dimensions: s.dimensions,
        name: s.varname,
        reason: '@invocation-index-out-of-bounds' 
      }

      return {error: true, result}
    }
  }

  private get_bad_index (indexes: number[], dimensions: number[]) {
    let i = 0
    while (indexes[i] >= 1 && indexes[i] <= dimensions[i]) {
      i++
    }
    return i
  }

  private pop_indexes(amount: number) : number[] {
    const result: number[] = []
    for (let i = 0; i < amount; i++) {
      result.push(this.state.value_stack.pop() as number)
    }

    return result.reverse()
  }

  private get_var (vn: string) : Variable {
    const locals = this.get_locals(this.current_module)
    if (vn in locals) {
      return locals[vn]
    }
    else {
      return this.globals[vn]
    }
  }

  private write (s: S4.WriteCall) : Success<Write> {
    const v = this.state.value_stack.pop()

    return {error: false, result: {action: 'write', value: v}}
  }

  private read (s: S4.ReadCall) : Success<Read> {
    this.state.paused = true
    return {error: false, result: {action: 'read'}}
  }

  private if_st (s: S4.If) : Success<NullAction> {
    const condition_result = this.state.value_stack.pop()

    this.state.next_statement = condition_result ? s.true_branch_entry:s.false_branch_entry

    return {error: false, result: {action: 'none'}}
  }

  private while_st (s: S4.While) : Success<NullAction> {
    const condition_result = this.state.value_stack.pop()

    this.state.next_statement = condition_result ? s.entry_point:s.exit_point

    return {error: false, result: {action: 'none'}}
  }

  private until_st (s: S4.Until) : Success<NullAction> {
    const condition_result = this.state.value_stack.pop()

    this.state.next_statement = !condition_result ? s.entry_point:s.exit_point

    return {error: false, result: {action: 'none'}}
  }

  private times() : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a*b)

    return {error:false, result:{action:'none'}}
  }

  uminus() {
    let a = this.state.value_stack.pop()

    this.state.value_stack.push(-a)
  }

  private power () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(Math.pow(a, b))

    return {error: false, result: {action: 'none'}}
  }

  private div () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push((a - (a % b)) / b)

    return {error: false, result: {action:'none'}}
  }

  private mod () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a % b)

    return {error: false, result: {action:'none'}}
  }

  private divide () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a/b)

    return {error: false, result: {action:'none'}}
  }

  private minus () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a - b)

    return {error: false, result: {action: 'none'}}
  }

  private plus () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a + b)

    return {error: false, result: {action: 'none'}}
  }

  private less () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a < b)

    return {error: false, result: {action: 'none'}}
  }

  private less_or_equal () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a <= b)

    return {error: false, result: {action: 'none'}}
  }

  private greater () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a > b)

    return {error: false, result: {action: 'none'}}
  }

  private greater_or_equal () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a >= b)

    return {error: false, result: {action: 'none'}}
  }

  private equal () : Success<NullAction> {
    const b = this.state.value_stack.pop() as Value
    const a = this.state.value_stack.pop() as Value

    this.state.value_stack.push(a == b)

    return {error: false, result: {action: 'none'}}
  }

  private not () : Success<NullAction> {
    const a = this.state.value_stack.pop() as boolean

    this.state.value_stack.push(!a)

    return {error: false, result: {action: 'none'}}
  }

  private different () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a != b)

    return {error: false, result: {action: 'none'}}
  }

  private and () : Success<NullAction> {
    const b = this.state.value_stack.pop() as boolean
    const a = this.state.value_stack.pop() as boolean

    this.state.value_stack.push(a && b)

    return {error: false, result: {action: 'none'}}
  }

  private or () : Success<NullAction> {
    const b = this.state.value_stack.pop() as boolean
    const a = this.state.value_stack.pop() as boolean

    this.state.value_stack.push(a || b)

    return {error: false, result: {action: 'none'}}
  }

  is_whithin_bounds (indexes: number[], dimensions: number[]) {
    let i = 0

    // NOTE: en las condiciones de abajo sumo 1 porque en index_values se le
    // restó 1 a cada elemento para que sea un indice válido en JS

    while (i < indexes.length) {
      if ((indexes[i]) < 1) {
        return false
      }
      else if ((indexes[i]) > dimensions[i]) {
        return false
      }
      else {
        i++
      }
    }
    return true
  }

  calculate_index (indexes: number[], dimensions: number[]) {
    let result = 0
    let index_amount = indexes.length
    let i = 0

    while (i < index_amount) {
      let term = 1
      let j = i + 1
      while (j < index_amount) {
        term *= dimensions[j]
        j++
      }
      term *= indexes[i]
      result += term
      i++
    }
    return result
  }
}
