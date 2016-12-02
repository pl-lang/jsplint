import {bind, mergeObjs} from '../utility/helpers.js'

import * as PI from '../interfaces/ParsingInterfaces'

import * as S1 from '../interfaces/Stage1'

import {IError, ISuccess} from '../interfaces/Utility'

export default function transform (ast: PI.ParsedProgram) : IError<S1.RepeatedVarError[]> | ISuccess<S1.AST> {
  const errors_found: S1.RepeatedVarError[] = [] 

  const new_main = transform_main(ast.main)

  if (new_main.error) {
    errors_found.push(...new_main.result)
  }
  else if (new_main.error == false) {
    const user_modules: {[m:string]: (S1.Function | S1.Procedure)} = {}
    const local_variables: {[m:string]: S1.VariableDict} = {}

    local_variables['main'] = new_main.result.locals

    for (let module_name in ast.user_modules) {
      const old_module = ast.user_modules[module_name]
      const new_module = transform_module(old_module)
      if (new_module.error) {
        errors_found.push(...new_module.result)
      }
      else if (new_module.error == false) {
        user_modules[old_module.name] = new_module.result.new_module
        local_variables[old_module.name] = new_module.result.locals
      }
    }

    const new_ast: S1.AST = {
      modules: {
        main: new_main.result.new_module,
        user_modules: user_modules
      },
      local_variables: local_variables
    }

    if (errors_found.length > 0) {
      return {error:true, result:errors_found}
    }
    else {
      return {error:false, result:new_ast}
    } 
  }
}

function transform_module (old_module: PI.Module) : IError<S1.RepeatedVarError[]> | ISuccess<S1.TransformedModule> {
  switch (old_module.module_type) {
    case 'procedure':
    case 'function':
      return transform_user_module(old_module)
  }
}

function transform_main (old_module: PI.Main) : IError<S1.RepeatedVarError[]> | ISuccess<S1.TransformedMain> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as PI.Declaration[]

   const locals = declare_variables(declarations)

   if (locals.error) {
     return locals
   }
   else {
     const new_module: S1.Main = {
       type: 'module',
       module_type: 'main',
       name: 'main',
       body: old_module.body.filter(statement => statement.type !== 'declaration') as S1.Statement[]
     }
     return {error:false, result:{new_module, locals:locals.result as S1.VariableDict}}
   }
}

function transform_user_module (old_module: PI.Function | PI.Procedure) : IError<S1.RepeatedVarError[]> | ISuccess<S1.TransformedModule> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as PI.Declaration[]

   const locals = declare_variables(declarations)

   if (locals.error) {
     return locals
   }
   else {
     if (old_module.module_type == 'procedure') {
       const new_module: S1.Procedure = {
         type: 'module',
         module_type: 'procedure',
         name: old_module.name,
         body: old_module.body.filter(statement => statement.type !== 'declaration') as S1.Statement[],
         parameters: old_module.parameters,
         return_type: 'ninguno'
       }
       return {error:false, result:{new_module, locals:locals.result as S1.VariableDict}}
     }
     else {
       const new_module: S1.Function = {
         type: 'module',
         module_type: 'function',
         name: old_module.name,
         body: old_module.body.filter(statement => statement.type !== 'declaration') as S1.Statement[],
         parameters: old_module.parameters,
         return_type: old_module.return_type
       }
       return {error:false, result:{new_module, locals:locals.result as S1.VariableDict}}
     }
   }
}

function declare_variables (declarations: PI.Declaration[]) : IError<S1.RepeatedVarError[]> | ISuccess<S1.VariableDict> {
  const repeated_variables: S1.RepeatedVarError[] = []
  const declared_variables: S1.VariableDict = {}

  for (let declaration of declarations) {
    for (let variable of declaration.variables) {
      if (!(variable.name in declared_variables)) {
        if (variable.is_array) {
          const new_array: S1.ArrayVariable = {
            name: variable.name,
            datatype: variable.datatype,
            is_array: true,
            dimensions: variable.dimensions,
            values: new Array(variable.dimensions.reduce((a, b) => a * b))
          }

          declared_variables[new_array.name] = new_array
        }
        else {
          const new_var: S1.RegularVariable = {
            name: variable.name,
            datatype: variable.datatype,
            is_array: false,
            dimensions: variable.dimensions,
            value: null
          }
          declared_variables[new_var.name] = new_var
        }
      }
      else {
        const original = declared_variables[variable.name]

        const error_info: S1.RepeatedVarError = {
          reason: 'repeated-variable',
          name: original.name,
          first_type: original.datatype,
          second_type: variable.datatype
        }

        repeated_variables.push(error_info)
      }
    }
  }

  if (repeated_variables.length > 0) {
    return {error:true, result:repeated_variables}
  }
  else {
    return {error:false, result:declared_variables}
  }
}