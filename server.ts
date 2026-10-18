import {createRequestHandler, RouterContextProvider} from 'react-router';
// @ts-ignore -- React Routerがビルド時に生成する仮想モジュール
import * as serverBuild from 'virtual:react-router/server-build';
import {getBrandConfig} from '~/lib/brand.server';
import {isBrandId} from '~/lib/brands';
import {envContext} from '~/lib/env';
import {createLegacyStorefront} from '~/lib/storefront.server';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const method = request.method;
      if ((method === 'GET' || method === 'HEAD') && request.body) {
        return new Response(`${method} requests cannot have a body`, {status: 400});
      }

      // どのサイトとして応答するかを先に決める。
      // 必須の環境変数が欠けていると原因不明の500になるため、何を設定すればよいかを画面に出す。
      // Oxygenは PUBLIC_STOREFRONT_* / PRIVATE_STOREFRONT_API_TOKEN を自動注入するが SESSION_SECRET は注入しない。
      const brand = getBrandConfig(env, request);
      const missing: string[] = [];
      if (!env.SESSION_SECRET) missing.push('SESSION_SECRET');
      if (!brand.storeDomain) missing.push('PUBLIC_STORE_DOMAIN');
      if (!env.PRIVATE_STOREFRONT_API_TOKEN && !brand.storefrontApiToken) {
        missing.push('PRIVATE_STOREFRONT_API_TOKEN');
      }
      if (missing.length > 0) {
        return setupPage(missing, brand.name);
      }

      const routerContext = new RouterContextProvider();
      routerContext.cache = await caches.open('hydrogen-v1');
      routerContext.set(envContext, env);
      routerContext.env = env;
      routerContext.waitUntil = executionContext.waitUntil.bind(executionContext);
      // ストア接続はルートのミドルウェアで作られる。ローダーからは旧来どおり context.storefront で使う
      routerContext.storefront = createLegacyStorefront(routerContext);

      const handleRequest = createRequestHandler(serverBuild, process.env.NODE_ENV);
      const response = await handleRequest(request, routerContext as never);
      return withBrandPreviewCookie(request, response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      // 原因の切り分けができるよう、エラー内容を画面にも出す
      const detail = error instanceof Error ? error.message : String(error);
      return new Response(errorPage(detail), {
        status: 500,
        headers: {'content-type': 'text/html; charset=utf-8'},
      });
    }
  },
};

/** 必須の環境変数が未設定のときに出す案内ページ */
function setupPage(missing: string[], brandName: string): Response {
  const items = missing.map((name) => `<li><code>${name}</code></li>`).join('');

  return new Response(
    `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>設定があと少しです | ${brandName}</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#FFF;color:#141414;font-family:'Hiragino Sans','Noto Sans JP',sans-serif;padding:2rem}
.box{max-width:600px}
h1{font-size:1.5rem;margin:0 0 1rem}
p{color:#555;line-height:1.9;font-size:.95rem}
ul{background:#F7F7F5;padding:1rem 1rem 1rem 2.5rem;border-radius:8px}
li{margin:.4rem 0}
code{background:#EFEDE9;padding:.15em .45em;border-radius:4px;font-size:.9em}
.ok{color:#0A7B34}
</style></head><body><div class="box">
<h1>デプロイは成功しています ✅</h1>
<p>サイトは公開されました。あと<strong>環境変数の設定だけ</strong>が残っています。</p>
<p>不足している設定：</p>
<ul>${items}</ul>
<p><strong>設定する場所</strong><br>
Shopify管理画面 → Hydrogen → このストアフロント → 環境変数</p>
<p><code>SESSION_SECRET</code> には、推測されにくい長い文字列を入れてください
（例: 適当な英数字を30文字以上）。中身は何でも構いませんが、他人に教えないでください。</p>
<p>保存すると、このページは自動的に本来のサイトに切り替わります。</p>
</div></body></html>`,
    {status: 503, headers: {'content-type': 'text/html; charset=utf-8'}},
  );
}

/** 想定外のエラーを、原因が分かる形で表示する */
function errorPage(detail: string): string {
  const escaped = detail
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>エラーが発生しました</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#FFF;color:#141414;font-family:'Hiragino Sans','Noto Sans JP',sans-serif;padding:2rem}
.box{max-width:640px}
h1{font-size:1.4rem;margin:0 0 1rem}
p{color:#555;line-height:1.9;font-size:.95rem}
pre{background:#F7F7F5;padding:1rem;border-radius:8px;overflow-x:auto;font-size:.85rem;
white-space:pre-wrap;word-break:break-word}
</style></head><body><div class="box">
<h1>エラーが発生しました</h1>
<p>ページの読み込み中に問題が起きました。下の内容をそのまま伝えていただければ原因を特定できます。</p>
<pre>${escaped}</pre>
</div></body></html>`;
}

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

