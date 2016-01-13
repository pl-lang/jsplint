'use strict'

class Emitter {
  constructor(event_list) {
    this.events = new Set(event_list)
    this.callbacks = {}
  }

  exposeChildrenEvents(child_emitter) {
    // Esta funcion siver para emitir los eventos de otro emisor como si fueran propios.
    let self = this

    for (let event_name of child_emitter.events) {
      this.events.add(event_name)

      child_emitter.on(event_name, function () {self.emit(...arguments)})
    }
  }

  on(event_name, callback) {
    this.callbacks[event_name] = callback
  }

  emit(event_info) {
    // Se encarga de llamar a los callbacks de los eventos.
    // Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
    // Si un evento tiene registrado un callback entonces este se ejecuta despues del callback por defecto.
    if (this.callbacks.hasOwnProperty('any')) {
      this.callbacks.any(...arguments)
    }

    if (this.callbacks.hasOwnProperty(event_info.name)) {
      this.callbacks[event_info.name](...arguments)
    }
  }
}

module.exports = Emitter
