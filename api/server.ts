// Vercelサーバーレス関数のエントリーポイント。
// 静的ファイルはVercel CDN（dist/client）が配信し、残りの全リクエストが
// vercel.json の rewrites 経由でここに届く。
import {installGlobals} from '@remix-run/node';
import {createRequestHandler} from '@remix-run/express';
import type {ServerBuild} from '@remix-run/node';
import express from 'express';
import {
  createStorefrontClient,
  createCartHandler,
  cartGetIdDefault,
  cartSetIdDefault,
  InMemoryCache,
} from '@shopify/hydrogen';
import {HydrogenSession} from '../app/lib/session.server';
import {FALLBACK_STORE} from '../app/lib/brands.config';
// @ts-ignore -- buildCommand(remix vite:build)が生成する成果物。型定義はない
import * as remixBuild from '../dist/server/index.js';

installGlobals();

// ウォームスタート間で共有されるインメモリキャッシュ（Storefront APIレスポンス用）
const cache = new InMemoryCache();

function getEnv(): Env {
  const p = process.env;
  return {
    SESSION_SECRET: p.SESSION_SECRET ?? 'preview-only-session-secret',
    PUBLIC_STOREFRONT_API_TOKEN:
      p.PUBLIC_STOREFRONT_API_TOKEN ?? FALLBACK_STORE.publicStorefrontToken,
    PRIVATE_STOREFRONT_API_TOKEN: p.PRIVATE_STOREFRONT_API_TOKEN ?? '',
    PUBLIC_STORE_DOMAIN: p.PUBLIC_STORE_DOMAIN ?? FALLBACK_STORE.storeDomain,
    PUBLIC_STOREFRONT_ID: p.PUBLIC_STOREFRONT_ID ?? '',
    BRAND_ID: (p.BRAND_ID as Env['BRAND_ID']) ?? 'elegant-plus',
    BRAND1_STORE_DOMAIN: p.BRAND1_STORE_DOMAIN ?? '',
    BRAND1_STOREFRONT_API_TOKEN: p.BRAND1_STOREFRONT_API_TOKEN ?? '',
    BRAND2_STORE_DOMAIN: p.BRAND2_STORE_DOMAIN ?? '',
    BRAND2_STOREFRONT_API_TOKEN: p.BRAND2_STOREFRONT_API_TOKEN ?? '',
  };
}

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

// プレビュー用ブランド切り替え: ?brand=avant-garde をCookieに保存して遷移後も維持
app.use((req, res, next) => {
  const brand = req.query.brand;
  if (brand === 'elegant-plus' || brand === 'avant-garde') {
    res.setHeader(
      'Set-Cookie',
      `brand=${brand}; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  }
  next();
});

// ストア設定が全く無い場合の案内（フォールバックが未記入のままデプロイされた場合）
app.use((req, res, next) => {
  const env = getEnv();
  if (
    env.PUBLIC_STORE_DOMAIN.includes('REPLACE_ME') ||
    env.PUBLIC_STOREFRONT_API_TOKEN.includes('REPLACE_ME')
  ) {
    res
      .status(503)
      .type('text/plain; charset=utf-8')
      .send(
        'ストア設定が未完了です。Vercelの環境変数 PUBLIC_STORE_DOMAIN / PUBLIC_STOREFRONT_API_TOKEN を設定するか、app/lib/brands.config.ts を更新してください。',
      );
    return;
  }
  next();
});

app.all(
  '*',
  createRequestHandler({
    build: remixBuild as unknown as ServerBuild,
    mode: process.env.NODE_ENV,
    async getLoadContext(req) {
      const env = getEnv();
      const cookie = req.get('cookie') ?? '';
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      const session = await HydrogenSession.init(
        new Request(url, {headers: {cookie}}),
        [env.SESSION_SECRET],
      );

      const {storefront} = createStorefrontClient({
        cache,
        i18n: {language: 'JA', country: 'JP'},
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN || undefined,
        storeDomain: env.PUBLIC_STORE_DOMAIN,
        storefrontId: env.PUBLIC_STOREFRONT_ID || undefined,
        storefrontHeaders: {
          requestGroupId: req.get('request-id') ?? null,
          buyerIp: req.get('x-forwarded-for') ?? null,
          buyerIpSig: null,
          cookie,
          purpose: req.get('purpose') ?? null,
        },
      });

      const cart = createCartHandler({
        storefront,
        getCartId: cartGetIdDefault(new Headers({cookie})),
        setCartId: cartSetIdDefault(),
      });

      return {
        session,
        storefront,
        cart,
        env,
        waitUntil: (promise: Promise<unknown>) => {
          void promise.catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error);
          });
        },
      } as any;
    },
  }),
);

// Vercelがappをラップするため app.listen は呼ばない
export default app;
