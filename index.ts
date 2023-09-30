import "reflect-metadata";
import { delay } from "./utils";
import { limit } from "./rateLimiter";
import express from "express";

const app = express();
const port = 3000;

class Routes {
  @limit()
  static async slowRoute(req: express.Request, res: express.Response) {
    // Simulating a delay
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.send("This route is slow!");
  }

  @limit()
  static async rateLimitedRoute(req: express.Request, res: express.Response) {
    await delay(100);
    // res.send("Hello World!");
    return res.send("This route is rate limited!");
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/rate-limiter", Routes.rateLimitedRoute);
app.post("/rate-limiter2", Routes.slowRoute);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
