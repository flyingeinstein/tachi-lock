import { IMotorCommand, IMotorInfo, IMotorState} from "./common";
import * as lockActions from '../actions/lock';
import type {IProtocol, IDrawerProtocol, ILockProtocol } from "./common";
import {Protocol, Capabilities } from "./common";


export default class SimProtocol extends Protocol implements IProtocol, ILockProtocol, IDrawerProtocol {

    constructor(lockProps, dispatch) {
        super(lockProps, dispatch);

        // configure simulation settings
        let sim = lockProps.simulation || {};
        this.simulation = {
            passcode: sim.passcode || '123456789'.substr(0, lockProps.digits),
            latency: {
                min: (sim.latency && sim.latency.min) || 50,
                max: (sim.latency && sim.latency.max) || 500
            }
        };
        this.axis = [{
            // speed in units per second
            enabled: true,
            speed: 0,
            position: 0,
            target: 0,
            config: {
                speed: {
                    extending: 5000,
                    retracting: 2500,
                    homing: 1000
                },
                limits: {
                    min: 0,
                    max: 27000
                }
            }
        }];
        this.axis.forEach((axis, id) => {
            axis.stop = this.stopMotor.bind(this,axis);
            axis.isMoving = this.isMotorMoving.bind(this,axis);
            axis.moveTo = this.moveMotorTo.bind(this,axis);
            axis.moveToPercent = this.moveMotorToPercent.bind(this,axis);
            axis.sendUpdate = this.sendMotorUpdate.bind(this,id,axis);
        });

        this.lock.digits = this.simulation.passcode.length;
        this.position = this.target = 0;  // set position to home
    }

    request(endpointId : string, args, lambda : (resolve, reject) => void) : Promise {
        let {latency} = this.simulation;
        let endpoint = this.getEndpoint(endpointId, args);
        if(endpoint)
            console.log("request => "+endpoint.url);

        // we fake a request by setting a timer and the running the lambda code
        return new Promise((resolve, reject) => {
            setTimeout(
                () => lambda(resolve, reject),
                latency.min + Math.random() * (latency.max - latency.min)
            );
        });
    }

    protocolName() { return "Simulated Drawer"; }
    capabilities() { return [Capabilities.Locking, Capabilities.ExtendRange, Capabilities.Enable]}

    echo(msg) {
        console.log(this.protocolName()+" says "+msg);
    }

    lock() {
        return this.request("lock", { percent }, (resolve, reject) => {
            this.echo("locked");
            this.dispatch(lockActions.lock());
        });
    }

    unlock(code : string) {
        return this.request("unlock", { code }, (resolve, reject) => {
            if(code===this.simulation.passcode) {
                this.dispatch(lockActions.unlock(code));
                this.echo("unlocked");
                this.enable(true);
                resolve();
            } else {
                this.echo("access denied");
                reject();
            }
        });
    }

    enable(enable: boolean) {
        return this.request(enable?"enable":"disable", { enable }, (resolve, reject) => {
            this.echo((enable?"enabled":"disabled"));
            this.axis[0].enabled = enable;
            if(!enable && this.isMoving()) {
                this.stopMotion();
            }
            this.sendMotorUpdate(0, this.axis[0]);
            //this.dispatch(lockActions.enable(enable));
        });
    }

    open(percent : number) {
        return this.request("open", { percent }, (resolve, reject) => {
            this.echo("open " + percent);
            this.moveToPercent(percent);
            //this.dispatch(lockActions.open(percent));
        });
    }

    close() {
        return this.request("close", { }, (resolve, reject) => {
            this.echo("close");
            this.moveTo(0);
            //this.dispatch(lockActions.close());
        });
    }

    sendMotorUpdate(axis: number, motor: IMotorState) {
        let { position, state, config } = motor;
        this.lock.onMotorUpdated && this.lock.onMotorUpdated(this, axis, { ...motor });

        // we also need to send a drawer update
        this.lock.onDrawerUpdated && this.lock.onDrawerUpdated(this, {
            closed: (position < 10),
            position: position / config.limits.max,
            button: false,
            state: state
        });

        /*this.dispatch(lockActions.update({
            state,
            position,
            target
        }));*/
    }

    isMoving() {
        return this.axis[0].isMoving();
    }

    moveToPercent(percent) {
        this.axis[0].moveToPercent(percent);
    }
    moveTo(target: number) {
        this.axis[0].moveTo(target);
    }
    stop() {
        this.axis[0].stop();
    }


    isMotorMoving(motor: IMotorState) {
        return motor.target!==motor.position;
    }

    moveMotorToPercent(motor: IMotorState, percent) {
        return motor.moveTo(percent * motor.config.limits.max);
    }

    moveMotorTo(motor: IMotorState, target: number) {
        motor.stop();  // ensure no current command is set
        motor.target = target;
        if(!this.updateLoop)
            this.startMotorUpdateWorker();
    }

    stopMotor(motor: IMotorState, supressUpdate: boolean = false) {
        if(motor.isMoving()) {
            motor.target = motor.position;
            motor.speed = 0;
            motor.state = "idle";

            if(!supressUpdate)
                motor.sendUpdate();
            console.log("stop");
        }
    }

    startMotorUpdateWorker() {
        this.updateLoop = setInterval(
            () => {
                let anyUpdated = false;
                this.axis.forEach((motor,id) => {
                    if(motor.target!==motor.position) {
                        let extending = motor.target > motor.position;
                        let speed = extending ? motor.config.speed.extending : motor.config.speed.retracting;
                        motor.speed = speed;
                        speed /= 10;

                        if (extending) {
                            motor.state = "extending";
                            motor.position += speed;
                            if (motor.position > motor.target)
                                motor.stop(true);
                        } else {
                            motor.state = "retracting";
                            motor.position -= speed;
                            if (motor.position < motor.target)
                                motor.stop(true);
                        }
                        //console.log("update "+motor.position+" => "+motor.target, motor);
                        motor.sendUpdate();
                        anyUpdated = true;
                    }
                });

                if(!anyUpdated) {
                    // no more moving motors so we can stop updating
                    clearInterval(this.updateLoop);
                    this.updateLoop = null;
                }
            },
            100
        );
    }
}