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
import {isBrandId} from '../app/lib/brands';
import {getBrandConfig} from '../app/lib/brand.server';
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
    BRAND3_STORE_DOMAIN: p.BRAND3_STORE_DOMAIN ?? '',
    BRAND3_STOREFRONT_API_TOKEN: p.BRAND3_STOREFRONT_API_TOKEN ?? '',
  };
}

const app = express();
app.set('trust proxy', true);
app.disable('x-powered-by');

// プレビュー用ブランド切り替え: ?brand=bridal をCookieに保存して遷移後も維持
app.use((req, res, next) => {
  const brand = req.query.brand;
  if (isBrandId(brand)) {
    res.setHeader(
      'Set-Cookie',
      `brand=${brand}; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  }
  next();
});

// Storefrontトークン未設定時の案内ページ（設定が済むと自動的に本来のサイトが表示される）
app.use((req, res, next) => {
  const env = getEnv();
  if (
    env.PUBLIC_STORE_DOMAIN.includes('REPLACE_ME') ||
    env.PUBLIC_STOREFRONT_API_TOKEN.includes('REPLACE_ME')
  ) {
    res.status(503).type('html').send(`<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>セットアップ中 | Multi-Site Storefront</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D0D0D;color:#E8E8E8;font-family:'Hiragino Sans','Noto Sans JP',sans-serif}
.box{max-width:560px;padding:3rem 2rem;text-align:center}
h1{font-size:1.4rem;letter-spacing:.3em;margin-bottom:1.5rem}
p{color:#808080;font-size:.9rem;line-height:2}
code{background:#1A1A1A;padding:.2em .5em;border-radius:3px;color:#C9A96E}
.line{width:48px;height:1px;background:#CC0000;margin:2rem auto}
</style></head><body><div class="box">
<h1>BRILLAR / HAORI+ / NOCT.</h1>
<div class="line"></div>
<p>デプロイは成功しています。<br>
あとはShopifyの <strong>Storefront APIトークン</strong> を設定すると<br>
ショップが表示されます。</p>
<p>設定方法: Vercelの環境変数<br><code>PUBLIC_STOREFRONT_API_TOKEN</code> を追加<br>
または <code>app/lib/brands.config.ts</code> を更新</p>
<p>トークン設定後も商品が出ない場合は、Shopifyで<br>
商品とコレクションを<strong>カスタムアプリの販売チャネルに公開</strong><br>
できているか確認してください。</p>
</div></body></html>`);
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

      const incoming = new Request(url, {headers: {cookie}});
      const session = await HydrogenSession.init(incoming, [env.SESSION_SECRET]);

      // ブランドごとに別のShopifyストアを指せるよう、接続情報はブランドから取る
      // （server.ts のOxygen版と同じ挙動にそろえている）
      const brand = getBrandConfig(env, incoming);

      const {storefront} = createStorefrontClient({
        cache,
        i18n: {language: 'JA', country: 'JP'},
        publicStorefrontToken: brand.storefrontApiToken,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN || undefined,
        storeDomain: brand.storeDomain,
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
