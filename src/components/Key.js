import React, { Component } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity, TouchableHighlight,
    Text, View
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";

const buttonSize = 74;

type CodeEvent = {
    letter: string,
    final: boolean
};

type State = {
    letterIndex: number
};

type Props = {
    value?: string | number,
    icon?: string,
    border?: boolean,
    onCode: (CodeEvent) => void
};
export default class Key extends Component<Props, State> {
    static defaultProps = {
        border: true
    };

    constructor(props) {
        super(props);
        this.state = {
            letterIndex: 0
        }
        this.clickHandler = this.clickHandler.bind(this);
    }

    getCharacter() {
        return (this.props.value && this.props.value.length)
            ? this.props.value[this.state.letterIndex]
            : this.props.icon
                ? this.props.icon
                : null;
    }

    clickHandler() {
        if(this.props.onCode)
            this.props.onCode({ letter: this.getCharacter(), final: true });
    }

    render() {
        return (
            <TouchableOpacity
                onPress={this.clickHandler}
            >
                <View style={[styles.touchable, this.props.border?styles.withBorder:styles.withoutBorder]}>
                { this.props.icon && <Icon name={this.props.icon} style={styles.icon} color='white' /> }
                { this.props.value && <Text style={styles.value}>{ this.getCharacter() }</Text> }
                { (this.props.value && this.props.value.length>1) && <Text style={styles.subKeys}>{ this.props.value.substr(1) }</Text> }
                </View>
            </TouchableOpacity>
        );
    }
}


const styles = StyleSheet.create({
    withBorder: {
        borderWidth:1
    },
    withoutBorder: {
    },
    touchable: {
        borderColor:'rgba(255,255,255,0.4)',
        alignItems:'center',
        justifyContent:'center',
        width:buttonSize,
        height:buttonSize,
        borderRadius:buttonSize,
        margin: 15
    },
    icon: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 28
    },
    value: {
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'HelveticaNeue-Thin',
        fontSize: 28
    },
    subKeys: {
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'HelveticaNeue',
        fontSize: 10
    }
});
