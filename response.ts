import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.69.0/http/server.ts";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

export class DuckResponse {
  private request: ServerRequest;
  private response: Response;
  private sent: boolean = false;

  constructor(request: ServerRequest) {
    this.request = request;
    this.response = {
      status: 200,
      headers: new Headers(),
    };
  }

  send(data?: string | object) {
    if (this.sent) return console.warn("Response has been already sent, cancelling");
    
    this.sent = true;
    if (data) {
      if (typeof data === "object") {
        data = JSON.stringify(data);
        this.response.headers?.set("Content-Type", "application/json");
      } else {
        this.response.headers?.set("Content-Type", "text/plain");
      }
      this.response.body = data;
    }
    this.request.respond(this.response);
  }

  status(status: number) {
    this.response.status = status;
    return this;
  }

  async file(filePath: string) {
    try {
      const contentType: any = await lookup(filePath);
      this.response.headers?.set("Content-Type", contentType);
      this.response.body = await Deno.open(filePath);
      this.request.respond(this.response);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) return console.error(`File not found: ${filePath}`);
  
      console.error(e);
    }
  }

  get headers(): Headers {
    return this.response.headers!;
  }
}
