import Transaction from "./Transaction";
import { formatAmount } from "../tools";
import ScriptAware from "./ScriptAware";

export type TransactionOutputConstructor = { num: number, value: number, script: string, transaction: Transaction };
export type TransactionScriptKeyValueType = { [key: string]: string | undefined };

export default class TransactionOutput extends ScriptAware{

    public num: number;
    public value: number;

    public transaction: Transaction;
    
    constructor(data: TransactionOutputConstructor) {
        super(data);
        this.num = data['num'];
        this.value = data['value'];
        this.transaction = data['transaction'];
    }

    getValue = (): number => {
        return this.value;
    }

    setValue = (value: number) => {
        this.value = value;
    }

    addValue = (value: number) => {
        this.value += value;
        this.value = formatAmount(this.value);
    }
}
