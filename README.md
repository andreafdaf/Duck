# Duck 🦆
This Project is inspired by https://github.com/artur-borys/lapis

## Run
```
deno run --allow-net --allow-read xxx.ts
```

## Example
```typescript
import { Duck, Router } from "https://raw.githubusercontent.com/EntenKoeniq/Duck/master/mod.ts";

const PORT = 3000,
      posts = [{ id: 1, userId: 1, content: "I love ducks 🦆"}],
      duck = new Duck(),
      router = new Router("/api"); // http://localhost:3000/api/...

duck.use(Duck.logger);
duck.use(Duck.cookies);

/* ===== GET ===== */
duck.get("/", (req, res) => {
   res.file("./index.html");

   if (req.cookies?.has("cookieExample")) console.log(`Cookies: ${req.cookies?.get("cookieExample")}`);
   else req.cookies?.set({ name: "cookieExample", value: "cookieValue"});
})

router.get("/posts", (req, res) => { // http://localhost:3000/api/posts
  res.send(posts);
});

router.get("/get/:id", (req, res) => { // http://localhost:3000/api/get/1
  let post = posts.find((candidate) => candidate.id === Number(req.params.id));

  if (!post) return res.status(404).send("Post not found!");

  res.send(post);
});

router.get("/error", (req, res, next) => { // http://localhost:3000/api/error
  next(new Error("SomeError"));
});

/* ===== POST ===== */
router.post("/push", async (req, res) => {
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
