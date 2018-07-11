import React, { Component } from 'react';
import {
    Platform,
    StyleSheet,
    View
} from 'react-native';
import {Icon} from "react-native-vector-icons";

const circleSize = 16;

type Props = {
    solid?: boolean,
    percent?: number
};

export default class Dot extends Component<Props> {
    render() {
        let style = [styles.default];
        if(this.props.percent===undefined) {
            style.push(styles.dot);
            if(this.props.solid)
                style.push(styles.solid);
        } else {
            style.push(styles.progress);
        }
        return (
            <View style={style} />
        );
    }
}


const styles = StyleSheet.create({
    default: {
        borderWidth:1,
        borderColor:'rgba(255,255,255,0.4)',
        height:circleSize,
        borderRadius:circleSize,
        margin: 10
    },
    dot: {
        width:circleSize
    },
    solid: {
        backgroundColor: 'rgba(255,255,255,1)'
    },
    progress: {
        width: '80%'
    }
});
