
export const Capabilities = {
    Locking: 1,
    ExtendRange: 2,
    Enable: 4
}

export interface IProtocol {
    protocolName: () => string;
    capabilities: () => number;
}

export interface ILockProtocol extends IProtocol {
    lock: () => boolean | Promise;
    unlock: (code : string) => boolean | Promise;
    onLockUpdated: (lock: ILockProtocol, state : ILockState) => void;
}

export interface IDrawerProtocol extends IProtocol {
    open: (percent: number) => boolean | Promise;
    close: (percent: number) => boolean | Promise;
    onDrawerUpdated: (drawer: IDrawerProtocol, state : IDrawerState) => void;
}

export interface IMotorProtocol extends IProtocol {
    enable: (enable: boolean) => boolean | Promise;
    moveTo: (target: number) => boolean | Promise;
    moveToPercent: (percent: number) => boolean | Promise;
    stop: () => boolean | Promise;
    onMotorUpdated: (motor: IMotorProtocol, axis: number, state: IMotorState) => void;
}


export interface IMotorCommand {
    method?: string;          //   'get' or 'post'
    endpoint: string;        //   command, http://hostname/motor/<endpoint>
    data?: {};
    onSuccess?: (json : IMotorInfo) => void;
    onFail?: (error : any) => void;
}

export interface IMotorState {
    enabled: number;
    position: number;
    target: number;
    speed: number;
    state: string;
}

export interface IDrawerState {
    closed: boolean;
    position: number;   // 0 ... 1.0
    button: boolean;
    state: string;  // idle, extending, retracting, jammed
}

export interface ILockState {
    locked: boolean;
}

export class Protocol {
    constructor(lockProps, dispatch) {
        this.lock = lockProps;
        this.dispatch = dispatch;

        //setInterval(() => this.getMotorStatus(), 1000);
    }

    getEndpoint(endpointId, args) : {} {
        const lock = this.lock;
        if(!lock || !lock.endpoint || !lock.endpoint[endpointId])
            return null;
        else {
            let url = (lock.endpoint.baseUrl)
                ? lock.endpoint.baseUrl
                : 'http://localhost/';
            url += lock.endpoint[endpointId];
            // todo: add args into query string
            // todo: if post, build the form-data
            return {
                method: 'get',
                url
            }
        }
    }
}