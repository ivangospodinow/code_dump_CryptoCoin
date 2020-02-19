import Transaction from "./Transaction";
import settings from "../../settings";

export type TransactionInputConstructor = { num: number, outputNum?: number, transactionName?: string, script: string | number, transaction: Transaction };

export default class TransactionInput {

    public num: number;
    public outputNum?: number;
    public transactionName?: string;
    public script: string | number;

    public transaction: Transaction;

    constructor(data: TransactionInputConstructor) {
        this.num = data['num'];
        this.outputNum = data['outputNum'];
        this.transactionName = data['transactionName'];
        this.script = data['script'];
        this.transaction = data['transaction'];
    }

    getValue = (): number => {
        if (this.transaction.isCoinbase() && this.num === 0) {
            return settings.BLOCK_REWARD;
        }

        console.error('Check for referenced output')
        return 0;
    }

}