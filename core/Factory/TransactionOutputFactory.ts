import { json } from "../tools";
import TransactionOutput, { TransactionOutputConstructor } from "../Block/TransactionOutput";

export default class TransactionOutputFactory {

    createFromString = (input: string): TransactionOutput => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: TransactionOutputConstructor): TransactionOutput => {

        return new TransactionOutput({
            num : object['num'],
            value : object['value'] || 0,
            script : object['script'],
            transaction : object['transaction'] || undefined,
        });
    }
}
