const EventEmitter = require('events');

class AppEvents {
  constructor() {
    this.ee = new EventEmitter();
  }

  emit(event, params) {
    this.ee.emit(event, params);
  }

  on(eventName, cb) {
    this.ee.on(eventName, cb);
  }
}

export default new AppEvents();
export const Events = {
  WebhookChanged: 'webhookChanged',
  BeaconChanged: 'beaconChanged'
};