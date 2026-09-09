import { AsyncLocalStorage } from "node:async_hooks";
import type { StoreInfo } from "./store-resolver";

/**
 * مخزن سياق المتجر في بيئة الخادم (Server Request Context)
 * -------------------------------------------------------------
 * يعتمد على AsyncLocalStorage المدعوم أصلياً في Cloudflare Workers
 * عبر compatibility_flags: ["nodejs_compat"].
 * يضمن عزل كل طلب (Request) عن الآخر حتى في بيئات المعالجة المتزامنة.
 */
export const serverStoreStorage = new AsyncLocalStorage<StoreInfo>();

export function getActiveServerStore(): StoreInfo | undefined {
  return serverStoreStorage.getStore();
}
