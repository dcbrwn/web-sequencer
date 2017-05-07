'use strict';

class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(eventName, listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(listener);
  }

  emit(eventName, params) {
    if (!this.listeners[eventName]) {
      return;
    }

    this.listeners[eventName].forEach((listener) => {
      listener(params);
    });
  }
}
