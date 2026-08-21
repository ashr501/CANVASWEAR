import {
  BRANDS,
  DEFAULT_BRAND_ID,
  isBrandId,
  type BrandDefinition,
  type BrandId,
} from './brands';

export type {BrandId, BrandTheme, BrandDefinition} from './brands';
export {getCssVarsString} from './brands';

/** ブランド定義に、環境変数から読んだストア接続情報を足したもの */
export interface BrandConfig extends BrandDefinition {
  storeDomain: string;
  storefrontApiToken: string;
}

/**
 * ブランドの解決順序:
 * 1. クエリパラメータ `?brand=` （プレビュー用。api/server.tsがCookieに保存する）
 * 2. Cookie `brand=`
 * 3. ホスト名が hostMatches に一致（独自ドメイン運用時の自動判定）
 * 4. 環境変数 BRAND_ID（本番の正式な指定方法）
 * 5. DEFAULT_BRAND_ID
 */
export function resolveBrandId(env: Env, request?: Request): BrandId {
  if (request) {
    const url = new URL(request.url);

    const fromQuery = url.searchParams.get('brand');
    if (isBrandId(fromQuery)) return fromQuery;

    const cookie = request.headers.get('cookie') ?? '';
    const fromCookie = cookie.match(/(?:^|;\s*)brand=([^;]+)/)?.[1];
    if (isBrandId(fromCookie)) return fromCookie;

    const hostname = url.hostname.toLowerCase();
    for (const brand of Object.values(BRANDS)) {
      if (brand.hostMatches.some((needle) => hostname.includes(needle))) {
        return brand.id;
      }
    }
  }

  if (isBrandId(env.BRAND_ID)) return env.BRAND_ID;
  return DEFAULT_BRAND_ID;
}

export function getBrandConfig(env: Env, request?: Request): BrandConfig {
  const definition = BRANDS[resolveBrandId(env, request)];
  const vars = env as unknown as Record<string, string | undefined>;

  return {
    ...definition,
    storeDomain:
      vars[`${definition.envPrefix}_STORE_DOMAIN`] || env.PUBLIC_STORE_DOMAIN,
    storefrontApiToken:
      vars[`${definition.envPrefix}_STOREFRONT_API_TOKEN`] ||
      env.PUBLIC_STOREFRONT_API_TOKEN,
  };
}
