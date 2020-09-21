import { Duck, Router } from "./mod.ts";

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