import React, { Component } from 'react';
import {
    Platform,
    StyleSheet,
    View, Text
} from 'react-native';

import {Icon} from "react-native-vector-icons";

import { IDrawerProtocol } from "../protocols/common";
import NotchedTrackbar, { Notch } from "../components/NotchedTrackbar";


export type LockProps = {
    lock: {},
    protocol: IDrawerProtocol,
    state: {}
};

class SimpleLock extends Component<LockProps> {
    constructor(props) {
        super(props);
        this.setDrawer = this.setDrawer.bind(this);
        console.log("protocol ", this.props.protocol);
    }

    setDrawer(v,selection) {
        let protocol = this.props.protocol;
        if(!protocol)
            return false;

        let selectionCode = selection.map(s=> s.id).join('-');
        if(selectionCode === '0-1-2-3') {
            // enable gesture
            protocol.enable && protocol.enable(true);
        } else if(selectionCode === '3-2-1-0') {
            // disable gesture
            protocol.enable && protocol.enable(false);
        } else {
            switch(v.id) {
                case 1: protocol.open && protocol.open(0.33); break;
                case 2: protocol.open && protocol.open(0.66); break;
                case 3: protocol.open && protocol.open(1.00); break;
                default: protocol.close && protocol.close(); break;
            }
        }
    }

    static getPosition(position: number) {
        return  100 + position*300;
    }

    static getRadius(position: number) {
        return (position ===0)
            ? 35
            : 15 + (20*position);
    }

    getPositionTracker(outlineStyle)
    {
        let state = this.props.state;
        if(state && state.position) {
            let position = (state && state.position) ? state.position : 0;
            // translate percentage into location on notched bar (which isnt linear)
            return <Notch key='position' value={SimpleLock.getPosition(position)} radius={SimpleLock.getRadius(position)} fill={outlineStyle.stroke} selectable={false} />;
        }
    }

    opacity(color, op) {
        const hex = '0123456789ABCDEF';
        if(!op) op = 255;
        return color+hex[Math.floor(op/16)]+hex[Math.floor(op%16)];
    }

    render() {
        const hu = 80, br = 255;
        let { lock, state } = this.props;
        //console.log("Simple ", state);
        if(!lock || !lock.name)
            return null;
        if(lock.locked)
            return <Text>Lock has timed out</Text>;
        let colors = {
            disabled: (opacity) => this.opacity('#42C2E8',opacity),
            closed: (opacity) => this.opacity('#3CE75B',opacity),
            open: (opacity) => this.opacity('#E94A81',opacity),
            outline: (opacity) => this.opacity('#FFFFFF', opacity)
        };
        colors.status = (opacity) => (!state || !state.motor)
            ? colors.disabled(opacity)
            : state.closed
                ? colors.closed(opacity) //`rgba(66,194,232,0.9)`
                : colors.open(opacity);
        let notchStyle = {
            stroke: colors.status(),
            strokeWidth: 4,
            fill: 'transparent'
        };
        let outlineStyle = {
            fill: "none",
            strokeWidth: 1.5,
            stroke: colors.outline(0.4*255)
        };
        return (
            <View style={styles.container}>
                <NotchedTrackbar target={2} trackSize={6} outlineMargin={6} outlineStyle={outlineStyle} onDropped={this.setDrawer}>
                    <Notch value={SimpleLock.getPosition(0.00)} radius={SimpleLock.getRadius(0.00)} style={notchStyle}>CLOSE</Notch>
                    <Notch value={SimpleLock.getPosition(1/3)} radius={SimpleLock.getRadius(0.33)} style={notchStyle} />
                    <Notch value={SimpleLock.getPosition(2/3)} radius={SimpleLock.getRadius(0.66)} style={notchStyle} />
                    <Notch value={SimpleLock.getPosition(1.00)} radius={SimpleLock.getRadius(1.00)} style={notchStyle}>OPEN</Notch>
                    { this.getPositionTracker(notchStyle) }
                </NotchedTrackbar>
            </View>
        );
    }
}

export default SimpleLock;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row'
    },
    button: {

    }
});
