// este modulo toma un 'modulo' de pl...
/*

modulo = {
  type:'module',
  name:'x',
  body:[]
}

*/

// y lo transforma en:

/*

modulo = {
  type:'module',
  name:'x',
  locals:{}
  body:[]
}

*/

'use strict'

import Report from '../utility/Report.js'

export default function transformAST(ast) {
  let program = {
    modules : []
  }

  let repeated_vars = []

  for (let module of ast.modules) {
    program.modules.push(transform(module))
  }

  return program
}

function transform (module) {
  switch (module.module_type) {
    case 'main':
      return transformMain(module)
    case 'procedure':
      return transformProcedure(module)
    case 'function':
      throw Error(`@Checkable.js: la transformacion de funciones no esta implementada`)
    default:
      throw Error(`@Checkable.js: no se como transfor modulos de tipo ${module.module_type}`)
  }
}

function transformProcedure (module) {
  let parameter_variables = module.parameters.map(p => {return {type:p.type, name:p.name, isArray:false, dimension:null}})

  // HACK: crear un enunciado declaracion con las variables estipuladas en los parametros
  let parameters_declaration = {type:'declaration', variables:parameter_variables}

  let declaration_statements = module.body.filter(statement => statement.type === 'declaration')

  declaration_statements = [parameters_declaration, ...declaration_statements]

  let regular_statements = module.body.filter(statement => statement.type !== 'declaration')

  let variables_by_name = getVariables(declaration_statements).reduce((obj, element) => {obj[element.name] = element; return obj}, {})

  let result = {
    type : 'module',
    module_type:'procedure',
    name : module.name,
    locals : variables_by_name,
    body : regular_statements
  }

  return result
}

function transformMain(module) {
  let declaration_statements = module.body.filter(statement => statement.type === 'declaration')
  let regular_statements = module.body.filter(statement => statement.type !== 'declaration')

  let variables_by_name = getVariables(declaration_statements).reduce((obj, element) => {obj[element.name] = element; return obj}, {})

  let result = {
    type : 'module',
    module_type:'main',
    name : module.name,
    locals : variables_by_name,
    body : regular_statements
  }

  return result
}

function getVariables(declaration_statements) {
  let result = []

  for (let declaration of declaration_statements) {
    for (let variable of declaration.variables) {
      if (variable.isArray) {
        variable.values = new Array(variable.dimension.reduce((a, b) => a * b))
      }
      result.push(variable)
    }
  }

  return result
}

function find (array, test_function) {
  for (let element of array) {
    if (test_function(element) === true) return element;
  }
}
