import StorageInterface from "../Storage/StorageInterface";
import Address from "../Address/Address";
import Block from "./Block";
import Transaction from "./Transaction";
import TransactionInput from "./TransactionInput";
import TransactionOutput from "./TransactionOutput";
import settings from '../../settings';
import { formatAmount, sha256x2, stringToWeight, calcualteMultiplier } from "../tools";

export default class BlockModel {
    protected storage: StorageInterface;

    constructor(storage: StorageInterface) {
        this.storage = storage;
    }

    createCandidate = (address: Address, prevBlock : Block): Block => {

        const block = new Block({
            status: 'valid-fork',
            height: prevBlock.height + 1,
            weight: 0,
            chainWeight: 0,
            name: '',
            prevBlockName: prevBlock.name
        });

        block.transactions.push(this.createRewardTransaction(address, block))

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
        block.setName(this.createBlockName(block));
        block.setWeight(this.calculateWeight(block));



        return block;
    }

    createRewardTransaction = (address: Address, block: Block): Transaction => {
        const transaction =  new Transaction({
            block : block,
            name : '',
            num : 0,
        });

        transaction.inputs.push(new TransactionInput({
            num: 0,
            script: block.height,
            transaction : transaction,
        }));
        
        transaction.outputs.push(this.createSignedOutput(address, transaction));

        return transaction;
    }

    createSignedOutput = (address: Address, transaction: Transaction): TransactionOutput => {
        return new TransactionOutput({
            num: 0,
            value: 0,
            script: [
                'PPK',
                address.getPublic(),
                'VALID',
                address.sign(
                    [
                        transaction.block.prevBlockName
                    ].join('')
                )
            ].join(' '),
            transaction: transaction
        });

    }

    createBlockName = (block: Block): string => {
        const base = [];
        base.push(block.prevBlockName);

        for (let i = 0; i <= block.transactions.length - 1; i++) {
            base.push(block.transactions[i].name);
        }

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
            base.push(transaction.outputs[o].value.toFixed(settings.BLOCK_REWARD));
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