import Transaction from "./Transaction";
import { formatAmount } from "../tools";

export type TransactionOutputConstructor = { num: number, value: number, script: string, transaction: Transaction };
export type TransactionScriptKeyValueType = { [key: string]: string | undefined };

export default class TransactionOutput {

    public num: number;
    public value: number;
    public script: string;

    public transaction: Transaction;
    protected scriptKeyValueType: TransactionScriptKeyValueType | undefined = undefined;

    constructor(data: TransactionOutputConstructor) {
        this.num = data['num'];
        this.value = data['value'];
        this.script = data['script'];
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

    /**
     * Expected: PPK 0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed VALID 3045022100b838902a531620f21885c9d4aea1a9516c31ce028c1af4f2563ef039f52f32dc02201e30121ccaccff9b981a1ce1c34b3ab720bd3fefffa8917c3c9e80ef8f0359ab
     */
    getScriptKeyValuePair = (): TransactionScriptKeyValueType => {
        if (undefined === this.scriptKeyValueType) {
            this.scriptKeyValueType = {};
            let tmp = this.script.split(' ');
            for (let i = 0; i <= tmp.length; i += 2) {
                if (undefined !== tmp[i]) {
                    this.scriptKeyValueType[tmp[i]] = tmp[i + 1] || undefined;
                }
            }
        }
        return this.scriptKeyValueType;
    }

    getScriptAddress = (): string => {
        return this.getScriptKeyValuePair()['PPK'] || '';
    }

    getScriptValidatedHash = (): string => {
        return this.getScriptKeyValuePair()['VALID'] || '';
    }
}
