const EventEmitter = require('events');

export default class EventsManager extends EventEmitter {
    emitNext = (event: string, param: any) => {
        setTimeout(function enitNextTimeout(this: EventsManager) {
            this.emit(event, param);
        }.bind(this));
    }
}
