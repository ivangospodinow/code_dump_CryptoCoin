import StorageInterface from "../Storage/StorageInterface";
import Address from "../Address/Address";
import Block, { BLOCK_STATUS_VALID_FORK } from "./Block";
import Transaction from "./Transaction";
import TransactionInput from "./TransactionInput";
import TransactionOutput from "./TransactionOutput";
import settings from '../../settings';
import { formatAmount, sha256x2, stringToWeight, calcualteMultiplier } from "../tools";
import Utxo from "./Utxo";

export default class BlockModel {
    protected storage: StorageInterface;

    constructor(storage: StorageInterface) {
        this.storage = storage;
    }

    createCandidate = (address: Address, prevBlock: Block): Block => {

        const block = new Block({
            status: BLOCK_STATUS_VALID_FORK,
            height: prevBlock.height + 1,
            weight: 0,
            chainWeight: prevBlock.chainWeight,
            name: '',
            prevBlockName: prevBlock.name,

        });

        block.transactions.push(this.createRewardTransaction(address, block));

        return block;
    }

    prepareCandidate = (block: Block): Block => {

        const shareReward = formatAmount(settings.BLOCK_REWARD / block.transactions[0].outputs.length);
        const leftoverValue = formatAmount(settings.BLOCK_REWARD - shareReward * block.transactions[0].outputs.length);

        for (let i = 0; i <= block.transactions[0].outputs.length - 1; i++) {
            block.transactions[0].outputs[i].addValue(block.transactions[0].outputs[i].value + shareReward + (i === 0 ? leftoverValue : 0));
            block.transactions[0].outputs[i].num = i;
        }


        block.transactions[0].setName(this.createTransactionName(block.transactions[0]));

        let counter: number = 0;
        let transaction: Transaction;
        let input: TransactionInput;
        let output: TransactionOutput;

        for (transaction of block.transactions) {
            transaction.block = block;
            transaction.num = counter++;

            for (input of transaction.inputs) {
                input.transaction = transaction;
            }

            for (output of transaction.outputs) {
                output.transaction = transaction;
            }
        }

        block.setName(this.createBlockName(block));
        block.setWeight(this.calculateWeight(block));



        return block;
    }

    createRewardTransaction = (address: Address, block: Block): Transaction => {
        const transaction = new Transaction({
            block: block,
            name: '',
            num: 0,
        });

        transaction.inputs.push(new TransactionInput({
            num: 0,
            script: block.height,
            transaction: transaction,
        }));

        transaction.outputs.push(this.createSignedOutput(address, transaction));

        return transaction;
    }

    /**
     * @TODO Move to transaction repo
     */
    createPayToAddressTransaction = (from: Address, to: Address, utxos: Array<Utxo>, amount: number): Transaction | undefined => {
        // in case float is passed
        amount = formatAmount(amount);
        if (amount < 1) {
            return undefined;
        }

        const transaction = new Transaction({
            num: 0,
            name: '',
        });
        let utxoValue = 0;
        let inputNum = 0;
        let utxo: Utxo;
        transaction.inputs = [];
        for (utxo of utxos) {
            utxoValue += utxo.value;
            transaction.inputs.push(new TransactionInput({
                num: inputNum++,
                outputNum: utxo.outputNum,
                transactionName: utxo.transactionName,
                script: 'SIGN ' + from.sign(utxo.createSignValue()) + ' ADDRESS ' + from.getPublic(),
                transaction,
                utxo,
            }));
            if (utxoValue >= amount) {
                break;
            }
        }



        /**
         * If the address is the same, no need for two outputs
         */
        if (from.getPublic() === to.getPublic()) {
            amount = utxoValue;
        }

        transaction.outputs.push(new TransactionOutput({
            num: 0,
            value: amount > utxoValue ? utxoValue : amount,
            script: 'PPK ' + to.getPublic(),
            transaction
        }));

        // if (amount > utxoValue) {
        //     console.error('new transaction value is bigger than requested');
        //     return null;
        // }

        if (utxoValue - amount > 0) {
            transaction.outputs.push(new TransactionOutput({
                num: 1,
                value: formatAmount(utxoValue - amount),
                script: 'PPK ' + from.getPublic(),
                transaction,
            }));
        }

        transaction.name = this.createTransactionName(transaction);
        return transaction;
    }

    createSignedOutput = (address: Address, transaction: Transaction): TransactionOutput => {
        return new TransactionOutput({
            num: 0,
            value: 0,
            script: 'PPK ' + address.getPublic(),
            transaction,
        });

    }

    createBlockName = (block: Block): string => {
        const base = [];
        base.push(block.prevBlockName);

        for (let i = 0; i <= block.transactions.length - 1; i++) {
            base.push(block.transactions[i].name);
        }
        // dont use it!
        // base.push(block.timestamp);
        return sha256x2(base.join(''));
    }

    createTransactionName = (transaction: Transaction): string => {
        const base = [];

        for (let i = 0; i <= transaction.inputs.length - 1; i++) {
            base.push(transaction.inputs[i].num);
            base.push(transaction.inputs[i].outputNum || '');
            base.push(transaction.inputs[i].transactionName || '');
            base.push(transaction.inputs[i].script);
        }

        for (let o = 0; o <= transaction.outputs.length - 1; o++) {
            base.push(transaction.outputs[o].num);
            base.push(transaction.outputs[o].script);
            base.push(transaction.outputs[o].value);
        }

        return sha256x2(base.join(''));
    }

    calculateWeight = (block: Block): number => {
        const prevBlockWeight = stringToWeight(sha256x2(block.prevBlockName));

        let multiplier = calcualteMultiplier(
            prevBlockWeight,
            stringToWeight(sha256x2(block.transactions[0].outputs[0].script))
        );


        if (block.transactions.length <= 1) {
            multiplier--;
        }

        let valueMultiple = parseFloat('0.' + ('0'.repeat(settings.COIN_DECIMALS - 1)) + '1');
        /**
         * @TODO IMPLEMENT IT 
        $valueMultiple = '0.' . \str_repeat('0', COIN_DECIMALS - 1) . '1';
        if (
            isset($coinbaseTransaction->inputs[1])
            && isset($coinbaseTransaction->outputs[0])
            && $coinbaseTransaction->inputs[1]->output->getScriptAddress() === $coinbaseTransaction->outputs[0]->getScriptAddress()
        ) {
            $valueMultiple = $coinbaseTransaction->outputs[0]->value;
            $weight++;
        }
         */

        let score: number = 1;
        let outputScore: number = 0;
        let outputWeight: number = 0;
        let tmp: any = 0;
        for (let i = 1; i <= block.transactions[0].outputs.length - 1; i++) {
            outputWeight = stringToWeight(sha256x2(block.transactions[0].outputs[i].script));
            outputScore = valueMultiple * outputWeight;
            if (outputScore < 1) {
                outputScore = 1;
            }
            tmp = outputScore * calcualteMultiplier(prevBlockWeight, outputWeight);
            score += parseInt(tmp);
        }

        tmp = score * multiplier;
        return parseInt(tmp);
    }
}
