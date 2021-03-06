import { ServerRequest } from "https://deno.land/std@0.70.0/http/server.ts";
import { CookieJar } from "./cookie_jar.ts";

export interface QueryOrParams {
  [name: string]: string | string[];
}

export class DuckRequest {
  private request: ServerRequest;
  private _body?: any;
  private _query: QueryOrParams;
  private _params: QueryOrParams = {};
  cookies?: CookieJar;
  error?: any;

  constructor(request: ServerRequest) {
    this.request = request;
    this._query = {};
    this.parseQuery();
  }

  /**
   * Returns request parameters. It is an object containing params in string format
   * Example:
   * route /api/user/:id
   * request /api/user/123 - req.params = { id: "123" }
   */
  get params() {
    return this._params;
  }

  /**
   * sets request params (/user/:id etc.)
   * Probably should be private and parameters should be set from withing request - TODO
   */
  set params(value) {
    this._params = value;
  }

  private parseQuery() {
    try {
      const parts = this.request.url.split("?");
      if (parts[1]) {
        const queryString = parts[1];
        const queryParams = queryString.split("&");
        queryParams.forEach((param) => {
          const parts = param.split("=");
          const name = parts[0];
          const value = parts[1];
          if (this._query[name]) {
            if (Array.isArray(this._query[name])) return (this._query[name] as string[]).push(value);
            return this._query[name] = [(this.query[name] as string), value];
          } 
          this._query[name] = value;
        });
      }
    } catch (e) { this.error = e.message; }
  }

  /**
   * Returns query params. An object containing param names as keys and strings/array of strings as values
   * Example:
   * request - /api/furniture?color=red&color=blue&type=chair
   * req.query = { color: [ "red", "blue" ], type: "chair" }
   */
  get query() {
    return this._query;
  }

  /**
   * THIS METHOD IS AUTOMATICALLY CALLED ON EVERY REQUEST
   * Tries to parse request's body.
   * Currently supporting plain text and JSON.
   * Request must have Content-Type header present.
   * If it's not, or MIME is different than text/plain or application/json
   * request body will remain default, with is Deno.Reader
   */
  async parseBody() {
    try {
      if (this.headers.has("Content-Type")) {
        const contentType = this.headers.get("Content-Type");
        const bodyRaw = await Deno.readAll(this.request.body);
        const body = new TextDecoder("utf-8").decode(bodyRaw);
        if (contentType === "application/json") return this._body = JSON.parse(body.toString());
        if (contentType === "text/plain") return this._body = body;
      }
      this._body = this.request.body;
    } catch (e) { this.error = e.message; }
  }

  get headers() {
    return this.request.headers;
  }

  get url() {
    return this.request.url;
  }

  get method() {
    return this.request.method;
  }

  get body() {
    return this._body;
  }

  get contentLength() {
    return this.request.contentLength;
  }

  get remoteAddr() {
    // I think it is safe to assume that it will always be NetAddr, not UnixAddr
    return this.request.conn.remoteAddr as Deno.NetAddr;
  }
}
