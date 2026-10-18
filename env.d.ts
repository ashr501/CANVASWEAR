/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />

import type {CacheInstance} from '@shopify/hydrogen';
import type {LegacyStorefront} from '~/lib/storefront';

type HydrogenRouterContext = {
  cache: CacheInstance;
  env: Env;
  waitUntil: ExecutionContext['waitUntil'];
  /** 旧Hydrogenの context.storefront と同じ書き方で使える問い合わせ口（app/lib/storefront.ts） */
  storefront: LegacyStorefront;
};

declare module 'react-router' {
  interface AppLoadContext extends HydrogenRouterContext {}
  interface RouterContextProvider extends HydrogenRouterContext {}
}

declare global {
  interface Env {
    SESSION_SECRET: string;
    PUBLIC_STOREFRONT_API_TOKEN: string;
    PRIVATE_STOREFRONT_API_TOKEN: string;
    PUBLIC_STORE_DOMAIN: string;
    PUBLIC_STOREFRONT_ID: string;
    /** app/lib/brands.ts の BrandId。どのサイトとして動かすかを決める */
    BRAND_ID: string;
    BRAND1_STORE_DOMAIN: string;
    BRAND1_STOREFRONT_API_TOKEN: string;
    BRAND2_STORE_DOMAIN: string;
    BRAND2_STOREFRONT_API_TOKEN: string;
    BRAND3_STORE_DOMAIN: string;
    BRAND3_STOREFRONT_API_TOKEN: string;
    BRAND4_STORE_DOMAIN: string;
    BRAND4_STOREFRONT_API_TOKEN: string;
    // Cloudflare R2: カスタムプリントの入稿ファイル保管先
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET: string;
    R2_PUBLIC_BASE_URL: string;
  }
}
