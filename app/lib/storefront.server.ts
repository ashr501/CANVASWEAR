import {
  Cache,
  type CacheInstance,
  createShopifyRequestContext,
  createStorefrontClient,
} from '@shopify/hydrogen';
import {getBrandConfig} from '~/lib/brand.server';
import {
  I18N,
  storefrontClientContext,
  type LegacyStorefront,
  type RequestStorefrontClient,
} from '~/lib/storefront';

/**
 * Shopifyが購入者の判定（不正アクセス対策）に使うIP。
 * Oxygenでは oxygen-buyer-ip が必ず付く。ローカル開発時だけ 127.0.0.1 にする。
 */
function getBuyerIp(headers: Headers): string {
  for (const header of ['oxygen-buyer-ip', 'cf-connecting-ip', 'x-forwarded-for']) {
    const ip = headers.get(header)?.split(',')[0]?.trim();
    if (ip) return ip;
  }
  if (process.env.NODE_ENV !== 'production') return '127.0.0.1';
  throw new Error('No buyer IP header on the request');
}

export function createRequestStorefrontClient(
  request: Request,
  env: Env,
  cache: CacheInstance,
  waitUntil: ExecutionContext['waitUntil'],
): RequestStorefrontClient {
  const brand = getBrandConfig(env, request);

  // 本番（Oxygen）は非公開トークンが自動で入る。ローカル開発で公開トークンしか無いときは公開クライアントで同じストアを読む
  if (!env.PRIVATE_STOREFRONT_API_TOKEN) {
    return createStorefrontClient({
      type: 'public',
      requestContext: createShopifyRequestContext({request, i18n: I18N}),
      config: {
        storeDomain: brand.storeDomain,
        publicStorefrontToken: brand.storefrontApiToken,
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        cache,
        waitUntil,
      },
    }) as unknown as RequestStorefrontClient;
  }

  return createStorefrontClient({
    type: 'private',
    requestContext: createShopifyRequestContext({
      request,
      i18n: I18N,
      buyerIp: getBuyerIp(request.headers),
    }),
    config: {
      storeDomain: brand.storeDomain,
      privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
      storefrontId: env.PUBLIC_STOREFRONT_ID,
      cache,
      waitUntil,
    },
  }) as RequestStorefrontClient;
}

/**
 * 新しいクライアントは {data, errors} を返すので、ここでdataだけを取り出し、
 * データが無いエラーは例外にする（旧版と同じ挙動）。
 * 旧版は既定でキャッシュしていたが新版はしないため、指定が無ければ短めのキャッシュを付ける。
 */
export function createLegacyStorefront(context: {
  get(key: typeof storefrontClientContext): RequestStorefrontClient;
}): LegacyStorefront {
  return {
    i18n: I18N,
    async query(query, options = {}) {
      const {country: _c, language: _l, ...variables} = (options.variables ?? {}) as Record<
        string,
        unknown
      >;
      // ミドルウェアがリクエストごとに作ったクライアントを、使う時点で取り出す
      const client = context.get(storefrontClientContext);
      const result = await (client.graphql as any)(query, {
        variables,
        cache: options.cache ?? Cache.short(),
      });
      if (result.errors?.length && !result.data) {
        throw new Error(result.errors.map((e: {message: string}) => e.message).join('\n'));
      }
      return result.data;
    },
    CacheShort: (options) => Cache.short(options),
    CacheLong: (options) => Cache.long(options),
    CacheNone: () => Cache.none(),
    CacheCustom: (options) => Cache(options),
  };
}
