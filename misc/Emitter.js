'use strict'

class Emitter {
  constructor(public_event_list) {
    this.public_events = new Set(public_event_list)
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

  emit(event_name) {
    // Se encarga de llamar a los callbacks de los eventos.
    // Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
    // Si un evento tiene registrado un callback entonces este se ejecuta despues del callback por defecto.
    if (this.callbacks.hasOwnProperty('any')) {
      for (let callback of this.callbacks.any) {
        callback(...arguments)
      }
    }

    if (this.callbacks.hasOwnProperty(event_name)) {
      for (let callback of this.callbacks[event_name]) {
        callback(...arguments)
      }
    }
  }

  repeat(event_name, emitter, make_public) {
    if (make_public === true) {
      this.public_events.add(event_name)
    }
    let self = this
    emitter.on(event_name, function () {
      self.emit(...arguments)
    })
  }

  repeatAllPublicEvents(emitter) {
    // Esta funcion sive para emitir los eventos de otro emisor como si fueran propios.
    for (let event_name of emitter.public_events) {
      this.repeat(event_name, emitter, true)
    }
  }
}

module.exports = Emitter
