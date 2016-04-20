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

export default function transform(module) {
  let declaration_statements = module.body.filter(statement => statement.type === 'declaration')
  let regular_statements = module.body.filter(statement => statement.type !== 'declaration')

  let var_report = getVariables(declaration_statements)

  if (var_report.error) {
    return var_report
  }

  let variables = var_report.result.map(BoundCheckDecorator)

  let var_object = variables.reduce((obj, element) => {obj[element.name] = element; return obj}, {})

  let result = {
    type : 'module',
    name : module.name,
    locals : var_object,
    body : regular_statements
  }

  return new Report(false, result)
}

function getVariables(declaration_statements) {
  let result = []
  let repeated = []

  for (let declaration of declaration_statements) {
    for (let variable of declaration.variables) {
      let existing_variable = find(result, result_element => result_element.name === variable.name)
      if (existing_variable !== undefined) {
        repeated.push({first:existing_variable, second:variable})
      }
      else {
        result.push(variable)
      }
    }
  }

  if (repeated.length > 0) {
    return new Report(true, repeated)
  }
  else {
    return new Report(false, result)
  }
}

function find (array, test_function) {
  for (let element of array) {
    if (test_function(element) === true) return element;
  }
}

function BoundCheckDecorator(variable) {
  variable.bounds_checked = false
  return variable
}
