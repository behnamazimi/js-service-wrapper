const axios = require("axios").default;
const superagent = require('superagent');

const {ServiceWrapper, ClientHandler, HOOKS} = require("../lib/js-service-wrapper");

function fakeClient() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({data: {a: 1, b: 2}, status: 200});
        }, 1000)
    })
}

ServiceWrapper
    .init({
        client: superagent,
        queue: true,
        queueLogs: true,
    })
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.body)


new ClientHandler("https://reqres.in/api/users")
    .fire({parallel: false})
    .then((res) => {
        console.log("users fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler("https://reqres.in/api/users/2")
    .fire({parallel: false})
    .then(res => {
        console.log("user 3 fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler("https://reqres.in/api/users/3")
    .fire({parallel: false})
    .then(res => {
        console.log("user 4 fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler("https://reqres.in/api/users/4")
    .fire({parallel: false})
    .then(res => {
        console.log("user 5 fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler()
    .setClient(fakeClient)
    .setHook(HOOKS.BEFORE_RESOLVE, res => res)
    .fire({parallel: true})
    .then((res) => {
        console.log("fake client done");
    })
    .catch(err => {
        console.log(err);
    })