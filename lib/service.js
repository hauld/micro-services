import { graphql, execute, subscribe, GraphQLError  } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { useServer } from "graphql-ws/lib/use/ws";
import GraphqlAdapter from "./graphql.adapter.js";
import { makeExecutableSchema } from '@graphql-tools/schema';
import http from 'http';
import BASS from './bass.js';

class ServiceEmitter extends PubSub {};
export default class Service  {
    emitter = new ServiceEmitter();
    schema = {};
    resolvers = {};
    typeDefs = {};
    path = '';
    adapter = {
        name: 'default',
        handler: null,
    };
    constructor(name){
        this.path = '/' + ( name || '' ) ;
    }
    async serve(query){
        let res = Object.create(http.ServerResponse.prototype);
        let req = Object.create(http.IncomingMessage.prototype);
        req.headers['Location']= 'http://localhost:5783';
        req.headers['content-type'] = 'application/json';
        req.headers['accept'] = '*/*';
        req.method = 'POST';
        req['body'] = query;
        const next = () => {};
        res.end = function(result) {
            this['result'] = result;
        }
        res.setHeader = function (name, value) {
            return this;
        }
        res.writeHead = function (status, header) {
            return this;
        }
        res.status = function (code) {
            /*
                if ((typeof code === 'string' || Math.floor(code) !== code) && code > 99 && code < 1000) {
                    deprecate('res.status(' + JSON.stringify(code) + '): use res.status(' + Math.floor(code) + ') instead')
            }*/
            this.statusCode = code;
            return this;
        };
        await this.adapter.handler(req, res, next);

        return JSON.parse(res.result);
        /*
        const { operationName, query, variables } = getGraphQLParameters(request);

        const result = await processRequest({
                                                operationName,
                                                query,
                                                variables,
                                                request,
                                                schema: this.schema,
                                                rootValueFactory: this.getRootValue
                                            });
        return result;*/
    }
    onQuery(name, fn){
        this.on('Query', name, fn )
    }
    onMutation(name, fn){
        this.on('Mutation', name, fn )
    }
    onSubscription(name, subscribe, resolve){
        let type = 'Subscription';
        if(typeof name === 'string' && typeof type === 'string')
            if(this.resolvers[type] === undefined) this.resolvers[type] = {} 
            this.resolvers[type][name] = {};
            if(subscribe) this.resolvers[type][name]['subscribe'] = subscribe;
            if(resolve) this.resolvers[type][name]['resolve'] = resolve;
    }
    on(type, name, fn){
        if(typeof name === 'string' && typeof type === 'string')
            if(this.resolvers[type] === undefined) this.resolvers[type] = {}   
            this.resolvers[type][name] = fn;
    }
    sub(name, fn){
        this.emitter.subscribe(name, fn);
    }
    pub(name, data){
        this.emitter.publish(name, data);
        if(this.constructor.name !== 'ProxyService')
            //BASS.es.pub({service: this.name, name, data});
            BASS.es.pub({service: this.constructor.name, name, data});
    }
    iter(events){
        return this.emitter.asyncIterator(events);
    }
    render(){
        return `
            type Dummy {
                foo: String
            }
        `
    }
    buildSchema(){
        this.typeDefs = this.render();
        this.schema =  makeExecutableSchema({
          typeDefs: this.typeDefs,
          resolvers: this.resolvers
        })
    }
    getRootValue(context){
        console.log(context);
    }
    ebs(wsServer){
        let _self = this;
        if(wsServer) useServer({ schema: _self.schema, execute, subscribe }, wsServer)
    }
    useAdapter(){
        if(this.adapter.handler === null){
            this.adapter.handler = GraphqlAdapter(this);
        }
    }
    init(options){
        let {host, port, router, wsServer} = options;
        if(this.path === '/') this.path = '/' + this.constructor.name;
        this.subEndpoint = `ws://${host}:${port}${wsServer.options.path}`;
        this.buildSchema();
        this.useAdapter(options);
        if(router) router.use(this.path.toLowerCase(), this.adapter.handler);
        if(wsServer) useServer({ schema: this.schema, execute, subscribe }, wsServer)
    }
}
