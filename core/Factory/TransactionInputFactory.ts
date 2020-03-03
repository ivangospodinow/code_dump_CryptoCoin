import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Transaction, { TransactionConstructor } from "../Block/Transaction";
import TransactionInput, { TransactionInputConstructor } from "../Block/TransactionInput";

export default class TransactionInputFactory {

    createFromString = (input: string): TransactionInput => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: TransactionInputConstructor): TransactionInput => {
        return new TransactionInput({
            num: object['num'],
            outputNum: object['outputNum'],
            transactionName: object['transactionName'] || '',
            script: object['script'],
            transaction: object['transaction'] || undefined,
        });
    }
}
