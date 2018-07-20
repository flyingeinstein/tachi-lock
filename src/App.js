/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Dimensions,
  Text,
  View, Animated
} from 'react-native';
import Parallax from './react-spring/targets/native/Parallax';
import { connect } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient';

import store from './stores/root';
import { select as selectLock, unlock } from './actions/lock';

import {KeypadFormats} from './components/Keypad';
import Keypad from './redux/ConnectedKeypad';
import Dots from './components/DancinDots';
import Tracker from './components/Tracker';
import Lock, { LockProps } from './locks/Simple';
import Protocols from "./protocols/protocols";


const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

export const ViewState = {
    Welcome: 0,
    SelectiveUnlock: 1,         // shows keypad expecting unlock code with lockID prefix
    Unlock: 2,                  // shows keypad expecting unlock code on an already selected lock
    Control: 3                  // lock is unlocked and controls are shown
};

type State = {
    passcode: string,
    match: string,
    authenticated: boolean,
    viewState: number,
    lock: {},
    protocol: IProtocol,
    controls: {
        keypad: Animated,
        fader: Animated
    },
};

type Props = {};

const mapStateToProps = state => ({
    locks: state.locks
});

const mapDispatchToProps = (dispatch) => ({
    select: lock => {
        //console.log(lock);
        //store.selectLockType(lock.type);
        return dispatch(selectLock(lock));
    }
});

const Page = ({ offset, caption, first, second, gradient, onClick, children }) => (
    <React.Fragment>
        <Parallax.Layer offset={offset} speed={0.2} onClick={onClick}>
            <div className="slopeBegin" />
        </Parallax.Layer>

        <Parallax.Layer offset={offset} speed={-0.2} onClick={onClick}>
            <div className={`slopeEnd ${gradient}`} />
        </Parallax.Layer>

        <Parallax.Layer className="text number" offset={offset} speed={0.3}>
            <span>0{offset + 1}</span>
        </Parallax.Layer>

        <Parallax.Layer className="text header" offset={offset} speed={0.4}>
      <span>
        <p style={{ fontSize: 20 }}>{caption}</p>
        <div className={`stripe ${gradient}`} />
        <p>{first}</p>
        <p>{second}</p>
      </span>
        </Parallax.Layer>
    </React.Fragment>
);

const App = connect( mapStateToProps, mapDispatchToProps)(class App extends Component<Props,State> {
    constructor(props) {
      super(props);
      store.subscribe(this.onStoreChange.bind(this));
      this.onKeypadEntry = this.onKeypadEntry.bind(this);

      this.state = {
        passcode: '',
        viewState: 0,
        controls: {
            keypad: new Animated.Value(0),
            fader: new Animated.Value(0)
        }
      };

      //setTimeout(()=>{ this.props.select(this.props.locks[0]); this.props.unlock("111"); }, 100);
    }

    showKeypad() {
        this.refs.parallax.scrollTo(0);
        /*
        Animated.parallel([
            Animated.spring(
                this.state.controls.keypad,
                {
                    toValue: 0,
                    velocity: 1,
                    tension: 2,
                    friction: 16
                }
            ),
            Animated.timing(
                this.state.controls.fader,
                {
                    toValue: 0,
                    duration: 1000
                }
            )
        ]).start();*/
    }

    showControls() {
        this.refs.parallax.scrollTo(1);
        /*
        Animated.parallel([
            Animated.spring(
                this.state.controls.keypad,
                {
                    toValue: Dimensions.get('window').height,
                    velocity: 1,
                    tension: 2,
                    friction: 16
                }
            ),
            Animated.timing(
                this.state.controls.fader,
                {
                    toValue: 1,
                    duration: 1000
                }
            )
        ]).start();*/
    }

    onStoreChange() {
        let { viewState, lock } = this.state;
        //console.log("store-changed  state: ", viewState, lock);

        // our app view logic here
        switch(viewState) {
            case ViewState.Welcome: {
                // show keypad and move to next state
                this.setState({viewState: ViewState.SelectiveUnlock});
                this.showKeypad();
                console.log("moving from Welcome => SelectiveUnlock");
            } break;

            case ViewState.SelectiveUnlock: {
                if(lock && !lock.locked) {
                    this.setState({viewState: ViewState.Control});
                    this.showControls();
                    console.log("moving from SelectiveUnlock => Control");
                }
            } break;

            case ViewState.Unlock: {
                if(lock && !lock.locked) {
                    this.setState({viewState: ViewState.Control});
                    this.showControls();
                    console.log("moving from Unlock => Control");
                }
            } break;

            case ViewState.Control: {
                if(!lock) {
                    this.setState({viewState: ViewState.SelectiveUnlock});
                    this.showKeypad();
                    console.log("moving from Control => Control");
                } else if(lock.locked) {
                    this.setState({viewState: ViewState.Unlock});
                    this.showKeypad();
                }
            } break;
        }
    }

    getBannerText() {
        if(!this.state.authenticated) {
            return 'Enter passcode';
        } else if(this.state.lock) {
            // we are at the controls, so banner text depends on lock state
            switch(this.state.lock.state) {
                case 'Closed': return 'Drawer closed';
                case 'Closing': return 'Retracting drawer';
                case 'Open': return 'Drawer open';
                case 'Opening': return 'Opening drawer';
                case 'Jammed': return 'Jammed, clear obstacle';
                default:
                    return 'Dazed and confused!';
            }
        } else {
            // cannot communicate with lock
            return 'Lock status unavailable';
        }

    }

    getDots() {
        let { lock, passcode } = this.state;
        let digits = lock ? lock.digits+1 : 5;
        let dots = [];
        for(let x=0; x<digits; x++) {
            dots.push((x < passcode.length) ? '*':'.');
        }
        return dots;
    }

    onPasscodeMatch() {

    }

    onPasscodeMismatch() {
        this.setState({
            passcode: '',
            lock: null,
            protocol: null
        });
    }

    onKeypadEntry(passcode, pending) {
        let { lock, protocol } = this.state;
        this.setState({ passcode });
        if(!pending) {
            if(lock && protocol) {
                if(passcode.length-1===lock.digits)
                    protocol.unlock(passcode.substr(1))
                        .then(() => this.onPasscodeMatch() )
                        .catch(() => this.onPasscodeMismatch() );
            } else {
                if(passcode.length===0) {

                }  else if(passcode.length===1) {
                    // use the first digit of the passcode (prefix) to select a lock instance
                    this.props.locks.forEach((l) => {
                        let prefix = (typeof l.prefix === "number")
                            ? (''+l.prefix)
                            : l.prefix;

                        if (prefix === passcode[0]) {
                            let lock = {
                                ...l,
                                onLockUpdated: (lock, state) => this.setState({ lockState: state }),
                                onDrawerUpdated: (lock, state) => this.setState({ drawerState: state }),
                                onMotorUpdated: (lock, axis, state) => this.setState({ motorState: state })

                            };    // copy lock config
                            let protocol = Protocols.create(lock, store.dispatch.bind(store));
                            this.setState({
                                lock,
                                protocol
                            });
                            //console.log("protocl app ", lock);
                            this.props.select(lock);
                            return false;   // no more matching
                        }
                    });
                } else if(passcode.length===5) {
                    this.onPasscodeMismatch();
                }
                // otherwise we just ignore, there is no lock that matches so code will always fail
            }
        }
    }

    render() {
        let { lock, lockState, drawerState, motorState } = this.state;
        let state = {
            ...lockState,
            ...drawerState,
            motor: motorState
        };
        //scroll = to => this.refs.parallax.scrollTo(to);
        return (
              <View style={styles.container}>
                      <Parallax className="container" ref="parallax" pages={2} horizontal scrolling={false}>

                          <Parallax.Layer offset={0} speed={0.2}>
                              <View style={styles.welcome}>
                                <Text style={styles.welcomeText}>
                                    { this.getBannerText() }
                                </Text>
                              </View>

                              <Text style={styles.welcomeText}>
                                  { this.state && this.state.code }
                              </Text>

                              <View style={styles.feedback}>
                                  <Dots pattern={this.getDots()} visible={!this.state.authenticated} />
                              </View>
                          </Parallax.Layer>

                          <Parallax.Layer offset={1} speed={0.2}>

                              <Animated.View style={[ styles.controls, {opacity: this.state.controls.fader} ]}>
                                <Lock lock={this.state.lock} protocol={this.state.protocol} state={state} />
                              </Animated.View>

                              <Animated.View style={[styles.keypadView,
                                  {transform: [{translateY: this.state.controls.keypad}]}]}
                              >
                                <Keypad
                                    length={lock ? (lock.digits+1) : 5 }
                                    value={this.state.passcode}
                                    onUpdate={this.onKeypadEntry}
                                />
                              </Animated.View>

                          </Parallax.Layer>>

                      </Parallax>
              </View>
    );
  }
});


//export default App = connect((store) => { return {
//    locks: store.locks
//}})(App);
export default App;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    welcome: {
        flex: 1,
        justifyContent: 'center',
        height: 150
    },
    welcomeText: {
        color: '#aaa'
    },
    instructions: {
      textAlign: 'center',
      color: '#333333',
      marginBottom: 5,
    },
    keypadView: {

    },
    controls: {
        flex: 1,
        flexDirection: 'row'
    },
    icon: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 28
    },
    feedback: {
        flex: 1,
        flexDirection: 'row',
        height: 64
    },
    footer: {
        height: 48
    }
});
