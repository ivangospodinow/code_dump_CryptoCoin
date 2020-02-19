import StorageInterface from "./StorageInterface";
import settings from '../../settings';

export default class Storage {
    public storage: StorageInterface;

    constructor(storage: StorageInterface) {
        this.storage = storage;
    }

    get = (namespace: string, key: string): Promise<string> => {
        return new Promise(function getPromise(this: Storage, resolve: CallableFunction, reject: CallableFunction) {
            this.storage.get(namespace, key, function storageGetCallback(result: any, error: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        }.bind(this));
    }

    put = (namespace: string, key: string, value: string | Object): Promise<CallableFunction> => {
        return new Promise(function putPromise(this: Storage, resolve: CallableFunction, reject: CallableFunction) {
            this.storage.put(namespace, key, value, function storagePutCallback(result: any, error: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        }.bind(this));
    }

    puts = (data: Array<{ namespace: string, key: string, value: string | object }>): Promise<CallableFunction> => {
        return new Promise(function putsPromise(this: Storage, resolve: CallableFunction, reject: CallableFunction) {
            this.storage.puts(data, function storagePutsCallback(result: any, error: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        }.bind(this));
    }

    delete = (key: string) => {

    }

}
