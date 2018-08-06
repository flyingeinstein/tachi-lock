
export function select(lock) {
    return {
        type: 'SELECT',
        payload: lock
    }
}

export function unlock() {
    return {
        type: 'UNLOCK'
    }
}

export function open(percent) {
    return {
        type: 'OPEN',
        percent
    }
}

export function close() {
    return {
        type: 'CLOSE'
    }
}

export function enable(enable) {
    return {
        type: 'ENABLE',
        enable
    }
}

export function update(status) {
    return {
        type: 'STATUS',
        payload: status
    }
}
