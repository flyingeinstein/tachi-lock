import { connect } from 'react-redux'

import Keypad from '../components/Keypad';
import { unlock } from '../actions/lock';

const mapStateToProps = store => ({
    lock: store.current
});

const mapDispatchToProps = dispatch => ({
});

const ConnectedKeypad = connect(mapStateToProps, mapDispatchToProps)(Keypad);

export default ConnectedKeypad;
