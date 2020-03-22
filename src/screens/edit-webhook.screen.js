import React, { PureComponent } from 'react';
import { Button, Container, Content, Form, Item, Input, Picker, Icon, Left, Right, Text } from 'native-base';
import {StyleSheet} from 'react-native';
import { Navigation } from 'react-native-navigation';
import {dbKeys} from '../constants';
import dbService from '../services/db.service';
import {PROXIMITY_NAMES} from '../constants';
import axios from 'axios';

type Props = {};
export default class EditWebhookScreen extends PureComponent<Props> {

  static get options() {
    return {
      topBar: {
        rightButtons: [
          {
            id: 'save',
            title: 'Save'
          }
        ]
      }
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      webhook: this.props.webhook || {},
      beacons: {},
      selectedBeacon: undefined
    };
    this._loadBeacons();
    this.saveWebhook = this.saveWebhook.bind(this);
    this.onBeaconPick = this.onBeaconPick.bind(this);
    this.onProximityPick = this.onProximityPick.bind(this);
    this.onTestWebHookPressed = this.onTestWebHookPressed.bind(this);

    Navigation.events().registerNativeEventListener(async (eventId, params) => {
      const isButtonPressed = eventId === 'buttonPressed';
      const isComponent = this.props.componentId === params.componentId;
      const isSave = params.buttonId === 'save';
      if (isButtonPressed && isComponent && isSave) {
        await this.saveWebhook();
        Navigation.pop(this.props.componentId);
      }
    });
  }

  async _loadBeacons() {
    const beacons = await dbService.loadBeacons();
    this.setState({beacons});
  }

  async saveWebhook() {
    const {webhook} = this.state;
    dbService.upsertWebhook(webhook);
  }

  onBeaconPick(beaconName) {
    const {webhook, beacons} = this.state;
    const newWebhook = {
      ...webhook,
      beaconId: beacons[beaconName].uuid,
      beaconName
    };
    this.setState({webhook: newWebhook, selectedBeacon: beaconName});
  }

  onProximityPick(proximity) {
    const {webhook} = this.state;
    const newWebhook = {
      ...webhook,
      proximity
    };
    this.setState({webhook: newWebhook});
  }

  onTestWebHookPressed() {
    const {webhook} = this.state;
    axios.get(webhook.url);
  }

  renderInput(placeholder, name) {
    const value = this.state.webhook[name] ? `${this.state.webhook[name]}` : '';
    return (
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={text => {
          const newWebhook = {
            ...this.state.webhook,
            [name]: text
          };
          this.setState({webhook: newWebhook});
        }}
      />
    );
  }

  _renderBeaconsOptions() {
    const beacons = Object.keys(this.state.beacons).map((beaconName, index) => <Picker.Item label={beaconName} value={beaconName} key={index}/>);
    return beacons;
  }

  _renderProximityOptions() {
    const proximities = Object.keys(PROXIMITY_NAMES).map((proximity, index) => <Picker.Item label={proximity} value={PROXIMITY_NAMES[proximity]} key={index}/>);
    return proximities;
  }

  render() {
    const {webhook, selectedBeacon} = this.state;
    return (
      <Container style={{flex: 1}}>
        <Content>
          <Form>
            <Item floatingLabel>
              {this.renderInput('Name', 'name')}
            </Item>
            <Item>
              <Left>
                <Text>Beacon</Text>
              </Left>
              <Right>
                <Picker
                  mode="dropdown"
                  placeholder={"Select"}
                  iosHeader="Beacon"
                  iosIcon={<Icon name="ios-arrow-down-outline" />}
                  style={{ width: undefined }}
                  selectedValue={webhook.beaconName}
                  onValueChange={this.onBeaconPick}
                >
                  {this._renderBeaconsOptions()}
                </Picker>
              </Right>
            </Item>
            <Item>
              <Left>
                <Text>Proximity Trigger</Text>
              </Left>
              <Right>
                <Picker
                  mode="dropdown"
                  placeholder={"Select"}
                  iosHeader="Proximity"
                  iosIcon={<Icon name="ios-arrow-down-outline" />}
                  style={{ width: undefined }}
                  selectedValue={webhook.proximity}
                  onValueChange={this.onProximityPick}
                >
                  {this._renderProximityOptions()}
                </Picker>
              </Right>
            </Item>
            <Item floatingLabel last>
              {this.renderInput('URL', 'url')}
            </Item>
          </Form>
          <Button transparent info onPress={this.onTestWebHookPressed}>
            <Icon active name="flask" />
            <Text>Test</Text>
          </Button>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
});

