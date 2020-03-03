import Transaction from "./Transaction";

export type BlockConstructor = {
    status: string,
    height: number,
    weight: number,
    difficulty?: number,
    nonce?: string,
    chainWeight: number,
    name: string,
    prevBlockName: string,
    timestamp: string,
    transactionsNames?: Array<string>
};

export default class Block {

    public status: string;
    public height: number;
    public weight: number;
    public chainWeight: number;
    public difficulty: number;
    public nonce: string;

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
        this.difficulty = data['difficulty'] || 1;
        this.nonce = data['nonce'] || '';
        this.name = data['name'];
        this.prevBlockName = data['prevBlockName'] || '';
        this.timestamp = data['timestamp'] || '';
        this.transactionsNames = data['transactionsNames'] || [];
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
}
