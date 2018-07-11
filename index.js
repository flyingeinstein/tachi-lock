import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
import App from './src/App';
import store from './src/stores/root';

type State = {};
type Props = {};

class AppWithProvider extends Component<Props,State>  {
    render() {
        return (<Provider store={store}>
            <App/>
        </Provider>);
    }
}

AppRegistry.registerComponent('tachilock', () => AppWithProvider );
