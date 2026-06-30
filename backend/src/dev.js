import "dotenv/config";
import { Elysia } from "elysia";
import { node } from "@elysiajs/node";
import { app } from "./app.js";

new Elysia({
  adapter: node(),
})
.use(app)
.listen(3001);

console.log(
  "API running at http://localhost:3001/api"
);