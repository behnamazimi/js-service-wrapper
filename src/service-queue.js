"use strict";

/**
 * A queue structure to control the priority of services
 * this is a complement function for ServiceWrapper.
 *
 * ServiceQueue can only have one instance because it has the singleton structure
 *
 * @type {Object}
 */

export const ServiceQueue = (() => {
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
            count: 0, // count of all services that pushed in queue
            _services: {},
            generateNewID() {
                this.count++;
                return this.count + "__" + Math.random().toString(32).substr(2).substr(6)
            },
            onTurn(id, listener) {
                this._services[id] = {...this._services[id], listener, status: "pending"}
            },
            fire(id, ...args) {
                if (this._services[id] && typeof this._services[id].listener === 'function') {

                    this.log(`* FIRED: ${id} [type: ${this._services[id].status}]`);

                    this._services[id].status = "fired"
                    this._services[id].listener.apply(this, args);
                }
            },
            add(customID) {
                let id = customID;
                if (!id)
                    id = this.generateNewID();

                this._services[id] = {};

                this.log(`+ ADDED: ${id}`)

                return id;
            },
            checkIdleStatus(id, parallel = false) {
                return new Promise(resolve => {

                    // add listener for in turn of current id
                    // if the service is idle
                    this.onTurn(id, resolve);

                    // check if parallel is true
                    if (parallel) {
                        this._services[id].status = "parallel"
                        this.fire(id)
                        return;
                    }

                    // check the length of service queue or
                    // if the service is same as current or
                    const servicesIDs = Object.keys(this._services);
                    if (!servicesIDs.length || servicesIDs[0] === id) {
                        this.fire(id)
                    }

                })
            },
            removeService(id) {
                // delete service that has been done
                delete this._services[id];

                this.log(`- REMOVED: ${id}`)

                const servicesIDs = Object.keys(this._services);
                const first = this._services[servicesIDs[0]];
                if (first && first.status === "pending") {
                    this.fire(servicesIDs[0]);
                }

                return true
            },
            cancelService(id) {
                if (this._services[id].status === "pending") {
                    delete this._services[id];
                    return true;
                }

                return false
            }
        }
    }

    // return an instance of ServiceQueue
    return {
        getInstance() {
            if (!instance)
                instance = generateInstance();

            return instance;
        }
    }
})();

export default ServiceQueue