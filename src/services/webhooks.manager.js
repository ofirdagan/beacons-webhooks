import db from './db.service';
import beaconService from './beacon.service';
import axios from 'axios/index';
import appEvents from './app-events';

class WebhooksManager {
  constructor() {
    this.webhooks = {};
    this.triggerWebhook = this.triggerWebhook.bind(this);
    this.subscriptions = [];
    this.init();
    appEvents.on('webhookChanged', () => {
      this.subscriptions.forEach(unsubscribe => unsubscribe());
      this.init();
    });
  }

  async init() {
    this.webhooks = await db.loadWebhooks();
    Object.keys(this.webhooks).forEach(webhookName => {
      const webhook = this.webhooks[webhookName];
      const {proximity, beaconId, name} = webhook;
      const unsubscribe = beaconService.addBeaconListenerForProximity({correlationId: name, beaconId, proximity, callback: this.triggerWebhook});
      this.subscriptions.push(unsubscribe);
    });
  }

  triggerWebhook(correlationId) {
    const webhook = this.webhooks[correlationId];
    if (webhook.isActive) {
      axios.get(webhook.url);
    }
  }

}

export default new WebhooksManager();