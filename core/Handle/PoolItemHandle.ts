import PoolItem from "../Block/PoolItem";
import Transaction from "../Block/Transaction";
import TransactionInput from "../Block/TransactionInput";
import PoolItemFactory from "../Factory/PoolItemFactory";
import UtxoRepo from "../Repo/UtxoRepo";
import StorageHandle from "../Storage/StorageHandle";

const POOL_ITEM_FACTORY = new PoolItemFactory;

export default class PoolItemHandle {
    handle: StorageHandle;
    utxoRepo: UtxoRepo;
    constructor(handle: StorageHandle, utxoRepo: UtxoRepo) {
        this.handle = handle;
        this.utxoRepo = utxoRepo;
    }

    hasData = (): boolean => {
        return this.handle.hasData();
    }

    next = (): Promise<PoolItem | null> => {
        return new Promise(async function nextPoolItemPromise(this: PoolItemHandle, resolve: CallableFunction, reject: CallableFunction) {
            const poolItemData = await this.handle.next();
            if (poolItemData.length) {
                const poolItem = POOL_ITEM_FACTORY.createFromString(poolItemData);
                poolItem.transaction = await this.utxoRepo.loadTransactionUtxos(poolItem.transaction);
                return resolve(poolItem);
            } else {
                return resolve(null);
            }
        }.bind(this));
    }
}