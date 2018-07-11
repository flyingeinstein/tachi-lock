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
                case 1: protocol.open && protocol.open(0.50); break;
                case 2: protocol.open && protocol.open(0.75); break;
                case 3: protocol.open && protocol.open(1.00); break;
                default: protocol.close && protocol.close(); break;
            }
        }
    }

    getPositionTracker()
    {
        let state = this.props.state;
        if(state && state.position) {
            // translate percentage into location on notched bar (which isnt linear)
            let position = state.position;
            if(position<0.50)
                position = 100 + (position*200);
            else if(position<0.75)
                position = 200 + ((position-0.5)*400);
            else if(position <= 1.00)
                position = 300 + ((position-0.75)*400);
            else
                return null;    // no tracker
            return <Notch key='position' value={position} radius={5} fill='cyan' selectable={false} />;
        }
    }

    render() {
        let { lock, state } = this.props;
        //console.log("Simple ", lock, this.props.protocol);
        if(!lock || !lock.name)
            return <Text>Select a lock</Text>;
        if(lock.locked)
            return <Text>Lock has timed out</Text>;
        //let trackers = this.getTrackers();
        //if(state && !isNaN(state.position))
        //console.log("state ", state);
        let notchStyle = {
            fill: (state.motor && state.motor.enabled) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
        }
        return (
            <View style={styles.container}>
                <NotchedTrackbar target={2} onDropped={this.setDrawer}>
                    <Notch value={100} radius={35} style={notchStyle}>CLOSE</Notch>
                    <Notch value={200} radius={20} style={notchStyle}>50%</Notch>
                    <Notch value={300} radius={26} style={notchStyle}>75%</Notch>
                    <Notch value={400} radius={35} style={notchStyle}>OPEN</Notch>
                    { state && state.position && this.getPositionTracker() }
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
