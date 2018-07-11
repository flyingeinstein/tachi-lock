import React, { Component } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    Text, View
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";

const buttonSize = 64;

type State = {
    letterIndex: number
};

type Props = {
    value?: string | number,
    icon?: string,
    color?: string,
    width?: number,
    border?: number,
    disable?: boolean,
    onPress: (e) => void
};
export default class IconButton extends Component<Props, State> {
    static defaultProps = {
        border: 1
    };

    constructor(props) {
        super(props);
        this.state = {
            letterIndex: 0
        }
        this.clickHandler = this.clickHandler.bind(this);
    }

    getStyle() {
        let { width, border } = this.props;
        return [
            styles.touchable,
            {
                width: width,
                height:width,
                borderRadius:width,
                borderWidth: border ? border : 1
            },
            this.props.disable ? styles.disable : null
        ];
    }

    clickHandler(e) {
        if(!this.props.disable && this.props.onPress)
            this.props.onPress(e);
    }

    render() {
        // compute view style
        let viewStyle = this.getStyle();

        return (
            <TouchableOpacity
                disable={this.props.disable}
                activeOpacity={this.props.disable ? 1.0 : undefined}
                onPress={this.clickHandler}
            >
                <View style={viewStyle}>
                    { this.props.icon && <Icon name={this.props.icon} style={styles.icon} color='white' /> }
                    { this.props.value && <Text style={styles.value}>{ this.props.value }</Text> }
                </View>
            </TouchableOpacity>
        );
    }
}


const styles = StyleSheet.create({
    touchable: {
        borderColor:'rgba(255,255,255,0.4)',
        alignItems:'center',
        justifyContent:'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        margin: 35
    },
    disable: {
        opacity: 0.35
    },
    icon: {
        textAlign: 'center',
        color: '#ACBDC8',
        fontSize: 28
    },
    value: {
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'HelveticaNeue-Thin',
        fontSize: 12
    },
    subKeys: {
        textAlign: 'center',
        color: '#fff',
        fontFamily: 'HelveticaNeue',
        fontSize: 12
    }
});
