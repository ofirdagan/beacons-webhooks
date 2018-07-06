import { Navigation } from 'react-native-navigation';
import WebhooksScreen from './screens/webhooks.screen';
import BeaconsScreen from './screens/beacons.screen';
import EditBeaconScreen from './screens/edit-beacon.screen';
import {ScreenNames} from "./constants";
import EditWebhookScreen from "./screens/edit-webhook.screen";

Navigation.registerComponent(ScreenNames.WEBHOOKS, () => WebhooksScreen);
Navigation.registerComponent(ScreenNames.BEACONS, () => BeaconsScreen);
Navigation.registerComponent(ScreenNames.EDIT_BEACON, () => EditBeaconScreen);
Navigation.registerComponent(ScreenNames.EDIT_WEBHOOK, () => EditWebhookScreen);
require('./services/webhooks.manager');

function start() {
  Navigation.events().registerAppLaunchedListener(() => {
    Navigation.setRoot({
      root: {
        bottomTabs: {
          children: [
            {
              stack: {
                children: [{
                  component: {
                    name: ScreenNames.WEBHOOKS,
                    passProps: {
                    }
                  }
                }],
                options: {
                  bottomTab: {
                    title: 'Webhooks',
                    icon: require('./assets/images/icons8-webhook-50.png'),
                    testID: 'FIRST_TAB_BAR_BUTTON'
                  },
                  topBar: {
                    title: {
                      text: 'Webhooks List'
                    }
                  }
                }
              }
            },
            {
              stack: {
                children: [{
                  component: {
                    name: ScreenNames.BEACONS,
                    passProps: {
                    }
                  }
                }],
                options: {
                  bottomTab: {
                    title: 'Beacons',
                    icon: require('./assets/images/icons8-ibeacon-48.png'),
                    testID: 'FIRST_TAB_BAR_BUTTON'
                  },
                  topBar: {
                    title: {
                      text: 'Beacons List'
                    }
                  }
                }
              }
            },
          ]
        }
      }
    });

  });
}

export default start;

