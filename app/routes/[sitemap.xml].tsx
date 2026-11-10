import type {LoaderFunctionArgs} from 'react-router';
import {getBrandConfig} from '~/lib/brand.server';
import {NEWS_LIST_QUERY, SHOPIFY_PAGE_QUERY} from '~/lib/queries';
import {staticPageHandles} from './pages.$handle';
import {policyHandles} from './policies.$handle';

const MAX_PAGES = 6; // 250件 x 6 = 1500件までカバー

const SITEMAP_PRODUCTS_QUERY = `#graphql
  query SitemapProducts($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      products(first: $first, after: $after) {
        nodes {
          handle
          updatedAt
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function loader({request, context}: LoaderFunctionArgs) {
  const {origin} = new URL(request.url);
  const brand = getBrandConfig(context.env, request);

  // 他ブランドの商品を含む店舗全体のsitemapではなく、
  // このブランドの custom-print コレクションだけをスキャンする
  const products: Array<{handle: string; updatedAt: string}> = [];
  let after: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const data: any = await context.storefront.query(SITEMAP_PRODUCTS_QUERY, {
      variables: {handle: brand.collections.all, first: 250, after},
      cache: context.storefront.CacheCustom({
        mode: 'public',
        maxAge: 600,
        staleWhileRevalidate: 3600,
      }),
    });
    const connection = data?.collection?.products;
    if (!connection) break;
    products.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  const locale = context.storefront.i18n;
  const [news, printGuide] = await Promise.all([
    brand.newsBlog
      ? context.storefront.query(NEWS_LIST_QUERY, {
          variables: {blog: brand.newsBlog, country: locale.country, language: locale.language},
          cache: context.storefront.CacheShort(),
        })
      : null,
    brand.id === 'custom-print'
      ? context.storefront.query(SHOPIFY_PAGE_QUERY, {
          variables: {handle: 'print-data-guide', country: locale.country, language: locale.language},
          cache: context.storefront.CacheShort(),
        }).catch(() => null)
      : null,
  ]);
  const articles: Array<{handle: string}> = news?.blog?.articles?.nodes ?? [];
  const collections = new Set([...brand.nav.map(({handle}) => handle), brand.collections.all]);
  const contentPaths = [
    ...staticPageHandles.map((handle) => `/pages/${handle}`),
    ...policyHandles.map((handle) => `/policies/${handle}`),
    '/faq',
    ...(printGuide?.page ? ['/pages/print-data-guide'] : []),
    ...(brand.newsBlog
      ? ['/news', ...articles.map(({handle}) => `/news/${encodeURIComponent(handle)}`)]
      : []),
  ];

  const urls = [
    {loc: origin, priority: '1.0'},
    {loc: `${origin}/products`, priority: '0.8'},
    {loc: `${origin}/videos`, priority: '0.5'},
    ...contentPaths.map((path) => ({loc: `${origin}${path}`, priority: '0.5'})),
    ...Array.from(collections, (handle) => ({
      loc: `${origin}/collections/${handle}`,
      priority: '0.7',
    })),
    ...products.map((p) => ({
      loc: `${origin}/products/${p.handle}`,
      lastmod: p.updatedAt,
      priority: '0.6',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u: any) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600',
    },
  });
}
