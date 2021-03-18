import { json } from "../tools";
import Queue, { QueueConstructor } from "../Block/Queue";

export default class QueueFactory {

    createFromString = (input: string): Queue => {
        return this.createFromObject(json(input))
    }

    createFromObject = (object: QueueConstructor): Queue => {
        return new Queue({
            type: object['type'],
            data: object['data'],
        });
    }

    createArrayFromObject = (queue: Queue): QueueConstructor => {
        return {
            type: queue.type,
            data: queue.data,
        };
    }
}
