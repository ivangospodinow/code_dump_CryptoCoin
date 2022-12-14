import StorageHandle from "./StorageHandle";

export type StorageCallback = (result: any, error: any) => void;

export default class StorageInterface {
    constructor() {

    }

    has = (namespace: string, key: string, callback: StorageCallback) => { }
    get = (namespace: string, key: string, callback: StorageCallback) => { }
    put = (namespace: string, key: string, value: string | Object, callback: StorageCallback) => { }
    puts = (data: Array<{ namespace: string, key: string, value: string | object }>, callback: StorageCallback) => { }
    seek = (namespace: string, expression: string): StorageHandle => { }
}
