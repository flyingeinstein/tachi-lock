import React, { Component } from 'react';
import {
    StyleSheet,
    View
} from 'react-native';
import Promise from 'promise';

import Key from './Key';

type State = {
}

type Props = {
    value: string,
    length: number,
    alphanumeric?: boolean,
    onUpdate: (code, pending) => void,
};

export default class Keypad extends Component<Props, State> {
    constructor(props) {
        super(props);
        this.onCodeHandler = this.onCodeHandler.bind(this);
        this.onDeleteHandler = this.onDeleteHandler.bind(this);
    }


    onCodeHandler(key) {
        let code = this.props.value + key.letter;
        if(key.final) {
            //this.setState({ code });
        }
        this.props.onUpdate && this.props.onUpdate(code, !key.final);
    }

    onDeleteHandler() {
        if(this.state && this.props.value.length>0) {
            let code = this.props.value.substr(0, this.props.value.length-1);
            this.setState({code});
            this.props.onUpdate && this.props.onUpdate(code, false);
        }
    }

    render() {
        return (
            <View style={[styles.keypad, this.props.style]}>
                <View style={styles.row}>
                    <Key value="1" onCode={this.onCodeHandler} />
                    <Key value="2ABC" onCode={this.onCodeHandler} />
                    <Key value="3DEF" onCode={this.onCodeHandler} />
                </View>
                <View style={styles.row}>
                    <Key value="4GHI" onCode={this.onCodeHandler} />
                    <Key value="5JKL" onCode={this.onCodeHandler} />
                    <Key value="6MNO" onCode={this.onCodeHandler} />
                </View>
                <View style={styles.row}>
                    <Key value="7PQRS" onCode={this.onCodeHandler} />
                    <Key value="8TUV" onCode={this.onCodeHandler} />
                    <Key value="9WXYZ" onCode={this.onCodeHandler} />
                </View>
                <View style={styles.row}>
                    <Key icon="angle-left" border={false}  onCode={this.onDeleteHandler} />
                    <Key value="0"  onCode={this.onCodeHandler} />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        width: '100%'
    },
    keypad: {
        height: 400
    },
    row: {
        flex: 1,
        flexDirection: 'row'
    }

});
