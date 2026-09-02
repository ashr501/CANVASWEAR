import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getBrandConfig} from '~/lib/brand.server';

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

  const urls = [
    {loc: origin, priority: '1.0'},
    {loc: `${origin}/products`, priority: '0.8'},
    {loc: `${origin}/videos`, priority: '0.5'},
    ...brand.nav.map((n) => ({
      loc: `${origin}/collections/${n.handle}`,
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
