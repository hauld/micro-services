import Service  from './service.js';
import BASS from './bass.js';
import http from 'http';
import axios from 'axios';

export default class ProxyService extends Service {
    constructor(name){
        super();
        this.name = name;
    }
    async serve(query){
        const data = await axios.post(`http://${this.namespace}:${this.port}/${this.name}`,query);
        return data;
    }
    init(self){
        let __self = self;
        BASS.fed.forEach(fed => {
            http.get({
                agent: false,
                path: `/eventservice?service=${__self.name}&namespace=${BASS.namespace}`,
                hostname: fed.namespace,
                port: fed.port
            }, (res) => {
                res.on('data', payload => {
                    let payloadObj = JSON.parse(payload);
                    if(payloadObj.accept){
                        __self.namespace = fed.namespace;
                        __self.port = fed.port;
                        http.get({
                            agent: false,
                            path: `/eventservice?service=${__self.name}&namespace=${BASS.namespace}&sub=true`,
                            hostname: fed.namespace,
                            port: fed.port
                        }, (res) => {
                            res.on('data', payload => {
                                let payloadStr = payload.toString();
                                payloadObj = JSON.parse(payloadStr);
                                if(payloadObj.event) __self.pub(payloadObj.event.name, payloadObj.event.data);
                                else console.log(payloadStr);
                            })
                        })
                    }
                    else console.log(payload);
                })
            })
        })
        
    }
}