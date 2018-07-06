import { DeviceEventEmitter } from 'react-native'
import Beacons from 'react-native-beacons-manager'
import db from './db.service';
import appEvents from './app-events';
import {PROXIMITY} from '../constants';
const uuidv4 = require('uuid/v4');


class BeaconService {
  constructor() {
    this.state = {};
    this.listeners = {};
    this.monitorListeners = {};
    this.bind();
    this.init();
    appEvents.on('beaconChanged', (beacon) => {
      this.stopRangingRegions();
      this.init();
    });
  }

  bind() {
    this.init = this.init.bind(this);
    this.stopRangingRegions = this.stopRangingRegions.bind(this);
    this.checkForListeners = this.checkForListeners.bind(this);
    this.checkForMonitorListeners = this.checkForMonitorListeners.bind(this);
    this.setState = this.setState.bind(this);
  }

  async init() {
    Beacons.requestAlwaysAuthorization();
    this.beacons = await db.loadBeacons();
    this.regions = this.buildRegions();
    this.startRangingRegions();
    this.listenOnBeacons();
  }

  startRangingRegions() {
    this.regions.forEach(region => {
      Beacons.startMonitoringForRegion(region);
      Beacons.startRangingBeaconsInRegion(region);
    });
  }

  stopRangingRegions() {
    this.regions.forEach(region => {
      Beacons.stopMonitoringForRegion(region);
      Beacons.stopRangingBeaconsInRegion(region);
    });
  }

  buildRegions() {
    const regions = Object.keys(this.beacons).reduce((regions, beaconName) => {
      const beacon = this.beacons[beaconName];
      const region = {
        identifier: beacon.name,
        uuid: beacon.uuid,
        major: beacon.major,
        minor: beacon.minor
      };
      regions.push(region);
      return regions;
    }, []);
    return regions;
  }

  listenOnBeacons() {
    const subscription = DeviceEventEmitter.addListener(
      'beaconsDidRange',
      data => {
        const beacons = (data && data.beacons) || [];
        this.checkForListeners(beacons);
        this.checkForMonitorListeners(beacons);
        this.setState(beacons);
      }
    );
  }

  setState(beacons) {
    beacons.forEach(beacon => {
      this.state[beacon.uuid] = beacon.proximity;
    });
  }

  checkForMonitorListeners(beacons) {
    Object.keys(this.monitorListeners)
      .forEach(listener => this.monitorListeners[listener](beacons));
  }

  checkForListeners(beacons) {
    beacons.forEach(beacon => {
      const listenersForBeacon = this.getListenersForBeacon(beacon);
      listenersForBeacon.forEach(listner => {
        const oldBeaconState = this.state[beacon.uuid];
        if (!oldBeaconState) {
          return;
        }
        const didChangeProximity = oldBeaconState !== beacon.proximity;
        const didComeFromHigherProximity = PROXIMITY[beacon.proximity] < PROXIMITY[oldBeaconState];
        const isInRightProximity = beacon.proximity === listner.proximity;
        if (didChangeProximity && didComeFromHigherProximity && isInRightProximity) {
          listner.callback(listner.correlationId);
        }
      });
    });
  }

  getListenersForBeacon(beacon) {
    return Object
      .keys(this.listeners)
      .filter(uuid => this.listeners[uuid].beaconId === beacon.uuid)
      .map(uuid => this.listeners[uuid])
  }

  addBeaconsMonitorListener(callback) {
    const uuid = uuidv4();
    this.monitorListeners[uuid] = callback;
    return () => delete this.monitorListeners[uuid];
  }

  addBeaconListenerForProximity({correlationId, beaconId, proximity, callback}) {
    const uuid = uuidv4();
    this.listeners[uuid] = {
      correlationId,
      beaconId,
      proximity,
      callback
    };
    return () => delete this.listeners[uuid];
  }
}

export default new BeaconService();