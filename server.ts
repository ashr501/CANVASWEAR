import {createRequestHandler} from '@shopify/remix-oxygen';
import {storefrontRedirect} from '@shopify/hydrogen';
import {AppLoadContext} from '@remix-run/server-runtime';
import {createStorefrontClient, createCartHandler, cartGetIdDefault, cartSetIdDefault} from '@shopify/hydrogen';
import {HydrogenSession} from '~/lib/session.server';
import {getBrandConfig} from '~/lib/brand.server';
import {isBrandId} from '~/lib/brands';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const waitUntil = executionContext.waitUntil.bind(executionContext);
      const [cache, session] = await Promise.all([
        caches.open('hydrogen'),
        HydrogenSession.init(request, [env.SESSION_SECRET]),
      ]);

      // どのサイトとして応答するかを先に決める。
      // ブランドごとに別のShopifyストアを指せるよう、接続情報もここから取る
      // （将来ブランドを独立したストアに移すときは環境変数を変えるだけでよい）。
      const brand = getBrandConfig(env, request);

      const {storefront} = createStorefrontClient({
        cache,
        waitUntil,
        i18n: getLocaleFromRequest(request),
        publicStorefrontToken: brand.storefrontApiToken,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: brand.storeDomain,
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        storefrontHeaders: getStorefrontHeaders(request),
      });

      const cart = createCartHandler({
        storefront,
        getCartId: cartGetIdDefault(request.headers),
        setCartId: cartSetIdDefault(),
      });

      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext(): AppLoadContext {
          return {
            session,
            storefront,
            cart,
            env,
            waitUntil,
          };
        },
      });

      let response = await handleRequest(request);

      if (response.status === 404) {
        response = await storefrontRedirect({request, response, storefront});
      }

      return withBrandPreviewCookie(request, response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};

/**
 * プレビュー用ブランド切り替え。
 * `?brand=bridal` のように指定されたらCookieに保存し、ページ遷移しても維持する。
 * （1デプロイで全サイトを確認するための仕組み。本番は BRAND_ID で固定する）
 */
function withBrandPreviewCookie(request: Request, response: Response): Response {
  const brand = new URL(request.url).searchParams.get('brand');
  if (!isBrandId(brand)) return response;

  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `brand=${brand}; Path=/; Max-Age=31536000; SameSite=Lax`,
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getLocaleFromRequest(request: Request) {
  return {language: 'JA', country: 'JP'} as const;
}

function getStorefrontHeaders(request: Request) {
  const headers = request.headers;
  return {
    requestGroupId: headers.get('request-id'),
    buyerIp: headers.get('oxygen-buyer-ip'),
    buyerIpSig: headers.get('oxygen-buyer-ip-sig'),
    cookie: headers.get('cookie') ?? '',
    purpose: headers.get('purpose'),
  };
}

// Replaced at build time
declare const remixBuild: Parameters<typeof createRequestHandler>[0]['build'];
