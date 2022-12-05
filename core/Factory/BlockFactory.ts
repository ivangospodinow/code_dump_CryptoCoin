import Storage from "../Storage/Storage";
import Block, { BlockConstructor } from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Transaction, { TransactionConstructor } from "../Block/Transaction";
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
            target: object['target'] || '',
            nonce: object['nonce'] || '',
            hash: object['hash'] || 0,
            prevBlockName: object['prevBlockName'] || '',
            timestamp: object['timestamp'] || undefined,
            transactionsNames: object['transactionsNames'] || [],
            transactions: (object.transactions || []).map(function createTransactionFromObject(transaction: TransactionConstructor) {
                return TRANSACTION_FACTORY.createFromObject(transaction);
            }),
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
            target: block.target,
            nonce: block.nonce,
            hash: block.hash,
            timestamp: block.timestamp,
            transactionsNames: block.transactionsNames,
            transactions: block.transactions.map(function createArrayFromObjectMapTransactions(transaction: Transaction) {
                return TRANSACTION_FACTORY.createArrayFromObject(transaction);
            }),
        };
    }


    createStringFromObject = (block: Block): string => {
        return JSON.stringify(this.createArrayFromObject(block));
    }
}
