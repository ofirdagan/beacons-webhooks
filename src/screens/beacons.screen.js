import React, { PureComponent } from 'react';
import { Container, Fab, Content, List, ListItem, Text, Icon, Body, Button } from 'native-base';
import {StyleSheet} from 'react-native';
import { ListView } from 'react-native';
import {ScreenNames} from "../constants";
import { Navigation } from 'react-native-navigation';
import dbService from '../services/db.service';
import appEvents from '../services/app-events';
import beaconService from '../services/beacon.service';
import {log} from '../services/remote-logger';
import {AppState} from 'react-native'

type Props = {};
export default class BeaconsListScreen extends PureComponent<Props> {

  constructor(props) {
    super(props);
    this.renderRow = this.renderRow.bind(this);
    this.renderRightHiddenRow = this.renderRightHiddenRow.bind(this);
    this._handleAppStateChange = this._handleAppStateChange.bind(this);
    this.editOrAdd = this.editOrAdd.bind(this);
    this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this._loadBeacons();
    this.state = {
      listViewData: [],
      currentActiveBeacons: [],
      appState: AppState.currentState
    };
    appEvents.on('beaconChanged', (beacon) => {
      this._loadBeacons();
    });
    beaconService.addBeaconsMonitorListener(currentActiveBeacons => {
      this.setState({currentActiveBeacons});
    });
    AppState.addEventListener('change', this._handleAppStateChange);
    setTimeout(() => {
      beaconService.startRangingInAllRegions();
    }, 1000);

  }


  _handleAppStateChange(nextAppState) {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      log('coming to foreground');
      beaconService.startRangingInAllRegions();
    } else {
      log('going to background');
      beaconService.stopRangingInAllRegions();
    }
    this.setState({appState: nextAppState});
  }

  async _loadBeacons() {
    const beacons = await dbService.loadBeacons();
    this.setState({listViewData: Object.values(beacons)});
  }

  async deleteRow(secId, rowId, rowMap) {
    const {listViewData} = this.state;
    rowMap[`${secId}${rowId}`].props.closeRow();
    const newData = [...listViewData];
    await dbService.deleteBeacon(listViewData[rowId].name);
    newData.splice(rowId, 1);
    this.setState({ listViewData: newData });
  }

  onRowPressed(beacon) {
    this.editOrAdd(beacon, true);
  }

  renderRow(beacon) {
    const {currentActiveBeacons} = this.state;
    const beaconData = currentActiveBeacons.find(b => b.uuid === beacon.uuid);
    let data = '';
    if (beaconData) {
      data = this._formatBeaconData(beaconData);
    }
    return (
      <ListItem
        style={{height: 60}}
        icon
        onPress={() => this.onRowPressed(beacon)}
      >
        <Body>
          <Text>{beacon.name}</Text>
          <Text note>{data}</Text>
        </Body>
      </ListItem>
    );
  }

  _formatBeaconData(beacon) {
    return `Proximity: ${beacon.proximity}`;
  }

  renderRightHiddenRow(data, secId, rowId, rowMap) {
    return (
      <Button full danger onPress={_ => this.deleteRow(secId, rowId, rowMap)}>
        <Icon active name="trash" />
      </Button>
    );
  }

  editOrAdd(beacon, isEdit = false) {
    Navigation.push(this.props.componentId, {
      component: {
        name: ScreenNames.EDIT_BEACON,
        passProps: {
          beacon
        },
        options: {
          topBar: {
            title: {
              text: isEdit ? 'Edit Beacon' : 'Add Beacon'
            },
            backButton: {
              hideTitle: true
            }
          },
          hideBackButtonTitle: true
        }
      }
    });
  }

  render() {
    return (
      <Container style={{flex: 1}}>
        <Content>
          <List
            dataSource={this.ds.cloneWithRows(this.state.listViewData)}
            renderRightHiddenRow={this.renderRightHiddenRow}
            rightOpenValue={-75}
            renderRow={this.renderRow}
          />
        </Content>
        <Fab
          containerStyle={{ }}
          style={{ backgroundColor: '#5067FF' }}
          position="bottomRight"
          onPress={this.editOrAdd}>
          <Icon name="add" />
        </Fab>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
});

