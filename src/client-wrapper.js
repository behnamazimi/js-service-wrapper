"use strict";

import {ServiceWrapper, HOOKS} from "./service-handler";

export class ClientWrapper {

    constructor(...conf) {
        this._client = ServiceWrapper.client;

        if (!this._client || typeof this._client !== "function")
            throw new Error("HTTP client must be a function")

        this._reqConfig = conf;

        // add request to service queue and get the unique id
        this._id = ServiceWrapper.addToQueue();

        this._customHooks = {};
    }

    setClient(client) {
        if (!client || typeof client !== "function")
            throw new Error("Invalid client passed. Client must be a function")

        this._client = client;
        return this
    }

    setHook(hookName, fn) {
        if (hookName && typeof fn === "function")
            this._customHooks[hookName] = fn;

        return this;
    }

    execHook(hookName, ...args) {
        if (this._customHooks[hookName]
            && typeof this._customHooks[hookName] === "function") {
            return this._customHooks[hookName].apply(null, args)
        }

        return ServiceWrapper.execHook(hookName, ...args)
    }

    /**
     * Fire the client request and fetch response
     *
     * @param options - fire options
     * @returns {Promise<>}
     */
    fire(options = {}) {
        this._fireOptions = options;

        // we get the config by rest from arguments and it has array type
        // so, we need to convert it to array after updating
        this._reqConfig = [this.execHook(HOOKS.UPDATE_REQUEST_CONFIG, ...this._reqConfig)];

        // TODO: set specific id for each service
        // if (this._fireOptions && this._fireOptions.uniqueID)

        return new Promise(async (resolve, reject) => {
            try {

                // check idle status of service handler
                // if isParallel is true, the request will not wait for the queue
                await ServiceWrapper.checkQueueStatus(this._id, this._fireOptions.parallel);

                this.execHook(HOOKS.BEFORE_FIRE, this._fireOptions);

                // call Http client function and fire the request
                const callRes = await this._client(...this._reqConfig);

                // check the status of request and ErrorCode existence
                if (callRes.status === 200) {

                    this.execHook(HOOKS.AFTER_SUCCESS, callRes, this._fireOptions)

                    // resolve the main result
                    resolve(this.execHook(HOOKS.BEFORE_RESOLVE, callRes, this._fireOptions));
                }

            } catch (e) { // this scope will call when status is not 200
                console.log(e);
                this.execHook(HOOKS.AFTER_FAIL, e, this._fireOptions)

                reject(this.execHook(HOOKS.BEFORE_REJECT, e, this._fireOptions));

            } finally {

                // update request status in requests queue
                ServiceWrapper.removeQueueRequest(this._id);
            }
        })
    }
}
