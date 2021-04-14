import Storage, { DATA_REMOVE_VALUE } from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2, paddBlockHeight } from "../tools";
import BlockFactory from "../Factory/BlockFactory";
import TransactionRepo from "./TransactionRepo";
import Transaction from "../Block/Transaction";
import PoolItem from "../Block/PoolItem";
import PoolItemFactory from "../Factory/PoolItemFactory";

const NAMESPACE = 'pool';
const POOL_ITEM_FACTORY = new PoolItemFactory;

export default class PoolRepo {

    storage: Storage;

    constructor(
        storage: Storage
    ) {
        this.storage = storage;
    }

    addTransaction = (transaction: Transaction): Promise<CallableFunction> => {
        return this.addTransactions([transaction])
    }

    addTransactions = (transactions: Transaction[]): Promise<CallableFunction> => {
        const poolItem = new PoolItem({ transactions })
        return this.storage.put(NAMESPACE, poolItem.getName(), POOL_ITEM_FACTORY.createArrayFromObject(poolItem));
    }
}
