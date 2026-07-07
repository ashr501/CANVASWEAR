import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {COLLECTION_QUERY} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';

export const meta = ({data}: any) => [
  {title: data?.collection?.title ?? 'コレクション'},
];

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  const brand = getBrandConfig(context.env, request);

  const collection = await context.storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      first: 24,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  if (!collection.collection) throw new Response('Not found', {status: 404});

  return defer({collection: collection.collection, brandId: brand.id});
}

export default function CollectionPage() {
  const {collection, brandId} = useLoaderData<typeof loader>();
  const isAvantGarde = brandId === 'avant-garde';

  return (
    <div>
      {/* コレクションヘッダー */}
      <div
        className="py-16 md:py-24"
        style={
          isAvantGarde
            ? {borderBottom: '1px solid var(--color-border)'}
            : {backgroundColor: 'var(--color-surface)'}
        }
      >
        <div className="container-brand">
          <p
            className="text-xs tracking-widest uppercase mb-3"
            style={{color: isAvantGarde ? 'var(--color-accent)' : 'var(--color-primary)'}}
          >
            COLLECTION
          </p>
          <h1
            className={clsx(
              'text-display-lg',
              isAvantGarde ? 'tracking-[0.08em] uppercase' : 'italic',
            )}
            style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
          >
            {collection.title}
          </h1>
          {collection.description && (
            <p
              className="mt-4 text-sm leading-loose max-w-xl"
              style={{color: 'var(--color-text-muted)'}}
            >
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* 商品グリッド */}
      <div className="section-pad">
        <div className="container-brand">
          {collection.products.nodes.length === 0 ? (
            <div className="text-center py-24">
              <p
                className="text-sm tracking-widest"
                style={{color: 'var(--color-text-muted)'}}
              >
                {isAvantGarde ? 'NO PRODUCTS FOUND' : '商品がありません'}
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {collection.products.nodes.map((product: any) => (
                <ProductCard key={product.id} product={product} brandId={brandId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
