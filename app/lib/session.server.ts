import {createCookieSessionStorage} from '@shopify/remix-oxygen';
import type {HydrogenSessionData} from '@shopify/hydrogen';

type SessionData = HydrogenSessionData;
type FlashData = {error: string};

export class HydrogenSession {
  #sessionStorage;
  #session;

  constructor(
    sessionStorage: ReturnType<typeof createCookieSessionStorage>,
    session: Awaited<ReturnType<ReturnType<typeof createCookieSessionStorage>['getSession']>>,
  ) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets,
      },
    });

    const session = await storage.getSession(request.headers.get('Cookie'));
    return new HydrogenSession(storage, session);
  }

  get has() {
    return this.#session.has.bind(this.#session);
  }

  get get() {
    return this.#session.get.bind(this.#session);
  }

  get flash() {
    return this.#session.flash.bind(this.#session);
  }

  get unset() {
    return this.#session.unset.bind(this.#session);
  }

  get set() {
    return this.#session.set.bind(this.#session);
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    return this.#sessionStorage.commitSession(this.#session);
  }
}
