'use strict';
var StringMethods_1 = require('../utility/StringMethods');
(function (ValueKind) {
    ValueKind[ValueKind["Integer"] = 0] = "Integer";
    ValueKind[ValueKind["Real"] = 1] = "Real";
    ValueKind[ValueKind["String"] = 2] = "String";
})(exports.ValueKind || (exports.ValueKind = {}));
var ValueKind = exports.ValueKind;
(function (SymbolKind) {
    SymbolKind[SymbolKind["Plus"] = 0] = "Plus";
    SymbolKind[SymbolKind["Minus"] = 1] = "Minus";
    SymbolKind[SymbolKind["Times"] = 2] = "Times";
    SymbolKind[SymbolKind["Slash"] = 3] = "Slash";
    SymbolKind[SymbolKind["Power"] = 4] = "Power";
    SymbolKind[SymbolKind["Assignment"] = 5] = "Assignment";
    SymbolKind[SymbolKind["Minor"] = 6] = "Minor";
    SymbolKind[SymbolKind["MinorEq"] = 7] = "MinorEq";
    SymbolKind[SymbolKind["Different"] = 8] = "Different";
    SymbolKind[SymbolKind["Equal"] = 9] = "Equal";
    SymbolKind[SymbolKind["Major"] = 10] = "Major";
    SymbolKind[SymbolKind["MajorEq"] = 11] = "MajorEq";
    SymbolKind[SymbolKind["LeftPar"] = 12] = "LeftPar";
    SymbolKind[SymbolKind["RightPar"] = 13] = "RightPar";
    SymbolKind[SymbolKind["LeftBracket"] = 14] = "LeftBracket";
    SymbolKind[SymbolKind["RightBracket"] = 15] = "RightBracket";
    SymbolKind[SymbolKind["Comma"] = 16] = "Comma";
    SymbolKind[SymbolKind["EOF"] = 17] = "EOF";
    SymbolKind[SymbolKind["EOL"] = 18] = "EOL";
})(exports.SymbolKind || (exports.SymbolKind = {}));
var SymbolKind = exports.SymbolKind;
(function (ReservedKind) {
    ReservedKind[ReservedKind["Si"] = 0] = "Si";
    ReservedKind[ReservedKind["Or"] = 1] = "Or";
    ReservedKind[ReservedKind["Fin"] = 2] = "Fin";
    ReservedKind[ReservedKind["Que"] = 3] = "Que";
    ReservedKind[ReservedKind["Div"] = 4] = "Div";
    ReservedKind[ReservedKind["And"] = 5] = "And";
    ReservedKind[ReservedKind["Not"] = 6] = "Not";
    ReservedKind[ReservedKind["Mod"] = 7] = "Mod";
    ReservedKind[ReservedKind["Ref"] = 8] = "Ref";
    ReservedKind[ReservedKind["Sino"] = 9] = "Sino";
    ReservedKind[ReservedKind["Para"] = 10] = "Para";
    ReservedKind[ReservedKind["Real"] = 11] = "Real";
    ReservedKind[ReservedKind["FinSi"] = 12] = "FinSi";
    ReservedKind[ReservedKind["Hasta"] = 13] = "Hasta";
    ReservedKind[ReservedKind["Falso"] = 14] = "Falso";
    ReservedKind[ReservedKind["Inicio"] = 15] = "Inicio";
    ReservedKind[ReservedKind["Entero"] = 16] = "Entero";
    ReservedKind[ReservedKind["Logico"] = 17] = "Logico";
    ReservedKind[ReservedKind["FinPara"] = 18] = "FinPara";
    ReservedKind[ReservedKind["Repetir"] = 19] = "Repetir";
    ReservedKind[ReservedKind["Funcion"] = 20] = "Funcion";
    ReservedKind[ReservedKind["Entonces"] = 21] = "Entonces";
    ReservedKind[ReservedKind["Mientras"] = 22] = "Mientras";
    ReservedKind[ReservedKind["Caracter"] = 23] = "Caracter";
    ReservedKind[ReservedKind["Retornar"] = 24] = "Retornar";
    ReservedKind[ReservedKind["Variables"] = 25] = "Variables";
    ReservedKind[ReservedKind["Verdadero"] = 26] = "Verdadero";
    ReservedKind[ReservedKind["FinFuncion"] = 27] = "FinFuncion";
    ReservedKind[ReservedKind["FinMientras"] = 28] = "FinMientras";
    ReservedKind[ReservedKind["Procedimiento"] = 29] = "Procedimiento";
    ReservedKind[ReservedKind["FinProcedimiento"] = 30] = "FinProcedimiento";
})(exports.ReservedKind || (exports.ReservedKind = {}));
var ReservedKind = exports.ReservedKind;
(function (OtherKind) {
    OtherKind[OtherKind["Word"] = 0] = "Word";
    OtherKind[OtherKind["Unknown"] = 1] = "Unknown";
})(exports.OtherKind || (exports.OtherKind = {}));
var OtherKind = exports.OtherKind;
var EoFToken = (function () {
    function EoFToken(source) {
        this.name = 'eof';
        this.kind = SymbolKind.EOF;
        if (source) {
            this.column = source._current_column;
            this.line = source._current_line;
        }
    }
    return EoFToken;
}());
exports.EoFToken = EoFToken;
var NumberToken = (function () {
    function NumberToken(source) {
        // todos los numeros son enteros hasta que se 'demuestre' lo contrario
        this.kind = ValueKind.Integer;
        this.name = 'entero';
        this.text = '';
        this.line = source._current_line;
        this.column = source._current_column;
        this.extract(source);
    }
    NumberToken.prototype.extract = function (source) {
        this.text += source.currentChar();
        source.nextChar();
        var c;
        while (StringMethods_1.isDigit(c = source.currentChar())) {
            this.text += c;
            source.nextChar();
        }
        if (c === '.') {
            this.text += '.';
            source.nextChar();
            if (StringMethods_1.isDigit(source.currentChar())) {
                while (StringMethods_1.isDigit(c = source.currentChar())) {
                    this.text += c;
                    source.nextChar();
                }
                this.kind = ValueKind.Real;
                this.name = 'real';
            }
            else {
                this.error_found = true;
                this.error_info.unexpected = source.currentChar();
                this.error_info.expected = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                this.error_info.line = source._current_line;
                this.error_info.column = source._current_column;
                this.error_info.reason = 'unexpectedCharAtFloat';
            }
        }
        if (this.kind === ValueKind.Integer)
            this.value = parseInt(this.text);
        else if (this.kind === ValueKind.Real)
            this.value = parseFloat(this.text);
    };
    return NumberToken;
}());
exports.NumberToken = NumberToken;
var SpecialSymbolToken = (function () {
    function SpecialSymbolToken(source) {
        this.line = source._current_line;
        this.column = source._current_column;
        this.extract(source);
    }
    SpecialSymbolToken.isSpecialSymbolChar = function (c) {
        switch (c) {
            case '+':
            case '-':
            case '/':
            case '*':
            case '^':
            case '=':
            case '<':
            case '>':
            case '(':
            case ')':
            case '[':
            case ']':
            case ',':
            case '\n':
                return true;
            default:
                return false;
        }
    };
    SpecialSymbolToken.prototype.extract = function (source) {
        this.text = source.currentChar();
        switch (this.text) {
            case '+':
                this.kind = SymbolKind.Plus;
                this.name = 'plus';
                break;
            case '-':
                this.kind = SymbolKind.Minus;
                this.name = 'minus';
                break;
            case '/':
                this.kind = SymbolKind.Slash;
                this.name = 'slash';
                break;
            case '*':
                this.kind = SymbolKind.Times;
                this.name = 'times';
                break;
            case '^':
                this.kind = SymbolKind.Power;
                this.name = 'power';
                break;
            case '<':
                {
                    var peek = source.peekChar();
                    switch (peek) {
                        case '-':
                            this.kind = SymbolKind.Assignment;
                            this.name = 'assignment';
                            this.text += source.nextChar();
                            break;
                        case '=':
                            this.kind = SymbolKind.MinorEq;
                            this.name = 'minor-eq';
                            this.text += source.nextChar();
                            break;
                        case '>':
                            this.kind = SymbolKind.Different;
                            this.name = 'different';
                            this.text += source.nextChar();
                            break;
                        default:
                            this.kind = SymbolKind.Minor;
                            this.name = 'minor';
                            break;
                    }
                }
                break;
            case '>':
                {
                    var peek = source.peekChar();
                    if (peek === '=') {
                        this.kind = SymbolKind.MajorEq;
                        this.name = 'major-eq';
                        this.text += source.nextChar();
                    }
                    else
                        this.kind = SymbolKind.Major;
                    this.name = 'major';
                }
                break;
            case '=':
                this.kind = SymbolKind.Equal;
                this.name = 'equal';
                break;
            case '(':
                this.kind = SymbolKind.LeftPar;
                this.name = 'left-par';
                break;
            case ')':
                this.kind = SymbolKind.RightPar;
                this.name = 'right-par';
                break;
            case '[':
                this.kind = SymbolKind.LeftBracket;
                this.name = 'left-bracket';
                break;
            case ']':
                this.kind = SymbolKind.RightBracket;
                this.name = 'right-bracket';
                break;
            case ',':
                this.kind = SymbolKind.Comma;
                this.name = 'comma';
                break;
            case '\n':
                this.kind = SymbolKind.EOL;
                this.name = 'eol';
                break;
        }
        // consumir el caracer actual
        source.nextChar();
    };
    return SpecialSymbolToken;
}());
exports.SpecialSymbolToken = SpecialSymbolToken;
var StringToken = (function () {
    function StringToken(source) {
        this.name = 'string';
        this.kind = ValueKind.String;
        this.value = '';
        this.line = source._current_line;
        this.column = source._current_column;
        this.extract(source);
    }
    StringToken.prototype.extract = function (source) {
        // uso nextChar() en lugar de current xq no quiero que la " forme parte
        // de esta cadena
        this.value += source.nextChar();
        source.nextChar();
        var c;
        while ((c = source.currentChar()) !== '"' && c !== '\n') {
            this.value += c;
            source.nextChar();
        }
        if (c === '"')
            this.text = '"' + this.value + '"';
        else {
            this.error_found = true;
            this.error_info.unexpected = '\n';
            this.error_info.expected = ['caracteres', '"'];
            this.error_info.column = source._current_column;
            this.error_info.line = source._current_line;
            this.error_info.reason = 'unexpectedCharAtString';
        }
        // Consumo un caracter para dejar a currentChar() uno delante de la
        // " o del \n
        source.nextChar();
    };
    return StringToken;
}());
exports.StringToken = StringToken;
function isReservedWord(word) {
    switch (word.length) {
        case 2:
            switch (word) {
                case 'si':
                case 'or':
                    return true;
                default:
                    return false;
            }
        case 3:
            switch (word) {
                case 'fin':
                case 'que':
                case 'div':
                case 'and':
                case 'not':
                case 'mod':
                case 'ref':
                    return true;
                default:
                    return false;
            }
        case 4:
            switch (word) {
                case 'sino':
                case 'para':
                case 'real':
                    return true;
                default:
                    return false;
            }
        case 5:
            switch (word) {
                case 'finsi':
                case 'hasta':
                case 'hasta':
                case 'falso':
                    return true;
                default:
                    return false;
            }
        case 6:
            switch (word) {
                case 'inicio':
                case 'entero':
                case 'logico':
                    return true;
                default:
                    return false;
            }
        case 7:
            switch (word) {
                case 'finpara':
                case 'repetir':
                case 'funcion':
                    return true;
                default:
                    return false;
            }
        case 8:
            switch (word) {
                case 'entonces':
                case 'mientras':
                case 'caracter':
                case 'retornar':
                    return true;
                default:
                    return false;
            }
        case 9:
            switch (word) {
                case 'variables':
                case 'verdadero':
                    return true;
                default:
                    return false;
            }
        case 10:
            switch (word) {
                case 'finfuncion':
                    return true;
                default:
                    return false;
            }
        case 11:
            switch (word) {
                case 'finmientras':
                    return true;
                default:
                    return false;
            }
        case 13:
            switch (word) {
                case 'procedimiento':
                    return true;
                default:
                    return false;
            }
        case 16:
            switch (word) {
                case 'finprocedimiento':
                    return true;
                default:
                    return false;
            }
        default:
            return false;
    }
}
var WordToken = (function () {
    function WordToken(source) {
        this.kind = OtherKind.Word;
        this.text = '';
        this.line = source._current_line;
        this.column = source._current_column;
        this.extract(source);
    }
    WordToken.prototype.extract = function (source) {
        //agrega el primer caracter del token
        this.text += source.currentChar();
        source.nextChar();
        var isDigitOrLetter = function (s) { return StringMethods_1.isDigit(s) || StringMethods_1.isLetter(s) || s === '_'; };
        var c;
        while (isDigitOrLetter(c = source.currentChar())) {
            this.text += c;
            source.nextChar();
        }
        if (isReservedWord(this.text.toLowerCase()))
            this.kind = wtk(this.text.toLowerCase());
        this.name = this.text.toLowerCase();
    };
    return WordToken;
}());
exports.WordToken = WordToken;
var UnknownToken = (function () {
    function UnknownToken(source) {
        this.name = 'unknown';
        this.kind = OtherKind.Unknown;
        this.error_found = true;
        this.error_info.unexpected = source.currentChar();
        this.error_info.expected = null;
        this.error_info.line = source._current_line;
        this.error_info.column = source._current_column;
        this.error_info.reason = 'unknownToken';
        source.nextChar();
    }
    return UnknownToken;
}());
exports.UnknownToken = UnknownToken;
/**
 * Convierte una palabra reservada en un ReservedKind
 */
function wtk(word) {
    switch (word.length) {
        case 2:
            switch (word) {
                case 'si':
                    return ReservedKind.Si;
                case 'or':
                    return ReservedKind.Or;
            }
        case 3:
            switch (word) {
                case 'fin':
                    ReservedKind.Fin;
                case 'que':
                    ReservedKind.Que;
                case 'div':
                    ReservedKind.Div;
                case 'and':
                    ReservedKind.And;
                case 'not':
                    ReservedKind.Not;
                case 'mod':
                    ReservedKind.Mod;
                case 'ref':
                    ReservedKind.Ref;
            }
        case 4:
            switch (word) {
                case 'sino':
                    ReservedKind.Sino;
                case 'para':
                    ReservedKind.Para;
                case 'real':
                    ReservedKind.Real;
            }
        case 5:
            switch (word) {
                case 'finsi':
                    return ReservedKind.FinSi;
                case 'hasta':
                    return ReservedKind.Hasta;
                case 'falso':
                    return ReservedKind.Falso;
            }
        case 6:
            switch (word) {
                case 'inicio':
                    return ReservedKind.Inicio;
                case 'entero':
                    return ReservedKind.Entero;
                case 'logico':
                    return ReservedKind.Logico;
            }
        case 7:
            switch (word) {
                case 'finpara':
                    return ReservedKind.FinPara;
                case 'repetir':
                    return ReservedKind.Repetir;
                case 'funcion':
                    return ReservedKind.Funcion;
            }
        case 8:
            switch (word) {
                case 'entonces':
                    return ReservedKind.Entonces;
                case 'mientras':
                    return ReservedKind.Mientras;
                case 'caracter':
                    return ReservedKind.Caracter;
                case 'retornar':
                    return ReservedKind.Retornar;
            }
        case 9:
            switch (word) {
                case 'variables':
                    return ReservedKind.Variables;
                case 'verdadero':
                    return ReservedKind.Verdadero;
            }
        case 10:
            switch (word) {
                case 'finfuncion':
                    return ReservedKind.FinFuncion;
            }
        case 11:
            switch (word) {
                case 'finmientras':
                    return ReservedKind.FinMientras;
            }
        case 13:
            switch (word) {
                case 'procedimiento':
                    return ReservedKind.Procedimiento;
            }
        case 16:
            switch (word) {
                case 'finprocedimiento':
                    return ReservedKind.FinProcedimiento;
            }
    }
}
