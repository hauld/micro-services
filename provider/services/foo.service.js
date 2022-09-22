import Service  from '../../lib/service.js';
import BASS from '../../lib/bass.js';

export default class FooService extends Service {
    render(){
        var _self = this;

        //sync function
        this.onQuery('foo', async () => {
            //return  {value: 'hihi'} ;
            console.log(arguments);
            let query = {
                    operationName:'Foo',
                    query:'query Foo { hello { value } }',
                    variables: ''}
            let HelloService = BASS.connectService('HelloService');
            let result = await HelloService.serve(query);
            return result.data.hello;
        })
        //service spec
        return `
            type Hello {
                value: String
            }
            type Query {
                foo(name: String): Hello
            }
        `;
    }
}