import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request}: LoaderFunctionArgs) {
  const {origin} = new URL(request.url);

  // 検索結果とページネーション/並び替えのパラメータ付きURLはクロールさせない。
  // （同じ商品が何通りものURLで見えてしまい、クロール予算が無駄になるため）
  const body = `User-agent: *
Disallow: /cart
Disallow: /account
Disallow: /api/
Disallow: /search
Disallow: /*?cursor=
Disallow: /*?*cursor=
Disallow: /*?sort=
Disallow: /*?*sort=
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'max-age=86400',
    },
  });
}
