import React, { Component } from 'react';
import {
    StyleSheet
} from 'react-native';

import Dot from './Dot';

type Props = {
    pattern: string,
    visible?: boolean
};

export default class DancinDots extends Component<Props> {
    render() {
        if(this.props.pattern && this.props.visible) {
            let dots = [], pattern = this.props.pattern;
            for (let x = 0, _x = pattern.length; x < _x; x++) {
                dots.push(<Dot key={x} solid={pattern[x]==='*'} />);
            }
            return dots;
        } else
            return null;
    }
}


const styles = StyleSheet.create({
    default: {
    }
});
