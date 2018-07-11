import axios from 'axios';
import * as qs from 'qs';

import { IMotorCommand, IMotorInfo, IMotorState} from "./common";

const credentials = {
    host: "192.168.2.170",
    secureHost: false
};

export default class TachiProtocol {

    instance : {};

    constructor(lockProps, dispatch) {
        this.instance = axios.create({
            baseURL: lockProps.endpoint,
            timeout: 1000,
            responseType: 'json'
        });
        this.dispatch = dispatch;

        //setInterval(() => this.getMotorStatus(), 1000);
    }

    setState(state) {
        console.log("motor", state);
        dispatch({ type: 'STATUS', payload: state });
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

    enable(enable: boolean) {
        console.log("protocol says "+(enable?"enable":"disable"));
    }

    open(percent : number) {
        console.log("protocol says "+percent);
    }

    close() {
        console.log("protocol says close");
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

    toggleMotorEnable(e : React.ChangeEvent<HTMLInputElement>) {
        const toggle = e.target.checked;
        this.motorEnable(toggle);
    }

    updateTarget(target : number) {
        const motor = this.state.motor;
        this.setState( { motor: { position: motor.position, target, speed: motor.speed, state: motor.state }, remoteStatus: "OK"});
        this.motorPosition(target);
    }
}