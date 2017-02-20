'use strict'

import {Failure, Success, S1, S3} from '../interfaces'
import {Value, Errors, Read, Write, NullAction, Paused, SuccessfulReturn} from '../interfaces'
import {Alias, Vector, ValueContainer, Scalar, Frame} from '../interfaces'
import {drop} from '../utility/helpers'

/*
  Un evaluador sirve para ejecutar las acciones/enunciados de un modulo.
  Se crea con la info necesaria para dicha tarea. El retorno de su modulo se
  devuelve a traves de la funcion run.
*/

/*
  Los evaluadores son eliminados cuando terminan de ejecutar su modulo. Son de
  un solo uso.
*/

interface VectorRange {
  from: number[]
  to: number[]
}

interface Range {
  from: number
  to: number
}

export class Evaluator {
  private readonly modules: {[p:string]: S3.Module}
  private readonly entry_point: S3.Statement
  private current_statement: S3.Statement
  private current_module: string
  private readonly frame_templates: {[p:string]: S1.VariableDict}
  private readonly frame_stack: Frame[]
  private readonly state: {
    done: boolean
    value_stack: Value[]
    module_stack: string[]
    statement_stack: S3.Statement[]
    last_report: Failure<Errors.OutOfBounds> | SuccessfulReturn | Success<Paused>
    next_statement: S3.Statement
    next_frame: Frame
    paused: boolean
  }

  constructor (program: S3.Program) {
    this.entry_point = program.entry_point
    this.modules = program.modules
    this.frame_templates = program.local_variables
    this.frame_stack = [this.make_frame('main')]
    this.current_statement = this.entry_point
    this.current_module = 'main'

    this.state = {
      done: this.entry_point === null ? true:false,
      value_stack: [],
      module_stack: [],
      statement_stack: [],
      last_report: {error: false, result: {action: 'none', done: this.entry_point === null ? true:false}},
      next_statement: null,
      next_frame: null,
      paused: false
    }
  }

  /**
   * get_value_stack
   * devuelve la pila de valores
   */
  get_value_stack() {
    return this.state.value_stack
  }

  /**
   * get_locals
   * devuelve las variables locales del modulo en ejecucion.
   */
  get_locals () {
    return this.frame_stack[this.frame_stack.length - 1]
  }

  /**
   * get_globals
   * devuelve las variables globales de este evaluador.
   */
  get_globals() {
    return this.frame_stack[0]
  }

  input (v: Value) {
    /**
     * Esto resume el evaluador en caso de que haya estado en pausa.
     */
    this.state.paused = false
    this.state.value_stack.push(v)
  }

  step () : Failure<Errors.OutOfBounds> | SuccessfulReturn | Success<Paused> {
    /**
     * El evaluador esta en pausa cuando esta esperando que sea realice alguna lectura.
     */
    if (this.state.paused) {
      return {error: false, result: {action: 'paused', done: this.state.done}}
    }

    if (this.state.done) {
      return this.state.last_report
    }

    const report = this.evaluate(this.current_statement)

    this.state.last_report = report

    /**
     * Determinar si la ejecución terminó:
     * Pudo haber terminado porque se llegó al fin del
     * programa o porque hubo un error al evaluar el
     * enunciado anterior.
     */

    if (report.error) {
      this.state.done = true
      return this.state.last_report
    }
    else if (report.error == false) {
      /**
       * Determinar si se llegó al fin del programa.
       * this.state.next_statement ya fue establecido
       * durante la llamada a this.evaluate
       */

      /**
       * Si se llegó al final del modulo actual, desapilar modulos hasta
       * que se encuentre uno que todavia no haya finalizado.
       */
      while (this.state.next_statement == null && this.state.statement_stack.length > 0) {
        this.state.next_statement = this.state.statement_stack.pop()
        this.current_module = this.state.module_stack.pop()
        this.frame_stack.pop()
      }

      /**
       * Si aun despues de desapilar todo se encuentra que no hay
       * un enunciado para ejecutar, se llegó al fin del programa.
       */
      if (this.state.next_statement == null) {
        this.state.done = true
        report.result.done = this.state.done
      }

      this.current_statement = this.state.next_statement

      return report
    } 
  }

  /**
   * evaluate
   * ejecuta los enunciados y establece el proximo enunciado
   */
  private evaluate (s: S3.Statement) : Failure<Errors.OutOfBounds> | SuccessfulReturn {
    /**
     * Bandera que indica si el control del proximo enunciado se cede
     * a la función que lo evalua. Esto es verdadero para las estructuras
     * de control y  para las llamadas a funciones/procedimientos.
     */
    const controls_next = s.kind == S3.StatementKinds.UserModuleCall ||
    s.kind == S3.StatementKinds.If ||
    s.kind == S3.StatementKinds.While ||
    s.kind == S3.StatementKinds.Until ||
    s.kind == S3.StatementKinds.Return;

    if (!controls_next) {
      this.state.next_statement = s.exit_point
    }

    switch (s.kind) {
       case S3.StatementKinds.Plus:
        return this.plus()
       case S3.StatementKinds.Minus:
        return this.minus()
       case S3.StatementKinds.Times:
        return this.times()
       case S3.StatementKinds.Slash:
        return this.divide()
       case S3.StatementKinds.Div:
        return  this.div()
       case S3.StatementKinds.Mod:
        return this.mod()
       case S3.StatementKinds.Power:
        return this.power()
       case S3.StatementKinds.Assign:
        return this.assign(s)
       case S3.StatementKinds.Get:
        return this.get_value(s)
       case S3.StatementKinds.AssignV:
        return this.assignv(s)
       case S3.StatementKinds.GetV:
        return this.getv_value(s)
       case S3.StatementKinds.Push:
        return this.push(s)
       case S3.StatementKinds.Pop:
        return this.pop(s)
       case S3.StatementKinds.Minor:
        return this.less()
       case S3.StatementKinds.MinorEq:
        return this.less_or_equal()
       case S3.StatementKinds.Different:
        return this.different()
       case S3.StatementKinds.Equal:
        return this.equal()
       case S3.StatementKinds.Major:
        return this.greater()
       case S3.StatementKinds.MajorEq:
        return this.greater_or_equal()
       case S3.StatementKinds.Not:
        return this.not()
       case S3.StatementKinds.And:
        return this.and()
       case S3.StatementKinds.Or:
        return this.or()
       case S3.StatementKinds.If:
        return this.if_st(s)
       case S3.StatementKinds.While:
        return this.while_st(s)
       case S3.StatementKinds.Until:
        return this.until_st(s)
       case S3.StatementKinds.UserModuleCall:
        return this.call(s)
       case S3.StatementKinds.ReadCall:
        return this.read(s)
       case S3.StatementKinds.WriteCall:
        return this.write(s)
       case S3.StatementKinds.Return:
        /**
         * Esto termina con la ejecucion de la funcion en curso
         */
        this.state.next_statement = null
        return {error: false, result: {action: 'none', done: this.state.done}}
        case S3.StatementKinds.Concat:
          return this.concat(s)
        case S3.StatementKinds.AssignString:
          return this.assign_string(s)
        case S3.StatementKinds.Alias:
          return this.alias(s)
        case S3.StatementKinds.CopyVec:
          return this.copy_vec_statement(s)
        case S3.StatementKinds.Neg:
          return this.neg()
        case S3.StatementKinds.MakeFrame:
          return this.make_frame_statement(s)
        case S3.StatementKinds.InitV:
          return this.initv(s)
    }
  }

  private initv(s: S3.InitV): Success<NullAction> {
    // obtener el vector donde se copiaran los valores
    const tgt = this.state.next_frame[s.target_name] as Vector

    const tgt_range: Range = {
      from: 0,
      to: this.calculate_index(tgt.dimensions.map(i => i - 1), tgt.dimensions)
    }

    const src_found = this.get_var(s.source.name)

    const src_provided_indexes = this.pop_indexes(s.source.indexes)

    // src: vector del cual se copiaran los valores
    let src: Vector = null

    if (src_found.type == 'alias') {
      const {variable, pre_indexes} = this.resolve_alias(src_found)
      const partial_indexes = this.pad(src_provided_indexes, 1, s.source.dimensions.length)
      const indexes = [...pre_indexes, ...partial_indexes].map(i => i - 1)
      src = variable as Vector

      const src_range: Range = {
        from: this.calculate_index(indexes, src.dimensions),
        to: this.calculate_index(src.dimensions.map(i => i - 1), src.dimensions)
      }

      this.copy_vec(tgt, src, tgt_range, src_range)
    }
    else {
      src = src_found as Vector

      const src_range: Range = {
        from: this.calculate_index(this.pad(src_provided_indexes, 1, s.source.dimensions.length).map(i => i - 1), s.source.dimensions),
        to: this.calculate_index(s.source.dimensions.map(i => i - 1), s.source.dimensions)
      }

      this.copy_vec(tgt, src, tgt_range, src_range)
    }

    return {error: false, result: {done: false, action: 'none'}}
  }

  private make_frame_statement(s: S3.MakeFrame): Success<NullAction> {
    this.state.next_frame = this.make_frame(s.name)
    return {error: false, result: {done: false, action: 'none'}}
  }

  private make_frame(mod_name: string): Frame {
    const templates = this.frame_templates[mod_name]
    const frame: Frame = {}
    for (let name in templates) {
      const template = templates[name]
      const {type, datatype, by_ref} = template
      if (by_ref) {
        frame[name] = {type: 'alias', name: '', indexes: []}
      }
      else {
        if (type == 'array') {
          const values = new Array<Value>((template as S1.ArrayVariable).dimensions.reduce((a, b) => a*b))
          frame[name] = {type: 'vector', dimensions: (template as S1.ArrayVariable).dimensions, values}
        }
        else {
          frame[name] = {type: 'variable', value: null}
        }
      }
    }
    return frame
  }

  private neg(): Success<NullAction> {
    const a = this.state.value_stack.pop() as number
    this.state.value_stack.push(-a)
    return {error: false, result: {done: false, action: 'none'}}
  }

  private pad<A>(a: A[], padder: A, desired_length: number): A[] {
    let padded_copy: A[] = new Array(desired_length)

    for (let i = 0; i < desired_length; i++) {
      if (i < a.length) {
        padded_copy[i] = a[i]
      }
      else {
        padded_copy[i] = padder
      }
    }
    
    return padded_copy
  }

  private copy_vec_statement(s: S3.CopyVec): Success<NullAction> {
    /**
     * Indices provistos para el vector del cual se copian los datos
     */
    const src_provided_indexes = this.pop_indexes(s.source.indexes)

    /**
     * Indices provistos para el vector que recibe los datos
     */
    const tgt_provided_indexes = this.pop_indexes(s.target.indexes)

    const tgt_indexes: VectorRange = {
      from: this.pad(tgt_provided_indexes, 1, s.target.dimensions.length).map(i => i - 1),
      to: [...tgt_provided_indexes, ...drop(s.target.indexes, s.target.dimensions)].map(i => i - 1)
    }

    const src_indexes: VectorRange = {
      from: this.pad(src_provided_indexes, 1, s.source.dimensions.length).map(i => i - 1),
      to: [...src_provided_indexes, ...drop(s.source.indexes, s.source.dimensions)].map(i => i - 1)
    }

    // variables que se usan para saber si se encontró la variable deseada o un alias
    const tgt_found = this.get_var(s.target.name)
    const src_found = this.get_var(s.source.name)

    // variables que se usaran para la asignacion
    let tgt_var: Vector;
    let src_var: Vector;

    // rangos que indican el indice donde inicia la copia y el indice donde termina
    let tgt_range: Range = {from: 0, to: 0}
    let src_range: Range = {from: 0, to: 0}

    // preparar las variables y los rangos
    if (tgt_found.type == 'alias') {
      const {variable, pre_indexes} = this.resolve_alias(tgt_found)
      tgt_var = variable as Vector
      tgt_range.from = this.calculate_index([...pre_indexes, ...tgt_indexes.from], tgt_var.dimensions)
      tgt_range.to = this.calculate_index([...pre_indexes, ...tgt_indexes.to], tgt_var.dimensions)
    }
    else {
      tgt_var = tgt_found as Vector
      tgt_range.from = this.calculate_index(tgt_indexes.from, tgt_var.dimensions)
      tgt_range.to = this.calculate_index(tgt_indexes.to, tgt_var.dimensions)
    }

    if (src_found.type == 'alias') {
      const {variable, pre_indexes} = this.resolve_alias(src_found)
      src_var = variable as Vector
      src_range.from = this.calculate_index([...pre_indexes, ...src_indexes.from], src_var.dimensions)
      src_range.to = this.calculate_index([...pre_indexes, ...src_indexes.to], src_var.dimensions)
    }
    else {
      src_var = src_found as Vector
      src_range.from = this.calculate_index(src_indexes.from, src_var.dimensions)
      src_range.to = this.calculate_index(src_indexes.to, src_var.dimensions)
    }

    this.copy_vec(tgt_var, src_var, tgt_range, src_range)

    return {error: false, result: {done: false, action: 'none'}}
  }

  private copy_vec(tgt: Vector, src: Vector, tgt_range: Range, src_range: Range): Success<NullAction> {
    let counter = 0
    while (tgt_range.from + counter <= tgt_range.to) {
      tgt.values[tgt_range.from + counter] = src.values[src_range.from + counter]
      counter++
    }

    return {error: false, result: {done: false, action: 'none'}}
  }

  private alias (s: S3.Alias): Success<NullAction> {
    const indexes = this.pop_indexes(s.var_indexes)
    const alias = this.state.next_frame[s.local_alias] as Alias
    alias.indexes = indexes
    alias.name = s.varname
    return {error: false, result: {done: false, action: 'none'}}
  }

  private assign_string (s: S3.AssignString): Failure<Errors.OutOfBounds> | Success<NullAction> {
    const v = this.get_var(s.varname) as Vector

    const indexes = this.pop_indexes(s.indexes)
    
    if (this.is_whithin_bounds(indexes, v.dimensions)) {
      const string = this.state.value_stack.pop() as string

      let i = 0;
      const start_index = this.calculate_index([...indexes, 0], v.dimensions)
      while (i < s.length && i < string.length) {
        v.values[start_index + i] = string[i]
        i++
      }

      return {error: false, result: {done: false, action: 'none'}}
    }
    else {
      const bad_index = this.get_bad_index(indexes, v.dimensions)

      const result: Errors.OutOfBounds = {
        bad_index: bad_index,
        dimensions: v.dimensions,
        name: s.varname,
        reason: 'index-out-of-bounds',
        where: 'evaluator',
        done: true
      }

      return {error: true, result} 
    }
  }

  private concat (s: S3.Concat): Success<NullAction> {
    let string: string[] = []
    for (let i = 0; i < s.length; i++) {
      string.unshift(this.state.value_stack.pop() as string)
    }
    this.state.value_stack.push(string.join(''))
    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private push (s: S3.Push) : Success<NullAction> {
    this.state.value_stack.push(s.value)
    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  /**
   * Creo que esta funcion no sirve. No se usa nunca.
   */
  private pop (s: S3.Pop) : Success<NullAction> {
    this.state.value_stack.pop()
    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private assign (s: S3.Assign) : Success<NullAction> {
    const var_found = this.get_var(s.varname)

    // Si no hay alias esta es una asignacion normal
    if (var_found.type != 'alias') {
      const variable = var_found as Scalar

      variable.value = this.state.value_stack.pop()

      return {error: false, result: {action: 'none', done: this.state.done}}
    }
    else {
      const {variable, pre_indexes} = this.resolve_alias(var_found)

      if (pre_indexes.length > 0) {
        const v: Vector = variable as Vector
        const index = this.calculate_index(pre_indexes.map(i => i-1), v.dimensions)
        v.values[index] = this.state.value_stack.pop()
        return {error: false, result: {action: 'none', done: this.state.done}}
      }
      else {
        (variable as Scalar).value = this.state.value_stack.pop()
        return {error: false, result: {action: 'none', done: this.state.done}}
      }
    }
  }

  private get_value (s: S3.Get) : Success<NullAction> {
    const var_found = this.get_var(s.varname)

    // Si no hay alias solo hay que apilar el valor de la variable
    if (var_found.type != 'alias') {
      this.state.value_stack.push((var_found as Scalar).value)

      return {error: false, result: {action: 'none', done: this.state.done}}
    }
    else {
      const {variable, pre_indexes} = this.resolve_alias(var_found)

      if (pre_indexes.length > 0) {
        const v = variable as Vector
        const index = this.calculate_index(pre_indexes.map(i => i - 1), v.dimensions)
        this.state.value_stack.push(v.values[index])
        return {error: false, result: {action: 'none', done: this.state.done}}
      }
      else {
        this.state.value_stack.push((variable as Scalar).value)
        return {error: false, result: {action: 'none', done: this.state.done}}
      }
    }
  }

  private assignv (s: S3.AssignV) : Failure<Errors.OutOfBounds> | Success<NullAction> {
    const var_found = this.get_var(s.varname)


    if (var_found.type != 'alias') {
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
        const variable = this.get_var(s.varname) as Vector
        variable.values[index] = value

        return {error:false, result: {action: 'none', done: false}}
      }
      else {
        const bad_index = this.get_bad_index(indexes, s.dimensions)

        const result: Errors.OutOfBounds = {
          bad_index: bad_index,
          dimensions: s.dimensions,
          name: s.varname,
          reason: 'index-out-of-bounds',
          where: 'evaluator',
          done: true
        }

        return {error: true, result}
      }
    }
    else {
      const {variable, pre_indexes} = this.resolve_alias(var_found)

      /**
       * Los indices usados para asignar el valor al alias (al parametro tomado por referencia)
       */
      const partial_indexes = this.pop_indexes(s.total_indexes)

      const indexes: number[] = [...pre_indexes, ...partial_indexes]
      
      const dimensions = (variable as Vector).dimensions

      if (this.is_whithin_bounds(indexes, dimensions)) {
        const index = this.calculate_index(indexes.map(i => i - 1), dimensions)

        const v: Vector = variable as Vector

        v.values[index] = this.state.value_stack.pop()

        return {error: false, result: {action: 'none', done: false}}
      }
      else {
        const bad_index = this.get_bad_index(partial_indexes, s.dimensions)

        const result: Errors.OutOfBounds = {
          bad_index: bad_index,
          dimensions: s.dimensions,
          name: s.varname,
          reason: 'index-out-of-bounds',
          where: 'evaluator',
          done: true
        }

        return {error: true, result}
      }
    }
  }

  private getv_value (s: S3.GetV) : Failure<Errors.OutOfBounds> | Success<NullAction> {
    const var_found = this.get_var(s.varname)

    if (var_found.type != 'alias') {
      const indexes = this.pop_indexes(s.total_indexes)
      
      if (this.is_whithin_bounds(indexes, s.dimensions)) {
        /**
         * Calcular indice final y asignar el valor a la variable.
         * 
         * Nota: hay que restarle 1 a cada indice para que inicien en 0
         * (como los indices de JS) y no en 1
         */
        const index = this.calculate_index(indexes.map(i => i-1), s.dimensions)
        const variable = this.get_var(s.varname) as Vector
        this.state.value_stack.push(variable.values[index])

        return {error:false, result: {action: 'none', done: false}}
      }
      else {
        const bad_index = this.get_bad_index(indexes, s.dimensions)

        const result: Errors.OutOfBounds = {
          bad_index: bad_index,
          dimensions: s.dimensions,
          name: s.varname,
          reason: 'index-out-of-bounds',
          where: 'evaluator',
          done: true
        }

        return {error: true, result}
      }
    }
    else {
      const {variable, pre_indexes} = this.resolve_alias(var_found)

      /**
       * Los indices usados para asignar el valor al alias (al parametro tomado por referencia)
       */
      const partial_indexes = this.pop_indexes(s.total_indexes)

      const indexes: number[] = [...pre_indexes, ...partial_indexes]
      const dimensions = (variable as Vector).dimensions

      if (this.is_whithin_bounds(indexes, dimensions)) {
        const index = this.calculate_index(indexes.map(i => i - 1), dimensions)
        const v = variable as Vector
        this.state.value_stack.push(v.values[index])

        return {error: false, result: {action: 'none', done: false}}
      }
      else {
        const bad_index = this.get_bad_index(partial_indexes, s.dimensions)

        const result: Errors.OutOfBounds = {
          bad_index: bad_index,
          dimensions: s.dimensions,
          name: s.varname,
          reason: 'index-out-of-bounds',
          where: 'evaluator',
          done: true
        }

        return {error: true, result}
      }
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

  private get_var (vn: string) : ValueContainer | Alias {
    const locals = this.get_locals()
    return vn in locals ? locals[vn]:this.get_globals()[vn]
  }

  private resolve_alias (a: Alias): {variable: ValueContainer, pre_indexes: number[]} {
    /**
     * indice del ante-penultimo frame
     */
    let i = this.frame_stack.length - 2

    // se busca a partir del ante-penultimo porque se que en el ante-ultimo no esta
    // si estuviera get_var nunca hubiera llamado a esta funcion
    
    let var_found = false
    let v: ValueContainer | Alias = a
    let pre_indexes: number[] = []
    while (i >= 0) {
      pre_indexes = [...v.indexes, ...pre_indexes]
      v = this.frame_stack[i][v.name]
      switch (v.type) {
        case 'alias':
        i-- 
        break
        case 'vector':
        case 'variable':
        return {variable: v, pre_indexes}
      }
    }
  }

  private write (s: S3.WriteCall) : Success<Write> {
    const v = this.state.value_stack.pop()

    return {error: false, result: {action: 'write', value: v, done: this.state.done}}
  }

  private call (s: S3.UserModuleCall) : Success<NullAction> {

    this.state.next_statement = this.modules[s.name].entry_point
    this.state.statement_stack.push(this.current_statement.exit_point)
    this.state.module_stack.push(this.current_module)
    this.frame_stack.push(this.state.next_frame)
    this.state.next_frame = null
    this.current_module = s.name

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private read (s: S3.ReadCall) : Success<Read> {
    this.state.paused = true
    return {error: false, result: {action: 'read', type: s.type, name: s.varname,  done: this.state.done}}
  }

  private if_st (s: S3.If) : Success<NullAction> {
    const condition_result = this.state.value_stack.pop()

    this.state.next_statement = condition_result ? s.true_branch_entry:s.false_branch_entry

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private while_st (s: S3.While) : Success<NullAction> {
    const condition_result = this.state.value_stack.pop()

    this.state.next_statement = condition_result ? s.entry_point:s.exit_point

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private until_st (s: S3.Until) : Success<NullAction> {
    const condition_result = this.state.value_stack.pop()

    this.state.next_statement = !condition_result ? s.entry_point:s.exit_point

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private times() : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a*b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private uminus() {
    let a = this.state.value_stack.pop()

    this.state.value_stack.push(-a)
  }

  private power () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(Math.pow(a, b))

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private div () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push((a - (a % b)) / b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private mod () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a % b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private divide () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a/b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private minus () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a - b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private plus () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a + b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private less () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a < b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private less_or_equal () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a <= b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private greater () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a > b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private greater_or_equal () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a >= b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private equal () : Success<NullAction> {
    const b = this.state.value_stack.pop() as Value
    const a = this.state.value_stack.pop() as Value

    this.state.value_stack.push(a == b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private not () : Success<NullAction> {
    const a = this.state.value_stack.pop() as boolean

    this.state.value_stack.push(!a)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private different () : Success<NullAction> {
    const b = this.state.value_stack.pop() as number
    const a = this.state.value_stack.pop() as number

    this.state.value_stack.push(a != b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private and () : Success<NullAction> {
    const b = this.state.value_stack.pop() as boolean
    const a = this.state.value_stack.pop() as boolean

    this.state.value_stack.push(a && b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private or () : Success<NullAction> {
    const b = this.state.value_stack.pop() as boolean
    const a = this.state.value_stack.pop() as boolean

    this.state.value_stack.push(a || b)

    return {error: false, result: {action: 'none', done: this.state.done}}
  }

  private is_whithin_bounds (indexes: number[], dimensions: number[]) {
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

  private calculate_index (indexes: number[], dimensions: number[]) {
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
