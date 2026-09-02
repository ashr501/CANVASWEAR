import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  useRouteLoaderData,
  isRouteErrorResponse,
} from '@remix-run/react';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {defer} from '@shopify/remix-oxygen';
import {getBrandConfig} from '~/lib/brand.server';
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

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  const cart = context.cart.get();

  // storeDomain / storefrontApiToken はブラウザに渡さない
  return defer({
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
      googleFonts: brand.theme.googleFonts,
    },
    cart,
  });
}

export default function App() {
  const {brand, cart} = useLoaderData<typeof loader>();
  const [cartOpen, setCartOpen] = useState(false);
  const nonce = useNonce();

  return (
    <html lang="ja" data-brand={brand.id} data-ui={brand.uiMode}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={brand.googleFonts} />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout
          brand={brand}
          cart={cart}
          cartOpen={cartOpen}
          onCartOpen={() => setCartOpen(true)}
          onCartClose={() => setCartOpen(false)}
        >
          <Outlet context={{brand, onCartOpen: () => setCartOpen(true)}} />
        </Layout>
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
