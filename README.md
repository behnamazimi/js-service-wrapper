# Collective Service Wrapper

Sometimes you need to pass your service functions throw a shared pipe and call some actions on all of them. Or maybe you want to add all of your services to a queue that supports parallel and pending tasks. 

Needs that I mentioned above are common especially when you are using an http-request client like [**axios**](https://github.com/axios/axios), [**fetch**](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), or [**superagent**](https://github.com/visionmedia/superagent). Lots of the fetching could fire in the same time and if you want to check a common situation for all of them it could be very frustrating.

In these conditions, you can use **Collective Service Wrapper**. A promise based service wrapper with queue support that works on browsers and NodeJS environment.

## Install

Using npm:
```
npm install collective-service-wrapper
```

Using yarn:
```
npm install collective-service-wrapper
```

## Getting Started

First of all you need to import `collective-service-wrapper` in your project.
```javascript
const {ServiceWrapper, ClientWrapper, HOOKS} = require("collective-service-wrapper");
```

`ServiceWrapper` is the main object of our util. You need to initialize it, and it's enough to init it once in your project.
```javascript
ServiceWrapper
    .init({
        // `client` is the function that call inside `ClientWrapper`
        client: axios, 
        
        // `queue` is for determining that your service wrapper should active queue or not 
        queue: true,
    
        // if this will be true, queue will log details in different stages 
        queueLogs: true,
    })
```
The client that you set on the `ServiceWrapper` is the most important part of the initialization. It will be call 
inside the `ClientWrapper`, and it will return a promise.
Here is an example of wrapping. This code will call `axios` as client because we send it on `init` as the client value.
```javascript
new ClientWrapper({url: "https://reqres.in/api/users"})
    .fire()
    .then(res => {
        // handle result
        console.log("users fetched");
    })
    .catch(err => {
        /// handle error
        console.log(err);
    })
```

We have the chance to interrupt the above normal flow in different stages. We use hooks to do this.
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

These two hooks will call on all wrappers. the first one will get the result and return the `data` property of that,
 and the second one just receives the result after client-promise succeed and log it.

There are six pre-defined hooks that you can set them to the `ServiceWrapper` or on each `ClientWrapper`s to affect the services.
 1. `HOOKS.BEFORE_FIRE` calls before client service calling, but this hook is not async, and the fire will not wait for this. 
 2. `HOOKS.BEFORE_RESOLVE` calls when the service client promise is resolving, and the value that it returns will send as the resolve parameter.
 3. `HOOKS.BEFORE_REJECT` calls when the service client promise is rejecting, and the value that it returns will send as the reject parameter.
 4. `HOOKS.AFTER_SUCCESS` calls exactly before the resolve and this is not async to.  
 5. `HOOKS.AFTER_FAIL` calls exactly before the reject and this is not async to.  
 6. `HOOKS.UPDATE_REQUEST_CONFIG` with this hook you can update the request config before fire.
 
 Also, you can set the special `client` and `hooks` for each `ClientWrapper`:
 ```javascript
new ClientWrapper(clientConfig)
    .setClient(manualClient) 
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.body) // get result and return the data property
    .fire({parallel: true})
    .then(res=> {
        //...
    })
``` 
 
 If you active the **queue** on initialization, so you can specify the behavior of each service in the queue, and determine 
 that your service should be parallel beside other services or pending. To do that you should pass options to  
 the `fire` method and set the value of the `parallel` property as `true` or `false`. Here is an example of parallel 
 and pending service definition.
 
 ```javascript
// this will fire immediately after adding to the queue
new ClientWrapper({url: "https://reqres.in/api/users"})
    .fire({parallel: true})
    .then(res=> {
        //...
    })


// this will for its turn on queue
new ClientWrapper({url: "https://reqres.in/api/users"})
    .fire({parallel: true})
    .then(res=> {
        //...
    })
```


## Full Example
```javascript
const {ServiceWrapper, ClientWrapper, HOOKS} = require("collective-service-wrapper");

ServiceWrapper
    .init({
        client: axios,
        queue: true,
        queueLogs: true,
    })
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.data)
    .setHook(HOOKS.AFTER_SUCCESS, res => {
        // update auth token     
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


new ClientWrapper({url: "https://reqres.in/api/users"})
    .fire({parallel: false})
    .then((res) => {
        console.log("all users fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientWrapper({url: "https://reqres.in/api/users/2"})
    .fire({parallel: false})
    .then(res => {
        console.log("user 2 fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientWrapper("https://reqres.in/api/users/3")
    .setClient(fetch.bind(window)) 
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.json()) // get result and return the data property
    .fire({parallel: true})
    .then(res => {
        console.log("user 3 fetched ==> this service was parallel");
    })
    .catch(err => {
        console.log(err);
    })
```

this will be the console result of the above example:
```bash
+ ADDED: 1__glmag
* FIRED: 1__glmag [type: pending]
+ ADDED: 2__bgvrg
+ ADDED: 3__8jlr8
* FIRED: 3__8jlr8 [type: parallel]
- REMOVED: 1__glmag
* FIRED: 2__bgvrg [type: pending]
users fetched
- REMOVED: 3__8jlr8
user 3 fetched ==> this service was parallel
- REMOVED: 2__bgvrg
user 2 fetched

```
There are three wrapped services. Each of them has its unique id in the queue but ID starts with the real position index
 in the queue. As you can see above, all services added to the queue on its turn. When the first service added,
  it fires because it’s first of the queue too.
  
The second service will add to the queue after the first one, but it’s not parallel, so it must wait until it turns.
After the second, the third one, the only parallel service should add to the queue. It fires immediately when added to the queue because it’s parallel.
When all added, the first one resolves and removes from the queue, and the second service that is pending should fires.
Each of the services will remove from the queue after done. 


### Tips
 * To use the `fetch` as your client function, you need to send the bound version of it as like `fetch.bind(window)`.
 * The `fireOptions` that you pass to the `fire` method is accessible in the hook methods as the second parameter.
 * The wrapper itself is promise base but the `client` function doesn't need to be a promise.

### Contributing
I would be grateful to those who helped me make the project truly perfect. So, feel free to contribute to the project.

### License

[MIT](https://github.com/behnamazimi/collective-service-wrapper/blob/master/LICENSE)