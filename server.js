import express from "express";
import { readdirSync } from 'node:fs';
import * as path from 'path';
import { WebSocketServer } from "ws";
import BASS from './lib/bass.js';
import pgPkg from 'pg';


const { Pool, Client } = pgPkg;
const dbPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dbname',
  password: 'postgres',
  port: 5432,
});

BASS.fed.push({
  namespace: 'localhost',
  port: '4000'
});

var app = express();
var services = [];
var wsServer;
const port = process.env.PORT || 4000;
const host = process.env.HOST || 'localhost';
const server = app.listen(port, () => {
     wsServer = new WebSocketServer({
      server,
      path: "/graphql",
    });
    BASS.init({host, port, router: app, wsServer, dbPool});
    console.log(`GraphQL server is running on port ${port}.`);
});
const __dirname = path.resolve();
async function loadModels(){
  const normalizedPath = path.join(__dirname, './src/services');
  //const normalizedPath = path.join(__dirname, 'src/vtabs');
  readdirSync(normalizedPath).forEach(async function(file) {
    if(file.endsWith(".service.js")){
      const {default: loadedModule} = await import("./src/services/" + file);
      BASS.spawnService(loadedModule);
    }
  });
}

loadModels();


//test
import ProxyService from './lib/proxy.service.js';
var proxy = new ProxyService('fooservice');
setTimeout(proxy.init, 1500, proxy)
proxy.sub('event1', (data) => {
  console.log(`proxy received ${JSON.stringify(data)}`);
})

app.use(express.json());
app.use('/testevent', (req, res, next) => {
  proxy.pub('event1', {data: 'abc'});
  res.end('cool');
});

app.use('/testsync', (req, res, next) => {
  let query =  {
          operationName:'Foo',
          query:'query Foo { foo { value } }',
          variables: ''}
  proxy.serve(query);
  res.end('cool');
});