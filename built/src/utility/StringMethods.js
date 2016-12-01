'use strict';
exports.isDigit = function (char) { return /\d/.test(char); };
exports.isLetter = function (char) { return /[a-zA-Z]/.test(char); };
exports.isWhiteSpace = function (char) { return /\s/.test(char) && (char !== '\n'); };
