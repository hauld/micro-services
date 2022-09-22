import Service  from '../../lib/service.js';
import BASS from '../../lib/bass.js';
import { postgraphile } from "postgraphile";
import { database, schemas, options, port } from './postgres/postgres.common.js';

export default class PostgresService extends Service {
    useAdapter(serverOptions){
        const {dbPool} = serverOptions;
        this.adapter.handler = postgraphile(dbPool, 'bass', options);
    }
}