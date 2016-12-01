'use strict';
var List_js_1 = require('./List.js');
var GenericNode = (function () {
    function GenericNode(data) {
        if (data) {
            this.data = data;
        }
        else {
            this.data = null;
        }
        this._next = null;
    }
    GenericNode.prototype.setNext = function (n) {
        this._next = n;
    };
    GenericNode.prototype.getNext = function () {
        return this._next;
    };
    GenericNode.prototype.getNextStatementNode = function () {
        return this.getNext();
    };
    return GenericNode;
}());
exports.GenericNode = GenericNode;
var IfNode = (function () {
    function IfNode(data) {
        if (data) {
            this.data = data;
        }
        else {
            this.data = null;
        }
        this.false_branch_root = null;
        this.true_branch_root = null;
        this.next_statement_node = null;
    }
    IfNode.prototype.setNext = function (node) {
        if (this.false_branch_root === null) {
            this.false_branch_root = node;
        }
        else {
            var lastLeft = List_js_1.getLastNode(this.false_branch_root);
            lastLeft.setNext(node);
        }
        if (this.true_branch_root === null) {
            this.true_branch_root = node;
        }
        else {
            var lastRight = List_js_1.getLastNode(this.true_branch_root);
            lastRight.setNext(node);
        }
        this.next_statement_node = node;
    };
    IfNode.prototype.setCurrentBranchTo = function (branch_name) {
        if (branch_name === 'true_branch') {
            this.next_node = this.true_branch_root;
        }
        else if (branch_name === 'false_branch') {
            this.next_node = this.false_branch_root;
        }
        else if (branch_name === 'next_statement') {
            this.next_node = this.next_statement_node;
        }
    };
    IfNode.prototype.getNext = function () {
        return this.next_node;
    };
    IfNode.prototype.getNextStatementNode = function () {
        return this.next_statement_node;
    };
    return IfNode;
}());
exports.IfNode = IfNode;
var UntilNode = (function () {
    function UntilNode(data) {
        if (data) {
            this.data = data;
        }
        else {
            this.data = null;
        }
        this.loop_body_root = null;
        this.enter_loop_body = true;
        this.next_statement_node = null;
    }
    /**
     * Cambia la rama que va a devolver la llamada a getNext
     * @param {String} branch_name El nombre de la rama que se va a devolver.
     * Puede ser "loop_body" o "program_body"
     */
    UntilNode.prototype.setCurrentBranchTo = function (branch_name) {
        if (branch_name === 'loop_body') {
            this.enter_loop_body = true;
        }
        else if (branch_name === 'program_body') {
            this.enter_loop_body = false;
        }
    };
    UntilNode.prototype.getNext = function () {
        if (this.enter_loop_body === true) {
            return this.loop_body_root;
        }
        else {
            return this.next_statement_node;
        }
    };
    UntilNode.prototype.getNextStatementNode = function () {
        return this.next_statement_node;
    };
    UntilNode.prototype.setNext = function (node) {
        this.next_statement_node = node;
    };
    return UntilNode;
}());
exports.UntilNode = UntilNode;
var WhileNode = (function () {
    function WhileNode(data) {
        if (data) {
            this.data = data;
        }
        else {
            this.data = null;
        }
        this._loop_body_root = null;
        this.next_statement_node = null;
        this.enter_loop_body = true;
        this.next_statement_node = null;
    }
    /**
     * Cambia la rama que va a devolver la llamada a getNext
     * @param {String} branch_name El nombre de la rama que se va a devolver.
     * Puede ser "loop_body" o "program_body"
     */
    WhileNode.prototype.setCurrentBranchTo = function (branch_name) {
        if (branch_name === 'loop_body') {
            this.enter_loop_body = true;
        }
        else if (branch_name === 'program_body') {
            this.enter_loop_body = false;
        }
    };
    WhileNode.prototype.getNext = function () {
        if (this.enter_loop_body === true) {
            return this._loop_body_root;
        }
        else {
            return this.next_statement_node;
        }
    };
    WhileNode.prototype.getNextStatementNode = function () {
        return this.next_statement_node;
    };
    WhileNode.prototype.setNext = function (node) {
        this.next_statement_node = node;
        // Cuando se escribe un mientras con el cuerpo vacio lastNode va a ser null
        // y va a tirar una excepcion...
        // El resultado correcto de un mientras con el cuerpo vacio es un bucle
        // infinito
    };
    Object.defineProperty(WhileNode.prototype, "loop_body_root", {
        get: function () {
            return this._loop_body_root;
        },
        set: function (root_node) {
            this._loop_body_root = root_node;
            //  necesario para hacer que el ultimo nodo del bucle apunte al nodo de cond
            var lastNode = List_js_1.getLastNode(this._loop_body_root);
            // o sea, este
            lastNode.setNext(this);
        },
        enumerable: true,
        configurable: true
    });
    return WhileNode;
}());
exports.WhileNode = WhileNode;
