'use strict';
var List_js_1 = require('../parser/ast/List.js');
var Nodes_js_1 = require('../parser/ast/Nodes.js');
function transform(ast) {
    var program = {
        modules: {}
    };
    for (var _i = 0, _a = ast.modules; _i < _a.length; _i++) {
        var module = _a[_i];
        if (module.module_type == 'main') {
            program.modules[module.name] = transformMain(module);
        }
        else {
            program.modules[module.name] = transformModule(module);
        }
    }
    return program;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transform;
function transformMain(module) {
    var result = {
        name: 'main',
        locals: transformVariables(module.locals),
        parameters: [],
        module_type: 'main',
        root: null
    };
    var temp_list = new List_js_1.LinkedList();
    for (var _i = 0, _a = module.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        temp_list.addNode(transformStatement(statement));
    }
    result.root = temp_list.firstNode;
    return result;
}
function transformVariables(variables) {
    var result = {};
    for (var name_1 in variables) {
        var variable = variables[name_1];
        var transformed_var = {
            name: variable.name,
            type: variable.type
        };
        if (variable.isArray) {
            transformed_var.dimension = variable.dimension;
            transformed_var.values = variable.values;
        }
        else {
            transformed_var.dimension = [1];
            transformed_var.values = [];
        }
        result[name_1] = transformed_var;
    }
    return result;
}
function transformModule(module) {
    var result = {
        name: module.name,
        locals: transformVariables(module.locals),
        parameters: module.parameters.map(function (p) { return p.name; }),
        module_type: module.module_type,
        root: null
    };
    var temp_list = new List_js_1.LinkedList();
    for (var _i = 0, _a = module.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        temp_list.addNode(transformStatement(statement));
    }
    // HACK: esto es necesario para que las llamadas a modulos funcionen como debe
    // ser. Está relacionado con el funcionamiento de Evaluator.step()
    // commit anterior: c5b0404e45574cd54b8188d68a8a283031c40902
    var dummy_node = new Nodes_js_1.GenericNode({ action: 'dummy' });
    dummy_node.setNext(temp_list.firstNode);
    result.root = dummy_node;
    return result;
}
function transformStatement(statement) {
    switch (statement.type) {
        case 'assignment':
            return transformAssigment(statement);
        case 'if':
            return transformIf(statement);
        case 'while':
            return transformWhile(statement);
        case 'until':
            return transformUntil(statement);
        case 'for':
            return transformFor(statement);
        case 'call':
            return transformCall(statement);
        case 'return':
            return transformReturn(statement);
        default:
            throw new TypeError("'" + statement.type + "' no es un tipo de enunciado reconocido");
    }
}
function transformExpression(token) {
    switch (token.kind) {
        case 'operator':
            switch (token.operator) {
                case 'times':
                case 'unary-minus':
                case 'division':
                case 'power':
                case 'div':
                case 'mod':
                case 'divide':
                case 'minus':
                case 'plus':
                case 'minor-than':
                case 'minor-equal':
                case 'major-than':
                case 'major-equal':
                case 'equal':
                case 'not':
                case 'diff-than':
                case 'and':
                case 'or':
                    return new Nodes_js_1.GenericNode({ action: token.operator });
                default:
                    console.log(token);
                    throw new Error("Operador \"" + token.operator + "\" no reconocido");
            }
            break;
        case 'literal':
            return new Nodes_js_1.GenericNode({ action: 'push', value: token.value });
        case 'invocation':
            return transformInvocation(token);
        default:
            console.log(token);
            throw new Error("Tipo de expresion \"" + token.kind + "\" no reconocido.");
    }
}
function transformInvocation(invocation) {
    var action_list = new List_js_1.LinkedList();
    if (invocation.isArray) {
        var transformed_indexes = invocation.indexes.map(function (exp) { return exp.map(transformExpression); });
        for (var _i = 0, transformed_indexes_1 = transformed_indexes; _i < transformed_indexes_1.length; _i++) {
            var node_array = transformed_indexes_1[_i];
            for (var _a = 0, node_array_1 = node_array; _a < node_array_1.length; _a++) {
                var node = node_array_1[_a];
                action_list.addNode(node);
            }
        }
        var access = { action: 'subscript', name: invocation.name, total_indexes: invocation.indexes.length };
        action_list.addNode(new Nodes_js_1.GenericNode(access));
    }
    else {
        // actions
        var push = { action: 'push', value: 1 };
        var access = { action: 'subscript', name: invocation.name, total_indexes: 1 };
        action_list.addNode(new Nodes_js_1.GenericNode(push));
        action_list.addNode(new Nodes_js_1.GenericNode(access));
    }
    return action_list.firstNode;
}
function transformAssigment(assignment) {
    // las asignaciones se dividen en 2 acciones
    var expression_list = new List_js_1.LinkedList();
    for (var _i = 0, _a = assignment.right.map(transformExpression); _i < _a.length; _i++) {
        var node = _a[_i];
        expression_list.addNode(node);
    }
    // TODO: cambiar 'pop' por 'assign'
    // pop es una accion que (en el evaluador) desapila una expression de expression_stack y la mete en una variable
    var assign;
    var indexes_list = new List_js_1.LinkedList();
    if (assignment.left.isArray) {
        for (var _b = 0, _c = assignment.left.indexes; _b < _c.length; _b++) {
            var expression = _c[_b];
            var node_list = expression.map(transformExpression);
            for (var _d = 0, node_list_1 = node_list; _d < node_list_1.length; _d++) {
                var node = node_list_1[_d];
                indexes_list.addNode(node);
            }
        }
        assign = {
            action: 'assign',
            varname: assignment.left.name,
            total_indexes: assignment.left.indexes.length,
            bounds_checked: assignment.left.bounds_checked
        };
    }
    else {
        indexes_list.addNode(new Nodes_js_1.GenericNode({ action: 'push', value: 1 }));
        assign = { action: 'assign', varname: assignment.left.name, total_indexes: 1, bounds_checked: true };
    }
    var assign_node = new Nodes_js_1.GenericNode(assign);
    indexes_list.addNode(expression_list.firstNode);
    indexes_list.addNode(assign_node);
    return indexes_list.firstNode;
}
function transformIf(if_statement) {
    var left_branch = new List_js_1.LinkedList();
    var right_branch = new List_js_1.LinkedList();
    for (var _i = 0, _a = if_statement.true_branch; _i < _a.length; _i++) {
        var statement = _a[_i];
        right_branch.addNode(transformStatement(statement));
    }
    for (var _b = 0, _c = if_statement.false_branch; _b < _c.length; _b++) {
        var statement = _c[_b];
        left_branch.addNode(transformStatement(statement));
    }
    var if_node = new Nodes_js_1.IfNode({ action: 'if' });
    if_node.left_branch_root = left_branch.firstNode;
    if_node.right_branch_root = right_branch.firstNode;
    var expression_list = if_statement.condition.map(transformExpression).reduce(function (l, n) { l.addNode(n); return l; }, new List_js_1.LinkedList());
    expression_list.addNode(if_node);
    return expression_list.firstNode;
}
function transformWhile(while_statement) {
    var temp_list = new List_js_1.LinkedList();
    for (var _i = 0, _a = while_statement.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        temp_list.addNode(transformStatement(statement));
    }
    var expression_nodes = while_statement.condition.map(transformExpression);
    for (var _b = 0, expression_nodes_1 = expression_nodes; _b < expression_nodes_1.length; _b++) {
        var node = expression_nodes_1[_b];
        temp_list.addNode(node);
    }
    var while_node = new Nodes_js_1.WhileNode({ action: 'while' });
    while_node.loop_body_root = temp_list.firstNode;
    var expression_list = while_statement.condition.map(transformExpression).reduce(function (l, n) { l.addNode(n); return l; }, new List_js_1.LinkedList());
    expression_list.addNode(while_node);
    return expression_list.firstNode;
}
function transformUntil(until_statement) {
    var new_condition = until_statement.condition;
    new_condition.push({ kind: 'operator', operator: 'not' });
    var while_statement = { type: 'while', condition: new_condition, body: until_statement.body };
    return transformWhile(while_statement);
}
function transformFor(for_statement) {
    var counter_variable = for_statement.counter_init.left;
    var condition = [
        { kind: 'invocation', name: counter_variable.name, isArray: counter_variable.isArray, indexes: counter_variable.indexes }
    ].concat(for_statement.last_value, [
        { kind: 'operator', operator: 'minor-equal' }
    ]);
    var increment_statement = {
        type: 'assignment',
        left: counter_variable,
        right: [
            {
                kind: 'invocation',
                indexes: counter_variable.indexes,
                isArray: counter_variable.isArray,
                name: counter_variable.name
            },
            { kind: 'literal', type: 'entero', value: 1 },
            { kind: 'operator', operator: 'plus' }
        ]
    };
    var new_body = for_statement.body;
    new_body.push(increment_statement);
    var while_statement = { type: 'while', condition: condition, body: new_body };
    var temp_list = new List_js_1.LinkedList();
    var counter_initialization = transformAssigment(for_statement.counter_init);
    temp_list.addNode(counter_initialization);
    temp_list.addNode(transformWhile(while_statement));
    return temp_list.firstNode;
}
function transformCall(call_statement) {
    if (call_statement.name == 'leer') {
        var temp_list = new List_js_1.LinkedList();
        for (var _i = 0, _a = call_statement.args; _i < _a.length; _i++) {
            var arg = _a[_i];
            var assignment = void 0;
            if (arg[0].isArray) {
                for (var _b = 0, _c = arg[0].indexes; _b < _c.length; _b++) {
                    var expression = _c[_b];
                    var node_list = expression.map(transformExpression);
                    for (var _d = 0, node_list_2 = node_list; _d < node_list_2.length; _d++) {
                        var node = node_list_2[_d];
                        temp_list.addNode(node);
                    }
                }
                assignment = {
                    action: 'assign',
                    varname: arg[0].name,
                    total_indexes: arg[0].indexes.length,
                    // HACK: cambiar esto cuando las invocaciones dentro de leer() tengan
                    // esta propiedad
                    bounds_checked: false
                };
            }
            else {
                temp_list.addNode(new Nodes_js_1.GenericNode({ action: 'push', value: 1 }));
                assignment = {
                    action: 'assign',
                    varname: arg[0].name,
                    total_indexes: 1,
                    // HACK: cambiar esto cuando las invocaciones dentro de leer() tengan
                    // esta propiedad
                    bounds_checked: false
                };
            }
            var call = { name: 'leer', action: 'module_call', variable_name: arg[0].name };
            temp_list.addNode(new Nodes_js_1.GenericNode(call));
            temp_list.addNode(new Nodes_js_1.GenericNode(assignment));
        }
        return temp_list.firstNode;
    }
    else if (call_statement.name == 'escribir') {
        var temp_list = new List_js_1.LinkedList();
        for (var _e = 0, _f = call_statement.args; _e < _f.length; _e++) {
            var expression = _f[_e];
            var node_list = expression.map(transformExpression);
            for (var _g = 0, node_list_3 = node_list; _g < node_list_3.length; _g++) {
                var node = node_list_3[_g];
                temp_list.addNode(node);
            }
            var call = { action: 'module_call', name: 'escribir' };
            temp_list.addNode(new Nodes_js_1.GenericNode(call));
        }
        return temp_list.firstNode;
    }
    else {
        var temp_list = new List_js_1.LinkedList();
        for (var _h = 0, _j = call_statement.args; _h < _j.length; _h++) {
            var expression = _j[_h];
            var node_list = expression.map(transformExpression);
            for (var _k = 0, node_list_4 = node_list; _k < node_list_4.length; _k++) {
                var node = node_list_4[_k];
                temp_list.addNode(node);
            }
        }
        var call = { action: 'module_call', name: call_statement.name, total_arguments: call_statement.args.length };
        temp_list.addNode(new Nodes_js_1.GenericNode(call));
        return temp_list.firstNode;
    }
}
function transformReturn(return_statement) {
    var temp_list = new List_js_1.LinkedList();
    var expression_list = return_statement.expression.map(transformExpression).reduce(function (l, n) { l.addNode(n); return l; }, new List_js_1.LinkedList());
    return expression_list.firstNode;
}
