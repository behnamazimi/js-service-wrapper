/**
 * A queue structure to control the priority of requests
 * this is a complement function for ServiceWrapper.
 *
 * RequestQueue can only have one instance because it has the singleton structure
 *
 * @type {Object}
 */

const RequestQueue = (() => {
    let instance;

    function generateInstance() {
        return {
            _debugMode: false, // control the logs
            log(...args) {
                if (this._debugMode)
                    console.log(...args);
            },
            set debugMode(st) {
                this._debugMode = st;
            },
            count: 0, // count of all requests that pushed in queue
            _requests: {},
            generateNewID() {
                this.count++;
                return this.count + "__" + Math.random().toString(32).substr(2).substr(6)
            },
            onTurn(id, listener) {
                this._requests[id] = {...this._requests[id], listener, status: "pending"};
            },
            fire(id, ...args) {
                if (this._requests[id] && typeof this._requests[id].listener === 'function') {

                    this.log(`* FIRED: ${id} [type: ${this._requests[id].status}]`);

                    this._requests[id].status = "fired";
                    this._requests[id].listener.apply(this, args);
                }
            },
            add(customID) {
                let id = customID;
                if (!id)
                    id = this.generateNewID();

                this._requests[id] = {};

                this.log(`+ ADDED: ${id}`);

                return id;
            },
            checkIdleStatus(id, parallel = false) {
                return new Promise(resolve => {

                    // add listener for in turn of current id
                    // if the service is idle
                    this.onTurn(id, resolve);

                    // check if parallel is true
                    if (parallel) {
                        this._requests[id].status = "parallel";
                        this.fire(id);
                        return;
                    }

                    // check the length of request queue or
                    // if the request is same as current or
                    const requestsIDs = Object.keys(this._requests);
                    if (!requestsIDs.length || requestsIDs[0] === id) {
                        this.fire(id);
                    }

                })
            },
            removeRequest(id) {
                // delete request that has been done
                delete this._requests[id];

                this.log(`- REMOVED: ${id}`);

                const requestsIDs = Object.keys(this._requests);
                const first = this._requests[requestsIDs[0]];
                if (first && first.status === "pending") {
                    this.fire(requestsIDs[0]);
                }

                return true
            }
        }
    }

    // return an instance of RequestQueue
    return {
        getInstance() {
            if (!instance)
                instance = generateInstance();

            return instance;
        }
    }
})();

const HOOKS = {
    BEFORE_RESOLVE: "before.resolve",
    BEFORE_REJECT: "before.reject",
    BEFORE_FIRE: "before.fire",
    AFTER_SUCCESS: "after.success",
    AFTER_FAIL: "after.fail",
    UPDATE_REQUEST_CONFIG: "update.request-config",
};

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
    removeQueueRequest(reqID) {
        if (!this.queue)
            return;

        return this.queue.removeRequest(reqID);
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
            this.setClient(options.client);

        if (options.queue) {
            this.queue = RequestQueue.getInstance();
            this.queue.debugMode = !!options.queueLogs;
        } else {
            this.queue = null;
        }

        if (options.defaultParallelStatus !== void 0)
            this.defaultParallelStatus = Boolean(options.defaultParallelStatus);

        return this
    }
};

const ServiceWrapper = {__proto__: ServiceWrapperObject};

(function initRequestHandler() {
    ServiceWrapper.setResolveValidation(res => true);
    ServiceWrapper.setHook(HOOKS.BEFORE_RESOLVE, data => data);
    ServiceWrapper.setHook(HOOKS.BEFORE_REJECT, data => data);
    ServiceWrapper.setHook(HOOKS.UPDATE_REQUEST_CONFIG, data => data);
})();

class ClientHandler {

    constructor(...conf) {
        this._client = ServiceWrapper.client;

        if (!this._client || typeof this._client !== "function")
            throw new Error("HTTP client must be a function")

        this._reqConfig = conf;

        this._customHooks = {};

        this._resolveValidation = null;
    }

    get id() {
        return this._id;
    }

    addToQueue(customID) {
        // add request to service queue and get the unique id
        this._id = ServiceWrapper.addToQueue(customID);
    }

    cancel() {
        if (!this._fireOptions || this._fireOptions.parallel)
            return false;

        // remove service from queue
        return ServiceWrapper.removeQueueRequest(this._id);
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
            return this._customHooks[hookName].apply(this, args)
        }

        return ServiceWrapper.execHook(hookName, ...args)
    }

    resolveValidation(result) {
        if (this._resolveValidation
            && typeof this._resolveValidation === "function") {
            return this._resolveValidation(result)
        }

        return ServiceWrapper.resolveValidation(result);
    }

    setResolveValidation(fn) {
        this._resolveValidation = fn;

        return this
    }

    /**
     * Fire the client request and fetch response
     *
     * @param options - fire options
     * @returns {Promise<>}
     */
    fire(options = {}) {
        this._fireOptions = options;

        // check the existence of the fire options
        if (!this._fireOptions || typeof this._fireOptions !== 'object')
            this._fireOptions = {parallel: ServiceWrapper.defaultParallelStatus};

        // add request to queue
        // this is important because this assigns id too
        this.addToQueue(this._fireOptions.id);

        // we get the config by rest from arguments and it has array type
        // so, we need to convert it to array after updating
        this._reqConfig = [this.execHook(HOOKS.UPDATE_REQUEST_CONFIG, ...this._reqConfig)];

        return new Promise(async (resolve, reject) => {
            try {

                // check idle status of service handler
                // if isParallel is true, the request will not wait for the queue
                await ServiceWrapper.checkQueueStatus(this._id, this._fireOptions.parallel);

                this.execHook(HOOKS.BEFORE_FIRE, this._fireOptions);

                // call Http client function and fire the request
                const callRes = await this._client(...this._reqConfig);

                // check the status of request and ErrorCode existence
                if (this.resolveValidation(callRes)) {

                    this.execHook(HOOKS.AFTER_SUCCESS, callRes, this._fireOptions);

                    // resolve the main result
                    resolve(this.execHook(HOOKS.BEFORE_RESOLVE, callRes, this._fireOptions));

                } else {

                    this.execHook(HOOKS.AFTER_FAIL, callRes, this._fireOptions);

                    reject(this.execHook(HOOKS.BEFORE_REJECT, callRes, this._fireOptions));
                }

            } catch (e) { // this scope will call when status is not 200

                this.execHook(HOOKS.AFTER_FAIL, e, this._fireOptions);

                reject(this.execHook(HOOKS.BEFORE_REJECT, e, this._fireOptions));

            } finally {

                // update request status in requests queue
                ServiceWrapper.removeQueueRequest(this._id);
            }
        })
    }
}

export { ClientHandler, HOOKS, ServiceWrapper };
