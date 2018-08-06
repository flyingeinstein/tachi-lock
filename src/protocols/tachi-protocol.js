import axios from 'axios';
import * as qs from 'qs';

import type {IProtocol, IDrawerProtocol, ILockProtocol, IMotorInfo, IMotorCommand, IDrawerState, ILockState } from "./common";
import {Protocol, Capabilities } from "./common";

const credentials = {
    host: "192.168.2.170",
    secureHost: false
};

export default class TachiProtocol extends Protocol implements IProtocol, ILockProtocol, IDrawerProtocol  {

    instance : {};
    lockState : ILockState;
    drawerState : IDrawerState;

    constructor(lockProps, dispatch) {
        super(lockProps, dispatch);

        this.instance = axios.create({
            baseURL: lockProps.endpoint.baseUrl,
            timeout: 10000,
            responseType: 'json'
        });
        this.dispatch = dispatch;

        //setInterval(() => this.getMotorStatus(), 1000);
    }

    setState(state) {
        console.log("motor", state);
        //dispatch({ type: 'STATUS', payload: state });
    }

    request(endpointId : string, args) : Promise {
        let endpoint = this.getEndpoint(endpointId, args);
        if(endpoint)
            console.log("request => "+endpoint.method.toUpperCase()+" "+endpoint.url);

        // we fake a request by setting a timer and the running the lambda code
        return new Promise((resolve, reject) => {
            this.instance.request({
                url: endpoint.url,
                method: endpoint.method
            })
                .then( (response) => {
                    console.log("lock returned ", response);
                    if(response.lock) {
                        // lock state
                        this.setLockState({ locked: status.lock==="locked" });
                    } if(response.drawer && response.button) {
                        // drawer status
                        this.setDrawerState({ closed: status.drawer==="closed", button: status.button })
                    } else {
                        const motorResponse: IMotorInfo = response.data;
                        this.setState({motor: motorResponse});
                    }
                    resolve(response);
                })
                .catch((error) => {
                    console.log("error ", error.response);
                    this.setState( { remoteStatus: 'bad response' });
                    reject(error);
                });
        });
    }

    command(options: IMotorCommand) {
        const This = this;
        let url = "/motor/"+options.endpoint;
        if(options.data) {
            url += '?'+qs.stringify(options.data);
        }
        console.log("request => "+url);
        axios({
            url,
            method: options.method ? options.method : 'post'
        })
            .then( (response) => {
                const motorResponse : IMotorInfo = response.data;
                this.setState( { motor: motorResponse } );
                if(options.onSuccess) {
                    options.onSuccess.call(This, motorResponse);
                }
            })
            .catch((error) => {
                this.setState( { remoteStatus: 'bad response' });
                if(options.onFail) {
                    options.onFail.call(This, error);
                }
            });
    }

    command2(options: IMotorCommand) {
        const This = this;
        let url = (credentials.secureHost ? 'https' : 'http') + '://' + credentials.host + "/motor/"+options.endpoint;
        if(options.data) {
            url += '?'+qs.stringify(options.data);
        }
        console.log(url);
        axios({
            method: options.method ? options.method : 'post',
            timeout: 8000,
            url
        })
            .then( (response) => {
                const motorResponse : IMotorInfo = response.data;
                this.setState( { motor: motorResponse } );
                if(options.onSuccess) {
                    options.onSuccess.call(This, motorResponse);
                }
            })
            .catch((error) => {
                this.setState( { remoteStatus: 'bad response' });
                if(options.onFail) {
                    options.onFail.call(This, error);
                }
            });
    }

    setLockState(state) {
        this.lockState = {...this.lockState, ...state};
        console.log("tachi.lockState ", this.lockState);
        this.lock.onLockUpdated && this.lock.onLockUpdated(this, this.lockState);
    }

    setDrawerState(state) {
        this.drawerState = {...this.drawerState, ...state};
        console.log("tachi.drawerState ", this.drawerState);
        this.lock.onDrawerUpdated && this.lock.onDrawerUpdated(this, this.drawerState);
    }

    lock() {
        return this.request("lock.lock", { percent }).then((status) => {
            this.echo("locked");


        });
    }

    unlock(code : string) {
        return this.request("lock.unlock", { code });/*
            .then((status) => {
                if(status.lock==="unlocked") {
                    console.log("Unlocked!!!");
                }
            })
            .catch(error => {
                if(error.response.status===401) {
                    console.log("access denied!");
                }
            })*/
    }

    enable(enable: boolean) {
        console.log("tachi protocol says "+(enable?"enable":"disable"));
    }

    open(percent : number) {
        console.log("tachi protocol says " + percent);
        /*return this.request("drawer.open", {percent: Math.round(percent * 100)}, (resolve, reject) => {

        });*/
    }

    close() {
        console.log("tachi protocol says close");
    }

    getMotorStatus() {
        // retrieve status, status is processed already in command method
        return this.command({
            endpoint: 'status',
            onSuccess: (status) => { this.queueMotorUpdate() }, // always queue another update
            onFail: (status) => { this.queueMotorUpdate() } // always queue another update
        });
    }

    motorPosition(toPosition: number) {
        return this.command({
            method: 'post',
            endpoint: 'position',
            data: { target: toPosition }
        });
    }

    motorEnable(enable: boolean) {
        return this.command({
            method: 'post',
            endpoint: enable ? 'enable' : 'disable'
        });
    }

    motorHome() {
        return this.command({
            method: 'post',
            endpoint: 'home'
        });
    }

    queueMotorUpdate()
    {
        if(this.updateTimer ===undefined) {
            // console.log("tick");
            let tm = 1000;
            if(this.state.motor) {
                switch (this.state.motor.state) {
                    case "extending":
                    case "retracting":
                        tm = 400;
                        break;
                }
            }
            this.updateTimer = setTimeout(() => {
                // console.log("tock");
                this.updateTimer = undefined;
                this.getMotorStatus()
            }, tm);
        }
    }

/*    toggleMotorEnable(e : React.ChangeEvent<HTMLInputElement>) {
        const toggle = e.target.checked;
        this.motorEnable(toggle);
    }

    updateTarget(target : number) {
        const motor = this.state.motor;
        this.setState( { motor: { position: motor.position, target, speed: motor.speed, state: motor.state }, remoteStatus: "OK"});
        this.motorPosition(target);
    }
*/
}