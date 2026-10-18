import type {CachingStrategy, RequestScopedPrivateStorefrontClient, ShopifyRequestContext, CacheOptions} from '@shopify/hydrogen';
import {createContext} from 'react-router';

type StorefrontCallOptions = {cache?: CachingStrategy};
export type RequestStorefrontClient = RequestScopedPrivateStorefrontClient<StorefrontCallOptions>;

/** サイトは日本向けのみ。$country / $language はクライアントが自動で差し込む */
export const I18N = {country: 'JP', language: 'JA'} as const;

export const storefrontClientContext = createContext<RequestStorefrontClient>();
export const storefrontRequestContext = createContext<ShopifyRequestContext>();

/**
 * 旧Hydrogenの `context.storefront.query()` と同じ形で使える問い合わせ口（作るのは storefront.server.ts）。
 */
export type LegacyStorefront = {
  i18n: typeof I18N;
  query<T = any>(
    query: string,
    options?: {variables?: Record<string, unknown>; cache?: CachingStrategy},
  ): Promise<T>;
  CacheShort: (options?: CacheOptions) => CachingStrategy;
  CacheLong: (options?: CacheOptions) => CachingStrategy;
  CacheNone: () => CachingStrategy;
  CacheCustom: (options: CacheOptions) => CachingStrategy;
};
