"use strict";
var ramda_1 = require('ramda');
var Types = require('./Types.js');
var equals = Types.equals;
function check(modules) {
    var errors_found = [];
    for (var module_name in modules) {
        var module = modules[module_name];
        var report = check_module(module);
        if (report.error)
            errors_found.push.apply(errors_found, report.result);
    }
    return errors_found;
}
exports.check = check;
function check_module(module) {
    switch (module.module_type) {
        case 'main':
        case 'procedure':
            return check_procedure(module);
        case 'function':
            return check_function(module);
    }
}
function check_procedure(procedure) {
    var errors_found = [];
    for (var _i = 0, _a = procedure.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        var report = check_statement(statement);
        if (report.error)
            errors_found.push(report.result);
    }
    var error = errors_found.length > 0;
    return { error: error, result: errors_found };
}
function check_function(func) {
    var errors_found = [];
    for (var _i = 0, _a = func.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        var report = check_statement(statement);
        if (report.error)
            errors_found.push(report.result);
    }
    var return_exp_type = calculate_type(ramda_1.last(func.body).exptype);
    if (!return_exp_type.error) {
        if (!Types.equals(func.type.return_type, return_exp_type.result)) {
            var error_info = {
                reason: '@function-bad-return-type',
                expected: stringify(func.type.return_type),
                returned: stringify(return_exp_type.result)
            };
            errors_found.push(error_info);
        }
    }
    else
        errors_found.push(return_exp_type.result);
    var error = errors_found.length > 0;
    return { error: error, result: errors_found };
}
function check_statement(statement) {
    switch (statement.type) {
        case 'call':
            switch (statement.name) {
                case 'escribir':
                case 'escribir_linea':
                case 'leer':
                    return io_rule(statement);
                default:
                    return call_rule(statement);
            }
        case 'assignment':
            return assignment_rule(statement);
        case 'for_loop':
            return for_rule(statement);
        case 'control':
            return ctrl_rule(statement);
        case 'return':
            return { error: false };
        default:
            throw new Error("@TypeChecker: no se como verificar enunciados de tipo " + statement.type);
    }
}
exports.check_statement = check_statement;
// assignment_error:: error_report
//
// Informacion sobre los errores encontrados en la asignacion a una variable
//
//  reason: 'assignment-error'
//
//  errors: [error]
//  Arreglo con todos los errores encontrados en el llamado
//
// :: (assignment) -> report<assignment_error, type>
// Encuentra errores en una asignacion a una variable
function assignment_rule(assignment) {
    var errors = [];
    var variable_type = invocation_rule(assignment.left);
    var type_report = calculate_type(assignment.right);
    if (variable_type.error)
        errors.push(variable_type.result);
    if (type_report.error)
        errors.push(type_report.result);
    var error = errors.length > 0;
    if (error) {
        var result = { reason: 'assignment-error', errors: errors };
        return { error: error, result: result };
    }
    else {
        var right_type = type_report.result;
        if (equals(variable_type.result, right_type)) {
            return { error: false };
        }
        if (right_type.atomic == 'entero' && variable_type.result.atomic == 'real')
            if (equal_dimensions(variable_type.result, right_type)) {
                return { error: false };
            }
        var reason = '@assignment-incompatible-types';
        var expected = stringify(variable_type.result);
        var received = stringify(right_type);
        errors.push({ reason: reason, expected: expected, received: received });
        var result = { reason: 'assignment-error', errors: errors };
        return { error: true, result: result };
    }
}
exports.assignment_rule = assignment_rule;
// call_error:: error_report
//
// Informacion sobre los errores encontrados en el llamado a un modulo
//
//  reason: '@call-errors-found'
//
//  name: string
//  Nombre del modulo llamado
//
//  errors: [error]
//  Arreglo con todos los errores encontrados en el llamado
//
// :: (call) -> report<call_error, type>
// Encuentra errores en una llamada a un modulo
function call_rule(call) {
    var errors = [];
    // ver si se llamó al modulo con la cantidad correcta de argumentos
    if (call.argtypes.length != call.type_info.parameters.amount) {
        var reason = '@call-incorrect-arg-number';
        var expected = call.type_info.parameters.amount;
        var received = call.argtypes.length;
        errors.push({ reason: reason, expected: expected, received: received });
    }
    // calcular los tipos de los argumentos
    var argument_types = [];
    for (var i = 0; i < call.argtypes.length; i++) {
        var type = calculate_type(call.argtypes[i]);
        if (type.error)
            errors.push(type.result);
        argument_types.push(type.result);
    }
    // verificar que los tipos de los argumentos coincidan con los tipos de los
    // parametros
    for (var i = 0; i < argument_types.length; i++) {
        var expected_type = call.type_info.parameters.types[i];
        if (!equals(argument_types[i], expected_type)) {
            var reason = '@call-wrong-argument-type';
            var expected = stringify(expected_type);
            var received = stringify(argument_types[i]);
            var at = i + 1;
            errors.push({ reason: reason, expected: expected, received: received, at: at });
        }
    }
    var error = errors.length > 0;
    // Si se encontro algun error se retorna informacion sobre ellos
    // si no se retorna el tipo de retorno declarado por el modulo
    var result;
    if (error) {
        var reason = '@call-errors-found';
        var name_1 = call.name;
        result = { reason: reason, name: name_1, errors: errors };
    }
    else
        result = call.type_info.return_type;
    return { error: error, result: result };
}
exports.call_rule = call_rule;
// io_error:: error_report
//
// Informacion sobre los errores encontrados en el llamado a un modulo de IO
//
//  reason: '@io-errors-found'
//
//  name: string
//  Nombre del modulo llamado (escribir, escribir_linea, leer)
//
//  errors: [error]
//  Arreglo con todos los arreglos encontrados en el llamado
//
// :: (call) -> report<io_error, type>
// Encuentra errores en una llamada a un modulo
function io_rule(call) {
    var errors = [];
    var argument_types = [];
    for (var i = 0; i < call.argtypes.length; i++) {
        var type = calculate_type(call.argtypes[i]);
        if (type.error)
            errors.push(type.result);
        argument_types.push(type.result);
    }
    var constraint = call.type_info.parameter_constraint;
    for (var i = 0; i < argument_types.length; i++) {
        if (!constraint(argument_types[i])) {
            var reason = '@io-wrong-argument-type';
            var received = stringify(argument_types[i]);
            var name_2 = call.name;
            var at = i + 1;
            errors.push({ reason: reason, received: received, at: at });
        }
    }
    var error = errors.length > 0;
    var result;
    if (error) {
        var reason = '@io-errors-found';
        var name_3 = call.name;
        result = { reason: reason, name: name_3, errors: errors };
    }
    else
        result = call.type_info.return_type;
    return { error: error, result: result };
}
// for_loop_error:: error_report
//
// Informacion sobre los errores encontrados en un bucle para.
//
//  reason: 'for-loop-error'
//
//  errors: [error]
//  Arreglo con todos los arreglos encontrados en el bucle.
//
// :: (for_statement) -> report<for_loop_error, type>
// Encuentra errores en un bucle para.
function for_rule(for_loop) {
    var errors = [];
    var counter_type = invocation_rule(for_loop.counter_invocation);
    if (counter_type.error)
        errors.push(counter_type.result);
    var init_value_type = calculate_type(for_loop.init_value);
    if (init_value_type.error)
        errors.push(init_value_type.result);
    var last_value_type = calculate_type(for_loop.last_value);
    if (last_value_type.error)
        errors.push(last_value_type.result);
    if (!counter_type.error && !equals(Types.Integer, counter_type.result)) {
        var error_info = {
            reason: '@for-non-integer-counter',
            received: stringify(counter_type.result)
        };
        errors.push(error_info);
    }
    if (!init_value_type.error && !equals(Types.Integer, init_value_type.result)) {
        var error_info = {
            reason: '@for-non-integer-init',
            received: stringify(init_value_type.result)
        };
        errors.push(error_info);
    }
    if (!last_value_type.error && !equals(Types.Integer, last_value_type.result)) {
        var error_info = {
            reason: '@for-non-integer-goal',
            received: stringify(last_value_type.result)
        };
        errors.push(error_info);
    }
    for (var _i = 0, _a = for_loop.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        var report = check_statement(statement);
        if (report.error) {
            if (statement.type == 'control')
                errors.push(report.result);
            else
                errors.push(report.result);
        }
    }
    if (errors.length > 0) {
        var result = { reason: 'for-loop-error', errors: errors };
        return { error: true, result: result };
    }
    else
        return { error: false };
}
// TODO: adaptar esta funcion al nuevo formato de errores
function invocation_rule(invocation) {
    var error = false;
    var errors_found = [];
    var indexnum = 1;
    for (var _i = 0, _a = invocation.indextypes; _i < _a.length; _i++) {
        var type_expression = _a[_i];
        var type_report = calculate_type(type_expression);
        if (type_report.error)
            return type_report;
        if (!equals(Types.Integer, type_report.result)) {
            error = true;
            var error_info = {
                reason: 'non-integer-index', at: indexnum, bad_type: stringify(type_report.result)
            };
            errors_found.push(error_info);
        }
        indexnum++;
    }
    if (error)
        return { error: error, result: errors_found };
    else
        return { error: error, result: invocation.type };
}
exports.invocation_rule = invocation_rule;
function ctrl_rule(ctrl_statement) {
    var errors = [];
    var condition_type = calculate_type(ctrl_statement.condition);
    if (!condition_type.error) {
        if (!equals(condition_type.result, Types.Bool)) {
            var reason = '@condition-invalid-expression';
            var received = stringify(condition_type.result);
            errors.push({ reason: reason, received: received });
        }
    }
    else
        errors.push(condition_type.result);
    for (var _i = 0, _a = ctrl_statement.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        var report = check_statement(statement);
        if (report.error)
            errors.push(report.result);
    }
    if (errors.length > 0) {
        var result = { reason: 'control-error', errors: errors };
        return { error: true, result: result };
    }
    else
        return { error: false };
}
exports.ctrl_rule = ctrl_rule;
// el argumento de esta funcion es un arreglo de tipos y operadores
// su tarea es reducir ese arreglo a un tipo
function calculate_type(expression) {
    var stack = [];
    for (var _i = 0, expression_1 = expression; _i < expression_1.length; _i++) {
        var elt = expression_1[_i];
        if (elt.kind == 'operator') {
            var report = apply_operator(stack, elt.name);
            if (report.error)
                return report;
            stack = report.result;
        }
        else if (elt.kind == 'call') {
            var report = call_rule(elt.type_info);
            if (report.error)
                return report;
            stack.push(report.result);
        }
        else if (elt.kind == 'invocation') {
            var report = invocation_rule(elt.type_info);
            if (report.error)
                return report;
            stack.push(report.result);
        }
        else
            stack.push(elt.type_info);
    }
    return { error: false, result: stack.pop() };
}
exports.calculate_type = calculate_type;
function apply_operator(stack, opname) {
    switch (opname) {
        case 'plus':
        case 'times':
        case 'power':
            return real_operators(stack);
        case 'divide':
            return division(stack);
        case 'minus':
            return minus(stack);
        case 'mod':
        case 'div':
            return integer_operators(stack);
        case 'equal':
        case 'diff-than':
        case 'major-than':
        case 'minor-than':
        case 'major-equal':
        case 'minor-equal':
            return comparison_operators(stack);
        case 'and':
        case 'or':
            return binary_logic_operators(stack);
        case 'not':
            return not(stack);
        default:
            throw new Error("No se como verificar los tipos del operador " + opname);
    }
}
function division(stack) {
    var booth_are_integers = false;
    var new_stack = stack;
    var a = new_stack.pop();
    var b = new_stack.pop();
    if (!equals(a, Types.Integer) && !equals(a, Types.Float)) {
        var reason = '@expression-incompatible-type';
        var received = stringify(a);
        return { error: true, result: { reason: reason, received: received } };
    }
    if (!equals(b, Types.Integer) && !equals(b, Types.Float)) {
        var reason = '@expression-incompatible-type';
        var received = stringify(b);
        return { error: true, result: { reason: reason, received: received } };
    }
    new_stack.push(Types.Float);
    return { error: false, result: new_stack };
}
function minus(stack) {
    var new_stack = stack;
    var a = new_stack.pop();
    if (!equals(a, Types.Integer) && !equals(a, Types.Float)) {
        var reason = '@expression-incompatible-type';
        var received = stringify(a);
        return { error: true, result: { reason: reason, received: received } };
    }
    // hay que devolver el mismo tipo de dato que se recibio
    new_stack.push(a);
    return { error: false, result: new_stack };
}
function real_operators(stack) {
    var new_stack = stack;
    var a = new_stack.pop();
    var b = new_stack.pop();
    var a_is_integer = equals(a, Types.Integer);
    var b_is_integer = equals(b, Types.Integer);
    var a_is_float = equals(a, Types.Float);
    var b_is_float = equals(b, Types.Float);
    if (!a_is_integer && !a_is_float) {
        var reason = '@expression-incompatible-types';
        var received = stringify(a);
        return { error: true, result: { reason: reason, received: received } };
    }
    if (!b_is_integer && !b_is_float) {
        var reason = '@expression-incompatible-types';
        var received = stringify(b);
        return { error: true, result: { reason: reason, received: received } };
    }
    var return_type = a_is_integer && b_is_integer ? Types.Integer : Types.Float;
    new_stack.push(return_type);
    return { error: false, result: new_stack };
}
function integer_operators(stack) {
    var new_stack = stack;
    var a = new_stack.pop();
    var b = new_stack.pop();
    if (!equals(a, Types.Integer)) {
        var reason = '@expression-incompatible-types';
        var received = stringify(a);
        return { error: true, result: { reason: reason, received: received } };
    }
    if (!equals(b, Types.Integer)) {
        var reason = '@expression-incompatible-types';
        var received = stringify(b);
        return { error: true, result: { reason: reason, received: received } };
    }
    new_stack.push(Types.Integer);
    return { error: false, result: new_stack };
}
function comparison_operators(stack) {
    var new_stack = stack;
    var a = new_stack.pop();
    var b = new_stack.pop();
    if (!equals(a, b)) {
        if (equals(a, Types.Integer) || equals(a, Types.Float)) {
            if (!equals(b, Types.Integer) && !equals(b, Types.Float)) {
                var reason = '@expression-incompatible-comparison';
                var first = stringify(a);
                var second = stringify(b);
                return { error: true, result: { reason: reason, first: first, second: second } };
            }
        }
        else {
            var reason = '@expression-incompatible-comparison';
            var first = stringify(a);
            var second = stringify(b);
            return { error: true, result: { reason: reason, first: first, second: second } };
        }
    }
    new_stack.push(Types.Bool);
    return { error: false, result: new_stack };
}
function binary_logic_operators(stack) {
    var new_stack = stack;
    var a = new_stack.pop();
    var b = new_stack.pop();
    if (!equals(a, Types.Bool)) {
        var reason = '@expression-incompatible-types';
        var received = stringify(a);
        return { error: true, result: { reason: reason, received: received } };
    }
    if (!equals(b, Types.Bool)) {
        var reason = '@expression-incompatible-types';
        var unexpected = stringify(b);
        return { error: true, result: { reason: reason, received: received } };
    }
    new_stack.push(Types.Bool);
    return { error: false, result: new_stack };
}
function not(stack) {
    var new_stack = stack;
    var a = new_stack.pop();
    if (!equals(a, Types.Bool)) {
        var reason = '@expression-incompatible-type';
        var received = stringify(a);
        return { error: true, result: { reason: reason, received: received } };
    }
    new_stack.push(Types.Bool);
    return { error: false, result: new_stack };
}
function stringify(type) {
    if (type.kind == 'array') {
        var dimensions = '';
        var ct = type;
        while (ct.kind == 'array') {
            dimensions += ct.length;
            if (ct.contains.kind == 'array')
                dimensions += ', ';
            ct = ct.contains;
        }
        return ct.atomic + "[" + dimensions + "]";
    }
    else {
        return type.atomic;
    }
}
