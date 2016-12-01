import {bind, mergeObjs} from '../utility/helpers.js'

import {ParsedProgram, Module, IMainModule, IDeclarationStatement, ITypedDeclaration, IParameter} from '../interfaces/ParsingInterfaces'

import {IModuleCall , IAssignment , IIf , IWhile , IFor , IUntil, IReturn, IProcedureModule, IFunctionModule} from '../interfaces/ParsingInterfaces'

import {Stage1AST, RepeatedVarError, S1TransformedModule, S1Main, S1Procedure} from '../interfaces/TransformerInterfaces'

import {S1Function, S1Statement, VariableDict, ArrayVariable, RegularVariable} from '../interfaces/TransformerInterfaces'

import {IError, ISuccess} from '../interfaces/Utility'

export default function transform (ast: ParsedProgram) : IError<RepeatedVarError[]> | ISuccess<Stage1AST> {
  const new_ast = {
    modules:{},
    local_variables:{}
  } as Stage1AST

  const errors_found: RepeatedVarError[] = []

  for (let module_name in ast) {
    const module = ast[module_name]
    const report = transform_module(module)
    if (report.error) {
      errors_found.push(...report.result)
    }
    else {
      new_ast.local_variables[module.name] = (report.result as S1TransformedModule).locals
      new_ast.modules[module.name] = (report.result as S1TransformedModule).new_module
    }
  }

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    return {error:false, result:new_ast}
  }
}

function transform_module (old_module: Module) : IError<RepeatedVarError[]> | ISuccess<S1TransformedModule> {
  switch (old_module.module_type) {
    case 'main':
      return transform_main(old_module)
    case 'procedure':
    case 'function':
      return transform_user_module(old_module)
  }
}

function transform_main (old_module: IMainModule) : IError<RepeatedVarError[]> | ISuccess<S1TransformedModule> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as IDeclarationStatement[]

   const locals = declare_variables(declarations)

   if (locals.error) {
     return locals
   }
   else {
     const new_module: S1Main = {
       type: 'module',
       module_type: 'main',
       name: 'main',
       body: old_module.body.filter(statement => statement.type !== 'declaration') as S1Statement[]
     }
     return {error:false, result:{new_module, locals:locals.result as VariableDict}}
   }
}

function transform_user_module (old_module: IFunctionModule | IProcedureModule) : IError<RepeatedVarError[]> | ISuccess<S1TransformedModule> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as IDeclarationStatement[]

   const locals = declare_variables(declarations)

   if (locals.error) {
     return locals
   }
   else {
     if (old_module.module_type == 'procedure') {
       const new_module: S1Procedure = {
         type: 'module',
         module_type: 'procedure',
         name: old_module.name,
         body: old_module.body.filter(statement => statement.type !== 'declaration') as S1Statement[],
         parameters: old_module.parameters
       }
       return {error:false, result:{new_module, locals:locals.result as VariableDict}}
     }
     else {
       const new_module: S1Function = {
         type: 'module',
         module_type: 'function',
         name: old_module.name,
         body: old_module.body.filter(statement => statement.type !== 'declaration') as S1Statement[],
         parameters: old_module.parameters,
         return_type: old_module.return_type
       }
       return {error:false, result:{new_module, locals:locals.result as VariableDict}}
     }
   }
}

function declare_variables (declarations: IDeclarationStatement[]) : IError<RepeatedVarError[]> | ISuccess<VariableDict> {
  const repeated_variables: RepeatedVarError[] = []
  const declared_variables: VariableDict = {}

  for (let declaration of declarations) {
    for (let variable of declaration.variables) {
      if (!(variable.name in declared_variables)) {
        if (variable.is_array) {
          const new_array: ArrayVariable = {
            name: variable.name,
            datatype: variable.datatype,
            is_array: true,
            dimensions: variable.dimensions,
            values: new Array(variable.dimensions.reduce((a, b) => a * b))
          }

          declared_variables[new_array.name] = new_array
        }
        else {
          const new_var: RegularVariable = {
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

        const error_info: RepeatedVarError = {
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