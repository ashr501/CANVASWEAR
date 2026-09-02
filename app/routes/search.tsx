import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, useOutletContext} from '@remix-run/react';
import {Suspense} from 'react';
import {Pagination, getPaginationVariables, getSeoMeta} from '@shopify/hydrogen';
import {SEARCH_PRODUCTS_QUERY} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import CategoryFilterChips from '~/components/CategoryFilterChips';
import SortSelect from '~/components/SortSelect';
import {getBrandConfig} from '~/lib/brand.server';
import {getSortVariables} from '~/lib/sort';
import type {PublicBrand} from '~/lib/brands';

export const meta = ({data}: any) =>
  getSeoMeta({title: data?.term ? `「${data.term}」の検索結果` : '検索'});

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  const url = new URL(request.url);
  const term = url.searchParams.get('q')?.trim() ?? '';
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  if (!term) {
    return defer({term, products: Promise.resolve({nodes: [], pageInfo: {}}), brandId: brand.id});
  }

  // このストアは他ブランドと共有されているため、custom-printブランドでは
  // タイトルに「カスタムプリント」を含む商品だけを検索対象にする
  const scope = brand.id === 'custom-print' ? " AND title:*カスタムプリント*" : '';
  const searchQuery = `(title:*${term}* OR tag:*${term}*)${scope}`;

  // 商品検索(products())のsortKeyはコレクション用と種類が異なり、
  // 既定値は COLLECTION_DEFAULT ではなく RELEVANCE を使う
  const sortParam = url.searchParams.get('sort');
  const sortVariables =
    sortParam && sortParam !== ''
      ? getSortVariables(sortParam)
      : {sortKey: 'RELEVANCE', reverse: false};

  const products = context.storefront.query(SEARCH_PRODUCTS_QUERY, {
    variables: {
      searchQuery,
      ...paginationVariables,
      ...sortVariables,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: context.storefront.CacheShort(),
  });

  return defer({term, products, brandId: brand.id});
}

export default function SearchPage() {
  const {term, products, brandId} = useLoaderData<typeof loader>();
  const {brand} = useOutletContext<{brand: PublicBrand}>();

  return (
    <div className="section-pad">
      <div className="container-brand">
        <div className="mb-12 pb-8" style={{borderBottom: '1px solid var(--color-border)'}}>
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{color: 'var(--color-primary)'}}
          >
            SEARCH
          </p>
          <h1
            className="text-display-lg italic"
            style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
          >
            {term ? `「${term}」の検索結果` : '検索'}
          </h1>
        </div>

        {!term ? (
          <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>
            キーワードを入力して検索してください。
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <CategoryFilterChips nav={brand.nav} />
              <SortSelect />
            </div>
            <Suspense fallback={null}>
            <Await resolve={products}>
              {(data: any) => {
                const connection = data?.products ?? data;
                return !connection?.nodes || connection.nodes.length === 0 ? (
                  <div className="text-center py-24">
                    <p className="text-sm tracking-widest" style={{color: 'var(--color-text-muted)'}}>
                      「{term}」に一致する商品が見つかりませんでした
                    </p>
                  </div>
                ) : (
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
          </>
        )}
      </div>
    </div>
  );
}
