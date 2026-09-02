import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, useOutletContext} from '@remix-run/react';
import {Suspense} from 'react';
import {Pagination, getPaginationVariables, getSeoMeta} from '@shopify/hydrogen';
import {COLLECTION_QUERY} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import CategoryFilterChips from '~/components/CategoryFilterChips';
import SortSelect from '~/components/SortSelect';
import {getBrandConfig} from '~/lib/brand.server';
import {getSortVariables} from '~/lib/sort';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

export const meta = ({data}: any) =>
  getSeoMeta({title: '商品一覧', url: data?.seoUrl});

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});
  const sortVariables = getSortVariables(new URL(request.url).searchParams.get('sort'));

  // 1つのShopifyストアを複数サイトで共有しているので、そのブランドの商品だけを
  // 含むコレクション（brands.ts の collections.all）を一覧の母集合にする。
  const products = context.storefront.query(COLLECTION_QUERY, {
    variables: {
      handle: brand.collections.all,
      ...paginationVariables,
      ...sortVariables,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: context.storefront.CacheShort(),
  });

  return defer({products, brandId: brand.id, copy: brand.copy, seoUrl: request.url});
}

export default function ProductsIndex() {
  const {products, brandId, copy} = useLoaderData<typeof loader>();
  const {brand} = useOutletContext<{brand: PublicBrand}>();
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

        {/* カテゴリ絞り込み・並び替え */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <CategoryFilterChips nav={brand.nav} />
          <SortSelect />
        </div>

        {/* 商品グリッド */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <Await resolve={products}>
            {(data: any) => {
              const connection = data?.collection?.products;
              if (!connection || connection.nodes.length === 0) {
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
                <Pagination connection={connection}>
                  {({nodes, isLoading, PreviousLink, NextLink}) => (
                    <>
                      <div className="text-center mb-8">
                        <PreviousLink className="btn-outline">
                          {isLoading ? '読み込み中...' : '前を表示'}
                        </PreviousLink>
                      </div>
                      <div className="product-grid">
                        {nodes.map((product: any) => (
                          <ProductCard key={product.id} product={product} brandId={brandId} />
                        ))}
                      </div>
                      <div className="text-center mt-12">
                        <NextLink className="btn-outline">
                          {isLoading ? '読み込み中...' : 'もっと見る'}
                        </NextLink>
                      </div>
                    </>
                  )}
                </Pagination>
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
