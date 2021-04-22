import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Transaction, { TransactionConstructor } from "../Block/Transaction";
import TransactionInput, { TransactionInputConstructor } from "../Block/TransactionInput";
import TransactionInputFactory from "./TransactionInputFactory";
import TransactionOutput, { TransactionOutputConstructor } from "../Block/TransactionOutput";
import TransactionOutputFactory from "./TransactionOutputFactory";

const TRANSACTION_INPUT_FACTORY = new TransactionInputFactory;
const TRANSACTION_OUTPUT_FACTORY = new TransactionOutputFactory;

export default class TransactionFactory {

    createFromString = (input: string): Transaction => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: TransactionConstructor): Transaction => {

        return new Transaction({
            name: object['name'] || '',
            num: object['num'] || 0,
            blockName: object['blockName'] || '',
            inputs: (object['inputs'] || []).map(function inputFactory(input: TransactionInputConstructor): TransactionInput {
                return TRANSACTION_INPUT_FACTORY.createFromObject(input);
            }),
            outputs: (object['outputs'] || []).map(function outputFactory(input: TransactionOutputConstructor): TransactionOutput {
                return TRANSACTION_OUTPUT_FACTORY.createFromObject(input);
            }),
        });
    }

    createArrayFromObject = (transaction: Transaction) => {
        return {
            name: transaction.name,
            num: transaction.num,
            blockName: transaction.block?.name,
            inputs: transaction.inputs.map(function createArrayFromObjectMapInput(input: TransactionInput) {
                return TRANSACTION_INPUT_FACTORY.createArrayFromObject(input);
            }),
            outputs: transaction.outputs.map(function createArrayFromObjectMapOutput(output: TransactionOutput) {
                return TRANSACTION_OUTPUT_FACTORY.createArrayFromObject(output);
            }),
        };
    }
}
