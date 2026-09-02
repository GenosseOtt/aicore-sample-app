import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import chatRouter from "./routes/chat";
import { log } from "./logger";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "ok";
    log[level](`${req.method} ${req.path} → ${status} (${ms}ms)`);
  });
  next();
});

app.use(express.json());
app.use("/api", chatRouter);

app.get("/api/config", (_req: Request, res: Response) => {
  res.json({ title: process.env.APP_TITLE || "SAP AI Core Demo" });
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.listen(port, () => {
  log.info(`AI Core demo app listening on http://localhost:${port}`);
});
