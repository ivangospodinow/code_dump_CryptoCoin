import { TransactionScriptKeyValueType, TransactionOutputConstructor } from "./TransactionOutput";
import { UtxoConstructor } from "./Utxo";
import { TransactionInputConstructor } from "./TransactionInput";

export default class ScriptAware {

    public script: string;
    protected scriptKeyValueType: TransactionScriptKeyValueType | undefined = undefined;

    constructor(data: TransactionOutputConstructor | UtxoConstructor | TransactionInputConstructor) {
        this.script = data['script'];
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

    getScriptValidatedHash = (): string => {
        return this.getScriptKeyValuePair()['VALID'] || '';
    }
}