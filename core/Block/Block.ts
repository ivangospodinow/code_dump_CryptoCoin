import Transaction from "./Transaction";
import settings from "../../settings";
import Address from "../Address/Address";

// This is our current active chain (the longest chain).
export const BLOCK_STATUS_VALID = 'valid';
export const BLOCK_STATUS_INVALID = 'invalid';
// Our node performed a chain reorganisation. We downloaded and validated these blocks and had them as part of our active chain, but we later deactivated them after receiving a new longer chain of blocks.
export const BLOCK_STATUS_VALID_FORK = 'valid-fork';
export const BLOCK_STATUS_STAIL = 'stail';
export const BLOCK_STATUS_ORPHANED = 'orphaned';
export const BLOCK_STATUS_MINED = 'mined';

export const BLOCK_STATUSES = [
    BLOCK_STATUS_VALID,
    BLOCK_STATUS_VALID_FORK,
    BLOCK_STATUS_STAIL,
    BLOCK_STATUS_ORPHANED,
    BLOCK_STATUS_MINED
];

export type BlockStatusType = typeof BLOCK_STATUSES[number];

export type BlockConstructor = {
    status: BlockStatusType,
    height: number,
    weight: number,
    target?: number,
    nonce?: string,
    hash?: number,
    chainWeight: number,
    name: string,
    prevBlockName: string,
    timestamp?: string,
    transactionsNames?: Array<string>,
    transactions?: Array<Transaction>,
};
export default class Block {

    public status: BlockStatusType;
    public height: number;
    public weight: number;
    public chainWeight: number;
    public target: number;
    public nonce: string;
    public hash: number;
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
        this.hash = data['hash'] || 0;
        this.name = data['name'];
        this.prevBlockName = data['prevBlockName'] || '';
        this.timestamp = data['timestamp'] || '';
        this.transactionsNames = data['transactionsNames'] || [];
        this.transactions = (data['transactions'] || []).map(function blockConstructorSetTransactionRef(this: Block, transaction: Transaction) {
            transaction.block = this;
            return transaction;
        }.bind(this));
    }

    setStatus = (status: BlockStatusType): Block => {
        this.status = status;
        return this;
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

    getCoinBaseAddress = (): Address | undefined => {
        const coinBaseAddress = this.getCoinBaseAddressString();
        if (coinBaseAddress) {
            return new Address(coinBaseAddress);
        }
        return undefined;
    }

    getCoinBaseAddressString = (): string | undefined => {
        if (undefined === this.transactions[0]) {
            return undefined;
        }

        if (undefined === this.transactions[0].outputs[0]) {
            return undefined;
        }

        return this.transactions[0].outputs[0].getScriptAddress();
    }
}
