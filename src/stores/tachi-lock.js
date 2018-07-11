import TachiProtocol from '../protocols/tachi-protocol';

const lockDefaults = {
    locked: true
}

export default function lockReducer(state=null, action) {
    switch (action.type) {
        case 'SELECT': {
            // combine default lock values with whatever is in playload lock
            //console.log("selecting ", action);
            return {...lockDefaults, ...action.payload}
        }
        case 'UPDATE': {
            // combine default lock values with whatever is in playload lock
            console.log("updating info for lock ", action);
            return {...state, ...action.payload}
        }
        case 'STATUS': {
            // combine default lock values with whatever is in playload lock
            console.log("updating status for lock ", action.payload);
            return {...state, status: { ...action.payload }}
        }
        case 'UNLOCK': {
            if (action.code === '652') {
                //console.log("unlocked");
                return {...state, locked: false}
            }
        } break;
        case 'OPEN': {
            console.log("opening "+(action.percent*100)+"%");
            let protocol = new TachiProtocol();
            protocol.motorPosition( action.percent * 27000 );
            return {...state, state: 'Open'}
        } break;
        case 'CLOSE': {
            console.log("closing");
            let protocol = new TachiProtocol();
            protocol.motorHome();
            return {...state, state: 'Closed'}
        } break;
        case 'ENABLE': {
            console.log(action.enable ? "enable motor" : "disable motor");
            let protocol = new TachiProtocol();
            protocol.motorEnable( action.enable );
            return {...state, state: 'Open'}
        } break;
    }
    return state;
};
