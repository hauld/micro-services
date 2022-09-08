import ProxyService from './proxy.service.js';
import EventService from './event.service.js';
import { PubSub } from 'graphql-subscriptions';

class BassCore{
    services = [];
    transports = {
        host: null,
        port: null,
        router: null,
        wsServer: null
    }
    es = null;
    namespace = 'localhost';
    fed = [];
    init(options, namespace){
        if(namespace) this.namespace = namespace;
        this.transports = options;
        
        //init event service
        this.es = new EventService();
        this.es.init(this.transports);       
    };
    spawnService(service, options){
        let instance = new service();
        instance.init(this.transports);
        this.services.push({name: instance.constructor.name.toLowerCase(), instance});
    }
    connectService(name){
        let service = this.services.find(service => service.name === name.toLowerCase() );
        if(service) return service.instance
        else {
            //service = this.services.find(service => service.name === 'ProxyService' );
            let instance = new ProxyService(name);
            instance.init(this.transports);        
            this.services.push({name, instance});
            return instance;
        }
    }
}

var BASS = new BassCore();

export default BASS;