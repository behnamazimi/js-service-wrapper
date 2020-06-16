const axios = require("axios").default;
const superagent = require('superagent');

const {ServiceWrapper, ClientHandler, HOOKS} = require("../lib/js-service-wrapper.min");

function fakeClient() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({data: {a: 1, b: 2}, status: 200});
        }, 1000)
    })
}

ServiceWrapper
    .init({
        client: axios,
        queue: true,
        queueLogs: true,
    })
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.data)
    .setHook(HOOKS.AFTER_SUCCESS, (res, fireOptions) => {
        // update auth token
        console.log(`\n=== after success ===>> ${fireOptions.id}`)
    })
    .setHook(HOOKS.AFTER_FAIL, err => {
        // handle status
        if (err.response.status === 401) {
            console.log('redirect to /401')

        } else if (err.response.status === 404) {
            console.log('redirect to /404')

        } else if (err.response.status === 500) {
            console.log('redirect to /500')
        }
    })


new ClientHandler("https://reqres.in/api/users")
    .fire({parallel: false, id: "ALL_USERS_FETCH"})
    .then((res) => {
        console.log("ALL_USERS_FETCH done");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler("https://reqres.in/api/users/2")
    .fire({parallel: false, id: "USER_2_FETCH"})
    .then(res => {
        console.log("USER_2_FETCH done");
    })
    .catch(err => {
        console.log(err);
    })


const cancelableService = new ClientHandler()
    .setClient(fakeClient)
    .setHook(HOOKS.BEFORE_RESOLVE, res => res)

cancelableService
    .fire({parallel: false, id: "CANCELABLE_USER_FETCH"})
    .then((res) => {
        console.log("CANCELABLE_USER_FETCH done");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler("https://reqres.in/api/users/3")
    .setClient(superagent)
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.body)
    .fire({parallel: false, id: "USER_3_FETCH"})
    .then((res) => {
        console.log("USER_3_FETCH done");
    })
    .catch(err => {
        console.log(err);
    })

new ClientHandler("https://reqres.in/api/users/4")
    .setClient(superagent)
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.body)
    .fire({parallel: false, id: "USER_4_FETCH"})
    .then((res) => {
        console.log("USER_4_FETCH done");
    })
    .catch(err => {
        console.log(err);
    })


// try to cancel client
if (cancelableService.cancel()) {
    console.log(`*** Service ${cancelableService.id} canceled before fire ***`)
}

if (ServiceWrapper.cancelService("USER_3_FETCH")) {
    console.log(`*** Service USER_3_FETCH canceled before fire ***`)
}
