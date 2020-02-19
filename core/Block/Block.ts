import Transaction from "./Transaction";

export default class Block {

    public status: string;
    public height: number;
    public weight: number;
    public chainWeight: number;
    public name: string;
    public prevBlockName: string = '';

    public transactions: Array<Transaction> = [];
    public transactionsNames: Array<string> = [];

    constructor(data: { status: string, height: number, weight: number, chainWeight: number, name: string, prevBlockName: string, transactionsNames?: Array<string> }) {
        this.status = data['status'];
        this.height = data['height'];
        this.weight = data['weight'];
        this.chainWeight = data['chainWeight'];
        this.name = data['name'];
        this.prevBlockName = data['prevBlockName'] || '';
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
