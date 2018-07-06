import { DeviceEventEmitter } from 'react-native'
import Beacons from 'react-native-beacons-manager'

// Define a region which can be identifier + uuid,
// identifier + uuid + major or identifier + uuid + major + minor
// (minor and major properties are numbers)
//B5B182C7-EAB1-4988-AA99-B5C1517008D9

const listeners = [];
const region = {
  identifier: 'cookie',
  major: 1,
  uuid: 'B5B182C7-EAB1-4988-AA99-B5C1517008D9'
};

// Request for authorization while the app is open
Beacons.requestAlwaysAuthorization();

Beacons.startMonitoringForRegion(region);
Beacons.startRangingBeaconsInRegion(region);

// Beacons.startUpdatingLocation();

// Listen for beacon changes
const subscription = DeviceEventEmitter.addListener(
  'beaconsDidRange',
  (data) => {
    // data.region - The current region
    // data.region.identifier
    // data.region.uuid
    const beacon = data && data.beacons[0];
    if (beacon) {
      listeners.forEach(cb => {
        cb(data.beacons[0]);
      });
    }

    // data.beacons - Array of all beacons inside a region
    //  in the following structure:
    //    .uuid
    //    .major - The major version of a beacon
    //    .minor - The minor version of a beacon
    //    .rssi - Signal strength: RSSI value (between -100 and 0)
    //    .proximity - Proximity value, can either be "unknown", "far", "near" or "immediate"
    //    .accuracy - The accuracy of a beacon
  }
);

export const addBeaconListener = cb => {
  listeners.push(cb);
};

const calculateDistance = (rssi) => {

  const txPower = -59; //hard coded power value. Usually ranges between -59 to -65

  if (rssi === 0) {
    return -1.0;
  }

  const ratio = rssi*1.0/txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio,10);
  }
  else {
    const distance =  (0.89976)*Math.pow(ratio,7.7095) + 0.111;
    return distance;
  }
};
