# Collective Service Wrapper

Sometimes you need to pass your service functions throw a shared pipe and call some actions on all of them. Or maybe you want to add all of your services to a queue that supports parallel and pending tasks. 

Needs that I mentioned above are common especially when you are using an http-request client like [**axios**](https://github.com/axios/axios), [**fetch**](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), or [**superagent**](https://github.com/visionmedia/superagent). Lots of the fetching could fire in the same time and if you want to check a common situation for all of them it could be very frustrating.

In these conditions, you can use **Collective Service Wrapper**. A promise based service wrapper with queue support that works on browsers and NodeJS environment.

### Install

Using npm:
```
npm install collective-service-wrapper
```

Using yarn:
```
npm install collective-service-wrapper
```

### Getting Started

First of all you need to import it in your project.
```javascript
const {ServiceWrapper, ClientWrapper, HOOKS} = require("collective-service-wrapper");
```

`ServiceWrapper` is the main object of our util. You need to initialize. it's enough to init it once in your project.
```javascript
ServiceWrapper
    .init({
        client: axios,
        queue: true,
        queueLogs: true,
    })
```
The client that you set on the `ServiceWrapper` will be call inside the `ClientWrapper`, and it will return a promise.
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
        .setHook(HOOKS.BEFORE_RESOLVE, res => res.data) // get result and return the data property
        .setHook(HOOKS.AFTER_SUCCESS, res => {
            // this method will call on all successes.
            console.log(res);
        });
```

There are six pre-defined hooks that we can set them to the `ServiceWrapper` or on each `ClientWrapper`s to affect the services.
 1. `HOOKS.BEFORE_FIRE` calls before client service calling, but this hook is not async, and the fire will not wait for this. 
 2. `HOOKS.BEFORE_RESOLVE` calls when the service client promise is resolving, and the value that it returns will send as the resolve parameter.
 3. `HOOKS.BEFORE_REJECT` calls when the service client promise is rejecting, and the value that it returns will send as the reject parameter.
 4. `HOOKS.AFTER_SUCCESS` calls exactly before the resolve and this is not async to.  
 5. `HOOKS.AFTER_FAIL` calls exactly before the reject and this is not async to.  
 6. `HOOKS.UPDATE_REQUEST_CONFIG` with this hook we can update the request config before fire.
 

