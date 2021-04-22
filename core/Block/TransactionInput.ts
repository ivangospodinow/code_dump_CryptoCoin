import Transaction from "./Transaction";
import settings from "../../settings";
import Utxo from "./Utxo";
import ScriptAware from "./ScriptAware";
import TransactionOutput from "./TransactionOutput";

export type TransactionInputConstructor = {
    num: number,
    outputNum?: number,
    transactionName?: string,
    script: string | number,
    transaction: Transaction,
    utxo?: Utxo,
};

export default class TransactionInput extends ScriptAware {

    public num: number;
    public outputNum?: number;
    public transactionName?: string;

    public transaction: Transaction;
    public utxo?: Utxo;
    public output?: TransactionOutput;

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
            // @TODO may be get it from the stored value ?
            return settings.BLOCK_REWARD;
        } else if (this.utxo) {
            return this.utxo.getValue();
        } else if (this.output) {
            return this.output.getValue();
        }
        console.error('Check for referenced output', this.output)
        return 0;
    }

    isCoinbaseInput = (): boolean => {
        // @TODO add better validation
        return parseInt(this.script) > 0;
    }

}