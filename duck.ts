import { serve, HTTPOptions, Server } from "https://deno.land/std@0.70.0/http/server.ts";
import { DuckResponse } from "./response.ts";
import { DuckRequest } from "./request.ts";
import { Router } from "./router.ts";
import { Middleware, ErrorMiddlewareFunction, MiddlewareFunction } from "./middleware.ts";
import { CookieJar } from "./cookie_jar.ts";

export class Duck extends Router {
  port?: number;
  hostname?: string;
  certFile?: string;
  keyFile?: string;
  server?: Server;

  private async run() {
    if (this.server) {
      for await (const request of this.server!) {
        let res = new DuckResponse(request);
        const req = new DuckRequest(request);
        await req.parseBody();
        // get middlewares that match the request
        let matchingMiddlewares = Middleware.findMatching(this.middlewares, req);
        // create functions which take optional error parameter and call middleware
        const middlewaresToRun = matchingMiddlewares.map((middleware, i) =>
          (error?: Error): any => {
            middleware.setParams(req);
            // if there are no more defined middlewares, fallback to the default one
            let next = middlewaresToRun[i + 1]
              ? middlewaresToRun[i + 1]
              : ((error?: any) =>
                error
                  ? this.defaultErrorHandler(error, req, res)
                  : this.defaultHandler(req, res));
            // there can either be an error or not
            if (!error) {
              if (middleware.handler.length === 4) return next();
              
              return (middleware.handler as MiddlewareFunction)(req, res, next);
            }

            // if this middleware is an error handler - ok
            if (middleware.handler.length === 4) return (middleware.handler as ErrorMiddlewareFunction)(error, req, res, next);

            // if not, call the next middleware wrapper (hopefully it will recursively reach an error handler)
            return next(error);
          }
        );
        try {
          if (middlewaresToRun.length === 0) return this.defaultHandler(req, res);
          middlewaresToRun[0]();
        } catch (err) {
          this.defaultErrorHandler(err, req, res);
        }
      }
    }
  }

  private defaultHandler(req: DuckRequest, res: DuckResponse) {
    res.status(404).send({ code: 404, message: `Cannot ${req.method} ${req.url}` });
  }

  private defaultErrorHandler(
    err: any,
    req: DuckRequest,
    res: DuckResponse,
  ) {
    console.error(err);
    res.status(500).send({ ok: false });
  }

  /**
   * Starts an http server with given options
   * @param {HTTPOptions} options - options for server instance 
  */
  listen(options: HTTPOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = serve(options);
        this.run();
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Currently not implemented - will be in the future
  */
  listenTLS() {
    throw new Error("NotImplemented");
  }

  /**
   * Middleware that adds cookies to request and response
   * @see CookieJar
   * @param {DuckRequest} req 
   * @param {DuckResponse} res 
   * @param {Function} next 
  */
  static cookies(req: DuckRequest, res: DuckResponse, next: Function) {
    const cookieJar = new CookieJar(req, res);
    req.cookies = cookieJar;
    res.cookies = cookieJar;
    next();
  }

  static async logger(req: DuckRequest, res: DuckResponse, next: Function) {
    await next();
    if (!res) return console.log(req.method, req.url);
    if (req.error) console.error(req.error + "");
    console.log(`Got a request from ${req.remoteAddr.hostname}: [${res.gStatus}] ${req.method} ${req.url}`);
  }
}
