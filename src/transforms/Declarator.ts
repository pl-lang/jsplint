import {Failure, Success, S0, S1, ParsedProgram, Errors} from '../interfaces'

export default function transform (ast: ParsedProgram) : Failure<Errors.RepeatedVar[]> | Success<S1.AST> {
  const errors_found: Errors.RepeatedVar[] = [] 

  const new_main = transform_main(ast.main)

  if (new_main.error) {
    errors_found.push(...new_main.result)
  }
  else if (new_main.error == false) {
    const user_modules: {[m:string]: (S1.Function | S1.Procedure)} = {}
    const local_variables: {main: S1.VariableDict, [m:string]: S1.VariableDict} = {main: new_main.result.locals}

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

  return {error: true, result: errors_found}
}

function transform_module (old_module: S0.Module) : Failure<Errors.RepeatedVar[]> | Success<S1.TransformedModule> {
  switch (old_module.module_type) {
    case 'procedure':
    case 'function':
      return transform_user_module(old_module)
  }
}

function transform_main (old_module: S0.Main) : Failure<Errors.RepeatedVar[]> | Success<S1.TransformedMain> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as S0.Declaration[]

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

function transform_user_module (old_module: S0.Function | S0.Procedure) : Failure<Errors.RepeatedVar[]> | Success<S1.TransformedModule> {
   const declarations = old_module.body.filter(statement => statement.type === 'declaration') as S0.Declaration[]

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

function declare_variables (declarations: S0.Declaration[]) : Failure<Errors.RepeatedVar[]> | Success<S1.VariableDict> {
  const repeated_variables: Errors.RepeatedVar[] = []
  const declared_variables: S1.VariableDict = {}

  for (let declaration of declarations) {
    for (let variable of declaration.variables) {
      if (!(variable.name in declared_variables)) {
        if (variable.is_array) {
          const {name, datatype, dimensions, by_ref} = variable
          declared_variables[name] = {type: 'array', name , datatype , dimensions, by_ref}
        }
        else {
          const {name, datatype, by_ref} = variable
          declared_variables[name] = {type: 'scalar', name , datatype, by_ref}
        }
      }
      else {
        const original = declared_variables[variable.name]

        const error_info: Errors.RepeatedVar = {
          reason: 'repeated-variable',
          name: original.name,
          first_type: original.datatype,
          second_type: variable.datatype,
          where: 'declarator-transform'
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