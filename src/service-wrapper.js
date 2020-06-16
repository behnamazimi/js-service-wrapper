"use strict";

// list of service URLs that can fetch in parallel by other services
import ServiceQueue from "./service-queue";

export const HOOKS = {
    BEFORE_RESOLVE: "before.resolve",
    BEFORE_REJECT: "before.reject",
    BEFORE_FIRE: "before.fire",
    AFTER_SUCCESS: "after.success",
    AFTER_FAIL: "after.fail",
    UPDATE_SERVICE_CONFIG: "update.service-config",
}

const ServiceWrapperObject = {
    HOOKS,
    _hooks: {},
    client: null,
    queue: null,
    _resolveValidation: null,
    defaultParallelStatus: true,
    setClient(client) {
        this.client = client;
    },
    addToQueue(customID) {
        if (!this.queue)
            return;

        return this.queue.add(customID);
    },
    checkQueueStatus(...args) {
        if (!this.queue)
            return;

        return this.queue.checkIdleStatus(...args);
    },
    removeServiceFromQueue(reqID) {
        if (!this.queue)
            return;

        return this.queue.removeService(reqID);
    },
    cancelService(reqID) {
        if (!this.queue)
            return;

        return this.queue.cancelService(reqID);
    },
    setHook(hookName, fn) {
        this._hooks[hookName] = fn;

        return this;
    },
    execHook(hookName, ...args) {
        if (!this._hooks[hookName])
            return;

        return this._hooks[hookName].apply(null, args)
    },
    resolveValidation(result) {
        if (this._resolveValidation && typeof this._resolveValidation === "function") {
            return this._resolveValidation(result)
        }

        return false;
    },
    setResolveValidation(fn) {
        this._resolveValidation = fn;

        return this;
    },
    init(options = {}) {
        if (!options || options.toString() !== "[object Object]") {
            throw new Error("Invalid options passed.")
        }

        if (options.client)
            this.setClient(options.client)

        if (options.queue) {
            this.queue = ServiceQueue.getInstance()
            this.queue.debugMode = !!options.queueLogs
        } else {
            this.queue = null;
        }

        if (options.defaultParallelStatus !== void 0)
            this.defaultParallelStatus = Boolean(options.defaultParallelStatus);

        return this
    }
}

export const ServiceWrapper = {__proto__: ServiceWrapperObject};

(function initServiceHandler() {
    ServiceWrapper.setResolveValidation(res => true);
    ServiceWrapper.setHook(HOOKS.BEFORE_RESOLVE, data => data);
    ServiceWrapper.setHook(HOOKS.BEFORE_REJECT, data => data);
    ServiceWrapper.setHook(HOOKS.UPDATE_SERVICE_CONFIG, data => data);
})();