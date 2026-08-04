import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {COLLECTION_QUERY} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';
import {isBoldBrand} from '~/lib/brands';

export const meta = () => [{title: '商品一覧'}];

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);

  // 1つのShopifyストアを複数サイトで共有しているので、そのブランドの商品だけを
  // 含むコレクション（brands.ts の collections.all）を一覧の母集合にする。
  // 並び順はShopify側のコレクション設定に従う。
  const products = context.storefront.query(COLLECTION_QUERY, {
    variables: {
      handle: brand.collections.all,
      first: 24,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  return defer({products, brandId: brand.id, copy: brand.copy});
}

export default function ProductsIndex() {
  const {products, brandId, copy} = useLoaderData<typeof loader>();
  const isAvantGarde = isBoldBrand(brandId);

  return (
    <div className="section-pad">
      <div className="container-brand">
        {/* ページタイトル */}
        <div
          className="mb-12 pb-8"
          style={isAvantGarde ? {borderBottom: '1px solid var(--color-border)'} : {}}
        >
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{color: isAvantGarde ? 'var(--color-accent)' : 'var(--color-primary)'}}
          >
            {copy.allItemsEyebrow}
          </p>
          <h1
            className={clsx(
              'text-display-lg',
              isAvantGarde ? 'tracking-[0.1em] uppercase' : 'italic',
            )}
            style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
          >
            {copy.allItemsHeading}
          </h1>
        </div>

        {/* 商品グリッド */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <Await resolve={products}>
            {(data: any) => {
              const items = data?.collection?.products?.nodes ?? [];
              if (items.length === 0) {
                return (
                  <div className="text-center py-24">
                    <p
                      className="text-sm tracking-widest"
                      style={{color: 'var(--color-text-muted)'}}
                    >
                      {copy.empty}
                    </p>
                  </div>
                );
              }
              return (
                <div className="product-grid">
                  {items.map((product: any) => (
                    <ProductCard key={product.id} product={product} brandId={brandId} />
                  ))}
                </div>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="product-grid">
      {Array.from({length: 12}).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div
            className="aspect-[3/4] mb-3"
            style={{backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius)'}}
          />
          <div
            className="h-4 rounded mb-2 w-3/4"
            style={{backgroundColor: 'var(--color-border)'}}
          />
          <div
            className="h-3 rounded w-1/2"
            style={{backgroundColor: 'var(--color-border)'}}
          />
        </div>
      ))}
    </div>
  );
}
