import {DB_KEYS} from "../constants";
import {AsyncStorage} from 'react-native';
import appEvents, {Events} from './app-events';

class DBService {

  async loadBeacons() {
    try {
      const beaconsStr = await AsyncStorage.getItem(DB_KEYS.BEACONS);
      const beacons = JSON.parse(beaconsStr);
      Object.keys(beacons).forEach(beaconName => {
        const beacon = beacons[beaconName];
        beacon.major = beacon.major ? parseInt(beacon.major) : null;
        beacon.minor = beacon.minor ? parseInt(beacon.minor) : null;
      });
      return beacons || {};
    } catch(error) {
      console.log(`Error loading beacons: `, error);
      throw error;
    }
  }

  async upsertBeacon(beacon) {
    try {
      const beacons = await this.loadBeacons();
      beacons[beacon.name] = beacon;
      await AsyncStorage.setItem(DB_KEYS.BEACONS, JSON.stringify(beacons));
      appEvents.emit(Events.BeaconChanged, beacon);
      return beacon;
    } catch (error) {
      console.log(`Error saving beacon: `, error);
      throw error;
    }
  }

  async deleteBeacon(beaconName) {
    try {
      const beacons = await this.loadBeacons();
      delete beacons[beaconName];
      await AsyncStorage.setItem(DB_KEYS.BEACONS, JSON.stringify(beacons));
    } catch (error) {
      console.log(`Error deleting beacon: `, error);
      throw error;
    }
  }


  async loadWebhooks() {
    try {
      const webhooksStr = await AsyncStorage.getItem(DB_KEYS.WEBHOOKS);
      const webhooks = JSON.parse(webhooksStr);
      return webhooks || {};
    } catch(error) {
      console.log(`Error loading webhooks: `, error);
      throw error;
    }
  }

  async upsertWebhook(webhook) {
    try {
      const webhooks = await this.loadWebhooks();
      webhooks[webhook.name] = webhook;
      await AsyncStorage.setItem(DB_KEYS.WEBHOOKS, JSON.stringify(webhooks));
      appEvents.emit(Events.WebhookChanged, webhook);
      return webhook;
    } catch (error) {
      console.log(`Error saving webhook: `, error);
      throw error;
    }
  }

  async deleteWebhook(webhookName) {
    try {
      const webhooks = await this.loadWebhooks();
      delete webhooks[webhookName];
      await AsyncStorage.setItem(DB_KEYS.WEBHOOKS, JSON.stringify(webhooks));
    } catch (error) {
      console.log(`Error deleting webhook: `, error);
      throw error;
    }
  }
}

export default new DBService();