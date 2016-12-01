'use strict';
var TokenTypes_1 = require('./TokenTypes');
var TokenQueue_js_1 = require('./TokenQueue.js');
/**
 * Funcion que intenta capturar un token numerico
 * @param {TokenQueue} source Fuente en la que hay que buscar el numero
 */
function Number(source) {
    var current = source.current();
    if (current.kind == TokenTypes_1.ValueKind.Real || current.kind == TokenTypes_1.ValueKind.Integer) {
        source.next();
        // A esta altura ya se que current representa un Token de tipo NumberToken, por lo tanto
        // su propiedad value es de tipo number y no (number | string), por lo tanto la casteo
        // a tipo number para que el compilador no se queje 
        return { error: false, result: { value: current.value, type: current.kind } };
    }
    else {
        var unexpected = current.kind;
        var expected = ['entero', 'real'];
        var column = current.column;
        var line = current.line;
        return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
    }
}
exports.Number = Number;
/**
 * Captura un token de tipo 'entero'
 * @param {TokenQueue} source fuente desde la cual se debe capturar
 */
function Integer(source) {
    var current = source.current();
    if (current.kind === TokenTypes_1.ValueKind.Integer) {
        // consumir el token actual y...
        source.next();
        // ...devolver los datos importantes o...
        return { error: false, result: current.value };
    }
    else {
        // ...devolver informacion sobre el error
        var unexpected = current.kind;
        var expected = ['entero'];
        var column = current.column;
        var line = current.line;
        return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
    }
}
exports.Integer = Integer;
/**
 * Captura la dimension de un arreglo
 */
function ArrayDimension(source) {
    var indexes = [];
    var index_report = Integer(source);
    if (index_report.error) {
        return index_report;
    }
    else {
        indexes.push(index_report.result);
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.Comma) {
        source.next();
        var following_indexes = ArrayDimension(source);
        if (following_indexes.error) {
            return following_indexes;
        }
        else {
            indexes = indexes.concat(following_indexes.result);
            return { error: false, result: indexes };
        }
    }
    else {
        return { error: false, result: indexes };
    }
}
exports.ArrayDimension = ArrayDimension;
function Word(source) {
    var current = source.current();
    if (current.kind === TokenTypes_1.OtherKind.Word) {
        source.next();
        return { error: false, result: current.text };
    }
    else {
        var unexpected = current.kind;
        var expected = ['word'];
        var column = current.column;
        var line = current.line;
        return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
    }
}
exports.Word = Word;
/**
 * Patron que consume la declaracion de una variable (nombre y dimension)
 */
function VariableDeclaration(source) {
    var variable = { name: '', is_array: false, dimensions: [] };
    var text = Word(source);
    if (text.error) {
        return text;
    }
    else {
        variable.name = text.result;
        if (source.current().kind === TokenTypes_1.SymbolKind.LeftBracket) {
            source.next();
            var dimension = ArrayDimension(source);
            if (dimension.error) {
                return dimension;
            }
            else {
                variable.is_array = true;
                variable.dimensions = dimension.result;
                if (source.current().kind === TokenTypes_1.SymbolKind.RightBracket) {
                    source.next();
                    return { error: false, result: variable };
                }
                else {
                    var current = source.current();
                    var unexpected = current.kind;
                    var expected = ['right-bracket'];
                    var column = current.column;
                    var line = current.line;
                    return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
                }
            }
        }
        else {
            return { error: false, result: variable };
        }
    }
}
exports.VariableDeclaration = VariableDeclaration;
/**
 * Patron que consume una lista de declaraciones
 */
function VariableList(source) {
    var variables = [];
    var partial_match = false;
    var name_report = VariableDeclaration(source);
    if (name_report.error) {
        return name_report;
    }
    else {
        variables.push(name_report.result);
        if (source.current().kind === TokenTypes_1.SymbolKind.Comma && source.peek().kind === TokenTypes_1.OtherKind.Word) {
            source.next();
            var var_list_match = VariableList(source);
            if (var_list_match.error) {
                return var_list_match;
            }
            else if (var_list_match.error == false) {
                var k = var_list_match.result;
                var result = variables.concat(var_list_match.result);
                return { error: false, result: result };
            }
        }
        else {
            return { error: false, result: variables };
        }
    }
}
exports.VariableList = VariableList;
var isType = function (k) {
    return k == TokenTypes_1.ReservedKind.Entero || k == TokenTypes_1.ReservedKind.Real || k == TokenTypes_1.ReservedKind.Logico || k == TokenTypes_1.ReservedKind.Caracter;
};
/**
 * Patron que consume un tipo de datos.
 */
function TypeName(source) {
    var current = source.current();
    if (isType(current.kind)) {
        source.next();
        return { error: false, result: current.name };
    }
    else {
        var unexpected = current.kind;
        var expected = ['entero', 'real', 'logico', 'caracter'];
        var column = current.column;
        var line = current.line;
        var reason = 'nonexistent-type';
        return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line, reason: reason } };
    }
}
exports.TypeName = TypeName;
/**
 * Patron que consume un indice (una expresion) de un arreglo
 */
function IndexExpression(source) {
    var indexes = [];
    var index_report = Expression(source);
    if (index_report.error === true) {
        return index_report;
    }
    else {
        indexes.push(index_report.result);
        if (source.current().kind === TokenTypes_1.SymbolKind.Comma) {
            source.next();
            var another_index_report = IndexExpression(source);
            if (another_index_report.error === true) {
                return another_index_report;
            }
            else {
                indexes = indexes.concat(another_index_report.result);
                return { error: false, result: indexes };
            }
        }
        else {
            return { error: false, result: indexes };
        }
    }
}
exports.IndexExpression = IndexExpression;
/**
 * Captura la invocacion de una variable
 */
function Variable(source) {
    var name = '', is_array = false, indexes = [];
    var word_match = Word(source);
    if (word_match.error === true) {
        return word_match;
    }
    else {
        name = word_match.result;
        if (source.current().kind === TokenTypes_1.SymbolKind.LeftPar) {
            source.next();
            var index_expressions_match = IndexExpression(source);
            if (index_expressions_match.error === true) {
                return index_expressions_match;
            }
            is_array = true;
            indexes = index_expressions_match.result;
            if (source.current().kind === TokenTypes_1.SymbolKind.RightPar) {
                source.next();
                return { error: false, result: { name: name, is_array: is_array, indexes: indexes } };
            }
            else {
                var current = source.current();
                var unexpected = current.kind;
                var expected = ['right-bracket'];
                var column = current.column;
                var line = current.line;
                return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
            }
        }
        else {
            return { error: false, result: { name: name, is_array: is_array, indexes: indexes } };
        }
    }
}
exports.Variable = Variable;
var precedence = {
    'power': 6,
    'div': 5,
    'mod': 5,
    'times': 5,
    'divide': 5,
    'minus': 4,
    'plus': 4,
    'minor-than': 3,
    'minor-equal': 3,
    'major-than': 3,
    'major-equal': 3,
    'equal': 2,
    'diff-than': 2,
    'and': 1,
    'or': 0
};
function is_operator(k) {
    switch (k) {
        case TokenTypes_1.SymbolKind.Power:
        case TokenTypes_1.SymbolKind.Times:
        case TokenTypes_1.SymbolKind.Slash:
        case TokenTypes_1.SymbolKind.Minus:
        case TokenTypes_1.SymbolKind.Plus:
        case TokenTypes_1.SymbolKind.Minor:
        case TokenTypes_1.SymbolKind.Major:
        case TokenTypes_1.SymbolKind.MinorEq:
        case TokenTypes_1.SymbolKind.MajorEq:
        case TokenTypes_1.SymbolKind.Equal:
        case TokenTypes_1.SymbolKind.Different:
        case TokenTypes_1.ReservedKind.Div:
        case TokenTypes_1.ReservedKind.Mod:
        case TokenTypes_1.ReservedKind.And:
        case TokenTypes_1.ReservedKind.Or:
            return true;
        default:
            return false;
    }
}
/**
 * Captura una expresion
 */
function Expression(source) {
    // Ubicacion del inicio de la expresion, en caso de que haya algun error
    var column = source.current().column;
    var line = source.current().line;
    /**
     * Dice si un token indica el fin de la expresion a capturar
     */
    var end_reached = function (tkind) {
        return tkind == TokenTypes_1.SymbolKind.EOL
            || tkind == TokenTypes_1.SymbolKind.EOF
            || tkind == TokenTypes_1.SymbolKind.Comma
            || tkind == TokenTypes_1.SymbolKind.RightPar
            || tkind == TokenTypes_1.SymbolKind.RightBracket;
    };
    var output = [];
    var operators = [];
    while (!end_reached(source.current().kind)) {
        var ctoken = source.current();
        if (ctoken.kind == TokenTypes_1.SymbolKind.LeftPar) {
            operators.unshift({ type: 'parenthesis', name: 'left-par' });
            source.next();
        }
        else if (ctoken.kind == TokenTypes_1.SymbolKind.RightPar) {
            while (operators.length > 0 && operators[0].name != 'left-par') {
                output.push(operators.shift());
            }
            if (operators[operators.length - 1].name == 'left-par') {
                operators.shift();
            }
            else {
                var unexpected = TokenTypes_1.SymbolKind.LeftPar;
                var expected = ['left-par'];
                var reason = 'mismatched-parenthesis';
                return { error: true, result: { unexpected: unexpected, expected: expected, reason: reason, column: column, line: line } };
            }
        }
        else if (is_operator(ctoken.kind)) {
            var p1 = precedence[ctoken.kind];
            var p2 = function () { return precedence[operators[0].name]; };
            while (operators.length > 0 && p1 <= p2()) {
                var op = operators.shift();
                output.push({ type: 'operator', name: op.name });
            }
            operators.unshift({ type: 'operator', name: ctoken.name });
            source.next();
        }
        else {
            var value_match = Value(source);
            if (value_match.error == true) {
                return value_match;
            }
            output.push(value_match.result);
        }
    }
    while (operators.length > 0)
        output.push(operators.shift());
    return { error: false, result: output };
}
exports.Expression = Expression;
/**
 * Patron que captura un valor (literal o invocado)
 */
function Value(source) {
    var ctoken = source.current();
    if (ctoken.kind == TokenTypes_1.OtherKind.Word) {
        if (source.peek().kind == TokenTypes_1.SymbolKind.LeftPar) {
            var call_match = ModuleCall(source);
            return call_match;
        }
        else {
            var value_match = Variable(source);
            if (value_match.error == true) {
                return value_match;
            }
            else if (value_match.error == false) {
                var result = {
                    type: 'invocation',
                    name: value_match.result.name,
                    is_array: value_match.result.is_array,
                    indexes: value_match.result.indexes
                };
                return { error: false, result: result };
            }
        }
    }
    else if (isLiteralTokenType(ctoken.kind)) {
        var value = void 0;
        if (ctoken.kind == TokenTypes_1.ReservedKind.Verdadero || ctoken.kind == TokenTypes_1.ReservedKind.Falso)
            value = ctoken.kind == TokenTypes_1.ReservedKind.Verdadero;
        else
            value = ctoken.value;
        source.next();
        return { error: false, result: { type: 'literal', value: value } };
    }
    else {
        var unexpected = ctoken.kind;
        var expected = ['expresion'];
        var reason = '@value-expected-expression';
        var column = ctoken.column;
        var line = ctoken.line;
        return { error: true, result: { unexpected: unexpected, expected: expected, reason: reason, column: column, line: line } };
    }
}
exports.Value = Value;
function isLiteralTokenType(k) {
    var is_num = k == TokenTypes_1.ReservedKind.Entero || k == TokenTypes_1.ReservedKind.Real;
    var is_bool = k == TokenTypes_1.ReservedKind.Verdadero || k == TokenTypes_1.ReservedKind.Falso;
    var is_other = k == TokenTypes_1.ReservedKind.Caracter || k == TokenTypes_1.ValueKind.String;
    return is_num || is_bool || is_other;
}
/**
 * Captura una lista de argumentos, es decir, una lista de expresiones
 */
function ArgumentList(source) {
    var args = [];
    var exp = Expression(source);
    if (exp.error) {
        return exp;
    }
    else if (exp.error == false) {
        args.push(exp.result);
        if (source.current().kind == TokenTypes_1.SymbolKind.Comma) {
            source.next();
            var next_args = ArgumentList(source);
            if (next_args.error) {
                return next_args;
            }
            else {
                args = args.concat(next_args.result);
                return { error: false, result: args };
            }
        }
        else {
            return { error: false, result: args };
        }
    }
}
exports.ArgumentList = ArgumentList;
/**
 * Captura una lista de parametros en la declaracion de una funcion o procedimiento
 */
function ParameterList(source) {
    var result = [];
    var parameter_report = Parameter(source);
    if (parameter_report.error) {
        return parameter_report;
    }
    else {
        result.push(parameter_report.result);
        if (source.current().kind == TokenTypes_1.SymbolKind.Comma) {
            source.next();
            var other_parameters = ParameterList(source);
            if (other_parameters.error) {
                return other_parameters;
            }
            else {
                result = result.concat(other_parameters.result);
                return { error: false, result: result };
            }
        }
        else {
            return { error: false, result: result };
        }
    }
}
exports.ParameterList = ParameterList;
/**
 * Captura un parametro de una funcion o procedimiento
 */
function Parameter(source) {
    var result = { name: '', by_ref: false, type: null };
    var type_r = TypeName(source);
    if (type_r.error) {
        return type_r;
    }
    else {
        result.type = type_r.result;
        if (source.current().kind === TokenTypes_1.ReservedKind.Ref) {
            result.by_ref = true;
            source.next(); // consumir 'ref'
        }
        var name_1 = Word(source);
        if (name_1.error) {
            return name_1;
        }
        else {
            result.name = name_1.result;
        }
        return { error: false, result: result };
    }
}
exports.Parameter = Parameter;
/**
 * Captura una llamada a una funcion o procedimiento
 */
function ModuleCall(source) {
    var name = Word(source);
    if (name.error) {
        return name;
    }
    else if (name.error == false) {
        if (source.current().kind != TokenTypes_1.SymbolKind.LeftPar) {
            var current = source.current();
            var unexpected = current.kind;
            var expected = ['right-par'];
            var column = current.column;
            var line = current.line;
            return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
        }
        else {
            source.next();
        }
        if (source.current().kind != TokenTypes_1.SymbolKind.RightPar) {
            var args = ArgumentList(source);
            if (args.error) {
                return args;
            }
            else if (args.error == false) {
                if (source.current().kind == TokenTypes_1.SymbolKind.RightPar) {
                    source.next();
                    return { error: false, result: { type: 'call', args: args.result, name: name.result } };
                }
                else {
                    var current = source.current();
                    var unexpected = current.kind;
                    var expected = ['right-par'];
                    var column = current.column;
                    var line = current.line;
                    return { error: true, result: { unexpected: unexpected, expected: expected, column: column, line: line } };
                }
            }
        }
        else {
            source.next();
            return { error: false, result: { type: 'call', args: [], name: name.result } };
        }
    }
}
exports.ModuleCall = ModuleCall;
/**
 * Captura un enunciado de asignacion
 */
function Assignment(source) {
    var result = { type: 'assignment', left: null, right: null };
    var left_hand_match = Variable(source);
    if (left_hand_match.error) {
        return left_hand_match;
    }
    else {
        result.left = left_hand_match.result;
        if (source.current().kind !== TokenTypes_1.SymbolKind.Assignment) {
            var current = source.current();
            var unexpected = current.kind;
            var expected = ['<-'];
            var line = current.line;
            var column = current.column;
            var reason = 'bad-assignment-operator';
            return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
        }
        else {
            source.next();
        }
        var right_hand_match = Expression(source);
        if (right_hand_match.error) {
            return right_hand_match;
        }
        else {
            result.right = right_hand_match.result;
            return { error: false, result: result };
        }
    }
}
exports.Assignment = Assignment;
/**
 * Captura un enunciado si
 */
function If(source) {
    var result = {
        type: 'if',
        condition: null,
        true_branch: [],
        false_branch: []
    };
    if (source.current().kind === TokenTypes_1.ReservedKind.Si) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['si'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-si';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.LeftPar) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['('];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-par-at-condition';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    var queue = [];
    while (/right\-par|eof|eol/.test(source.current().name) === false) {
        queue.push(source.current());
        source.next();
    }
    var expression_match = Expression(new TokenQueue_js_1.default(queue));
    if (expression_match.error) {
        return expression_match;
    }
    else {
        result.condition = expression_match.result;
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.RightPar) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = [')'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-par-at-condition';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.Entonces) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['entonces'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-entonces';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    skipWhiteSpace(source);
    while (/finsi|sino|eof/.test(source.current().name) === false) {
        var statement_match = AnyStatement(source);
        if (statement_match.error) {
            return statement_match;
        }
        result.true_branch.push(statement_match.result);
        skipWhiteSpace(source);
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.Sino) {
        source.next();
        skipWhiteSpace(source);
        while (/finsi|eof/.test(source.current().name) === false) {
            var statement_match = AnyStatement(source);
            if (statement_match.error) {
                return statement_match;
            }
            result.false_branch.push(statement_match.result);
            skipWhiteSpace(source);
        }
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.FinSi) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['finsi'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-finsi';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.EOL) {
        source.next();
    }
    return { error: false, result: result };
}
exports.If = If;
function While(source) {
    var result = {
        type: 'while',
        condition: null,
        body: []
    };
    if (source.current().kind === TokenTypes_1.ReservedKind.Mientras) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['mientras'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-mientras';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.LeftPar) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['('];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-par-at-condition';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    var queue = [];
    while (/right\-par|eof|eol/.test(source.current().name) === false) {
        queue.push(source.current());
        source.next();
    }
    var expression_match = Expression(new TokenQueue_js_1.default(queue));
    if (expression_match.error) {
        return expression_match;
    }
    else {
        result.condition = expression_match.result;
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.RightPar) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = [')'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-par-at-condition';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    skipWhiteSpace(source);
    while (/finmientras|eof/.test(source.current().name) === false) {
        var statement_match = AnyStatement(source);
        if (statement_match.error) {
            return statement_match;
        }
        result.body.push(statement_match.result);
        skipWhiteSpace(source);
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.FinMientras) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['finmientras'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-finmientras';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.EOL) {
        source.next();
    }
    return { error: false, result: result };
}
exports.While = While;
// para i <- 0 hasta 5
//  ...
// finpara
//
// 'para' <expresion> 'hasta' <expresion.entera>
//    [<enunciado>]
// 'finpara'
function For(source) {
    var result = {
        type: 'for',
        counter_init: null,
        last_value: null,
        body: []
    };
    if (source.current().kind === TokenTypes_1.ReservedKind.Para) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['para'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-para';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    var queue = [];
    while (source.current().kind !== TokenTypes_1.ReservedKind.Hasta) {
        queue.push(source.current());
        source.next();
    }
    var init_statement = Assignment(new TokenQueue_js_1.default(queue));
    if (init_statement.error) {
        return init_statement;
    }
    else {
        result.counter_init = init_statement.result;
        if (source.current().kind === TokenTypes_1.ReservedKind.Hasta) {
            source.next();
        }
        else {
            var current = source.current();
            var unexpected = current.kind;
            var expected = ['hasta'];
            var line = current.line;
            var column = current.column;
            var reason = 'missing-hasta';
            return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
        }
        var last_val_exp = Expression(source);
        if (last_val_exp.error) {
            return last_val_exp;
        }
        else {
            result.last_value = last_val_exp.result;
            skipWhiteSpace(source);
            while (/finpara|eof/.test(source.current().name) === false) {
                var statement_match = AnyStatement(source);
                if (statement_match.error) {
                    return statement_match;
                }
                result.body.push(statement_match.result);
                skipWhiteSpace(source);
            }
            if (source.current().kind === TokenTypes_1.ReservedKind.FinPara) {
                source.next();
            }
            else {
                var current = source.current();
                var unexpected = current.kind;
                var expected = ['finpara'];
                var line = current.line;
                var column = current.column;
                var reason = 'missing-finpara';
                return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
            }
            skipWhiteSpace(source);
            return { error: false, result: result };
        }
    }
}
exports.For = For;
function Until(source) {
    var result = {
        type: 'until',
        condition: null,
        body: []
    };
    if (source.current().kind === TokenTypes_1.ReservedKind.Repetir) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['repetir'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-repetir';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    skipWhiteSpace(source);
    // TODO: hacer que "hasta que" sea un solo token ("hastaque")
    while (/hasta|que|eof/.test(source.current().name) === false) {
        var statement_match = AnyStatement(source);
        if (statement_match.error) {
            return statement_match;
        }
        else {
            if (statement_match.result !== null) {
                result.body.push(statement_match.result);
            }
            skipWhiteSpace(source);
        }
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.Hasta) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['hasta'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-hasta';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.Que) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['que'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-que';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.LeftPar) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['('];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-par-at-condition';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    var queue = [];
    while (/right\-par|eof|eol/.test(source.current().name) === false) {
        queue.push(source.current());
        source.next();
    }
    var expression_match = Expression(new TokenQueue_js_1.default(queue));
    if (expression_match.error) {
        return expression_match;
    }
    else {
        result.condition = expression_match.result;
        if (source.current().kind === TokenTypes_1.SymbolKind.RightPar) {
            source.next();
        }
        else {
            var current = source.current();
            var unexpected = current.kind;
            var expected = [')'];
            var line = current.line;
            var column = current.column;
            var reason = 'missing-par-at-condition';
            return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
        }
        if (source.current().kind === TokenTypes_1.SymbolKind.EOL) {
            source.next();
        }
        return { error: false, result: result };
    }
}
exports.Until = Until;
function Return(source) {
    var result = {
        type: 'return',
        expression: null
    };
    if (source.current().kind != TokenTypes_1.ReservedKind.Retornar) {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['retornar'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-retornar';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    else {
        source.next(); // consumir 'retornar'
        var exp = Expression(source);
        if (exp.error) {
            return exp;
        }
        else {
            result.expression = exp.result;
            return { error: false, result: result };
        }
    }
}
exports.Return = Return;
function AnyStatement(source) {
    switch (source.current().kind) {
        case TokenTypes_1.OtherKind.Word:
            if (source.peek().kind === TokenTypes_1.SymbolKind.LeftPar) {
                return ModuleCall(source);
            }
            else {
                return Assignment(source);
            }
        case TokenTypes_1.ReservedKind.Si:
            return If(source);
        case TokenTypes_1.ReservedKind.Mientras:
            return While(source);
        case TokenTypes_1.ReservedKind.Repetir:
            return Until(source);
        case TokenTypes_1.ReservedKind.Para:
            return For(source);
        case TokenTypes_1.ReservedKind.Retornar:
            return Return(source);
        default: {
            var current = source.current();
            var reason = 'missing-statement';
            var unexpected = current.kind;
            var expected = ['variable', 'funcion', 'procedimiento', 'si', 'mientras', 'repetir'];
            var line = current.line;
            var column = current.column;
            return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
        }
    }
}
exports.AnyStatement = AnyStatement;
function MainModule(source) {
    var result = {
        type: 'module',
        name: 'main',
        module_type: 'main',
        body: []
    };
    if (source.current().kind === TokenTypes_1.ReservedKind.Variables) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['variables'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-variables';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    skipWhiteSpace(source);
    while (/inicio|eof/.test(source.current().name) === false) {
        var var_declaration_match = DeclarationStatement(source);
        if (var_declaration_match.error) {
            return var_declaration_match;
        }
        else {
            result.body.push(var_declaration_match.result);
        }
        skipWhiteSpace(source);
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.Inicio) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['inicio'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-inicio';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    skipWhiteSpace(source);
    while (/fin|eof/.test(source.current().name) === false) {
        var statement_match = AnyStatement(source);
        if (statement_match.error) {
            return statement_match;
        }
        else {
            result.body.push(statement_match.result);
        }
        skipWhiteSpace(source);
    }
    if (source.current().kind === TokenTypes_1.ReservedKind.Fin) {
        source.next();
    }
    else {
        var current = source.current();
        var unexpected = current.kind;
        var expected = ['fin'];
        var line = current.line;
        var column = current.column;
        var reason = 'missing-fin';
        return { error: true, result: { unexpected: unexpected, expected: expected, line: line, column: column, reason: reason } };
    }
    if (source.current().kind === TokenTypes_1.SymbolKind.EOL) {
        source.next();
    }
    return { error: false, result: result };
}
exports.MainModule = MainModule;
function FunctionModule(source) {
    // Lectura del encabezado: <tipo> funcion <nombre>(<parametros>)
    var typename = TypeName(source);
    if (typename.error)
        return typename;
    if (source.current().kind != TokenTypes_1.ReservedKind.Funcion)
        return UnexpectedTokenReport(source.current(), ['funcion'], 'missing-funcion');
    source.next();
    var name = Word(source);
    if (name.error)
        return name;
    if (source.current().kind != TokenTypes_1.SymbolKind.LeftPar)
        return UnexpectedTokenReport(source.current(), ['('], 'missing-left-par');
    source.next();
    var parameters = ParameterList(source);
    if (parameters.error)
        return parameters;
    if (source.current().kind != TokenTypes_1.SymbolKind.RightPar)
        return UnexpectedTokenReport(source.current(), [')'], 'missing-right-par');
    source.next();
    // Fin del encabezado
    // Leer declaraciones de variables
    var declarations = [];
    while (/inicio|eof/.test(source.current().name) === false) {
        var var_declaration_match = DeclarationStatement(source);
        if (var_declaration_match.error) {
            return var_declaration_match;
        }
        else {
            declarations.push(var_declaration_match.result);
        }
        skipWhiteSpace(source);
    }
    if (source.current().kind != TokenTypes_1.ReservedKind.Inicio)
        return UnexpectedTokenReport(source.current(), ['inicio'], 'missing-inicio');
    source.next(); // consumir inicio
    skipWhiteSpace(source);
    var statements = [];
    // Leer el resto de los enunciados
    while (/finfuncion|eof/.test(source.current().name) === false) {
        var statement = AnyStatement(source);
        if (statement.error) {
            return statement;
        }
        else {
            statements.push(statement.result);
        }
        skipWhiteSpace(source);
    }
    if (source.current().kind != TokenTypes_1.ReservedKind.FinFuncion)
        return UnexpectedTokenReport(source.current(), ['finfuncion'], 'missing-finfuncion');
    source.next(); // consumir 'finfuncion'
    var function_body = declarations.concat(statements);
    var result = {
        type: 'module',
        module_type: 'function',
        name: name.result,
        parameters: parameters.result,
        body: function_body,
        return_type: typename.result
    };
    return { error: false, result: result };
}
exports.FunctionModule = FunctionModule;
function ProcedureModule(source) {
    // Lectura del encabezado: procedimiento <nombre>(<parametros>)
    if (source.current().kind != TokenTypes_1.ReservedKind.Funcion)
        return UnexpectedTokenReport(source.current(), ['procedimiento'], 'missing-procedimiento');
    source.next();
    var name = Word(source);
    if (name.error)
        return name;
    if (source.current().kind != TokenTypes_1.SymbolKind.LeftPar)
        return UnexpectedTokenReport(source.current(), ['('], 'missing-left-par');
    source.next();
    var parameters = ParameterList(source);
    if (parameters.error)
        return parameters;
    if (source.current().kind != TokenTypes_1.SymbolKind.RightPar)
        return UnexpectedTokenReport(source.current(), [')'], 'missing-right-par');
    source.next();
    // Fin del encabezado
    // Leer declaraciones de variables
    var declarations = [];
    while (/inicio|eof/.test(source.current().name) === false) {
        var var_declaration_match = DeclarationStatement(source);
        if (var_declaration_match.error) {
            return var_declaration_match;
        }
        else {
            declarations.push(var_declaration_match.result);
        }
        skipWhiteSpace(source);
    }
    if (source.current().kind != TokenTypes_1.ReservedKind.Inicio)
        return UnexpectedTokenReport(source.current(), ['inicio'], 'missing-inicio');
    source.next(); // consumir inicio
    skipWhiteSpace(source);
    var statements = [];
    // Leer el resto de los enunciados
    while (/finprocedimiento|eof/.test(source.current().name) === false) {
        var statement = AnyStatement(source);
        if (statement.error) {
            return statement;
        }
        else {
            statements.push(statement.result);
        }
        skipWhiteSpace(source);
    }
    if (source.current().kind != TokenTypes_1.ReservedKind.FinFuncion)
        return UnexpectedTokenReport(source.current(), ['finprocedimiento'], 'missing-finprocedimiento');
    source.next(); // consumir 'finprocedimiento'
    var function_body = declarations.concat(statements);
    var result = {
        type: 'module',
        module_type: 'procedure',
        name: name.result,
        parameters: parameters.result,
        body: function_body
    };
    return { error: false, result: result };
}
exports.ProcedureModule = ProcedureModule;
function DeclarationStatement(source) {
    var result = {
        type: 'declaration',
        variables: []
    };
    var type_match = TypeName(source);
    var current_type = null;
    if (type_match.error) {
        return type_match;
    }
    else {
        current_type = type_match.result;
    }
    var variables_match = VariableList(source);
    if (variables_match.error) {
        return variables_match;
    }
    else {
        for (var _i = 0, _a = variables_match.result; _i < _a.length; _i++) {
            var variable = _a[_i];
            var declaration = {
                datatype: current_type,
                name: variable.name,
                is_array: variable.is_array,
                dimensions: variable.dimensions
            };
            result.variables.push(declaration);
        }
    }
    var eol_found = false;
    var comma_found = false;
    switch (source.current().kind) {
        case TokenTypes_1.SymbolKind.Comma:
            comma_found = true;
            break;
        case TokenTypes_1.SymbolKind.EOL:
            eol_found = true;
            break;
        default:
            return {
                error: true,
                result: {
                    unexpected: source.current().kind,
                    expected: ['eol', 'comma'],
                    column: source.current().column,
                    line: source.current().line,
                    reason: '@declaration-unexpected-token'
                }
            };
    }
    source.next();
    if (comma_found) {
        var next_declaration_match = DeclarationStatement(source);
        if (next_declaration_match.error) {
            return next_declaration_match;
        }
        else {
            result.variables = result.variables.concat(next_declaration_match.result.variables);
            return { error: false, result: result };
        }
    }
    if (eol_found) {
        return { error: false, result: result };
    }
}
exports.DeclarationStatement = DeclarationStatement;
function skipWhiteSpace(source) {
    var current = source.current();
    while (current.kind === TokenTypes_1.SymbolKind.EOL) {
        current = source.next();
    }
}
exports.skipWhiteSpace = skipWhiteSpace;
function UnexpectedTokenReport(current_token, expected, reason) {
    var result = {
        unexpected: current_token.kind,
        line: current_token.line,
        column: current_token.column,
        expected: expected
    };
    result.reason = reason;
    return { error: true, result: result };
}
