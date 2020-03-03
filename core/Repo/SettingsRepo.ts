import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';
import PeersFactory from "../Factory/PeersFactory";
import Peers from "../Block/Peers";

const NAMESPACE = 'setting';
const PEERS_FACTORY = new PeersFactory;

export default class SettingsRepo {
    storage: Storage;
    constructor(storage: Storage) {
        this.storage = storage;
    }

    getLastBlockName = (): Promise<string> => {
        return this.getSetting(settings.LAST_BLOCK_NAME_KEY);
    }

    getSetting = (name: string): Promise<string> => {
        return this.storage.get(NAMESPACE, name);
    }

    setSetting = (name: string, value: string | object): Promise<CallableFunction> => {
        return this.storage.put(NAMESPACE, name, value);
    }

    getPeers = (): Promise<Peers> => {
        return new Promise(async function getPeersPromise(this: SettingsRepo, resolve: CallableFunction, reject: any) {
            this.getSetting(settings.PEERS_KEY).then((result: string) => {
                resolve(PEERS_FACTORY.createFromString(result));
            }).catch(reject);
        }.bind(this));
    }
}
