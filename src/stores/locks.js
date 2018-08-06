// import { createStore } from 'redux'

const defaultLocks = [{
    name: 'Simulated Drawer',
    type: 'sim-lock',
    prefix: 1,
    digits: 3,
    simulation: {
        passcode: '111',
        latency: {
            min: 50,
            max: 1000
        }
    },
    encoding: 'plain-text',      // plain-text, base64, md5, challenge-response
    endpoint: {
        baseUrl: 'http://simlock',
        lock: {
            status: 'GET status',
            lock: 'POST control/lock',
            unlock: 'POST control/unlock?code={code}'
        },
        drawer: {
            open: 'POST control/open?percent={percent}',
            close: 'POST control/close'
        },
        motor: {
            enable: 'POST motor/enable',
            disable: 'POST motor/disable'
        }
    }
}, {
    name: 'Secret Drawer',
    type: 'tachi-lock',
    prefix: 2,
    digits: 4,
    encoding: 'plain-text',      // plain-text, base64, md5, challenge-response
    endpoint: {
        baseUrl: 'http://192.168.2.170',
        lock: {
            status: 'GET status',
            lock: 'POST control/lock',
            unlock: 'POST control/unlock?code={code}'
        },
        drawer: {
            open: 'POST control/open?percent={percent}',
            close: 'POST control/close'
        },
        motor: {
            enable: 'POST motor/enable',
            disable: 'POST motor/disable'
        }
    }
}, {
    name: 'Projector',
    type: ['Drawer','Projector'],
    prefix: 5,
    digits: 6,
    encoding: 'challenge-response',
    endpoint: 'http://projector/'
}];

export default function locksReducer(state=defaultLocks, action) {
    switch(action.type) {
        case 'ADD': {
        } break;
        case 'DELETE': {
        } break;
        case 'UPDATE': {
        } break;
    }
    return state;
}
