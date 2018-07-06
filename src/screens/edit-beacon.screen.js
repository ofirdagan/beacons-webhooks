import React, { PureComponent } from 'react';
import { Container, Content, Form, Item, Input } from 'native-base';
import {StyleSheet} from 'react-native';
import { Navigation } from 'react-native-navigation';
import {dbKeys} from '../constants';
import dbService from '../services/db.service';

type Props = {};
export default class EditBeaconScreen extends PureComponent<Props> {

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
      beacon: this.props.beacon || {}
    };
    this.saveBeacon = this.saveBeacon.bind(this);
    Navigation.events().registerNativeEventListener(async (eventId, params) => {
      const isButtonPressed = eventId === 'buttonPressed';
      const isComponent = this.props.componentId === params.componentId;
      const isSave = params.buttonId === 'save';
      if (isButtonPressed && isComponent && isSave) {
        await this.saveBeacon();
        Navigation.pop(this.props.componentId);
      }
    });
  }

  async saveBeacon() {
    const {beacon} = this.state;
    dbService.upsertBeacon(beacon);
  }

  renderInput(placeholder, name) {
    const value = this.state.beacon[name] ? `${this.state.beacon[name]}` : '';
    return (
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={text => {
          const newBeacon = {
            ...this.state.beacon,
            [name]: text
          };
          this.setState({beacon: newBeacon});
        }}
      />
    )
  }

  render() {
    return (
      <Container style={{flex: 1}}>
        <Content>
          <Form>
            <Item floatingLabel>
              {this.renderInput('Name', 'name')}
            </Item>
            <Item floatingLabel>
              {this.renderInput('UUID', 'uuid')}
            </Item>
            <Item floatingLabel>
              {this.renderInput('Major', 'major')}
            </Item>
            <Item floatingLabel last>
              {this.renderInput('Minor', 'minor')}
            </Item>
          </Form>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
});

