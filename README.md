# JS Service Wrapper

Sometimes you need to pass your service functions from a shared pipe and call some actions on all of them.
 Or maybe you want to add all of your services to a queue that supports parallel and pending tasks.

Needs that I mentioned above are common especially when you are using an http-request client like 
[**axios**](https://github.com/axios/axios), [**fetch**](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), 
or [**superagent**](https://github.com/visionmedia/superagent). Lots of the fetching could fire in the same time and 
if you want to check a common situation for all of them it could be very frustrating.

In these conditions, you can use **JS Service Wrapper**. A promise based collective service wrapper with queue support 
that works on browsers and NodeJS environment.

## Getting Started

### Installation

Using npm:
```
npm install js-service-wrapper
```

Using yarn:
```
npm install js-service-wrapper
```

Using unpkg CDN
```
<script src="http://unpkg.com/js-service-wrapper/lib/js-service-wrapper.min.js"></script>
```

### Usage

First of all you need to import `js-service-wrapper` in your project.
```javascript
const {ServiceWrapper, ClientHandler, HOOKS} = require("js-service-wrapper");

// or
import {ServiceWrapper, ClientHandler, HOOKS} from "js-service-wrapper";
```

`ServiceWrapper` is the main object of our util. You need to initialize it, and it's enough to init it once in your project.
```javascript
ServiceWrapper
    .init({
        // `client` is the function that call inside `ClientHandler`
        client: axios, 
        
        // `queue` is for determining that your service wrapper should active queue or not 
        queue: true,
    
        // if this will be true, queue will log details in different stages 
        queueLogs: true,
    })
```
The client that you set on the `ServiceWrapper` is the most important part of the initialization. It will be call 
inside the `ClientHandler` and will return a promise.
Here is an example of wrapping. This code calls `axios` as client because we set it as the `client` value on `init`.
```javascript
new ClientHandler({url: "https://reqres.in/api/users"})
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
 6. `HOOKS.UPDATE_REQUEST_CONFIG` with this hook you can update the request config before fire.
 
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
    .fire({parallel: true})
    .then(res=> {
        //...
    })
```

## Full Example
```javascript
const {ServiceWrapper, ClientHandler, HOOKS} = require("js-service-wrapper");

ServiceWrapper
    .init({
        client: axios,
        queue: true,
        queueLogs: true,
    })
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.data)
    .setHook(HOOKS.AFTER_SUCCESS, (res, fireOptions) => {
        // update auth token     
        console.log(`=== after success ===>> ${fireOptions.fireDesc}`)
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


new ClientHandler({url: "https://reqres.in/api/users"})
    .fire({parallel: false, fireDesc: "users fetch"})
    .then((res) => {
        console.log("all users fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler({url: "https://reqres.in/api/users/2"})
    .fire({parallel: false, fireDesc: "user 2 fetch"})
    .then(res => {
        console.log("user 2 fetched");
    })
    .catch(err => {
        console.log(err);
    })


new ClientHandler("https://reqres.in/api/users/3")
    .setClient(fetch.bind(window))  // fetch works only on browser
    .setHook(HOOKS.BEFORE_RESOLVE, res => res.json()) // get result and return the data property
    .fire({parallel: true, fireDesc: "user 3 fetch"})
    .then(res => {
        console.log("user 3 fetched ==> this service was parallel");
    })
    .catch(err => {
        console.log(err);
    })
```

This is the console result of the above example:
```bash
+ ADDED: 1__glmag
* FIRED: 1__glmag [type: pending]
+ ADDED: 2__bgvrg
+ ADDED: 3__8jlr8
* FIRED: 3__8jlr8 [type: parallel]
=== after success ===>>  users fetch
- REMOVED: 1__glmag
* FIRED: 2__bgvrg [type: pending]
users fetched
=== after success ===>>  user 3 fetch
- REMOVED: 3__8jlr8
user 3 fetched ==> this service was parallel
=== after success ===>>  user 2 fetch
- REMOVED: 2__bgvrg
user 2 fetched

```
There are three wrapped services, and each has its unique id in the queue but ID starts with the real position index
 in the queue. As you can see above, all services added to the queue on its turn. When the first service added,
  it fires because it’s first of the queue too.
  
The second service will add to the queue after the first one, but it’s not parallel, so it must wait until it turns.
After the second, the third one, the only parallel service should add to the queue. It fires immediately when added to 
the queue because it’s parallel.
When all added, the first one resolves and removes from the queue, and the second service that is pending should fire.
Each of the services will remove from the queue after done. 

Also, there are three of `=== after success ===` in the result, since we set the `AFTER_SUCCESS` hook on the `ServiceWrapper`, 
it executed for all three services. As you can see, all you send as `fireOptions` to the `fire` method is 
 accessible in hooks as second parameter. 

### Tips
 * To use the `fetch` as your client function, you need to send the bound version of it as like `fetch.bind(window)`.
 * The `fireOptions` that you pass to the `fire` method is accessible in the hook methods as the second parameter.
 * The wrapper itself is promise base but the `client` function doesn't need to be a promise.

### Contributing
I would be grateful to those who helped me make the project truly perfect. So, feel free to contribute to the project.

### License

[MIT](https://github.com/behnamazimi/js-service-wrapper/blob/master/LICENSE)