import type {AppLoadContext, EntryContext} from '@shopify/remix-oxygen';
import {RemixServer} from '@remix-run/react';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';
import {NonceContext} from '~/lib/nonce-context';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  context: AppLoadContext,
) {
  // 入稿ファイル（R2）のプレビューを商品ページに表示するため、保管先の公開URLを画像の許可元に加える。
  // 環境変数から読むので、r2.dev から独自ドメインに切り替えても追従する。
  const uploadOrigin = originOrNull(context.env.R2_PUBLIC_BASE_URL);

  const {nonce, header} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_STORE_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    // LINE公式アカウントのQRコード画像（お問い合わせページ）を許可
    imgSrc: [
      "'self'",
      'data:',
      'https://cdn.shopify.com',
      'https://qr-official.line.me',
      ...(uploadOrigin ? [uploadOrigin] : []),
    ],
    // 商品動画は cdn.shopify.com ではなくストアのプライマリドメイン
    // (alolore.shop/cdn/shop/videos/...) から配信される。media-src を指定しないと
    // default-src にフォールバックしてブラウザにブロックされ、動画が再生できない。
    mediaSrc: ["'self'", 'https://cdn.shopify.com', 'https://alolore.shop'],
  });

  const body = await renderToReadableStream(
    <NonceContext.Provider value={nonce}>
      <RemixServer context={remixContext} url={request.url} nonce={nonce} />
    </NonceContext.Provider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        // eslint-disable-next-line no-console
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

function originOrNull(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
