import { TransactionScriptKeyValueType, TransactionOutputConstructor } from "./TransactionOutput";
import { UtxoConstructor } from "./Utxo";
import { TransactionInputConstructor } from "./TransactionInput";

export default class ScriptAware {

    public script: string;
    protected scriptKeyValueType: TransactionScriptKeyValueType | undefined = undefined;

    constructor(data: TransactionOutputConstructor | UtxoConstructor | TransactionInputConstructor) {
        this.script = data['script'];
    }

    getScriptKeyValuePair = (): TransactionScriptKeyValueType => {
        if (undefined === this.scriptKeyValueType) {
            this.scriptKeyValueType = {};
            let tmp = this.script.split(' ');
            for (let i = 0; i <= tmp.length; i += 2) {
                if (undefined !== tmp[i]) {
                    this.scriptKeyValueType[tmp[i]] = undefined !== tmp[i + 1] ? tmp[i + 1] : undefined;
                }
            }
        }
        return this.scriptKeyValueType;
    }

    getScriptAddress = (): string => {
        return this.getScriptKeyValuePair()['PPK'] || '';
    }

    getSign = (): string => {
        return this.getScriptKeyValuePair()['SIGN'] || '';
    }

    getSignAddress = (): string => {
        return this.getScriptKeyValuePair()['ADDRESS'] || '';
    }

    getScriptValidatedHash = (): string => {
        return this.getScriptKeyValuePair()['VALID'] || '';
    }
}