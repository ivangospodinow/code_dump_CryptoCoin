import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionFactory from "../Factory/TransactionFactory";
import Transaction from "../Block/Transaction";

const NAMESPACE = 'transaction';
const TRANSACTION_FACTORY = new TransactionFactory;

export default class TransactionRepo {
    storage: Storage;

    constructor(storage: Storage) {
        this.storage = storage;
    }

    getTransactionByName = (name: string): Promise<Transaction> => {
        return new Promise(function getTransactionByNamePromise(this: TransactionRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, name).then(function getTransactionByNameStorageFetch(result : string) {
                resolve(TRANSACTION_FACTORY.createFromString(result));
            }).catch(reject);
        }.bind(this));
    }
}
