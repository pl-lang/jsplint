'use strict';
/*
  Un evaluador sirve para ejecutar las acciones/enunciados de un modulo.
  Se crea con la info necesaria para dicha tarea. El retorno de su modulo se
  devuelve a traves de la funcion run.
*/
/*
  Los evaluadores son eleiminados cuando terminan de ejecutar su modulo. Son de
  un solo uso.
*/
/**
 * Eventos que emite:
 * 	- read
 * 	- write
 * 	- evaluation-error
 * 	- module-call
 */
var Evaluator = (function () {
    function Evaluator(modules) {
        var _this = this;
        this._modules = modules;
        this._current_node = modules.main.root;
        this._current_statement = null;
        this._current_module = modules.main;
        this._globals = modules.main.locals;
        this.getLocals = function (module_name) {
            return _this._modules[module_name].locals;
        };
        this.getGlobals = function () {
            return _this._globals;
        };
        this._state = {
            done: modules.main.root === null ? true : false,
            error: false,
            output: null,
            expression_stack: [],
            module_stack: [],
            node_stack: [],
        };
    }
    Evaluator.prototype.input = function (value) {
        this._state.expression_stack.push(value);
    };
    Evaluator.prototype.step = function () {
        if (this._state.done || this._state.error) {
            return { done: this._state.done, error: this._state.error, output: this._state.output };
        }
        else {
            var output = void 0;
            try {
                output = this.evaluate(this._current_node.data);
            }
            catch (exception) {
                if (exception.name == 'EvaluatorError') {
                    output = { error: true, result: exception.info };
                }
                else
                    throw exception;
            }
            finally { }
            this._state.error = output.error;
            this._state.output = output.result;
            this._current_node = this._current_node.getNext();
            if (this._current_node == null) {
                while (this._current_node == null && this._state.node_stack.length > 0 && this._state.module_stack.length > 0) {
                    this._current_node = this._state.node_stack.pop();
                    this._current_module = this._state.module_stack.pop();
                }
            }
            if (this._current_node == null)
                this._state.done = true;
            return { done: this._state.done, error: this._state.error, output: output.result };
        }
    };
    Evaluator.prototype.evaluate = function (statement) {
        switch (statement.action) {
            case 'push':
                this.pushStatement(statement);
                break;
            case 'if':
                this.ifStatement(statement);
                break;
            case 'while':
                this.whileStatement(statement);
                break;
            case 'module_call':
                return this.callStatement(statement);
            case 'dummy':
                throw new Error('Esto no deberia ejecutarse');
            case 'values':
                this.values(statement);
                break;
            case 'assign':
                this.assign(statement);
                break;
            case 'subscript':
                this.subscript(statement);
                break;
            case 'times':
                this.times();
                break;
            case 'unary-minus':
                this.uminus();
                break;
            case 'division':
                this.division();
                break;
            case 'power':
                this.power();
                break;
            case 'div':
                this.div();
                break;
            case 'mod':
                this.mod();
                break;
            case 'divide':
                this.divide();
                break;
            case 'minus':
                this.minus();
                break;
            case 'plus':
                this.plus();
                break;
            case 'minor-than':
                this.less();
                break;
            case 'minor-equal':
                this.less_o_equal();
                break;
            case 'major-than':
                this.greater();
                break;
            case 'major-equal':
                this.greate_or_equal();
                break;
            case 'equal':
                this.equal();
                break;
            case 'not':
                this.not();
                break;
            case 'diff-than':
                this.different();
                break;
            case 'and':
                this.and();
                break;
            case 'or':
                this.or();
                break;
            default:
                throw new Error("En Evaluator.evaluate --> no se reconoce el enunciado " + statement.action);
        }
        return { error: false, result: null };
    };
    Evaluator.prototype.pushStatement = function (statement) {
        this._state.expression_stack.push(statement.value);
    };
    Evaluator.prototype.subscript = function (statement) {
        var variable = this.getVariable(statement.name);
        var indexes = [];
        for (var i = 0; i < statement.total_indexes; i++) {
            indexes.unshift(this._state.expression_stack.pop() - 1);
        }
        if (this.indexWithinBounds(indexes, variable.dimension)) {
            var index = this.calculateIndex(indexes, variable.dimension);
            this._state.expression_stack.push(variable.values[index]);
        }
        else {
            var result = {
                reason: '@invocation-index-out-of-bounds',
                // index: index_list,
                name: variable.name,
                dimension: variable.dimension
            };
            return { error: true, finished: true, result: result };
        }
        return { error: false, result: null };
    };
    Evaluator.prototype.assign = function (statement) {
        var variable = this.getVariable(statement.varname);
        var new_value = this._state.expression_stack.pop();
        var indexes = [];
        for (var i = 0; i < statement.total_indexes; i++) {
            indexes.unshift(this._state.expression_stack.pop() - 1);
        }
        if (statement.bounds_checked || this.indexWithinBounds(indexes, variable.dimension)) {
            var index = this.calculateIndex(indexes, variable.dimension);
            variable.values[index] = new_value;
        }
        else {
            var result = {
                reason: '@assignment-index-out-of-bounds',
                // index: index_list,
                name: variable.name,
                dimension: variable.dimension
            };
            return { error: true, finished: true, result: result };
        }
        return { error: false, result: null };
    };
    Evaluator.prototype.values = function (statement) {
        var variable = this.getVariable(statement.name);
        this._state.expression_stack.push(variable.values);
    };
    Evaluator.prototype.callStatement = function (statement) {
        if (statement.name == 'leer') {
            var targer_variable = this.getVariable(statement.variable_name);
            var type = targer_variable.type;
            return { error: false, finished: true, result: { action: 'read', type: type } };
        }
        else if (statement.name == 'escribir') {
            var value = this._state.expression_stack.pop();
            return { error: false, finished: true, result: { action: 'write', value: value } };
        }
        else {
            this._state.node_stack.push(this._current_node.getNext());
            this._state.module_stack.push(this._current_module);
            this._current_node = this._modules[statement.name].root;
            this._current_module = this._modules[statement.name];
            var args = [];
            for (var i = 0; i < statement.total_arguments; i++) {
                args.unshift(this._state.expression_stack.pop());
            }
            for (var i = 0; i < statement.total_arguments; i++) {
                var value = args[i];
                var variable = this.getVariable(this._current_module.parameters[i]);
                // HACK: De momento, los parametros de las funciones/procedimientos NO pueden
                // ser arreglos
                variable.values[0] = value;
            }
            return { error: false, finished: true, result: null };
        }
    };
    Evaluator.prototype.ifStatement = function (statement) {
        var condition_result = this._state.expression_stack.pop();
        this._current_node.setCurrentBranchTo(condition_result ? 'true_branch' : 'false_branch');
        return { error: false, finished: true, result: null };
    };
    Evaluator.prototype.whileStatement = function (statement) {
        var condition_result = this._state.expression_stack.pop();
        this._current_node.setCurrentBranchTo(condition_result ? 'loop_body' : 'program_body');
        return { error: false, finished: true, result: null };
    };
    Evaluator.prototype.untilStatement = function (statement) {
        var condition_result = this._state.expression_stack.pop();
        this._current_node.setCurrentBranchTo(!condition_result ? 'loop_body' : 'program_body');
        return { error: false, finished: true, result: null };
    };
    Evaluator.prototype.getVariable = function (varname) {
        var current_locals = this.getLocals(this._current_module.name);
        return varname in current_locals ? current_locals[varname] : this._globals[varname];
    };
    Evaluator.prototype.times = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a * b);
    };
    Evaluator.prototype.uminus = function () {
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(-a);
    };
    Evaluator.prototype.power = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(Math.pow(a, b));
    };
    Evaluator.prototype.div = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push((a - (a % b)) / b);
    };
    Evaluator.prototype.mod = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a % b);
    };
    Evaluator.prototype.divide = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a / b);
    };
    Evaluator.prototype.minus = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a - b);
    };
    Evaluator.prototype.plus = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a + b);
    };
    Evaluator.prototype.less = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a < b);
    };
    Evaluator.prototype.less_o_equal = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a <= b);
    };
    Evaluator.prototype.greater = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a > b);
    };
    Evaluator.prototype.greate_or_equal = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a >= b);
    };
    Evaluator.prototype.equal = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a == b);
    };
    Evaluator.prototype.not = function () {
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(!a);
    };
    Evaluator.prototype.different = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a != b);
    };
    Evaluator.prototype.and = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a && b);
    };
    Evaluator.prototype.or = function () {
        var b = this._state.expression_stack.pop();
        var a = this._state.expression_stack.pop();
        this._state.expression_stack.push(a || b);
    };
    Evaluator.prototype.pushVariableValue = function (info) {
        var variable = this.getVariable(info.name);
        var indexes = [];
        for (var _i = 0, _a = info.indexes; _i < _a.length; _i++) {
            var index_expression = _a[_i];
            var index_value = this.evaluateExpression(index_expression) - 1;
            indexes.push(index_value);
        }
        if (info.bounds_checked || this.indexWithinBounds(indexes, variable.dimension)) {
            var index = this.calculateIndex(indexes, variable.dimension);
            this._state.expression_stack.push(variable.values[index]);
        }
        else {
            var out_of_bunds_info = this.getBoundsError(index_values, variable.dimension);
            var exception = { name: 'EvaluatorError', info: out_of_bunds_info };
            throw exception;
        }
    };
    Evaluator.prototype.indexWithinBounds = function (index_values, dimension_lengths) {
        var i = 0;
        // NOTE: en las condiciones de abajo sumo 1 porque en index_values se le
        // restó 1 a cada elemento para que sea un indice válido en JS
        while (i < index_values.length) {
            if ((index_values[i] + 1) < 1) {
                return false;
            }
            else if ((index_values[i] + 1) > dimension_lengths[i]) {
                return false;
            }
            else {
                i++;
            }
        }
        return true;
    };
    Evaluator.prototype.getBoundsError = function (index_values, dimension_lengths) {
        var i = 0;
        while (i < index_values.length) {
            if ((index_values[i] + 1) < 1) {
                this.running = false;
                var reason = 'index-less-than-one';
                var bad_index = i;
                return { error: true, result: { reason: reason, bad_index: bad_index } };
            }
            else if ((index_values[i] + 1) > dimension_lengths[i]) {
                out_of_bounds_index = true;
                var reason = 'index-out-of-bounds';
                var bad_index = i;
                var expected = variable.dimension[i];
                return { error: true, result: { reason: reason, bad_index: bad_index, expected: expected } };
            }
            else {
                i++;
            }
        }
    };
    Evaluator.prototype.calculateIndex = function (index_array, dimensions) {
        var result = 0;
        var index_amount = index_array.length;
        var i = 0;
        while (i < index_amount) {
            var term = 1;
            var j = i + 1;
            while (j < index_amount) {
                term *= dimensions[j];
                j++;
            }
            term *= index_array[i];
            result += term;
            i++;
        }
        return result;
    };
    return Evaluator;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Evaluator;
