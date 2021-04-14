
import { sha256x2 } from "../tools";
import Transaction from "./Transaction";

export type PoolItemConstructor = {
    transactions: Transaction[],
};

export default class PoolItem {
    public transactions: Transaction[];

    constructor(data: PoolItemConstructor) {
        this.transactions = data['transactions'];
    }

    getName(): string {
        return sha256x2(this.transactions.map(transaction => transaction.getName()).join(''));
    }
}
