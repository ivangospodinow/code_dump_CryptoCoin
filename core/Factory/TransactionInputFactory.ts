import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Transaction, { TransactionConstructor } from "../Block/Transaction";
import TransactionInput, { TransactionInputConstructor } from "../Block/TransactionInput";
import TransactionOutputFactory from "./TransactionOutputFactory";

const TRANSACTION_OUTPUT_FACTORY = new TransactionOutputFactory;

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

    createArrayFromObject = (input: TransactionInput) => {
        return {
            num: input.num,
            outputNum: input.outputNum,
            transactionName: input.transactionName,
            script: input.script,
            output: (input.output ? TRANSACTION_OUTPUT_FACTORY.createArrayFromObject(input.output) : null)
        };
    }
}
