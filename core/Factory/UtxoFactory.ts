import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json, sha256x2 } from "../tools";
import Utxo, { UtxoConstructor } from "../Block/Utxo";
import TransactionOutput from "../Block/TransactionOutput";

export default class UtxoFactory {

    createFromString = (input: string): Utxo => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: UtxoConstructor): Utxo => {
        return new Utxo(object);
    }

    createKeyFromOutputObject = (output: TransactionOutput) => {
        return 'output.' + output.transaction.name + '.' + output.num;
    }

    createArrayFromOutputObject = (output: TransactionOutput) => {
        return {
            // @TODO not needed
            // blockHeight: output.transaction.block.height,
            transactionName: output.transaction.name,
            transactionNum: output.transaction.num,
            outputNum: output.num,
            value: output.value,
            script: output.script,
            // @TODO may not be needed
            hashedAddress: sha256x2(output.getScriptAddress()),
        };
    }
}


