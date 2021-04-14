import { json } from "../tools";
import Transaction, { TransactionConstructor } from "../Block/Transaction";
import TransactionFactory from "./TransactionFactory";
import PoolItem, { PoolItemConstructor } from "../Block/PoolItem";

const TRANSACTION_FACTORY = new TransactionFactory;

export default class PoolItemFactory {

    createFromString = (input: string): PoolItem => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: { transactions: TransactionConstructor[] }): PoolItem => {

        return new PoolItem({
            transactions: object.transactions.map(function createTransactionFromArray(transactionData: TransactionConstructor) {
                return TRANSACTION_FACTORY.createFromObject(transactionData);
            }),
        });
    }

    createArrayFromObject = (poolItem: PoolItem) => {
        return {
            transactions: poolItem.transactions.map(function createArrayFromTransactoon(transaction: Transaction) {
                return TRANSACTION_FACTORY.createArrayFromObject(transaction);
            }),
        };
    }
}
