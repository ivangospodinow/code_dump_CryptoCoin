import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionFactory from "../Factory/TransactionFactory";
import Transaction from "../Block/Transaction";
import TransactionOutput from "../Block/TransactionOutput";
import TransactionInput from "../Block/TransactionInput";
import UtxoRepo from "./UtxoRepo";

const NAMESPACE = 'transaction';
const TRANSACTION_FACTORY = new TransactionFactory;

export default class TransactionRepo {
    storage: Storage;
    utxoRepo: UtxoRepo;

    constructor(storage: Storage, utxoRepo: UtxoRepo) {
        this.storage = storage;
        this.utxoRepo = utxoRepo;
    }

    getTransactionByName = (name: string): Promise<Transaction> => {
        return new Promise(function getTransactionByNamePromise(this: TransactionRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, name).then(function getTransactionByNameStorageFetch(result: string) {
                resolve(TRANSACTION_FACTORY.createFromString(result));
            }).catch(reject);
        }.bind(this));
    }

    getOutput = (transactionName: string, outputNum: number): Promise<TransactionOutput | undefined> => {
        return new Promise(function getOutputPrimise(this: TransactionRepo, resolve: CallableFunction, reject: any) {
            this.storage.get(NAMESPACE, transactionName).then(function getTransactionByNameStorageFetch(result: string) {
                let output: TransactionOutput;
                for (output of TRANSACTION_FACTORY.createFromString(result).outputs) {
                    if (output.num === outputNum) {
                        return resolve(output);
                    }
                }
                return resolve(undefined);
            }).catch(reject);
        }.bind(this));
    }
}
