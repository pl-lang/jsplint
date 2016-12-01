import {bind, mergeObjs} from '../utility/helpers.js'

import {ParsedProgram, Module, IMainModule, IDeclarationStatement, ITypedDeclaration, IParameter} from '../interfaces/ParsingInterfaces'

import {IModuleCall , IAssignment , IIf , IWhile , IFor , IUntil, IReturn, IProcedureModule, IFunctionModule} from '../interfaces/ParsingInterfaces'

import * as S1 from '../interfaces/Stage1'

import {IError, ISuccess} from '../interfaces/Utility'

export default function transform (ast: ParsedProgram) : IError<S1.RepeatedVarError[]> | ISuccess<S1.AST> {
  const new_ast = {
    modules:{},
    local_variables:{}
  } as S1.AST

  const errors_found: S1.RepeatedVarError[] = []

  for (let module_name in ast) {
    const module = ast[module_name]
    const report = transform_module(module)
    if (report.error) {
      errors_found.push(...report.result)
    }
    else {
      new_ast.local_variables[module.name] = (report.result as S1.TransformedModule).locals
      new_ast.modules[module.name] = (report.result as S1.TransformedModule).new_module
    }
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    return {error:false, result:new_ast}
  }
}

function transform_module (old_module: Module) : IError<S1.RepeatedVarError[]> | ISuccess<S1.TransformedModule> {
  switch (old_module.module_type) {
    case 'main':
      return transform_main(old_module)
    case 'procedure':
    case 'function':
      return transform_user_module(old_module)
  }
}

function transform_main (old_module: IMainModule) : IError<S1.RepeatedVarError[]> | ISuccess<S1.TransformedModule> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as IDeclarationStatement[]

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

function transform_user_module (old_module: IFunctionModule | IProcedureModule) : IError<S1.RepeatedVarError[]> | ISuccess<S1.TransformedModule> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as IDeclarationStatement[]

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
         parameters: old_module.parameters
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

function declare_variables (declarations: IDeclarationStatement[]) : IError<S1.RepeatedVarError[]> | ISuccess<S1.VariableDict> {
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