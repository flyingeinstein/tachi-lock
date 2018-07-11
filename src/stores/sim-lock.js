
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
            let { state, position, target, ...rest } = action.payload;
            if(position!==target)
                console.log("lock status: ", state, position+"=>"+target, rest);
            else
                console.log("lock status: ", state, position, rest);
            return {...state, status: { ...action.payload }}
        }
        case 'UNLOCK': {
            if (action.code === '111') {
                //console.log("unlocked");
                return {...state, locked: false}
            }
        }
            break;
        case 'OPEN': {
            //console.log("opening "+(action.percent*100)+"%");
            return {...state, state: 'Open'}
        }
            break;
        case 'CLOSE': {
            //console.log("closing");
            return {...state, state: 'Closed'}
        }
            break;
        case 'ENABLE': {
            // todo: this probably needs to go away as enabling/disabling the motor affects state (set by STATUS above)
            //console.log(action.enable ? "motor enabled" : "motor disabled");
            return {...state, state: action.enable ? 'Idle' : 'Disabled'}
        }
            break;
    }
    return state;
};
