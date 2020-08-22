# JS Service Wrapper
A promise based collective service wrapper with queue support which totally works in browser and/or Node.js environment

Sometimes you need to pass your service functions from a shared pipe and call some actions on all of them.
 Or maybe you want to add all of your services to a queue that supports parallel and pending tasks.

Needs that I mentioned above are common especially when you are using an http-request client like 
[**axios**](https://github.com/axios/axios), [**fetch**](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), 
or [**superagent**](https://github.com/visionmedia/superagent). Lots of the fetching could fire in the same time and 
if you want to check a common situation for all of them it could be very frustrating. In these conditions,
 you can use **JS Service Wrapper**. 

## Getting Started

### Installation

Using npm:
```
npm install js-service-wrapper
```

Using yarn:
```
yarn add js-service-wrapper
```

Using unpkg CDN
```
<script src="http://unpkg.com/js-service-wrapper/lib/js-service-wrapper.min.js"></script>
```****

### Usage

First of all you need to import `js-service-wrapper` in your project.
```javascript
const {ServiceWrapper, ClientHandler, HOOKS} = require("js-service-wrapper");

// ES Module
import {ServiceWrapper, ClientHandler, HOOKS} from "js-service-wrapper";
```

`ServiceWrapper` is the main object of our util. You need to initialize it, and it's enough to init it once in your project.
```javascript
ServiceWrapper
    .init({
        // `client` is the function that call inside `ClientHandler`
        // default value is null
        client: axios, 
        
        // `queue` is for determining that your service wrapper should active queue or not 
        // the queue is disabled by default
        queue: true,
    
        // if this will be true, queue will log details in different stages 
        // default value is false
        queueLogs: true,
        
        // set the default parallel value of fireOptions 
        // default value is true
        defaultParallelStatus: true,
    })
    // a function that execute to validate the result of main promise
    // if the result of this function be false, the promise will reject
    // default is a function that always returns true
    .setResolveValidation(res => res.status === "ok");
```

The client that you set on the `ServiceWrapper` is the most important part of the initialization. It will be call 
inside the `ClientHandler` and will return a promise. Also, you can do a validation on the promise result by define 
a promise response validation method, `setResolveValidation`. It will execute after promise done and check if the 
result is exactly what you want or not. If the resolve validation return false, so the service will reject. 

The default value of `resolveValidation` is a function that returns `true`.

Here is an example of wrapping that calls `axios` as client because we set it as the `client` on `init`.
```javascript
new ClientHandler({url: "https://reqres.in/api/users"})
    .fire({parallel: false})
    .then(res => {
        // handle result
        console.log("users fetched");
    })
    .catch(err => {
        /// handle error
        console.log(err);
    })
```

You can send an object as fire-options to the `fire` method. the most important property on it is the `parallel`. 
If you not send the parallel status to the `fire`, handler will take it from `defaultParallelStatus` which you send on the `init`.

### Hooks

We have the chance to intervene in the above trend at different stages by **hooks**. 
Hooks are some functions that execute in places we defined, you can think of hooks as events triggered at 
special points. Each hook has a name (event type) and a function that executes (listener). 

Let's set some hooks to the service wrapper.

```javascript
ServiceWrapper
         // get result and return the data property
        .setHook(HOOKS.BEFORE_RESOLVE, res => res.data)
        // this method will call on all successes.
        .setHook(HOOKS.AFTER_SUCCESS, res => {
            console.log(res);
        });
```

The hooks that you set on the `ServiceWrapper` will execute on all services. In the above example, the first one will get 
the result and return the `data` property of it, and the second one just receives the result after client execution succeed and log it.

There are six pre-defined hooks that you can set them to the `ServiceWrapper` or on each `ClientHandler`s to affect the services.
 1. `HOOKS.BEFORE_FIRE` calls before the client service calling. This hook is not async, and the fire will not wait for this. 
 2. `HOOKS.BEFORE_RESOLVE` calls when the service client promise is resolving. The value that it returns will send as the resolve parameter.
 3. `HOOKS.BEFORE_REJECT` calls when the service client promise is rejecting. The value that it returns will send as the reject parameter.
 4. `HOOKS.AFTER_SUCCESS` calls exactly before the resolve and this is not async to.  
 5. `HOOKS.AFTER_FAIL` calls exactly before the reject and this is not async to.  
 6. `HOOKS.UPDATE_SERVICE_CONFIG` with this hook you can update the service config before fire.
 
 Each `ClientHandler` could have its special hook set, and its hooks will override the global hooks that have set on the `ServiceWrapper`.
 Also, you can set the special `client` for each `ClientHandler`. Here is an example.
 ```javascript
new ClientHandler(clientConfig)
    .setClient(manualClient) 
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.body) // get result and return the data property
    .fire({parallel: true})
    .then(res=> {
        //...
    })
``` 
 
### Queue
 
 If you active the **queue** on initialization, so you can specify the behavior of each service in the queue, and determine 
 that your service should be parallel beside other services or pending. To do that you should pass options to  
 the `fire` method and set the value of the `parallel` property as `true` or `false`. The parallel service will fire 
 immediately after adding to the queue, but the pending service waits for its queue. Here is an example of a parallel 
 and a pending service definition.
 
 ```javascript
// this will fire immediately after adding to the queue
new ClientHandler({url: "https://reqres.in/api/users"})
    .fire({parallel: true})
    .then(res=> {
        //...
    })


// this will wait for its turn on queue
new ClientHandler({url: "https://reqres.in/api/users"})
    .fire({parallel: false})
    .then(res=> {
        //...
    })
```

#### Cancel Fired Service
You can cancel the **pending** services of the queue. To do this, you need to put your wrapper instance in a variable before `fire`, 
and call the `cancel` method of it when you want, like this.

```javascript
const cancelableClient = new ClientHandler()
    .setClient(fakeClient)
    .setHook(HOOKS.BEFORE_RESOLVE, res => res)

cancelableClient
    .fire({parallel: false, id: "CANCELABLE_USER_FETCH"})
    .then((res) => {
        console.log("CANCELABLE_USER_FETCH done");
    })
    .catch(err => {
        console.log(err);
    })

cancelableClient.cancel()
``` 

Also, you can ask the `ServiceWrapper` to cancel your service and remove it from the queue by its `cancelService` method. 

```javascript
ServiceWrapper.cancelService(serviceID);
```

## Full Example
```javascript
const {ServiceWrapper, ClientHandler, HOOKS} = require("js-service-wrapper");

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
```

This is the console result of the above example:
```bash
+ ADDED: ALL_USERS_FETCH
* FIRED: ALL_USERS_FETCH [type: pending]
+ ADDED: USER_2_FETCH
+ ADDED: CANCELABLE_USER_FETCH
+ ADDED: USER_3_FETCH
+ ADDED: USER_4_FETCH
- REMOVED: CANCELABLE_USER_FETCH
*** Service CANCELABLE_USER_FETCH canceled before fire ***
*** Service USER_3_FETCH canceled before fire ***

=== after success ===>> ALL_USERS_FETCH
- REMOVED: ALL_USERS_FETCH
* FIRED: USER_2_FETCH [type: pending]
ALL_USERS_FETCH done

=== after success ===>> USER_2_FETCH
- REMOVED: USER_2_FETCH
* FIRED: USER_4_FETCH [type: pending]
USER_2_FETCH done

=== after success ===>> USER_4_FETCH
- REMOVED: USER_4_FETCH
USER_4_FETCH done
```

### Tips
 * To use the `fetch` as your client function, you need to send the bound version of it as like `fetch.bind(window)`.
 * The `fireOptions` that you pass to the `fire` method is accessible in the hook methods as the second parameter.
 * The wrapper itself is promise base but the `client` function doesn't need to be a promise.

### Contributing
I would be grateful to those who helped me make the project truly perfect. So, feel free to contribute to the project.

### License

[MIT](https://github.com/behnamazimi/js-service-wrapper/blob/master/LICENSE)