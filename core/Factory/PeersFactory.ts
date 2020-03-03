import Storage from "../Storage/Storage";
import Block, { BlockConstructor } from "../Block/Block";
import settings from '../../settings';
import { json } from "../tools";
import Peers, { PeerStorage, PeerConstructor } from "../Block/Peers";

export default class PeersFactory {

    createFromString = (input: string): Peers => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: PeerStorage): Peers => {
        return new Peers(object.peers.map((pair: PeerConstructor) => {
            return pair;
        }));
    }
}
