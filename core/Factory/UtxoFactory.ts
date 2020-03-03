import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Utxo, { UtxoConstructor } from "../Block/Utxo";

export default class UtxoFactory {

    createFromString = (input: string): Utxo => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object : UtxoConstructor): Utxo => {
        return new Utxo(object);
    }
}


