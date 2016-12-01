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
'use strict';
function transformAST(ast) {
    var program = {
        modules: []
    };
    var repeated_vars = [];
    for (var _i = 0, _a = ast.modules; _i < _a.length; _i++) {
        var module = _a[_i];
        program.modules.push(transform(module));
    }
    return program;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformAST;
function transform(module) {
    switch (module.module_type) {
        case 'main':
            return transformMain(module);
        case 'procedure':
            return transformProcedure(module);
        case 'function':
            throw Error("@Checkable.js: la transformacion de funciones no esta implementada");
        default:
            throw Error("@Checkable.js: no se como transfor modulos de tipo " + module.module_type);
    }
}
function transformProcedure(module) {
    var parameter_variables = module.parameters.map(function (p) { return { type: p.type, name: p.name, isArray: false, dimension: null }; });
    // HACK: crear un enunciado declaracion con las variables estipuladas en los parametros
    var parameters_declaration = { type: 'declaration', variables: parameter_variables };
    var declaration_statements = module.body.filter(function (statement) { return statement.type === 'declaration'; });
    declaration_statements = [parameters_declaration].concat(declaration_statements);
    var regular_statements = module.body.filter(function (statement) { return statement.type !== 'declaration'; });
    var variables_by_name = getVariables(declaration_statements).reduce(function (obj, element) { obj[element.name] = element; return obj; }, {});
    var result = {
        type: 'module',
        module_type: 'procedure',
        parameters: module.parameters,
        name: module.name,
        locals: variables_by_name,
        body: regular_statements
    };
    return result;
}
function transformMain(module) {
    var declaration_statements = module.body.filter(function (statement) { return statement.type === 'declaration'; });
    var regular_statements = module.body.filter(function (statement) { return statement.type !== 'declaration'; });
    var variables_by_name = getVariables(declaration_statements).reduce(function (obj, element) { obj[element.name] = element; return obj; }, {});
    var result = {
        type: 'module',
        module_type: 'main',
        name: module.name,
        locals: variables_by_name,
        body: regular_statements
    };
    return result;
}
function getVariables(declaration_statements) {
    var result = [];
    for (var _i = 0, declaration_statements_1 = declaration_statements; _i < declaration_statements_1.length; _i++) {
        var declaration = declaration_statements_1[_i];
        for (var _a = 0, _b = declaration.variables; _a < _b.length; _a++) {
            var variable = _b[_a];
            if (variable.isArray) {
                variable.values = new Array(variable.dimension.reduce(function (a, b) { return a * b; }));
            }
            result.push(variable);
        }
    }
    return result;
}
function find(array, test_function) {
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var element = array_1[_i];
        if (test_function(element) === true)
            return element;
    }
}
