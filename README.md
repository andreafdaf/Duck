# Duck
This Project is inspired by https://github.com/artur-borys/lapis

## Example
```typescript
import { Duck, Router, DuckRequest, DuckResponse } from "./mod.ts";

const PORT = 3000;
const duck = new Duck();
const router = new Router("/api");

// Define a middleware
function logger(req: DuckRequest, res: DuckResponse, next: Function) {
  console.log(`Got a request: ${req.method} ${req.url}`);
  next();
}

const users = [{ id: 1 }];
const posts = [{ id: 1, userId: 1, content: "I love ducks 🦆"}];

// use middleware on duck instance (logging before route handling!)
duck.use(logger);

// Define some routes
router.get("/user/:id", (req, res, next) => {
  const user = users.find((user) => {
    return user.id === Number(req.params.id);
  });
  res.send(user);
});

router.get("/user/:id/posts", (req, res, next) => {
  const _posts = posts.filter((post) => {
    return post.userId === Number(req.params.id);
  });
  res.send(_posts);
});

router.post("/user/:id/post", (req, res, next) => {
  const newPost = {
    id: posts.length + 1,
    userId: Number(req.params.id),
    content: req.body.content,
  };
  posts.push(newPost);
  res.status(201).send(newPost);
});

router.get("/posts", (req, res, next) => {
  res.send(posts);
});

router.get("/error", (req, res, next) => {
  next(new Error("SomeError"));
});

// use created router
duck.use(router);

// use error middleware (at the end! IMPORTANT)
// error middleware has EXACTLY 4 parameters - very important
duck.use((error, req, res, next) => {
  if (error) return res.send({ ok: false, error: error.message });
  next!();
});

// Finally, listen
duck.listen({ port: PORT }).then(() => {
  console.log(`Listening on ${PORT}`);
});
```