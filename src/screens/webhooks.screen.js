import React, { PureComponent } from 'react';
import { Container, Fab, Content, List, ListItem, Text, Icon, Left, Button, Right, Switch, Body } from 'native-base';
import {StyleSheet} from 'react-native';
import { ListView, AsyncStorage } from 'react-native';
import {ScreenNames, DB_KEYS} from '../constants';
import { Navigation } from 'react-native-navigation';
import dbService from '../services/db.service';
import appEvents from '../services/app-events';


type Props = {};
export default class WebhooksListScreen extends PureComponent<Props> {

  constructor(props) {
    super(props);
    this.renderRow = this.renderRow.bind(this);
    this.renderRightHiddenRow = this.renderRightHiddenRow.bind(this);
    this.editOrAdd = this.editOrAdd.bind(this);
    this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this._loadWebhooks();
    this.state = {
      listViewData: [],
    };
    appEvents.on('webhookChanged', () => {
      this._loadWebhooks();
    });
  }

  async _loadWebhooks() {
    const webhooks = await dbService.loadWebhooks();
    this.setState({listViewData: Object.values(webhooks)});
  }

  async deleteRow(secId, rowId, rowMap) {
    const {listViewData} = this.state;
    rowMap[`${secId}${rowId}`].props.closeRow();
    const newData = [...listViewData];
    await dbService.deleteWebhook(listViewData[rowId].name);
    newData.splice(rowId, 1);
    this.setState({ listViewData: newData });
  }

  onRowPressed(webhook) {
    this.editOrAdd(webhook, true);
  }

  renderRow(webhook) {
    return (
      <ListItem
        icon
        onPress={() => this.onRowPressed(webhook)}
      >
        <Body style={{flexDirection: 'row'}}>
        <Left>
          <Text>{webhook.name}</Text>
        </Left>
        <Right>
          <Switch
            value={webhook.isActive}
            onValueChange={value => {
              webhook.isActive = value;
              dbService.upsertWebhook(webhook);
            }}
          />
        </Right>
        </Body>
      </ListItem>
    );
  }

  renderRightHiddenRow(data, secId, rowId, rowMap) {
    return (
      <Button full danger onPress={_ => this.deleteRow(secId, rowId, rowMap)}>
        <Icon active name="trash" />
      </Button>
    );
  }

  editOrAdd(webhook, isEdit = false) {
    Navigation.push(this.props.componentId, {
      component: {
        name: ScreenNames.EDIT_WEBHOOK,
        passProps: {
          webhook
        },
        options: {
          topBar: {
            title: {
              text: isEdit ? 'Edit Webhook' : 'Add Webhook'
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

