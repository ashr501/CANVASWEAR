import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request}: LoaderFunctionArgs) {
  const {origin} = new URL(request.url);

  const body = `User-agent: *
Disallow: /cart
Disallow: /account
Disallow: /api/
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
