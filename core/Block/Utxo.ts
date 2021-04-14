import { sha256x2 } from "../tools";
import ScriptAware from "./ScriptAware";

export type UtxoConstructor = {
    blockHeight: number,
    transactionName: string,
    transactionNum: number,
    outputNum: number,
    value: number,
    script: string,
    hashedAddress: string
};

export default class Utxo extends ScriptAware {
    blockHeight: number;
    transactionName: string;
    transactionNum: number;
    outputNum: number;
    value: number;
    hashedAddress: string;

    constructor(data: UtxoConstructor) {
        super(data);
        this.blockHeight = data['blockHeight'];
        this.transactionName = data['transactionName'];
        this.transactionNum = data['transactionNum'];
        this.outputNum = data['outputNum'];
        this.value = data['value'];
        this.hashedAddress = data['hashedAddress'];
    }

    createSignValue = (): string => {
        return sha256x2([
            this.transactionName,
            this.transactionNum,
            this.script,
            String(this.value),
        ].join(''));
    }

    getValue = (): number => {
        return this.value;
    }
}
