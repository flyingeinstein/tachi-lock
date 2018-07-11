// import { createStore } from 'redux'
import { Animated } from 'react-native';

export const States = {
    0: 'Welcome',
    1: 'Locked',
    2: 'Controls'
};

export interface Transition {
    from: number,
    to: number,
    animation: Animated,
    tween: number,       // number between 0 and 1 that animates and controlled by curve function
    curve_fn: (x: number) => number     // the curve function
}

const defaultState = {
    state: 1,
    transition:  undefined
};

export default function locksReducer(state=defaultState, action) {
    switch(action.type) {
        case 'GOTO_STATE': {
            if(action.state!==undefined && action.state !== state.state) {
                //
            }
        } break;
        case 'ANIMATE_STATE': {
            // called from within framework getAnimationFrame() to update animation step
        } break;
        case 'UPDATE': {
        } break;
    }
    return state;
}
