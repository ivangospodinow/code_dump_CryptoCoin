import StorageInterface from "./StorageInterface";
import settings from '../../settings';
import StorageHandle from "./StorageHandle";

export const DATA_REMOVE_VALUE = 'REMOVE_VALUE';

export default class Storage {
    public storage: StorageInterface;

    constructor(storage: StorageInterface) {
        this.storage = storage;
    }

    has = (namespace: string, key: string): Promise<boolean> => {
        return new Promise(function hasPromise(this: Storage, resolve: CallableFunction, reject: CallableFunction) {
            this.storage.has(namespace, key, function storageGetCallback(result: any, error: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        }.bind(this));
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

    /**
     * @example: address.nameoftheaddress.%
     */
    seek = (namespace: string, expression: string): StorageHandle => {
        return new StorageHandle(this.storage, namespace, expression);
    }

}
