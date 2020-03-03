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
    blockRepo: BlockRepo;

    constructor(blockModel: BlockModel, blockRepo: BlockRepo) {
        this.blockModel = blockModel;
        this.blockRepo = blockRepo;
    }

    isBlockValid = (block: Block): boolean => {

        if (!block.transactions.length) {
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

        for (let i in transaction.inputs) {
            if (!this.isInputValid(transaction.inputs[i])) {
                console.error('Input is invalid');
                return false;
            }
            inputValue += transaction.inputs[i].getValue();
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

            return  true;
        }

        if (!input.utxo) {
            console.error('utxo is required for non coinbase inputs');
            return false;
        }

        if (addressVerify(input.utxo.createSignValue(), input.getSign(), input.utxo.getScriptAddress())) {
            return true;
        }

        return false;
    }

    isOutputValid = (output: TransactionOutput): boolean => {
        if (output.transaction.isCoinbase()) {
            return this.isOutputValidatorValid(output);
        }
        if (!output.getScriptAddress().length) {
            console.error('Output PPK is required');
            return false;
        }
        // console.error('isOutputValid needs to be implemented');

        return true;
    }

    isOutputValidatorValid = (output: TransactionOutput): boolean => {
        if (!addressVerify(output.transaction.block?.prevBlockName, output.getScriptValidatedHash(), output.getScriptAddress())) {
            console.error('Invalid  coinbase output signed');
            return false;
        }
        return true;
    }
}
