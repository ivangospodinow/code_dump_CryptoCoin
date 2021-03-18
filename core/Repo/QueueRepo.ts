import Storage, { DATA_REMOVE_VALUE } from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2, paddBlockHeight, nanoTime } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionRepo from "./TransactionRepo";
import SettingsRepo from "./SettingsRepo";
import QueueFactory from "../Factory/QueueFactory";
import Queue from "../Block/Queue";

const NAMESPACE = 'queue';
const QUEUE_FACTORY = new QueueFactory;

export default class QueueRepo {
    storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    persist = (queue: Queue): Promise<string> => {
        return new Promise(function getBlockByNamePromise(this: QueueRepo, resolve: CallableFunction, reject: any) {
            const id = String(nanoTime());
            this.storage.put(
                NAMESPACE, id, QUEUE_FACTORY.createArrayFromObject(queue)).then(function persistStoragePut() {
                    resolve(id);
                }).catch(reject);
        }.bind(this));
    }

    exists = (key: string): Promise<boolean> => {
        return this.storage.has(NAMESPACE, key);
    }

    getItemForProcess = () => {
        return new Promise(async function getItemForProcessPromise(this: QueueRepo, resolve: CallableFunction, reject: any) {
            const handle = this.storage.seek(NAMESPACE, '');
            const items = [];
            let tmp: Queue;
            while (handle.hasData() || items.length <= settings.QUEUE_ITEMS_TO_PROCESS_LIMIT) {
                tmp = QUEUE_FACTORY.createFromString(await handle.next());
                if (tmp.data) {
                    items.push(tmp);
                }
            }
            resolve(items);
        }.bind(this));





    }
}
/**\
             const handle = this.getOutputs();
            let tmp: Utxo;
            let amount: number = 0;
            const utxos = [];
            while (handle.hasData()) {
                tmp = UTXO_FACTORY.createFromString(await handle.next());
                if (tmp.hashedAddress === address.getHashed()) {
                    utxos.push(tmp);
                    amount += tmp.value;
                }

                if (amount >= value) {
                    break;
                }
            }
 */