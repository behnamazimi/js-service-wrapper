"use strict";

// list of request URLs that can fetch in parallel by other requests
import RequestQueue from "./request-queue";

export const HOOKS = {
    BEFORE_RESOLVE: "before.resolve",
    BEFORE_REJECT: "before.reject",
    BEFORE_FIRE: "before.fire",
    AFTER_SUCCESS: "after.success",
    AFTER_FAIL: "after.fail",
    UPDATE_REQUEST_CONFIG: "update.request-config",
}

const ServiceWrapperObject = {
    HOOKS,
    _hooks: {},
    client: null,
    queue: null,
    setClient(client) {
        this.client = client;
    },
    addToQueue() {
        if (!this.queue)
            return;

        return this.queue.add();
    },
    checkQueueStatus(...args) {
        if (!this.queue)
            return;

        return this.queue.checkIdleStatus(...args);
    },
    removeQueueRequest(reqID) {
        if (!this.queue)
            return;

        return this.queue.removeRequest(reqID);
    },
    setHook(hookName, fn) {
        this._hooks[hookName] = fn;
    },
    execHook(hookName, ...args) {
        if (!this._hooks[hookName])
            return;

        return this._hooks[hookName].apply(null, args)
    },
    init(options = {}) {
        if (!options || options.toString() !== "[object Object]") {
            throw new Error("Invalid options passed.")
        }

        if (options.client)
            this.setClient(options.client)

        if (options.queue) {
            this.queue = RequestQueue.getInstance()
            this.queue.debugMode = !!options.queueLogs
        } else {
            this.queue = null;
        }

        return this
    }
}

export const ServiceWrapper = {__proto__: ServiceWrapperObject};

(function initRequestHandler() {
    ServiceWrapper.setHook(HOOKS.BEFORE_RESOLVE, data => data);
    ServiceWrapper.setHook(HOOKS.BEFORE_RESOLVE, data => data);
    ServiceWrapper.setHook(HOOKS.UPDATE_REQUEST_CONFIG, data => data);
})();