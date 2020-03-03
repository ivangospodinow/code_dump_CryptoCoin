import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2 } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionRepo from "./TransactionRepo";
import Address from "../Address/Address";
import StorageHandle from "../Storage/StorageHandle";
import UtxoFactory from "../Factory/UtxoFactory";
import Utxo from "../Block/Utxo";
import Transaction from "../Block/Transaction";

const NAMESPACE = 'utxo';
const UTXO_FACTORY = new UtxoFactory;

export default class UtxoRepo {
    storage: Storage;
    transactionRepo: TransactionRepo;

    constructor(storage: Storage, transactionRepo: TransactionRepo) {
        this.storage = storage;
        this.transactionRepo = transactionRepo;
    }

    getOutputByNameAndNum = (transactionName: string, outputNum : number): Promise<Utxo | undefined> => {
        return new Promise(function getOutputByNameAndNumPromise(this: UtxoRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, 'output.' + transactionName + '.' + outputNum).then(function getBlockByNameStorageFetch(result: string) {
                resolve(result.length ? UTXO_FACTORY.createFromString(result) : undefined);
            }).catch(reject);
        }.bind(this));
    }

    getOutputs = (): StorageHandle => {
        return this.storage.seek(NAMESPACE, 'output.%');
    }

    getOutputsForValue = (address: Address, value: number): Promise<Array<Utxo>> => {
        return new Promise(async function getOutputsForValuePromise(this: UtxoRepo, resolve: CallableFunction, reject: any) {
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
            resolve(utxos);
        }.bind(this));
    }

    populateTransaction = (transaction: Transaction): Promise<Transaction> => {
        return new Promise(async function populateTransactionPromise(this: UtxoRepo, resolve: CallableFunction, reject: any) {
            for (let i in transaction.inputs) {
                if (transaction.inputs[i].transactionName) {
                    transaction.inputs[i].utxo = await this.getOutputByNameAndNum(transaction.inputs[i].transactionName, transaction.inputs[i].outputNum);
                }
            }
            resolve(transaction);
        }.bind(this));
    }
}
