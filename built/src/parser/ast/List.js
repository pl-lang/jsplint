'use strict';
function getLastNode(node) {
    if (node.getNextStatementNode() === null) {
        return node;
    }
    else {
        var current = node;
        while (current !== null) {
            if (current.getNextStatementNode() === null) {
                return current;
            }
            else {
                current = current.getNextStatementNode();
            }
        }
    }
}
exports.getLastNode = getLastNode;
function getChainLenght(node) {
    var lenght = 0;
    var current = node;
    while (current !== null) {
        lenght++;
        current = current.getNext();
    }
    return lenght;
}
exports.getChainLenght = getChainLenght;
var LinkedList = (function () {
    function LinkedList(nodes) {
        if (nodes) {
            this.length = getChainLenght(nodes);
            this.first = nodes;
            this.last = getLastNode(nodes);
        }
        else {
            this.length = 0;
            this.first = null;
            this.last = null;
        }
    }
    LinkedList.prototype.addNode = function (node) {
        if (this.first === null) {
            this.first = node;
            this.last = getLastNode(node);
            this.length += getChainLenght(node);
        }
        else {
            this.last.setNext(node);
            this.last = getLastNode(node);
            this.length += getChainLenght(node);
        }
    };
    return LinkedList;
}());
exports.LinkedList = LinkedList;
