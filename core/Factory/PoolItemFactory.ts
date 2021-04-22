import { json } from "../tools";
import Transaction, { TransactionConstructor } from "../Block/Transaction";
import TransactionFactory from "./TransactionFactory";
import PoolItem, { PoolItemConstructor } from "../Block/PoolItem";

const TRANSACTION_FACTORY = new TransactionFactory;

export default class PoolItemFactory {

    createFromString = (input: string): PoolItem => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: { transaction: TransactionConstructor }): PoolItem => {

        return new PoolItem({
            transaction: TRANSACTION_FACTORY.createFromObject(object['transaction']),
        });
    }

    createArrayFromObject = (poolItem: PoolItem) => {
        return {
            transaction: TRANSACTION_FACTORY.createArrayFromObject(poolItem.transaction),
        };
    }
}
