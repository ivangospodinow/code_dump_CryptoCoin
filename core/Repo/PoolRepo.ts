import Storage, { DATA_REMOVE_VALUE } from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2, paddBlockHeight } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionRepo from "./TransactionRepo";
import Transaction from "../Block/Transaction";
import PoolItem from "../Block/PoolItem";
import PoolItemFactory from "../Factory/PoolItemFactory";
import StorageHandle from '../Storage/StorageHandle';
import PoolItemHandle from "../Handle/PoolItemHandle";
import UtxoRepo from "./UtxoRepo";
import { isReturnStatement } from "typescript";
import BlockValidator from "../Validator/BlockValidator";
import { BLOCK_VALIDATOR } from "../../globals";
import EventsManager from "../Events/EventManager";

const NAMESPACE = 'pool';
const POOL_ITEM_FACTORY = new PoolItemFactory;
export default class PoolRepo {

    storage: Storage;
    utxoRepo: UtxoRepo;
    eventsManager: EventsManager;

    constructor(
        storage: Storage,
        utxoRepo: UtxoRepo,
        eventsManager: EventsManager
    ) {
        this.storage = storage;
        this.utxoRepo = utxoRepo;
        this.eventsManager = eventsManager;
    }

    addTransaction = (transaction: Transaction): Promise<boolean> => {
        return this.addTransactions([transaction])
    }

    addTransactions = (transactions: Transaction[]): Promise<boolean> => {
        return new Promise(async function addTransactionsPromise(this: PoolRepo, resolve: CallableFunction, reject: any) {
            let transaction: Transaction;
            let poolItem: PoolItem;
            let poolItemData: any;
            let data = [];
            const poolItemsData: Array<any> = [];

            for (transaction of transactions) {
                transaction = await this.utxoRepo.loadTransactionUtxos(transaction);
                if (BLOCK_VALIDATOR.isTransactionValid(transaction)) {
                    poolItem = new PoolItem({ transaction });
                    // console.log('Add to pool ', poolItem.getName())
                    poolItemData = POOL_ITEM_FACTORY.createArrayFromObject(poolItem);
                    poolItemsData.push(poolItemData);

                    data.push({
                        namespace: NAMESPACE,
                        key: poolItem.getName(),
                        value: poolItemData,
                    });
                } else {
                    console.log('Add to pool not added ', transaction.getName())
                }
            }
            if (data.length) {
                await this.storage.puts(data);
                // this.eventsManager.emitNext('EVENT_POOL_ITEMS_ADDED', poolItemsData);
                return resolve(true);
            } else {
                return resolve(false);
            }

        }.bind(this));
    }

    getTransactionsHandle = (): PoolItemHandle => {
        return new PoolItemHandle(this.storage.seek(NAMESPACE, ''), this.utxoRepo);
    }

    clearInvalidPoolItems = (names: Array<string>): Promise<boolean> => {
        return new Promise(async function clearInvalidPoolItemsPromise(this: PoolRepo, resolve: CallableFunction, reject: any) {
            const data = [];
            let poolItemName: string;
            for (poolItemName of names) {
                data.push({
                    namespace: NAMESPACE,
                    key: poolItemName,
                    value: DATA_REMOVE_VALUE,
                });
            }
            this.storage.puts(data).then(function clearInvalidPoolItemsSuccess() {
                return resolve(true);
            }).catch(function clearInvalidPoolItemsFail() {
                return resolve(false);
            });
        }.bind(this));
    }
}
