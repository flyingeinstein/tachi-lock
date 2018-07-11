import SimProtocol from './sim-protocol'
import TachiProtocol from './tachi-protocol'

export { IProtocol, ILockProtocol,  IDrawerProtocol } from './common'

export default class Protocols {
    static create(lockProps, dispatch) {
        switch(lockProps.type) {
            case "tachi-lock": return new TachiProtocol(lockProps, dispatch);
            default:
                return new SimProtocol(lockProps, dispatch);
        }
    }

    static implementsLock(o) : boolean {
        return o.lock && o.unlock;
    }

    static implementsDrawer(o) : boolean {
        return o.open && o.close;
    }
}