"use strict";
var ramda_1 = require('ramda');
function bindN(f) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var func = f;
    var output;
    for (var i = 0; i < args.length - 1; i++) {
        if (args[i].error)
            return args[i];
        else
            func = func(args[i].result);
    }
    return exports.bind(func, ramda_1.last(args));
}
exports.bindN = bindN;
// similar como seria bind (>>=) de haskell si solo pudiera ser aplicado a
// Maybes
// En resumen, una funcion que toma una funcion y un reporte. Si el reporte indica
// un error, lo devuelve. Si no, aplica f sobre el valor que el reporte contiene
// Cabe aclarar que f es una funcion que tambien devuelve reportes.
// Un reporte es un objeto que contiene las propiedades `error` y `result`.
exports.bind = ramda_1.curry(function (f, r) { return r.error ? r : f(r.result); });
// flatten :: [any] -> [[any]] -> [any]
function flatten(accumulator, arr) {
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var a = arr_1[_i];
        for (var _a = 0, a_1 = a; _a < a_1.length; _a++) {
            var element = a_1[_a];
            accumulator.push(element);
        }
    }
    return accumulator;
}
exports.flatten = flatten;
// toma dos objetos y devuelve uno nuevo que contiene las propiedades (y valores)
// de los dos anteriores. Si hay propiedades repetidas entre a y b, se toman las
// de b
function mergeObjs(a, b) {
    var r = {};
    for (var prop in a) {
        r[prop] = a[prop];
    }
    for (var prop in b) {
        r[prop] = b[prop];
    }
    return r;
}
exports.mergeObjs = mergeObjs;
// take, zip y zipObj estan basadas en funciones de haskell
// crea un nuevo objeto dadas una lista de valores y una lista de cadenas.
// Tendra tantos pares prop/valor como haya elementos en la lista mas
// corta
function zipObj(values, names) {
    if (values.length > names.length) {
        values = take(names.length, values);
    }
    else if (values.length < names.length) {
        names = take(values.length, names);
    }
    var pairs = zip(names, values);
    /**
     * result es un objeto cuyas claves son cadenas y cuyos valores son de tipo A
     */
    var result = {};
    for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
        var _a = pairs_1[_i], prop = _a[0], value = _a[1];
        result[prop] = value;
    }
    return result;
}
exports.zipObj = zipObj;
// toma dos listas y devuelve una lista de pares donde el primer elemento
// pertenece a "a" y el segundo a "b". La lista tendra tantos elementos
// como la mas corta entre a y b
function zip(a, b) {
    if (a.length > b.length) {
        a = take(b.length, a);
    }
    else if (a.length < b.length) {
        b = take(a.length, b);
    }
    var result = [];
    for (var i = 0; i < a.length; i++) {
        result.push([a[i], b[i]]);
    }
    return result;
}
exports.zip = zip;
// toma los primeros n elementos de un arreglo
function take(n, list) {
    return list.slice(0, n);
}
exports.take = take;
