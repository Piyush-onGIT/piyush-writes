---
title: Concurrent request handling of ExpressJS
description: An in-depth details of ExpressJS uses NodeJS environment to handle concurrent requests.
date: 2026-02-05
---

In this article, you will learn about how ExpressJS handles concurrent requests with just one single thread. I will go deep into the engineering level to answer all your questions. I will be answering some common doubts that I also faced while understanding the architecture. Just get along with the blog and you will learn the in-depth details of ExpressJS or NodeJS, as ExpressJS framework uses NodeJS runtime environment.

Take a close look at this API (hope you don't get carried away as you scroll down)

```js
app.get("/users", async (req, res) => {
  console.log("Start");

  const user = await db.getUsers();   // takes 2 seconds

  console.log("End", req.id);
  res.json(user);
});

app.get("/health", async (req, res) => {
  console.log("health check passed");
});
```

This API is a GET request which just returns all the users stored in the DB. When you will call this API, one-by-one or concurrently, it will always respond you almost simultaneously. But ExpressJS uses NodeJS under the hood, and NodeJS is a single-threaded JS runtime environment, so how does it do that?


Let's add a small change in the above API:
```js
app.get("/users", (req, res) => {
  console.log("Start");

  const user = db.getUsers();   // takes 2 seconds

  console.log("End", req.id);
  res.json(user);
});
```

Let's try to learn through an example:
```bash
t = 0; req 'A' /users comes
		prints "Start" in the console.
		reads from the DB.             -> Important point (DB Calls will always take more time than usual.)
		
t = 1; req 'B' /health comes
		runtime is blocked as req 'A' is doing DB read.
		req 'B' is blocked.
```

But if we use async/await:
```bash
t = 0; req 'A' /users comes
		prints "Start" in the console.
		reads from the DB.             -> Important point (DB Calls will always take more time than usual.)
		Node sees 'await' here, so it will process it later(soon you will know how.)
		Rest of the things will be processed later. Handler is unblocked now.
		
t = 1; req 'B' /health comes
		prints "health check passed" in the console.
		req 'B' is unblocked.

t = 2; db read finishes
		Node will now process the remaining parts of req 'A'.
```

Now let's think of some questions and try to answer them one by one:

1. What if both the requests 'A' and 'B' come for /users only?

	Request 'A' comes and hits the await and now it will be processed later and it will not block the main thread. So req 'B' will not be blocked because of 'A'.

### Closer look on how these requests are actually processed

When the code hits await, JS converts the remaining part of the code like this:
```js
db.getUsers().then((user) => {
  console.log("End", req.id);
  res.json(user);
});
```
That `then(...)` callback is the **paused remainder** of your function. That callback must be stored somewhere.

#### Where is it stored?

Inside the **Promise object** returned by `db.getUsers()`.

More precisely:

> In the Promise’s internal **reaction list** (callback list).

The JS engine, V8 manages this list.

#### Memory layout at the moment of `await`

When `await` happens:
1. V8 creates a **closure** containing:
    - `req`
    - `res`
    - local variables
    - the remaining code after `await`
2. This closure is attached to the Promise as:
	PromiseReaction / FulfillmentHandler
	PromiseReaction is the list of all the functions which are going to be executed later, and those functions are called FulfillmentHandler. Example:
```javascript
Promise (returned by db.getUsers)
    └── PromiseReaction
          └── FulfillmentHandler (this function)
  
function fulfillmentHandler(user) {
  console.log("End", req.id);
  res.json(user);
}
```

3. Call stack is cleared.

So the paused function lives **inside heap memory**, referenced by the Promise.

#### Now who will handle the db call?

This is the key part.
`db.getUsers()` is **I/O** (network/database). Node does **NOT** do this on the main thread. It hands it to **libuv**.

Note:

libuv is the C library under Node.js that handles async I/O.
It has:
- OS async APIs (epoll/kqueue/IOCP)
- A **thread pool** (default size: 4)

So basically, node handles these types of call to the respective library who is responsible for the corresponding task that the API wants to do.

*At this point of time, I might have thrown a lot of new terms to you, but let's summarize the flow of execution till this point.*

### Flow
1. Request comes
2. JS pushes the handler into the call stack(which you will read about later in this blog), hits `await` while execution.
3. V8 passes the control to libuv for I/O, creates a closure(as defined above) and stores the promise returned by `db.getUsers()`.
4. DB reply → OS → libuv
5. libuv resolves the Promise
6. V8 sees Promise resolved, takes the stored callback (the paused function) and push it into the **Microtask Queue**(explained later, for now just think of it as a `task queue`).
9. V8 picks the tasks from the queue, and the handler is back in the call stack for execution.

### Microtask Queue (very important)

This queue is also inside V8.
It stores:
- Promise `.then` callbacks
- `await` continuations

After every event loop phase, Node asks V8:

> Do you have microtasks?

V8 says: “Yes — resume this function.”
And the handler function is back in the call stack and it will now get executed.

### Call Stack

JavaScript has **one call stack** and only one handler can be here at a time.
When req 'A' comes, stack becomes:
```bash
| handler(A) |
```

When it hits `await`, it is popped out from the call stack, so the stack becomes:
```bash
|   EMPTY   |
```

This is the key moment.
A is not running.  
A is not on the stack.  
A is stored in memory as a **paused continuation**.

Similarly things will happen when req 'B' comes.

#### Where are A and B?

In something like this (conceptually):
```bash
Waiting List (Event Loop memory):

- Resume handler(A) after dbCall
- Resume handler(B) after dbCall
```

Now, go according to the [flow](#flow), when DB finishes for A, handler(A) will come back in the stack and same goes for req 'B'. These functions get pushed and popped from the stack very fast as if they are running almost parallely.

One question might come into you mind:

**What if req 'A' has to do a lot of work (no I/O, or CPU intensive) which may take 1-2s, then what if req 'B' also comes at the same time as 'A'? As the call stack can have only one handler in it, how this case will be handled?**

So, I will put it in a simple way, handler(A) is currently there in the stack, so handler(B) can't be pushed in, so this request will be waiting in the event queue.
Visual explanation:
```bash
A: [ line1 line2 line3 line4 line5 await ]
B: ------waiting in the queue------[ line1 line2 line3 await ]

A: [ sync work ............ ][ await .... ]
B: [ ------waiting--------- ][ sync work  ] [ await .... ]

```
But usually these type of works(from line1 till line5) finish in a very small amount of time.

How JS ensures that there is only one handler in the call stack?

For this you need to visualize how an event loop looks like:
```js
while (true) {
  if (callStack is empty) {
    take next callback from queue
    push it to stack
    run it
  }
}
```


Event queue:
```bash
Event Queue:
[ handler(A), handler(B), handler(C) ]
```

So, **does the call stack has to have exactly one function in it? Then why do we even use a call stack? And what if the handler is calling some other functions?**

Yes, stack has to have exactly one function in it, but with an important, precise wording.

> In a single Node.js main thread, **only one JavaScript execution context runs on the call stack at any instant.**

#### What “one function” really means

The call stack can have **many frames** (nested calls):
```js
handler()
  └─ service()
       └─ helper()
       
Call stack becomes:

| helper  |
| service |
| handler |

```

But this whole stack belongs to **one executing flow**. There is never a second, independent function executing alongside it. So that is why to maintain these function, we do need a call stack.

So, this was all for my first blog. I hope you really made something out of this.

\- Piyush
