import Transaction from "./Transaction";
import settings from "../../settings";

export type BlockConstructor = {
    status: string,
    height: number,
    weight: number,
    target?: number,
    nonce?: string,
    workDone? : number,
    chainWeight: number,
    name: string,
    prevBlockName: string,
    timestamp?: string,
    transactionsNames?: Array<string>,
    transactions?: Array<Transaction>,
};

export const BLOCK_STATUS_VALID = 'valid';
export const BLOCK_STATUS_VALID_FORK = 'valid-fork';
export const BLOCK_STATUS_STAIL = 'stail';
export const BLOCK_STATUS_ORPHANED = 'orphaned';

export default class Block {

    public status: string;
    public height: number;
    public weight: number;
    public chainWeight: number;
    public target: number;
    public nonce: string;
    public workDone: number;
    public name: string;
    public prevBlockName: string = '';
    public timestamp: string;

    public transactions: Array<Transaction> = [];
    public transactionsNames: Array<string> = [];

    constructor(data: BlockConstructor) {
        this.status = data['status'];
        this.height = data['height'];
        this.weight = data['weight'];
        this.chainWeight = data['chainWeight'];
        this.target = data['target'] || 1;
        this.nonce = data['nonce'] || '';
        this.workDone = data['workDone'] || 0;
        this.name = data['name'];
        this.prevBlockName = data['prevBlockName'] || '';
        this.timestamp = data['timestamp'] || '';
        this.transactionsNames = data['transactionsNames'] || [];
        this.transactions = (data['transactions'] || []).map(function blockConstructorSetTransactionRef(this: Block, transaction: Transaction) {
            transaction.block = this;
            return transaction;
        }.bind(this));
    }

    setName = (name: string) => {
        this.name = name;
    }

    getName = (): string => {
        return this.name;
    }

    setWeight = (weight: number) => {
        this.weight = weight;
    }

    exists = () => {
        return this.name && this.height > 0;
    }

}
