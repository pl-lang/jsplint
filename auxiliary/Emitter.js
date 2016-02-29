'use strict'

class Emitter {
  constructor(event_list) {
    this.events = new Set(event_list)
    this.callbacks = {}
  }

  on(event_name, callback) {
    if (event_name in this.callbacks) {
      this.callbacks[event_name].push(callback)
    }
    else {
      this.callbacks[event_name] = [callback]
    }
  }

  emit(event_info) {
    // Se encarga de llamar a los callbacks de los eventos.
    // Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
    // Si un evento tiene registrado un callback entonces este se ejecuta despues del callback por defecto.
    if (this.callbacks.hasOwnProperty('any')) {
      for (let callback of this.callbacks.any) {
        callback(...arguments)
      }
    }

    if (this.callbacks.hasOwnProperty(event_info.name)) {
      for (let callback of this.callbacks[event_info.name]) {
        callback(...arguments)
      }
    }
  }

  repeat(event_name, emitter) {
    this.events.add(event_name)
    let self = this
    emitter.on(event_name, function () {
      self.emit(...arguments)
    })
  }

  repeatAllEvents(emitter) {
    // Esta funcion sive para emitir los eventos de otro emisor como si fueran propios.
    for (let event_name of emitter.events) {
      this.repeat(event_name, emitter)
    }
  }
}

module.exports = Emitter
