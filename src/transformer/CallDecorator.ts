// Esta transformacion agrega a cada llamada de funcion:
//
// -  Su tipo de retorno.
//
// -  Los declaradores de sus parametros.
//
// Si la funcion no existe entonces devuelve un error.
import * as PI from '../interfaces/ParsingInterfaces'

import * as S1 from '../interfaces/Stage1'

import * as S2 from '../interfaces/Stage2'

import {IError, ISuccess} from '../interfaces/Utility'

export default function transform (ast: S1.AST) : IError<S2.Error[]> | ISuccess<S2.AST> {
  const new_ast = {
    modules: {
      main: null,
      user_modules: {}
    },
    local_variables: {}
  } as S2.AST

  const errors_found: S2.Error[] = []

  const new_main = transform_main(ast.modules.main, ast, 'main')

  if (new_main.error) {
    errors_found.push(...new_main.result)
  }
  else {
    new_ast.modules['main'] = new_main.result as S2.Main 
  }

  for (let module_name in ast.modules.user_modules) {
    const old_module = ast.modules[module_name]
    const report = transform_module(old_module, ast, module_name)
    if (report.error) {
      errors_found.push(...report.result)
    }
    else {
      new_ast.modules.user_modules[module_name] = report.result as S2.Module
    }
  }

  new_ast.local_variables = ast.local_variables

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    return {error:false, result:new_ast}
  }
}

function transform_main (old_module: S1.Main, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.Main> {
  const new_body = transform_body(old_module.body, ast, module_name)

  if (new_body.error) {
    return new_body
  }
  else {
    const new_main: S2.Main = {
      type: 'module',
      name: 'main',
      module_type: 'main',
      body: new_body.result as S2.Statement[]
    }

    return {error:false, result:new_main}
  }
}

function transform_module (old_module: S1.Module, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.Module> {
  const new_body = transform_body(old_module.body, ast, module_name)

  if (new_body.error) {
    return new_body
  }
  else {
    if (old_module.module_type == 'function') {
      const new_module: S2.Function = {
        type: 'module',
        module_type: 'function',
        name: old_module.name,
        parameters: old_module.parameters,
        body: new_body.result as S2.Statement[],
        return_type: old_module.return_type
      }

      return {error:false, result:new_module}
    }
    else {
      const new_module: S2.Procedure = {
        type: 'module',
        module_type: 'procedure',
        name: old_module.name,
        parameters: old_module.parameters,
        body: new_body.result as S2.Statement[],
        return_type: 'ninguno'
      }

      return {error:false, result:new_module}
    }
  }
}

function transform_body (statements: S1.Statement[], ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.Statement[]> {
  const errors_found: S2.Error[] = []
  const new_body: S2.Statement[] = []

  for (let statement of statements) {
    const new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) {
      errors_found.push(...new_statement.result)
    }
    else if (new_statement.error == false) {
      new_body.push(new_statement.result)
    }
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else if (errors_found.length == 0) {
    return {error:false, result:new_body}
  }
}

function transform_statement (statement: S1.Statement, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.Statement> {
  switch (statement.type) {
    case 'assignment':
      return transform_assignment(statement, ast, module_name)
    case 'call':
      return transform_call(statement, ast, module_name)
    case 'for':
      return transform_for(statement, ast, module_name)
    case 'until':
    case 'while':
      return transform_loop(statement, ast, module_name)
    case 'if':
      return transform_if(statement, ast, module_name)
    case 'return':
      return transform_return(statement, ast, module_name)
  }
}

function transform_assignment (assignment: PI.Assignment, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.Assignment> {
  const errors_found: S2.Error[] = []

  const variable = transform_invocation(assignment.left, ast, module_name)

  if (variable.error) {
    errors_found.push(...variable.result)
  }

  const payload = transform_expression(assignment.right, ast, module_name)

  if (payload.error) {
    errors_found.push(...payload.result)
  }

  if (errors_found.length == 0) {
    const new_assignment: S2.Assignment = {
      type:'assignment',
      left:variable.result as S2.InvocationInfo,
      right:payload.result as PI.ExpElement[]
    }

    return {error:false, result:new_assignment}
  }
  else {
    return {error:true, result:errors_found}
  }
}

export type SuccesfulCall = ISuccess<S2.ReadCall> | ISuccess<S2.WriteCall> | ISuccess<S2.ModuleCall>

function transform_call (call: PI.Call, ast: S1.AST, module_name: string) : IError<S2.Error[]> | SuccesfulCall {
  // si es la funcion leer, no hay que transformarla
  if (call.name == 'leer') {return {error:false, result: call as S2.ReadCall}}

  const errors_found: S2.Error[] = []

  const args: PI.ExpElement[][] = []

  for (let arg of call.args) {
    const new_arg= transform_expression(arg, ast, module_name)
    if (new_arg.error) {
      errors_found.push(...new_arg.result)
    }
    else if (new_arg.error == false) {
      args.push(new_arg.result)
    }
  }

  let info: IError<S2.UndefinedModule[]> | ISuccess<S1.Module> = null

  if (call.name != 'escribir') {
    info = get_module_info(call.name, ast)

    if (info.error) {
      errors_found.push(...info.result)
    }
  }

  if (errors_found.length > 0) {
    return {error: true, result: errors_found}
  }
  else {
    if (call.name == 'escribir') {
      const new_call: S2.WriteCall = {
        args: args,
        name: 'escribir',
        type: 'call'
      }

      return {error: false, result: new_call}
    }
    else {
      const new_call: S2.ModuleCall = {
        type: 'call',
        args: call.args,
        name: call.name,
        module_type: (info.result as (S1.Function | S1.Procedure)).module_type,
        parameters: (info.result as (S1.Function | S1.Procedure)).parameters,
        return_type: (info.result as (S1.Function | S1.Procedure)).return_type
      }

      return {error:false, result:new_call}
    }
  }
}

function transform_loop (statement: S1.While | S1.Until, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.While | S2.Until> {
  const errors_found: S2.Error[] = []

  const new_condition = transform_expression(statement.condition, ast, module_name)

  if (new_condition.error) {
    errors_found.push(...new_condition.result)
  }

  const new_body = transform_body(statement.body, ast, module_name)

  if (new_body.error) {
    errors_found.push(...new_body.result)
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    if (statement.type == 'while') {
      const new_loop: S2.While = {
        type: statement.type,
        condition: new_condition.result as PI.ExpElement[],
        body: new_body.result as S2.Statement[]
      }
      return {error:false, result:new_loop}
    }
    else {
      const new_loop: S2.Until = {
        type: statement.type,
        condition: new_condition.result as PI.ExpElement[],
        body: new_body.result as S2.Statement[]
      }
      return {error:false, result:new_loop}
    }
  }
}

function transform_if (statement: S1.If, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.If> {
  const errors_found: S2.Error[] = []

  const new_condition = transform_expression(statement.condition, ast, module_name)

  if (new_condition.error) {
    errors_found.push(...new_condition.result)
  }

  const new_true_branch = transform_body(statement.true_branch, ast, module_name)

  if (new_true_branch.error) {
    errors_found.push(...new_true_branch.result)
  }

  const new_false_branch = transform_body(statement.false_branch, ast, module_name)

  if (new_false_branch.error) {
    errors_found.push(...new_false_branch.result)
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    const new_if: S2.If = {
      type: 'if',
      condition: new_condition.result as PI.ExpElement[],
      true_branch: new_true_branch.result as S2.Statement[],
      false_branch: new_false_branch.result as S2.Statement[]
    }

    return {error:false, result:new_if}
  }
}

function transform_for (statement: S1.For, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.For> {
  const errors_found: S2.Error[] = []

  const new_init = transform_assignment(statement.counter_init, ast, module_name)

  if (new_init.error) {
    errors_found.push(...new_init.result)
  }

  const new_goal = transform_expression(statement.last_value, ast, module_name)

  if (new_goal.error) {
    errors_found.push(...new_goal.result)
  }

  const new_body = transform_body(statement.body, ast, module_name)

  if (new_body.error) {
    errors_found.push(...new_body.result)
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    const new_for: S2.For = {
      type: 'for',
      counter_init: new_init.result as S2.Assignment,
      last_value: new_goal.result as PI.ExpElement[],
      body: new_body.result as S2.Statement[]
    }

    return {error:false, result: new_for}
  }
}

function transform_return (ret_statement: PI.Return, ast: S1.AST, module_name: string) : IError<S2.Error[]>  | ISuccess<PI.Return> {
  const exp_returned = transform_expression(ret_statement.expression, ast, module_name)

  if (exp_returned.error) {
    return exp_returned
  }
  else {
    const new_return: PI.Return = {
      type: 'return',
      expression: exp_returned.result as PI.ExpElement[]
    }

    return {error:false, result:new_return}
  }
}

function transform_invocation(invocation: PI.InvocationInfo, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.InvocationInfo> {
  if (invocation.indexes.length == 0) {
    const varinfo = get_variable_info(invocation.name, ast.local_variables, module_name)

    if (varinfo.error) {
      return varinfo
    }
    else if (varinfo.error == false) {
      const new_invocation: S2.InvocationInfo = {
        name: invocation.name,
        is_array: invocation.is_array,
        indexes: invocation.indexes,
        dimensions: varinfo.result.dimensions
      }

      return {error:false, result:new_invocation}
    }
  }
  else {
    const errors_found: S2.Error[] = []
    const new_indexes: PI.ExpElement[][] = []

    for (let index of invocation.indexes) {
      const new_index = transform_expression(index, ast, module_name)
      switch (new_index.error) {
        case true:
          errors_found.push(...new_index.result)
          break
        case false:
          new_indexes.push(new_index.result)

          break
      }
    }

    const varinfo = get_variable_info(invocation.name, ast.local_variables, module_name)

    if (varinfo.error) {
      errors_found.push(...varinfo.result)
    }
    else if (varinfo.error == false) {
      if (errors_found.length == 0) {
        const new_invocation: S2.InvocationInfo = {
          name: invocation.name,
          is_array: invocation.is_array,
          indexes: new_indexes,
          dimensions: varinfo.result.dimensions
        }

        return {error:false, result:new_invocation}
      }
      else {
        return {error: true, result:errors_found}
      }
    }
  }
}

function transform_invocation_exp(invocation: PI.InvocationValue, ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<S2.InvocationValue> {
  if (invocation.indexes.length == 0) {
    const varinfo = get_variable_info(invocation.name, ast.local_variables, module_name)

    if (varinfo.error) {
      return varinfo
    }
    else if (varinfo.error == false) {
      const new_invocation: S2.InvocationValue = {
        type: 'invocation',
        name: invocation.name,
        is_array: invocation.is_array,
        indexes: invocation.indexes,
        dimensions: varinfo.result.dimensions
      }

      return {error:false, result:new_invocation}
    }
  }
  else {
    const errors_found: S2.Error[] = []
    const new_indexes: PI.ExpElement[][] = []

    for (let index of invocation.indexes) {
      const new_index = transform_expression(index, ast, module_name)
      switch (new_index.error) {
        case true:
          errors_found.push(...new_index.result)
          break
        case false:
          new_indexes.push(new_index.result)

          break
      }
    }

    const varinfo = get_variable_info(invocation.name, ast.local_variables, module_name)

    if (varinfo.error) {
      errors_found.push(...varinfo.result)
    }
    else if (varinfo.error == false) {
      if (errors_found.length == 0) {
        const new_invocation: S2.InvocationValue = {
          type: 'invocation',
          name: invocation.name,
          is_array: invocation.is_array,
          indexes: new_indexes,
          dimensions: varinfo.result.dimensions
        }

        return {error:false, result:new_invocation}
      }
      else {
        return {error: true, result:errors_found}
      }
    }
  }
}

function transform_expression (expression: PI.ExpElement[], ast: S1.AST, module_name: string) : IError<S2.Error[]> | ISuccess<PI.ExpElement[]>  {
  const errors_found: S2.Error[] = []
  const output: PI.ExpElement[] = []

  for (let element of expression) {
    let new_element: IError<S2.Error[]> | ISuccess<PI.ExpElement>

    switch (element.type) {
      case 'call':
        new_element = transform_call(element as PI.Call, ast, module_name)
        break
      case 'invocation':
        new_element = transform_invocation_exp(element as PI.InvocationValue, ast, module_name)
      break
      case 'literal':
      case 'operator':
        new_element = {error:false, result:element}
    }


    if (new_element.error) {
      errors_found.push(...new_element.result)
    }
    else if (new_element.error == false) {
      output.push(new_element.result)
    }
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    return {error:false, result:output}
  }
}

function get_module_info (name: string, ast: S1.AST) : IError<S2.UndefinedModule[]> | ISuccess<S1.Module> {
  if ( !(name in ast.modules.user_modules) ) {
    return {error:true, result:[{reason: '@call-undefined-module', name}]}
  }
  else {
    return {error:false, result:ast.modules[name]}
  }
}

function get_variable_info (name: string, variables: {[m:string]: S1.VariableDict}, module_name: string) : IError<S2.UndefinedVariable[]> | ISuccess<S2.VarDimensions> {
  if (name in variables[module_name]) {
    return {error:false, result:{dimensions:variables[module_name][name].dimensions}}
  }
  else if (name in variables['main']) {
    return {error:false, result:{dimensions: variables['main'][name].dimensions}}
  }
  else return {error:true, result:[{reason:'undefined-variable', name}]}
}

function is_builtin (name:string) {
  return name == 'escribir' || name == 'escribir_linea' || name == 'leer'
}
