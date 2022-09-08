import Service  from '../../lib/service.js';
export default class HelloService extends Service {
    render(){
        var _self = this;
        //sync function
        this.onQuery('hello', (name) => {
            _self.pub('NOSAY', {value: 'hello'});
            return  {value: 'hihi'} ;
        })
        this.onSubscription('sayhi', 
            async function* () {
                for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
                    yield { value: hi };
                }
            },
            (payload) => { 
                return payload 
            })
        this.onSubscription('sayno', 
                () => _self.iter(['NOSAY']),
            (payload) => { 
                return payload 
            })
        //service spec
        return `
            type Hello {
                value: String
            }
            type Query {
                hello(name: String): Hello
            }
            type Subscription {
                sayhi: Hello,
                sayno: Hello
            }
            
        `;
    }
}