'use strict'

let StringMethods = {
    isDigit       : (c) => {return /\d/.test(c)}
  , isLetter      : (c) => {return /[a-zA-Z]/.test(c)}
  , isWhiteSpace  : (c) => {return /\s/.test(c)}
}

module.exports = StringMethods
