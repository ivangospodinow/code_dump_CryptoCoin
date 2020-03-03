import Transaction from "./Transaction";
import settings from "../../settings";
import Utxo from "./Utxo";
import ScriptAware from "./ScriptAware";

export type TransactionInputConstructor = {
    num: number,
    outputNum?: number,
    transactionName?: string,
    script: string | number,
    transaction: Transaction,
    utxo?: Utxo,
};

export default class TransactionInput extends ScriptAware{

    public num: number;
    public outputNum?: number;
    public transactionName?: string;

    public transaction: Transaction;
    public utxo?: Utxo;

    constructor(data: TransactionInputConstructor) {
        super(data);
        this.num = data['num'];
        this.outputNum = data['outputNum'];
        this.transactionName = data['transactionName'];
        this.transaction = data['transaction'];
        this.utxo = data['utxo'] || undefined;
    }

    getValue = (): number => {
        if (this.transaction.isCoinbase() && this.num === 0) {
            return settings.BLOCK_REWARD;
        } else if (this.utxo) {
            return this.utxo.getValue();
        }
        console.error('Check for referenced output', this.utxo)
        return 0;
    }

}