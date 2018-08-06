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
import { connect } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient';

import store from './stores/root';
import { select as selectLock, unlock } from './actions/lock';

import {KeypadFormats} from './components/Keypad';
import Keypad from './redux/ConnectedKeypad';
import Dots from './components/DancinDots';
import Tracker from './components/Tracker';
import Lock, { LockProps } from './locks/Simple';
import Protocols from './protocols/protocols';
import KPI from './components/KPI';


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
        fader: Animated,
        keypadFader: Animated,
        dots: Animated,
        locktitle: Animated
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

const Page = ({ offset, caption, first, second, gradient, onClick }) => (
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
        viewState: ViewState.SelectiveUnlock,
        controls: {
            keypad: new Animated.Value(0),
            keypadFader: new Animated.Value(1),
            dots: new Animated.Value(0),

            lockFader: new Animated.Value(0),
            lockTitle: new Animated.Value(300)
        }
      };

      //setTimeout(()=>{ this.selectLock(this.props.locks[0]); this.onKeypadEntry("1111", 0); }, 1500);
    }

    showKeypad() {
        let x = Animated.parallel([
            Animated.timing(
                this.state.controls.lockFader,
                {
                    toValue: 0,
                    duration: 500
                }
            ),
            Animated.spring(
                this.state.controls.lockTitle,
                {
                    toValue: 300,
                    velocity: 1,
                    tension: 2,
                    friction: 16,
                    onComplete: () => {
                        // clear lock now that title and lock is hidden
                        this.setState({
                            lock: null,
                            protocol: null
                        });
                    }
                }
            ),
            Animated.spring(
                this.state.controls.keypad,
                {
                    toValue: 0,
                    velocity: 1,
                    tension: 2,
                    friction: 16,
                    delay: 500
                }
            ),
            Animated.timing(
                this.state.controls.keypadFader,
                {
                    toValue: 1,
                    duration: 1000,
                    delay: 500
                }
            ),
            Animated.spring(
                this.state.controls.dots,
                {
                    toValue: 0,
                    velocity: 1,
                    tension: 2,
                    friction: 16
                }
            )
        ]);
        x.start();
    }

    showControls() {
        Animated.parallel([
            Animated.spring(
                this.state.controls.keypad,
                {
                    toValue: -Dimensions.get('window').height,
                    velocity: 1,
                    tension: 2,
                    friction: 16
                }
            ),
            Animated.timing(
                this.state.controls.keypadFader,
                {
                    toValue: 0,
                    duration: 1000
                }
            ),
            Animated.spring(
                this.state.controls.dots,
                {
                    toValue: -300,
                    velocity: 1,
                    tension: 2,
                    friction: 16
                }
            ),
            Animated.timing(
                this.state.controls.lockFader,
                {
                    toValue: 1,
                    duration: 1000
                }
            ),
            Animated.spring(
                this.state.controls.lockTitle,
                {
                    toValue: 0,
                    velocity: 1,
                    tension: 2,
                    friction: 16
                }
            )
        ]).start();
    }

    lockStateChanged(state) {
        let { viewState } = this.state;
        if(state.locked && viewState===ViewState.Control) {
            viewState = ViewState.Welcome;
        }
        this.setState({ viewState: viewState, lockState: state }, () => this.onStoreChange());
    }

    onStoreChange() {
        let { viewState, lock, lockState } = this.state;
        //console.log("store-changed  state: ", viewState, lock);

        // our app view logic here
        switch(viewState) {
            case ViewState.Welcome: {
                // show keypad and move to next state
                this.setState({
                    viewState: ViewState.SelectiveUnlock,
                    passcode: ''
                });
                this.showKeypad();
                //console.log("moving from Welcome => SelectiveUnlock");
            } break;

            case ViewState.SelectiveUnlock: {
                if(lockState && !lockState.locked) {
                    this.setState({viewState: ViewState.Control});
                    this.showControls();
                    //console.log("moving from SelectiveUnlock => Control");
                }
            } break;

            case ViewState.Unlock: {
                if(lockState && !lockState.locked) {
                    this.setState({viewState: ViewState.Control});
                    this.showControls();
                    //console.log("moving from Unlock => Control");
                }
            } break;

            case ViewState.Control: {
                if(!lockState) {
                    this.setState({viewState: ViewState.SelectiveUnlock});
                    this.showKeypad();
                    //console.log("moving from Control => Control");
                } else if(lockState.locked) {
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
        let digits = lock ? lock.digits+1 : 4;
        let dots = [];
        for(let x=0; x<digits; x++) {
            dots.push((x < passcode.length) ? '*':'.');
        }
        return dots;
    }

    onPasscodeMatch() {
        this.onStoreChange();
    }

    onPasscodeMismatch(e) {
        console.log("password incorrect");
        this.setState({
            passcode: '',
            lock: null,
            protocol: null
        });
    }

    selectLock(l) {
        let lock = {
            ...l,
            onLockUpdated: (lock, state) => this.lockStateChanged(state),
            onDrawerUpdated: (lock, state) => this.setState({ drawerState: state }),
            onMotorUpdated: (lock, axis, state) => this.setState({ motorState: state })

        };    // copy lock config
        let protocol = Protocols.create(lock, store.dispatch.bind(store));
        this.setState({
            lock,
            protocol
        });
        console.log("App selected lock ", lock);
        this.props.select(lock);
    }

    onKeypadEntry(passcode, pending) {
        let { lock, protocol } = this.state;
        this.setState({ passcode });
        if(!pending) {
            if(lock && protocol) {
                if(passcode.length-1===lock.digits)
                    protocol.unlock(passcode.substr(1))
                        .then(() => this.onPasscodeMatch() )
                        .catch((e) => this.onPasscodeMismatch(e) );
            } else {
                if(passcode.length===0) {

                }  else if(passcode.length===1) {
                    // use the first digit of the passcode (prefix) to select a lock instance
                    this.props.locks.forEach((l) => {
                        let prefix = (typeof l.prefix === "number")
                            ? (''+l.prefix)
                            : l.prefix;

                        if (prefix === passcode[0]) {
                            this.selectLock(l);
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
        let { lock, protocol, lockState, drawerState, motorState, viewState } = this.state;
        let state = {
            ...lockState,
            ...drawerState,
            motor: motorState,
        };
        let showControls = viewState === ViewState.Control;
        let stateIcon = null;
        //if(lock && state ) console.log("lock ", state);
        return (
              <View style={styles.container}>
                  <LinearGradient colors={['#0E5B72', '#06252E']} style={styles.container}>

                      <Animated.View style={[styles.welcome, {opacity: this.state.controls.keypadFader}]}>
                        <Text style={styles.welcomeText}>
                            { this.getBannerText() }
                        </Text>
                      </Animated.View>

                      <Text style={styles.welcomeText}>
                          { this.state && this.state.code }
                      </Text>

                      <Animated.View style={[styles.feedback, styles.dots, {transform: [{translateX: this.state.controls.dots}]}]}>
                          <Dots pattern={this.getDots()} visible={!this.state.authenticated} />
                      </Animated.View>

                      <Animated.View style={[styles.feedback, styles.lockTitle, {transform: [{translateX: this.state.controls.lockTitle}]}]}>
                          <Text style={styles.title}>{lock ? lock.name : ''}</Text>
                      </Animated.View>

                      <Animated.View style={[ styles.controls, {opacity: this.state.controls.lockFader} ]}>
                          <Lock lock={lock} protocol={protocol} state={state} />
                      </Animated.View>

                      <KPI order={0} icon='lock' show={showControls && drawerState.state==='idle' && drawerState.closed } />
                      <KPI order={0} icon='angle-double-up' header='retracting' show={showControls && drawerState.state==='retracting'} />
                      <KPI order={0} icon='angle-double-down' header='extending' show={showControls && drawerState.state==='extending'} />
                      <KPI order={0} icon='exclamation-triangle' header='jammed' show={showControls && drawerState.state==='jammed'} />

                      <KPI order={1} header='Last Unlocked' footer='days ago' value={'15'} show={showControls} />
                      <KPI order={2} footer='Relock' value={state.timeout ? state.timeout.remaining*100/state.timeout.interval : 0} type='pie' show={showControls && state.timeout} />

                      <Animated.View style={[styles.keypadView, {bottom: this.state.controls.keypad}]}
                      >
                        <Keypad
                            length={lock ? (lock.digits+1) : 5 }
                            value={this.state.passcode}
                            onUpdate={this.onKeypadEntry}
                        />
                      </Animated.View>

                      <View style={styles.footer}>
                      </View>

                  </LinearGradient>
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
        justifyContent: 'center',
        height: 30,
        position: 'absolute',
        top: 45
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
        position: 'absolute',
        bottom: 0,
        marginBottom: 35
    },
    controls: {
        position: 'absolute',
        top: 140,
        left: 80,
        height: 400,
        width: 100
    },
    icon: {
        textAlign: 'center',
        color: '#fff',
        fontSize: 28
    },
    feedback: {
        position: 'absolute',
        top: 100,
    },
    dots: {
        flex: 1,
        flexDirection: 'row',
        height: 64
    },
    locktitle: {
        height: 64
    },
    title: {
        fontFamily: 'arial',
        fontSize: 18,
        color: 'white'
    },
    header: {
        display: 'none',
        backgroundColor: '#57C9EA',
        width: '130%',
        height: 170,
        position: 'absolute',
        top: -20,
        left: -20,
        zIndex: -4,
        transform: [{ rotateZ: '-5deg' }]
    },
    footer: {
        height: 48
    }
});
