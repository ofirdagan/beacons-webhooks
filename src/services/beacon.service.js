import { NativeEventEmitter, NativeModules } from 'react-native'
import Beacons from 'react-native-beacons-manager'
import db from './db.service';
import appEvents from './app-events';
import {PROXIMITY} from '../constants';
const uuidv4 = require('uuid/v4');
import {log} from './remote-logger';

class BeaconService {
  constructor() {
    this.state = {};
    this.eventEmitter = new NativeEventEmitter(NativeModules.RNiBeacon);
    this.listeners = {};
    this.monitorListeners = {};
    this._bind();
    this._init();
    appEvents.on('beaconChanged', () => {
      this._stopRangingAndMonitoring();
      this.unsubscribe();
      this._init();
    });
    Beacons.requestAlwaysAuthorization();
    Beacons.startUpdatingLocation();
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

  startRangingInAllRegions() {
    this.regions.forEach(region => {
      Beacons.startRangingBeaconsInRegion(region);
    });
  }

  stopRangingInAllRegions() {
    this.regions.forEach(region => {
      Beacons.stopRangingBeaconsInRegion(region);
    });
  }

  _bind() {
    this._init = this._init.bind(this);
    this._startMonitoringRegions = this._startMonitoringRegions.bind(this);
    this._stopRangingAndMonitoring = this._stopRangingAndMonitoring.bind(this);
    this._stopRangingBeaconsInRegion = this._stopRangingBeaconsInRegion.bind(this);
    this._startRangingBeaconsInRegion = this._startRangingBeaconsInRegion.bind(this);
    this._checkForListeners = this._checkForListeners.bind(this);
    this._checkForMonitorListeners = this._checkForMonitorListeners.bind(this);
    this._setState = this._setState.bind(this);
  }

  async _init() {
    this.beacons = await db.loadBeacons();
    this.regions = this._buildRegions();
    this._startMonitoringRegions();
    this.unsubscribe = this._listenOnBeacons();
  }

  _startMonitoringRegions() {
    this.regions.forEach(region => {
      log(`start monitoring ${region.identifier}`);
      Beacons.startMonitoringForRegion(region);
    });
  }

  _stopRangingAndMonitoring() {
    this.regions.forEach(region => {
      log(`stop monitoring ${region.identifier}`);
      Beacons.stopMonitoringForRegion(region);
      Beacons.stopRangingBeaconsInRegion(region);
    });
  }

  _startRangingBeaconsInRegion(beaconId) {
    const beaconToRange = this.regions
      .filter(region => region.uuid === beaconId);
    beaconToRange.forEach(region => {
      Beacons.startRangingBeaconsInRegion(region);
    });
  }

  _stopRangingBeaconsInRegion(beaconId) {
    const beaconToStopRange = this.regions
      .filter(region => region.uuid === beaconId);
    beaconToStopRange.forEach(region => {
      Beacons.stopRangingBeaconsInRegion(region);
    });
  }


  _listenOnBeacons() {
    const rangeSubscription = this.eventEmitter.addListener(
      'beaconsDidRange',
      data => {
        const beacons = data && data.beacons;
        const firstBeaconProximity = beacons && beacons.length > 0 ? beacons[0].proximity : 'beacon not found';
        log(`beaconsDidRange proximity: ${firstBeaconProximity}`);
        this._checkForListeners(beacons);
        this._checkForMonitorListeners(beacons);
        this._setState(beacons);
      }
    );
    const enterSubscription = this.eventEmitter.addListener(
      'regionDidEnter',
      data => {
        log(`beacon enter ${data.uuid}`);
        this._startRangingBeaconsInRegion(data.uuid);
      }
    );
    const exitSubscription = this.eventEmitter.addListener(
      'regionDidExit',
      data => {
        log(`beacon exit ${data.uuid}`);
        this._stopRangingBeaconsInRegion(data.uuid);
      }
    );
    return () => {
      rangeSubscription.remove();
      enterSubscription.remove();
      exitSubscription.remove();
    }
  }

  _setState(beacons) {
    beacons.forEach(beacon => {
      this.state[beacon.uuid] = beacon.proximity;
    });
  }

  _checkForMonitorListeners(beacons) {
    Object.keys(this.monitorListeners)
      .forEach(listener => this.monitorListeners[listener](beacons));
  }

  _checkForListeners(beacons) {
    beacons.forEach(beacon => {
      const listenersForBeacon = this._getListenersForBeacon(beacon);
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

  _getListenersForBeacon(beacon) {
    return Object
      .keys(this.listeners)
      .filter(uuid => this.listeners[uuid].beaconId === beacon.uuid)
      .map(uuid => this.listeners[uuid])
  }

  _buildRegions() {
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
    return regions || [];
  }
}

export default new BeaconService();