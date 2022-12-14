import Block from "./Block";
import TransactionInput from "./TransactionInput";
import TransactionOutput from "./TransactionOutput";
import { getStringBytes } from '../tools';

export type TransactionConstructor = {
    num: number,
    name: string,
    blockName?: string,
    inputs?: Array<TransactionInput>,
    outputs?: Array<TransactionOutput>,
    block?: Block
};

export default class Transaction {

    public num: number;
    public name: string;

    public blockName: string;
    public inputs: Array<TransactionInput>;
    public outputs: Array<TransactionOutput>;
    public block?: Block;

    constructor(data: TransactionConstructor) {
        this.num = data['num'] || 0;
        this.name = data['name'] || '';
        this.blockName = data['blockName'] || '';
        this.inputs = (data['inputs'] || []).map(function assignSelfRefrenceInput(this: Transaction, input: TransactionInput): TransactionInput {
            input.transaction = this;
            return input;
        }.bind(this));

        this.outputs = (data['outputs'] || []).map(function assignSelfRefrenceOutput(this: Transaction, output: TransactionOutput): TransactionOutput {
            output.transaction = this;
            return output;
        }.bind(this));
        this.block = data['block'] || undefined;
    }

    isCoinbase = (): boolean => {
        if (undefined === this.inputs[0]) {
            console.error('No input in transaction ', this);
            return false;
        }
        return this.inputs[0].isCoinbaseInput();
    }

    setName = (name: string) => {
        this.name = name;
    }

    getName = (): string => {
        return this.name;
    }

    getSizeInBytes = (): number => {
        return getStringBytes([
            this.inputs.map(input => input.script).join(''),
            this.outputs.map(output => output.script).join(''),
        ].join(''));
    }
}
