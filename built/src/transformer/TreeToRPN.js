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
    for (var _i = 0, _a = ast.modules; _i < _a.length; _i++) {
        var module = _a[_i];
        program.modules.push(transformModule(module));
    }
    return program;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformAST;
function transformModule(module) {
    var result = {
        type: 'module',
        module_type: module.module_type,
        name: module.name,
        body: []
    };
    for (var _i = 0, _a = module.body; _i < _a.length; _i++) {
        var statement = _a[_i];
        if (statement.type === 'declaration') {
            result.body.push(statement);
        }
        else {
            result.body.push(transformStatement(statement));
        }
    }
    if ('parameters' in module) {
        result.parameters = module.parameters;
    }
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
        default:
            throw new TypeError("'" + statement.type + "' no es un tipo de enunciado reconocido");
    }
}
function transformAssigment(statement) {
    var result = {
        type: 'assignment',
        left: null,
        right: null
    };
    if (statement.left.isArray) {
        result.left = transformArrayInvocation(statement.left);
    }
    else {
        result.left = statement.left;
    }
    result.right = treeToRPN(statement.right);
    return result;
}
function transformIf(statement) {
    var result = {
        type: 'if',
        condition: null,
        true_branch: [],
        false_branch: []
    };
    for (var _i = 0, _a = statement.true_branch; _i < _a.length; _i++) {
        var s = _a[_i];
        result.true_branch.push(transformStatement(s));
    }
    for (var _b = 0, _c = statement.false_branch; _b < _c.length; _b++) {
        var s = _c[_b];
        result.false_branch.push(transformStatement(s));
    }
    result.condition = treeToRPN(statement.condition);
    return result;
}
function transformWhile(statement) {
    var result = {
        type: 'while',
        condition: null,
        body: []
    };
    result.condition = treeToRPN(statement.condition);
    for (var _i = 0, _a = statement.body; _i < _a.length; _i++) {
        var s = _a[_i];
        result.body.push(transformStatement(s));
    }
    return result;
}
function transformUntil(statement) {
    var result = {
        type: 'until',
        condition: null,
        body: []
    };
    result.condition = treeToRPN(statement.condition);
    for (var _i = 0, _a = statement.body; _i < _a.length; _i++) {
        var s = _a[_i];
        result.body.push(transformStatement(s));
    }
    return result;
}
function transformFor(statement) {
    var result = {
        type: 'for',
        counter_init: null,
        last_value: null,
        body: []
    };
    result.counter_init = transformAssigment(statement.counter_init);
    result.last_value = treeToRPN(statement.last_value);
    for (var _i = 0, _a = statement.body; _i < _a.length; _i++) {
        var s = _a[_i];
        result.body.push(transformStatement(s));
    }
    return result;
}
function transformCall(statement) {
    var result = {
        type: 'call',
        args: [],
        name: statement.name,
        expression_type: 'module_call'
    };
    for (var _i = 0, _a = statement.args; _i < _a.length; _i++) {
        var arg = _a[_i];
        result.args.push(treeToRPN(arg));
    }
    return result;
}
function transformArrayInvocation(array) {
    var transformed_indexes = [];
    for (var _i = 0, _a = array.indexes; _i < _a.length; _i++) {
        var index = _a[_i];
        transformed_indexes.push(treeToRPN(index));
    }
    var new_left = {};
    for (var prop in array) {
        if (prop === 'indexes') {
            new_left.indexes = transformed_indexes;
        }
        else {
            new_left[prop] = array[prop];
        }
    }
    return new_left;
}
function treeToRPN(exp_root) {
    var stack = [];
    if (exp_root.expression_type === 'operation') {
        var op = { kind: 'operator', operator: exp_root.op };
        var left_operand = treeToRPN(exp_root.operands[0]);
        var right_operand = treeToRPN(exp_root.operands[1]);
        stack.push.apply(stack, left_operand.concat(right_operand, [op]));
    }
    else if (exp_root.expression_type === 'unary-operation') {
        var op = { kind: 'operator', operator: exp_root.op };
        var operand = treeToRPN(exp_root.operand);
        stack.push.apply(stack, operand.concat([op]));
    }
    else if (exp_root.expression_type === 'expression') {
        var rpn_contents = treeToRPN(exp_root.expression);
        stack.push.apply(stack, rpn_contents);
    }
    else {
        if (exp_root.isArray) {
            exp_root = transformArrayInvocation(exp_root);
        }
        var exp = {};
        for (var prop in exp_root) {
            if (prop === 'expression_type') {
                exp.kind = exp_root[prop];
            }
            else {
                exp[prop] = exp_root[prop];
            }
        }
        stack.push(exp);
    }
    return stack;
}
