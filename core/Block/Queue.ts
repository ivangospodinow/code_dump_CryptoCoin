export type QueueConstructor = {
    type: string,
    data: any,
    callback?: CallableFunction,
};

export const QUEUE_TYPE_BLOCK = 'block';
export const QUEUE_TYPE_SYNC = 'sync';

export default class Queue {
    public type: string;
    public data: any;
    public callback?: CallableFunction;

    constructor(data: QueueConstructor) {
        this.type = data['type'];
        this.data = data['data'];
        this.callback = data['callback'];
    }

    doCallback = (success: boolean) => {
        if (this.callback) {
            this.callback(success);
        }
    }
}