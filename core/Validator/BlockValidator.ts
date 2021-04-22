import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import SettingsRepo from '../Repo/SettingsRepo';
import BlockModel from "../Block/BlockModel";
import Address, { addressVerify } from "../Address/Address";
import BlockRepo from "../Repo/BlockRepo";
import Transaction from "../Block/Transaction";
import TransactionInput from "../Block/TransactionInput";
import TransactionOutput from "../Block/TransactionOutput";
import { numbersEqual } from "../tools";


export default class BlockValidator {
    blockModel: BlockModel;

    constructor(blockModel: BlockModel) {
        this.blockModel = blockModel;
    }

    isBlockValid = (block: Block): boolean => {
        if (!block.transactions || !block.transactions.length) {
            console.error('Block without transactions is not accepted');
            return false;
        }

        if (block.getName() !== this.blockModel.createBlockName(block)) {
            console.error('Invalid block name');
            return false;
        }

        for (let t in block.transactions) {
            if (!this.isTransactionValid(block.transactions[t])) {
                console.error('Invalid transaction');
                return false;
            }

            if (block.transactions[t].num !== parseInt(t)) {
                console.error('Transaction number is not matching');
                return false;
            }
        }

        return true;
    }

    isTransactionValid = (transaction: Transaction): boolean => {
        // @TODO check for dublciated inputs

        if (!transaction) {
            return false;
        }

        if (!transaction.inputs.length) {
            console.error('Transaction with empty inputs');
            return false;
        }
        if (!transaction.outputs.length) {
            console.error('Transaction with empty outputs');
            return false;
        }

        if (transaction.getName() !== this.blockModel.createTransactionName(transaction)) {
            console.error('Transaction name is not valid');
            return false;
        }

        let inputValue = 0;
        let outputValue = 0;
        let refOutputs = {};
        for (let i in transaction.inputs) {
            if (!this.isInputValid(transaction.inputs[i])) {
                console.error('Input is invalid');
                return false;
            }
            inputValue += transaction.inputs[i].getValue();
        }

        if (this.hasTransactionInputsOverlap(transaction)) {
            console.log('has overlaping input outputs');
            return false;
        }

        for (let o in transaction.outputs) {
            if (!this.isOutputValid(transaction.outputs[o])) {
                console.error('Output is invalid');
                return false;
            }
            outputValue += transaction.outputs[o].getValue();
        }

        if (!numbersEqual(inputValue, outputValue)) {
            console.error('Input and Output values does not match');
            return false;
        }

        return true;
    }

    hasTransactionInputsOverlap = (transaction: Transaction): boolean => {
        let refOptuts: any = {};
        let input: TransactionInput;
        for (input of transaction.inputs) {
            if (undefined === refOptuts[input.transactionName + '.' + input.outputNum]) {
                refOptuts[input.transactionName + '.' + input.outputNum] = 0;
            }
            refOptuts[input.transactionName + '.' + input.outputNum]++;
        }

        return Object.values(refOptuts).reduce((a, b) => a + b) > Object.keys(refOptuts);
    }

    isInputValid = (input: TransactionInput): boolean => {

        /**
         * Coinbase input
         */
        if (input.num === 0 && input.transaction.isCoinbase()) {
            if (input.getValue() !== settings.BLOCK_REWARD) {
                console.error('Invalid reward for coinbase');
                return false;
            }
            if (parseInt(String(input.script).substr(0, String(input.transaction.block?.height).length)) !== input.transaction.block?.height) {
                console.error('Reward transaction needs to include block num as a start');
                return false;
            }

            return true;
        }

        if (!input.utxo) {
            console.error('utxo is required for non coinbase inputs');
            return false;
        }

        if (input.utxo.getScriptAddress() !== input.getSignAddress()) {
            console.error('utxo address is different than input address');
            return false;
        }

        if (addressVerify(input.utxo.createSignValue(), input.getSign(), input.getSignAddress())) {
            return true;
        } else {
            console.error('input sign is invalid');
            return false;

        }
    }

    isOutputValid = (output: TransactionOutput): boolean => {
        if (!this.isValueInValidRange(output.getValue())) {
            console.error('Output value is not correct');
            return false;
        }

        if (output.transaction.isCoinbase()) {
            return this.isOutputValidatorValid(output);
        }
        if (!output.getScriptAddress().length) {
            console.error('Output PPK is required');
            return false;
        }

        return true;
    }

    isOutputValidatorValid = (output: TransactionOutput): boolean => {
        // dont validate at this time
        return true;
    }

    isValueInValidRange = (value: number) => {
        return value === parseInt(String(value), 10);
    }
}
