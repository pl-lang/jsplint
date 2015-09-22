'use strict'

let StringMethods = {
    isDigit : (c) => {return /\d/.test(c)}
  , isLetter : (c) => {return /[a-zA-Z]/.test(c)}
}

module.exports = StringMethods
