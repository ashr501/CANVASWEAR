/// <reference types="@shopify/remix-oxygen" />
/// <reference types="@shopify/oxygen-workers-types" />

import type {HydrogenCart, HydrogenSessionData, Storefront} from '@shopify/hydrogen';
import type {HydrogenSession} from '~/lib/session.server';

declare global {
  const __remix_build: string;

  interface Env {
    SESSION_SECRET: string;
    PUBLIC_STOREFRONT_API_TOKEN: string;
    PRIVATE_STOREFRONT_API_TOKEN: string;
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STOREFRONT_ID: string;
    BRAND_ID: 'elegant-plus' | 'avant-garde';
    // Brand 1
    BRAND1_STORE_DOMAIN: string;
    BRAND1_STOREFRONT_API_TOKEN: string;
    // Brand 2
    BRAND2_STORE_DOMAIN: string;
    BRAND2_STOREFRONT_API_TOKEN: string;
  }
}

declare module '*.css?url' {
  const url: string;
  export default url;
}

declare module '@shopify/remix-oxygen' {
  interface AppLoadContext {
    env: Env;
    cart: HydrogenCart;
    storefront: Storefront;
    session: HydrogenSession;
    waitUntil: ExecutionContext['waitUntil'];
  }

  interface SessionData extends HydrogenSessionData {}
}
