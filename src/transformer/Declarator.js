import {bind, mergeObjs} from '../utility/helpers.js'

const copy_obj = curry(mergeObjs)({})

import {curry} from 'ramda'

export default function transform (ast) {
  let new_ast = {
    modules:{},
    local_variables:{}
  }

  let errors_found = []

  for (let module_name in ast) {
    let module = ast[module_name]
    let report = transform_module(module)
    if (report.error) errors_found.push(...report.result)
    else {
      new_ast.local_variables[module.name] = report.result.locals
      delete report.result.locals
      new_ast.modules[module.name] = report.result
    }
  }

  let error = errors_found.length > 0

  let result = error ? errors_found:new_ast

  return {error, result}
}

function transform_module (module) {
  switch (module.module_type) {
    case 'main':
      return transform_main(module)
    case 'procedure':
    case 'function':
      return transform_user_module(module)
    default:
      throw Error(`@Declarator.js: no se como transformar modulos de tipo ${module.module_type}`)
  }
}

function transform_main (old_module) {
   let declarations = old_module.body.filter(statement => statement.type === 'declaration')

   let locals = declare_variables(declarations)

   return bind(make_module(old_module), locals)
}

function transform_user_module (old_module) {
   let declarations = old_module.body.filter(statement => statement.type === 'declaration')

   let locals = declare_variables(declarations)

   return bind(make_module(old_module), locals)
}

function declare_variables (declarations) {
  let repeated_variables = []
  let declared_variables = {}

  for (let declaration of declarations) {
    for (let variable of declaration.variables) {
      if (!(variable.name in declared_variables)) {
        let new_var = mergeObjs({}, variable)

        if (new_var.isArray) {
          new_var.values = new Array(new_var.dimension.reduce((a, b) => a * b))
        }
        else {
          new_var.value = null
        }

        declared_variables[new_var.name] = new_var
      }
      else {
        let original = declared_variables[variable.name]

        let error_info = {
          reason: 'repeated-variable',
          name: original.name,
          first: original.type,
          second: variable.type
        }

        repeated_variables.push(error_info)
      }
    }
  }

  let error = repeated_variables.length > 0

  let result = error ? repeated_variables:declared_variables

  return {error, result}
}

const make_module = curry((old_module, locals) => {
  let new_module = copy_obj(old_module)
  new_module.body = old_module.body.filter(statement => statement.type !== 'declaration')
  new_module.locals = locals
  return {error:false, result:new_module}
})

function transform_procedure (module) {

}
