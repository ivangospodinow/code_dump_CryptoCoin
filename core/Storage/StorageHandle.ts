import StorageInterface from "./StorageInterface";

export default class StorageHandle {
    storage: StorageInterface;
    namespace: string;
    expression: string;
    increment: number = 0;
    storageHasData = true;

    constructor(storage: StorageInterface, namespace: string, expression: string) {
        this.storage = storage;
        this.namespace = namespace;
        this.expression = expression;
    }

    hasData = (): boolean => {
        return this.storageHasData;
    }

    next = (): Promise<string> => {
        return new Promise(function nextPromise(this: StorageHandle, resolve: CallableFunction, reject: CallableFunction) {
            this.storage.seek(this.namespace, this.expression, this.increment, function storageSeekCallback(this: StorageHandle, result: any, error: any) {
                if (error) {
                    reject(error);
                    this.storageHasData = false;
                } else {
                    this.increment++;
                    this.storageHasData = String(result).length > 0;
                    resolve(result || '');
                }
            }.bind(this));
        }.bind(this));
    }
}