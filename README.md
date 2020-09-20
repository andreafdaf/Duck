# Duck 🦆
This Project is inspired by https://github.com/artur-borys/lapis

## Example
```typescript
import { Duck, Router, DuckRequest, DuckResponse } from "https://raw.githubusercontent.com/EntenKoeniq/Duck/master/mod.ts";

const PORT = 3000;
const duck = new Duck();
const router = new Router("/api"); // http://localhost:3000/api/...

// Define a middleware
function logger(req: DuckRequest, res: DuckResponse, next: Function) {
  console.log(`Got a request: ${req.method} ${req.url}`);
  next();
}

const posts = [{ id: 1, userId: 1, content: "I love ducks 🦆"}];

// use middleware on duck instance (logging before route handling!)
duck.use(logger);

/* ===== GET ===== */
duck.get("/", (req, res, next) => {
   res.file("./index.html");
})

router.get("/posts", (req, res, next) => { // http://localhost:3000/api/posts
  res.send(posts);
});

router.get("/error", (req, res, next) => { // http://localhost:3000/api/error
  next(new Error("SomeError"));
});

/* ===== POST ===== */
router.post("/push", async (req, res, next) => {
    const newPost = {
        id: posts.length + 1,
        userId: Number(req.params.id),
        content: req.body.content
    };
    await posts.push(newPost);
    res.status(201).send(newPost);
});

// use created router
duck.use(router);

// use error middleware (at the end! IMPORTANT)
// error middleware has EXACTLY 4 parameters - very important
duck.use(async (error, req, res, next) => {
  if (error) return await res.send({ ok: false, error: error.message });
  next!();
});

// Finally, listen
duck.listen({ port: PORT }).then(() => {
  console.log(`Listening on ${PORT}`);
});
```
