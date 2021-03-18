import Queue from "../Block/Queue";

export default class QueueService {
    private items: Array<Queue> = [];

    add = (item: Queue): QueueService => {
        this.items.push(item);
        return this;
    }

    next = (): Queue | undefined => {
        return this.items.shift();
    }

    hasType = (type: string): boolean => {
        return this.items.filter((item: Queue) => item.type === type).length > 0;
    }
}
