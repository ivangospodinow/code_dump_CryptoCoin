import Storage from "../Storage/Storage";
import Block, { BlockConstructor } from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Transaction from "../Block/Transaction";
import TransactionFactory from "./TransactionFactory";

const TRANSACTION_FACTORY = new TransactionFactory;

export default class BlockFactory {

    createFromString = (input: string): Block => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: BlockConstructor): Block => {
        return new Block({
            status: object['status'] || '',
            height: object['height'] || 0,
            weight: object['weight'] || 0,
            chainWeight: object['chainWeight'] || 0,
            name: object['name'] || '',
            prevBlockName: object['prevBlockName'] || '',
            timestamp: object['timestamp'] || '',
            transactionsNames: object['transactionsNames'] || [],
        });
    }

    createArrayFromObject = (block: Block) => {
        return {
            height: block.height,
            status: block.status,
            name: block.name,
            prevBlockName: block.prevBlockName,
            weight: block.weight,
            chainWeight: block.chainWeight,
            difficulty: block.difficulty,
            nonce: block.nonce,
            transctions: block.transactions.map(function createArrayFromObjectMapTransactions(transaction: Transaction) {
                return TRANSACTION_FACTORY.createArrayFromObject(transaction);
            }),
        };
    }
}
