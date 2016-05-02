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

function transform(module) {
  let declaration_statements = module.body.filter(statement => statement.type === 'declaration')
  let regular_statements = module.body.filter(statement => statement.type !== 'declaration')

  let variables_by_name = getVariables(declaration_statements).reduce((obj, element) => {obj[element.name] = element; return obj}, {})

  let result = {
    type : 'module',
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
