
import { sha256x2 } from "../tools";
import Transaction from "./Transaction";

export type PoolItemConstructor = {
    transaction: Transaction,
};

export default class PoolItem {
    public transaction: Transaction;

    constructor(data: PoolItemConstructor) {
        this.transaction = data['transaction'];
    }

    getName(): string {
        return this.transaction.name;
    }
}
