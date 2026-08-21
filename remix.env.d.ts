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
    /** app/lib/brands.ts の BrandId。どのサイトとして動かすかを決める */
    BRAND_ID: string;
    // Brand 1: HAORI+ (elegant-plus)
    BRAND1_STORE_DOMAIN: string;
    BRAND1_STOREFRONT_API_TOKEN: string;
    // Brand 2: NOCT. (avant-garde)
    BRAND2_STORE_DOMAIN: string;
    BRAND2_STOREFRONT_API_TOKEN: string;
    // Brand 3: BRILLAR (bridal)
    BRAND3_STORE_DOMAIN: string;
    BRAND3_STOREFRONT_API_TOKEN: string;
    // Brand 4: INKWEAR (custom-print)
    BRAND4_STORE_DOMAIN: string;
    BRAND4_STOREFRONT_API_TOKEN: string;
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
