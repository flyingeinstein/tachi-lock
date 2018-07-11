import React, { Component } from 'react';
import {
    StyleSheet,
    Text
} from 'react-native';

type Props = {
    value: string,
    visible?: boolean
};

export default class Tracker extends Component<Props> {
    render() {
        if(this.props.value!==null) {
            return <Text>{this.props.value}</Text>;
        } else
            return null;
    }
}


const styles = StyleSheet.create({
    default: {
    }
});
