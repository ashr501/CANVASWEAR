import type {WritableCustomerSessionManager} from '@shopify/hydrogen/customer-account';

/** 会員ログインを使わないので、リクエストごとのメモリ上のセッションで足りる（カートIDはCookieで持つ） */
export function createEphemeralSessionManager(request: Request): WritableCustomerSessionManager {
  const data = new Map<string, unknown>();
  const origin = new URL(request.url).origin;
  return {
    getSessionOrigin: () => origin,
    getSessionItem: (key) => data.get(key),
    setSessionItem: (key, value) => {
      data.set(key, value);
    },
    removeSessionItem: (key) => {
      data.delete(key);
    },
  };
}
