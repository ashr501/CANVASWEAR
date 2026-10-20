import {handleShopifyRedirects, handleShopifyRoutes} from '@shopify/hydrogen';
import {ShopifyScripts} from '@shopify/hydrogen/react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useRouteError,
  useRouteLoaderData,
  type LoaderFunctionArgs,
  type MiddlewareFunction,
} from 'react-router';
import {CartAnalyticsTracker, PageViewedTracker} from '~/components/AnalyticsTrackers';
import {getBrandConfig} from '~/lib/brand.server';
import {CartProvider} from '~/lib/cart';
import {cartHandlers} from '~/lib/cart-handlers';
import {envContext} from '~/lib/env';
import {routeTemplates} from '~/lib/route-templates';
import {createEphemeralSessionManager} from '~/lib/session';
import {createRequestStorefrontClient} from '~/lib/storefront.server';
import {I18N, storefrontClientContext, storefrontRequestContext} from '~/lib/storefront';
import appStyles from '~/styles/app.css?url';
import Layout from '~/components/Layout';
import {useState} from 'react';
import {useNonce} from '~/lib/nonce-context';

export function links() {
  return [
    {rel: 'stylesheet', href: appStyles},
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous' as const,
    },
  ];
}

/**
 * すべてのリクエストの入口。Shopifyのストア接続を作り、
 * Shopifyが受け持つURL（/api/cart・チェックアウト・Shopifyのスクリプト用の中継など）は
 * ここで返す。それ以外は各ページの処理に進む。
 */
export const middleware: MiddlewareFunction<Response>[] = [
  async ({context, request}, next) => {
    const env = context.get(envContext);
    const storefrontClient = createRequestStorefrontClient(
      request,
      env,
      context.cache,
      context.waitUntil,
    );
    const requestContext = storefrontClient.requestContext;
    const sessionManager = createEphemeralSessionManager(request);

    const shopifyRoute = handleShopifyRoutes({
      request,
      requestContext,
      sessionManager,
      storefrontClient,
      routeTemplates,
      handlers: [cartHandlers],
    });
    if (shopifyRoute) return shopifyRoute;

    context.set(storefrontClientContext, storefrontClient);
    context.set(storefrontRequestContext, requestContext);

    const response = await next();
    const sessionHeaders = new Headers((await sessionManager.commit?.()) ?? undefined);
    for (const [name, value] of sessionHeaders) response.headers.append(name, value);
    if (response.status === 404) {
      const redirect = await handleShopifyRedirects({request, storefrontClient, routeTemplates});
      if (redirect) return redirect;
    }
    requestContext.applyResponseHeaders(response.headers);
    return response;
  },
];

const SHOP_QUERY = `#graphql
  query RootShop {
    shop {
      id
      paymentSettings {
        currencyCode
      }
    }
  }
`;

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  const storefrontClient = context.get(storefrontClientContext);
  const [cartResult, shopData] = await Promise.all([
    cartHandlers.get({storefrontClient, request}),
    context.storefront.query(SHOP_QUERY, {cache: context.storefront.CacheLong()}),
  ]);
  const storefrontId = context.env.PUBLIC_STOREFRONT_ID ?? '';

  // storeDomain / storefrontApiToken はブラウザに渡さない
  return {
    cartData: cartResult.data,
    origin: new URL(request.url).origin,
    shopify: {
      shop: {shopId: shopData.shop.id as string, storefrontId, myshopifyDomain: brand.storeDomain},
      currency: (shopData.shop.paymentSettings?.currencyCode as string) ?? 'JPY',
      channel: storefrontId ? ('hydrogen' as const) : ('headless' as const),
    },
    brand: {
      id: brand.id,
      name: brand.name,
      nameJa: brand.nameJa,
      tagline: brand.tagline,
      taglineJa: brand.taglineJa,
      uiMode: brand.uiMode,
      heroLayout: brand.heroLayout,
      heroHeading: brand.heroHeading,
      heroBody: brand.heroBody,
      nav: brand.nav,
      copy: brand.copy,
      concept: brand.concept,
      collections: brand.collections,
      newsBlog: brand.newsBlog,
      expressFinishing: brand.expressFinishing,
      googleFonts: brand.theme.googleFonts,
    },
  };
}

export default function App() {
  const {brand, cartData, shopify, origin} = useLoaderData<typeof loader>();
  const [cartOpen, setCartOpen] = useState(false);
  const nonce = useNonce();
  const navigate = useNavigate();

  return (
    <html lang="ja" data-brand={brand.id} data-ui={brand.uiMode}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={brand.googleFonts} />
        <ShopifyScripts
          nonce={nonce}
          i18n={{...I18N, currency: shopify.currency}}
          shop={shopify.shop}
          analytics={{channel: shopify.channel}}
          shopifyAnalytics={shopify.shop.storefrontId !== ''}
          consent={{mode: 'default-banner'}}
          inbox
          navigate={navigate}
          routes={routeTemplates}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <CartProvider initialData={cartData}>
          <PageViewedTracker />
          <CartAnalyticsTracker />
          <Layout
            brand={brand}
            cartOpen={cartOpen}
            onCartOpen={() => setCartOpen(true)}
            onCartClose={() => setCartOpen(false)}
          >
            <Outlet context={{brand, onCartOpen: () => setCartOpen(true)}} />
          </Layout>
          {/* Shopify Inbox（AIチャット・スタッフへの引き継ぎ）。右下にボタンが出る */}
          {/* チャットの言語を日本語にする（Alo Loreのテーマと同じ指定） */}
          <shopify-store store-domain={origin} country="JP" language="ja" suppressHydrationWarning />
          <shopify-chat suppressHydrationWarning />
        </CartProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const nonce = useNonce();
  const error = useRouteError();
  const rootData = useRouteLoaderData<typeof loader>('root');
  const brand = rootData?.brand;
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <html lang="ja" data-brand={brand?.id} data-ui={brand?.uiMode}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {brand?.googleFonts && <link rel="stylesheet" href={brand.googleFonts} />}
        <Meta />
        <Links />
      </head>
      <body style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            fontFamily: 'var(--font-body)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              marginBottom: '1rem',
              color: 'var(--color-text)',
            }}
          >
            {is404 ? 'ページが見つかりません' : 'エラーが発生しました'}
          </h1>
          <p
            className="text-sm"
            style={{color: 'var(--color-text-muted)', marginBottom: '2rem'}}
          >
            {is404
              ? 'お探しのページは存在しないか、移動した可能性があります。'
              : 'ページの読み込み中に問題が発生しました。しばらくしてから再度お試しください。'}
          </p>
          <a
            href="/"
            className="btn-primary"
            style={{textDecoration: 'none', display: 'inline-block'}}
          >
            トップページに戻る
          </a>
        </div>
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}
