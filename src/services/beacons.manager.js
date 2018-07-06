import axios from "axios/index";
import * as beacons from "./beacon.service";


class BeaconsManager {

  constructor() {
    this.state = {};
  }

  registerWebHookForBeacon({id, webhookUrl, targetProxmity}) {
    beacons.addBeaconListener(beacon => {
      if (beacon.uuid === id) {
        if (this._shouldTrigger(beacon, targetProxmity)) {
          axios.get(webhookUrl);
        }
        this.state[beacon.uuid] = beacon;
      }
    });
  }

  _shouldTrigger(beacon, targetProximity) {
    const {proximity} = beacon;
    const previousProximity = this.state[beacon.uuid] && this.state[beacon.uuid].proximity;
    const didChange = proximity !== previousProximity;
    const shuoldTrigger = proximity === targetProximity && proximity !== 'immediate' &&  didChange;
    return shuoldTrigger;
  }
}

export default new BeaconsManager();