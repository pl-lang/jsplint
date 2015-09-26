'use strict'

let isTypeToken = (token) => {return /entero|real|logico|caracter/.test(token.kind)}

class DeclarationStruct {
  constructor(queue) {
    this.kind = 'declaration'
    this.variables = {
        caracter : []
      , entero   : []
      , logico   : []
      , real     : []
    }

    this.extract(queue)
  }

  extract(queue) {
    let currentType
    let error = false
    let t

    while ( (t = queue.current()).kind !== 'inicio' && !error ) {
      let nameSet = new Set()
      if ( isTypeToken(t) ) {
        currentType = t.kind
        queue.next()
        let nameList = this.getNameList(queue)
        if (nameList.kind !== 'name-list') {
          error = true
          this.kind = nameList.kind
          this.errorInfo = nameList.errorInfo
        }
        else {
          // Como estoy usando un Set para los nombres, no importa que se repitan
          for (let name of nameList.names)
            nameSet.add(name)

          // Aca, si llegara a haber un nombre repetido, tendría que tirar un error
          for (let name of nameSet)
            this.variables[currentType].push(name)
        }
      }
      else {
        error = true
        this.kind = 'SYNTACTICAL_ERROR'
        this.errorInfo = {
            reason : 'INVALID_TYPENAME'
          , unexpectedToken : t
        }
      }
    }
  }

  getNameList(queue) {

    let getNextName = (queue) => {
      let name = {
          kind    : 'name'
        , isArray : false
      }

      let t = queue.current()
      // Si se llegó acá está garantizado que t.kind es 'word'
      name.text = t.text

      // TODO: Completar este codigo para que tome los corchetes de arreglos y matrices
      // if (queue.next().kind === 'right-bracket') {
      //   let dimension = getDimension(queue)
      //
      //   if (dimension.kind === 'dimension') {
      //     name.isArray = true
      //     name.dimensions = dimension.list
      //   }
      //   else {
      //     name.kind = 'SYNTACTICAL_ERROR'
      //   }
      // }

      return name
    }

    let result = {
        kind  : 'name-list'
      , names : []
    }

    let t = queue.current()

    if ( t.kind === 'word' ) {
      let error = false
      while ( (t = queue.current()).kind === 'word' && !error ) {
        let next = getNextName(queue)
        result.names.push(next)
        queue.next()
        // add error handling for the result of getNextName

        if ( queue.current().kind === 'comma' ) {
          if (queue.peek().kind === 'word')
            t = queue.next()
          else {
            error = true
            result.kind = 'SYNTACTICAL_ERROR'
            result.errorInfo = {
                reason : 'UNEXPECTED_TOKEN'
              , expectedTokenKind : 'word'
              , unexpectedToken : queue.peek()
            }
          }
        }
      }
    }
    else {
      result.kind = 'SYNTACTICAL_ERROR'
      result.errorInfo = {
          reason : 'UNEXPECTED_TOKEN'
        , unexpectedToken : t
      }
    }
    return result
  }
}

module.exports = DeclarationStruct
