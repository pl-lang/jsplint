"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
exports.Integer = {
    kind: 'atomic',
    atomic: 'entero'
};
exports.Float = {
    kind: 'atomic',
    atomic: 'real'
};
exports.Bool = {
    kind: 'atomic',
    atomic: 'logico'
};
exports.Char = {
    kind: 'atomic',
    atomic: 'caracter'
};
exports.None = {
    kind: 'atomic',
    atomic: 'ninguno'
};
var ArrayType = (function () {
    function ArrayType(element_type, length) {
        this.kind = 'array';
        this.length = length;
        this.contains = element_type;
    }
    return ArrayType;
}());
exports.ArrayType = ArrayType;
var String = (function (_super) {
    __extends(String, _super);
    function String(length) {
        _super.call(this, exports.Char, length);
    }
    return String;
}(ArrayType));
exports.String = String;
var FunctionType = (function () {
    function FunctionType(return_type, paramtypes) {
        this.kind = 'function',
            this.return_type = return_type;
        this.parameters = {
            amount: paramtypes.length,
            types: paramtypes
        };
    }
    return FunctionType;
}());
exports.FunctionType = FunctionType;
var ProcedureType = (function () {
    function ProcedureType(paramtypes) {
        this.kind = 'function',
            this.return_type = exports.None;
        this.parameters = {
            amount: paramtypes.length,
            types: paramtypes
        };
    }
    return ProcedureType;
}());
exports.ProcedureType = ProcedureType;
exports.IOType = {
    return_type: exports.None,
    parameter_constraint: function (type) { return type instanceof String || is_atomic(type); }
};
function is_atomic(type) {
    return type.kind == 'atomic';
}
function equals(type_a, type_b) {
    if (type_a.kind != type_b.kind)
        return false;
    else if (type_a instanceof ArrayType)
        return array_equality(type_a, type_b);
    else
        return atomic_equality(type_a, type_b);
}
exports.equals = equals;
function array_equality(a, b) {
    if (a.length == b.length) {
        return equals(a.contains, b.contains);
    }
    else
        return false;
}
function atomic_equality(a, b) {
    if (a.atomic == b.atomic && equal_dimensions(a, b))
        return true;
    else
        return false;
}
function equal_dimensions(type_a, type_b) {
    if (type_a.dimensions == type_b.dimensions) {
        for (var i = 0; i < type_a.dimensions; i++) {
            if (type_a.dimensions_sizes[i] != type_b.dimensions_sizes[i]) {
                return false;
            }
        }
        return true;
    }
    return false;
}
exports.equal_dimensions = equal_dimensions;
