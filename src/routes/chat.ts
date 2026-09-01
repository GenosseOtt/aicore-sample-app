import { Router, Request, Response } from "express";
import { chat, Message } from "../aicore";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
  const { messages } = req.body as { messages: Message[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  try {
    const reply = await chat(messages);
    res.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
