import Storage from "../Storage/Storage";
import Block from "../Block/Block";
import settings from '../../settings';

const NAMESPACE = 'setting';

export default class SettingsRepo {
    storage: Storage;
    constructor(storage: Storage) {
        this.storage = storage;
    }

    getLastBlockName = (): Promise<string> => {
        return this.storage.get(NAMESPACE, settings.LAST_BLOCK_NAME_KEY);
    }
}
