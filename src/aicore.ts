import "dotenv/config";
import { log } from "./logger";

interface AICoreCreds {
  clientid: string;
  clientsecret: string;
  url: string;
  serviceurls: { AI_API_URL: string };
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function getCreds(): AICoreCreds {
  const raw = process.env.AICORE_CREDENTIALS;
  if (!raw) throw new Error("AICORE_CREDENTIALS env var not set");
  const creds = JSON.parse(raw) as AICoreCreds;
  log.info(`AI Core: clientid=${creds.clientid} apiUrl=${creds.serviceurls?.AI_API_URL}`);
  return creds;
}

async function getToken(creds: AICoreCreds): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const tokenUrl = `${creds.url}/oauth/token`;
  log.info(`AI Core: fetching token from ${tokenUrl}`);

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: creds.clientid,
      client_secret: creds.clientsecret,
    }).toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token fetch failed ${resp.status}: ${text}`);
  }

  const data = await resp.json() as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  log.ok(`AI Core: token acquired (expires in ${data.expires_in}s)`);
  return tokenCache.token;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chat(messages: Message[]): Promise<string> {
  const creds = getCreds();
  const deploymentUrl = process.env.AICORE_DEPLOYMENT_URL;
  if (!deploymentUrl) throw new Error("AICORE_DEPLOYMENT_URL env var not set");

  const resourceGroup = process.env.AICORE_RESOURCE_GROUP ?? "default";
  const token = await getToken(creds);
  const endpoint = `${deploymentUrl}/chat/completions?api-version=2024-10-21`;

  log.info(`AI Core: POST ${endpoint} (${messages.length} messages, resourceGroup=${resourceGroup})`);
  const t0 = Date.now();

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "ai-resource-group": resourceGroup,
    },
    body: JSON.stringify({ messages, max_tokens: 2000 }),
  });

  const ms = Date.now() - t0;

  if (!resp.ok) {
    const text = await resp.text();
    log.error(`AI Core: ${resp.status} after ${ms}ms — ${text}`);
    throw new Error(`AI Core error ${resp.status}: ${text}`);
  }

  const data = await resp.json() as { choices: { message: { content: string } }[] };
  const reply = data.choices[0].message.content;
  log.ok(`AI Core: response received in ${ms}ms (${reply.length} chars)`);
  return reply;
}
