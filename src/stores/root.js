import { createStore, combineReducers } from 'redux'

import locksReducer from './locks'
import simLockReducer from './sim-lock'
//import tachiLockReducer from './tachi-lock'
import uiReducer from './uistate'

const reducers = combineReducers({
    ui: uiReducer,
    locks: locksReducer
});

const store = createStore(reducers);

store.selectLockType = function(type : string) {
    return; // todo: deprecated, lock implementation now in protocols
    let lockReducer = null;
    switch(type) {
        case "sim-lock": lockReducer = simLockReducer; break;
        case "tachi-lock": lockReducer = tachiLockReducer; break;
    }
    if(lockReducer!==null) {
        const reducers = combineReducers({
            ui: uiReducer,
            locks: locksReducer,
            current: lockReducer
        });
        store.replaceReducer(reducers);
        console.log("selected " + type + " lock type");
    }
}

// subscribe for some debugging
let cached_state = {
};
store.subscribe(() => {
    let previousUI = cached_state.ui;
    let state = store.getState();
    cached_state = {
        ui: state.ui
    };

    if(previousUI !== cached_state.ui)
        console.log("ui-state ", state.ui);
});
export default store;