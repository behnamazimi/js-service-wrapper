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
The client that you set on the `ServiceWrapper` will be call inside the `ClientWrapper`. 
Here is an example of wrapping. This code will call `axios` as client because we send it on `init` as the client value.
```javascript
new ClientWrapper("https://reqres.in/api/users")
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
