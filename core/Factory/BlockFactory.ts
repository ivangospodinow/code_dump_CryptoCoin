import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";

export default class BlockFactory {

    createFromString = (input: string): Block => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: { status?: string, height?: number, weight?: number, chainWeight?: number, name?: string, prevBlockName?: string, transactions? : Array<string> }): Block => {
        return new Block({
            status: object['status'] || '',
            height: object['height'] || 0,
            weight: object['weight'] || 0,
            chainWeight: object['chainWeight'] || 0,
            name: object['name'] || '',
            prevBlockName: object['prevBlockName'] || '',
            transactionsNames : object['transactions'] || [],
        });
    }
}
