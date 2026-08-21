import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {defer} from '@shopify/remix-oxygen';
import {getBrandConfig} from '~/lib/brand.server';
import appStyles from '~/styles/app.css?url';
import Layout from '~/components/Layout';
import {useState} from 'react';

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
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body
        style={{
          backgroundColor: '#0D0D0D',
          color: '#E8E8E8',
          padding: '2rem',
          fontFamily: 'monospace',
        }}
      >
        <h1>エラーが発生しました</h1>
        <p>ページの読み込み中にエラーが発生しました。</p>
        <Scripts />
      </body>
    </html>
  );
}
