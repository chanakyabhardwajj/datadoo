(function(DataDoo) {
    /**
     * DataDoo's special priority event bus for propagating
     * changes in the object hierarchy
     */
    function EventBus() {
        this.schedule = []; // contains the list of subscriber to be executed
        this.subscribers = {}; // contains map between publishers and subscribers
        this._currentParentEvents = []; // maintains the parentEvents for the current execution
    }
    DataDoo.EventBus = EventBus;
    EventBus.prototype.enqueue = function (publisher, eventName, data) {
        var subscribers = this.subscribers[publisher.id];

        // add execution schedules for this event
        _.each(subscribers, function (subscriber) {
            console.log("Scheduling execution of " + subscriber.id + " for event " + eventName);
            // collapse events for subscribers who wants it
            if (subscriber.collapseEvents) {
                var entry = _.find(this.schedule, function (item) {
                    return item.subscriber === subscriber;
                });
                if (entry) {
                    entry.events.push({
                        publisher : publisher,
                        eventName : eventName,
                        data : data,
                        parentEvents : this._currentParentEvents
                    });
                    return;
                }
            }
            this.schedule.push({
                priority : subscriber.priority,
                subscriber : subscriber,
                events : [
                    {
                        publisher : publisher,
                        eventName : eventName,
                        data : data,
                        parentEvents : this._currentParentEvents
                    }
                ]
            });
        }, this);

        // maintain priority order
        this.schedule = _.sortBy(this.schedule, "priority");
    };
    EventBus.prototype.subscribe = function (subscriber, publisher) {
        if (!this.subscribers[publisher.id]) {
            this.subscribers[publisher.id] = [];
        }
        this.subscribers[publisher.id].push(subscriber);
    };
    EventBus.prototype.execute = function () {
        while (this.schedule.length > 0) {
            var item = this.schedule.shift();
            console.log("EventBus : executing " + item.subscriber.id);
            this._currentParentEvents = item.events;
            if (item.subscriber.collapseEvents) {
                item.subscriber.handler(item.events);
            }
            else {
                item.subscriber.handler(item.events[0]);
            }
        }
        this._currentParentEvents = [];
    };
    
    EventBus.flatEventsIter = function(events, callback, context) {
        _.each(events, function(event) {
            callback.call(context || window, event);
            EventBus.flatEventsIter(event.parentEvents, callback, context);
        });
    };

    EventBus.flattenEvents = function(events) {
        var flat = [];
        EventBus.flatEventsIter(events, function(event) { flat.push(event); });
        return flat;
    };
})(window.DataDoo);
