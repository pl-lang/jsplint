import {bind, mergeObjs} from '../utility/helpers.js'

import {curry} from 'ramda'

export default function transform (ast) {
  let new_ast = {
    modules: []
  }

  let errors_found = []

  for (let module of ast.modules) {
    let report = transform_module(module)
    if (report.error) errors_found.push(...report.result)
    else new_ast.modules.push(report.result)
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
      // return transform_procedure(module)
      throw Error(`@Declarator.js: la transformacion de funciones no esta implementada`)
    case 'function':
      throw Error(`@Declarator.js: la transformacion de funciones no esta implementada`)
    default:
      throw Error(`@Declarator.js: no se como transformar modulos de tipo ${module.module_type}`)
  }
}

function transform_main (old_module) {
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
          original_type: original.type,
          repeated_type: variable.type
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
  let new_module = {
    module_type: old_module.module_type,
    type: 'module',
    name: old_module.name,
    locals: locals,
    body: old_module.body.filter(statement => statement.type !== 'declaration')
  }

  return {error:false, result:new_module}
})

function transform_procedure (module) {

}
