import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';

// Storefront APIの shop.<policy> は個別フィールドなので、handleごとにクエリを出し分ける
const HANDLE_TO_QUERY: Record<string, string> = {
  'privacy-policy': `#graphql
    query { shop { policy: privacyPolicy { title body } } }
  `,
  'terms-of-service': `#graphql
    query { shop { policy: termsOfService { title body } } }
  `,
  'shipping-policy': `#graphql
    query { shop { policy: shippingPolicy { title body } } }
  `,
  'refund-policy': `#graphql
    query { shop { policy: refundPolicy { title body } } }
  `,
};

export const meta = ({data}: any) => {
  if (!data?.policy) return [{title: 'ポリシー'}];
  return getSeoMeta({title: data.policy.title, url: data.seoUrl});
};

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  const query = handle ? HANDLE_TO_QUERY[handle] : undefined;
  if (!query) throw new Response('Not found', {status: 404});

  const data = await context.storefront.query(query);
  if (!data.shop.policy) throw new Response('Not found', {status: 404});

  return defer({policy: data.shop.policy, seoUrl: request.url});
}

export default function PolicyPage() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="section-pad">
      <div className="container-brand max-w-2xl mx-auto">
        <h1
          className="text-display-md mb-10"
          style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
        >
          {policy.title}
        </h1>
        <div
          className="prose prose-sm max-w-none"
          style={{color: 'var(--color-text-muted)'}}
          dangerouslySetInnerHTML={{__html: policy.body}}
        />
      </div>
    </div>
  );
}
