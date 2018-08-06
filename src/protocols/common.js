
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

export interface ITimeout {
    interval: number;
    remaining: number;
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
    timeout: ITimeout | boolean;
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
        const path = endpointId.split('.');
        if(!lock || !lock.endpoint || !path || !Array.isArray(path))
            return null;
        else {
            // get endpoint from the path
            let endpoint = lock.endpoint;
            while(endpoint && path.length>0) {
                endpoint = endpoint[path.shift()];
            }
            if(!endpoint)
                return null;    // endpoint not found

            let method = 'get';
            let methodPrefix = endpoint.match(/^(get|post|put) */i);
            if(methodPrefix) {
                // extract the http verb
                method = methodPrefix[1];
                endpoint = endpoint.substr(methodPrefix[0].length);
            }

            let url = '/'+endpoint;

            // add args into query string
            let replacer = function(match, p1, p2, p3, offset, string) {
                // p1 is nondigits, p2 digits, and p3 non-alphanumerics
                return args[ p1 ];
            };
            url = url.replace(/\{([A-Za-z_]*)\}/, replacer);

            return {
                method,
                url
            }
        }
    }
}