import Service  from './service.js';
import BASS from './bass.js';

function eventsHandler(service){
    var __service = service;
    return async function(request, response, next) {

        const namespace = request.query.namespace || BASS.namespace;
        const serviceName = request.query.service;
        const subscribe = request.query.sub;
        let service = BASS.services.find(service => service.name === serviceName );
        if(subscribe !== 'true'){
            if(service) response.json({accept: true});
            else response.json({accept: false});
            return;
        } else{
            if(!service) { response.json({accept: false}); return;}
        }
        const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
        };
        response.writeHead(200, headers);
    
        const data = JSON.stringify({accept: true});
    
        response.write(data);

        const newSub = {
            namespace,
            serviceName,
            response
        };
    
        __service.subscriptions.push(newSub);
    
        request.on('close', () => {
            console.log(`${namespace} Connection closed`);
            __service.subscriptions = __service.subscriptions.filter(sub => sub.namespace !== namespace && sub.serviceName !== serviceName);
        });
    }
}
export default class EventService extends Service {
    constructor(){
        super();
        this.subscriptions = [];
    }
    pub(service, name, data){
        let subscribers = this.subscriptions.filter(sub => sub.serviceName === service);
        subscribers.forEach(sub => { 
            sub.response.write(JSON.stringify({event: {name, data}}))
        })
    }
    useAdapter(){
        this.adapter.handler = eventsHandler(this);
    }
    init(options){
        let {router} = options;
        if(this.path === '/') this.path = '/' + this.constructor.name;
        this.useAdapter();
        if(router) router.use(this.path.toLowerCase(), this.adapter.handler);

    }
}