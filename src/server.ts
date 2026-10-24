import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { resolveStoreFromRequest } from "./lib/store-resolver";
import { serverStoreStorage } from "./lib/store-context.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

const KNOWN_CLOUDFLARE_SECRETS = [
  "NGENIUS_API_KEY",
  "NGENIUS_OUTLET_ID",
  "NGENIUS_MID",
  "NGENIUS_UAT_API_KEY",
  "NGENIUS_UAT_OUTLET_ID",
  "NGENIUS_UAT_MID",
  "NGENIUS_WEBHOOK_SECRET",
  "GENIUS_WEBHOOK_SECRET",
  "NGENIUS_LIVE_BASE",
  "EDFAPAY_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CARTAT_API_TOKEN",
  "CARTAT_ADMIN_PHONES",
  "CARTAT_ADMIN_PHONE",
];

function populateWorkerEnv(env: unknown) {
  if (!env || typeof env !== "object") return;
  (globalThis as any).__CF_RAW_ENV__ = env;
  const envObj = env as Record<string, unknown>;

  // 1. المتغيرات القابلة للدوران (Enumerable Vars)
  for (const [k, v] of Object.entries(envObj)) {
    if (v !== undefined && v !== null && (typeof v === "string" || typeof v === "number")) {
      const valStr = String(v).trim();
      process.env[k] = valStr;
      (globalThis as any)[k] = valStr;
    }
  }

  // 2. أسرار Cloudflare المشفرة (Non-enumerable Secrets)
  for (const key of KNOWN_CLOUDFLARE_SECRETS) {
    try {
      const val = (envObj as any)[key];
      if (val !== undefined && val !== null && val !== "") {
        const valStr = String(val).trim();
        process.env[key] = valStr;
        (globalThis as any)[key] = valStr;
      }
    } catch {}
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      populateWorkerEnv(env);

      // Resolve active store dynamically from the incoming request domain
      const resolvedStore = await resolveStoreFromRequest(request);

      const handler = await getServerEntry();
      
      // Run the request handler inside the isolated store context
      const rawResponse = await serverStoreStorage.run(resolvedStore, async () => {
        return await handler.fetch(request, env, ctx);
      });

      const response = await normalizeCatastrophicSsrResponse(rawResponse);

      // Attach tenant identification headers to response for transparency & debugging
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Store-ID", resolvedStore.id);
      newHeaders.set("X-Store-Slug", resolvedStore.slug);
      if (resolvedStore.domain) {
        newHeaders.set("X-Store-Domain", resolvedStore.domain);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
