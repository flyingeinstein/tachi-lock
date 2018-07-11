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
        baseUrl: 'http://simlock/',
        lock: 'lock?code={code}',
        unlock: 'unlock',
        enable: 'motor/enable',
        disable: 'motor/disable',
        open: 'open/{position}',
        close: '/motor/home'
    }
}, {
    name: 'Secret Drawer',
    type: 'tachi-lock',
    prefix: 2,
    digits: 3,
    encoding: 'plain-text',      // plain-text, base64, md5, challenge-response
    endpoint: {
        baseUrl: 'http://tachilock/',
        lock: 'lock?code={code}',
        unlock: 'unlock',
        enable: 'motor/enable',
        disable: 'motor/disable',
        open: 'open/{position}',
        close: '/motor/home'
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
