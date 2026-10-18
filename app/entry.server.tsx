import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {ServerRouter, type EntryContext, type RouterContextProvider} from 'react-router';
import {getBrandConfig} from '~/lib/brand.server';
import {createContentSecurityPolicy} from '~/lib/csp';
import {NonceContext} from '~/lib/nonce-context';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: RouterContextProvider,
) {
  const env = context.env;
  const {nonce, header} = createContentSecurityPolicy({
    storeDomain: getBrandConfig(env, request).storeDomain,
    // 入稿ファイル（R2）の保管先。r2.dev から独自ドメインに切り替えても追従する
    uploadOrigin: originOrNull(env.R2_PUBLIC_BASE_URL),
    isDev: process.env.NODE_ENV !== 'production',
  });

  const body = await renderToReadableStream(
    <NonceContext.Provider value={nonce}>
      <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
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
