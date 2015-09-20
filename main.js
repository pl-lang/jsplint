"use strict"
var fs = require('fs');
var Source = require('./Source.js');
var TokenList = require('./TokenList.js');

fs.readFile(process.argv[2], 'utf-8', (error, data) => {
  if (error)
    console.log(error)

  if (data) {
    let fuente = new Source(data)
    while (fuente.currentChar() !== fuente.EOF) {
      console.log(fuente.currentChar())
      fuente.nextChar()
    }
  }
})
