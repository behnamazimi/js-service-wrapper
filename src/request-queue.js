"use strict";

/**
 * A queue structure to control the priority of requests
 * this is a complement function for ServiceWrapper.
 *
 * RequestQueue can only have one instance because it has the singleton structure
 *
 * @type {Object}
 */

export const RequestQueue = (() => {
    let instance;

    function generateInstance() {
        return {
            _debugMode: false, // control the logs
            log(...args) {
                if (this._debugMode)
                    console.log(...args)
            },
            set debugMode(st) {
                this._debugMode = st
            },
            count: 0, // count of all requests that pushed in queue
            _requests: {},
            generateNewID() {
                this.count++;
                return this.count + "__" + Math.random().toString(32).substr(2).substr(6)
            },
            onTurn(id, listener) {
                this._requests[id] = {...this._requests[id], listener, status: "pending"}
            },
            fire(id, ...args) {
                if (this._requests[id] && typeof this._requests[id].listener === 'function') {

                    this.log(`* FIRED: ${id} [type: ${this._requests[id].status}]`);

                    this._requests[id].status = "fired"
                    this._requests[id].listener.apply(this, args);
                }
            },
            add(details = {}) {
                const newID = this.generateNewID();
                this._requests[newID] = details;

                this.log(`+ ADDED: ${newID}`)

                return newID;
            },
            checkIdleStatus(id, parallel = false) {
                return new Promise(resolve => {

                    // add listener for in turn of current id
                    // if the service is idle
                    this.onTurn(id, resolve);

                    // check if parallel is true
                    if (parallel) {
                        this._requests[id].status = "parallel"
                        this.fire(id)
                        return;
                    }

                    // check the length of request queue or
                    // if the request is same as current or
                    const requestsIDs = Object.keys(this._requests);
                    if (!requestsIDs.length || requestsIDs[0] === id) {
                        this.fire(id)
                    }

                })
            },
            removeRequest(id) {
                // delete request that has been done
                delete this._requests[id];

                this.log(`- REMOVED: ${id}`)

                const requestsIDs = Object.keys(this._requests);
                const first = this._requests[requestsIDs[0]];
                if (first && first.status === "pending") {
                    this.fire(requestsIDs[0]);
                }

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

export default RequestQueue