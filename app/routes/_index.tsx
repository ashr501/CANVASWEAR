import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, useOutletContext, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {HOME_PRODUCTS_QUERY} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';

export const meta = () => [{title: 'ホーム'}];

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  const {storefront} = context;

  const products = storefront.query(HOME_PRODUCTS_QUERY, {
    variables: {
      country: storefront.i18n.country,
      language: storefront.i18n.language,
      featuredHandle: brand.collections.featured,
      newArrivalsHandle: brand.collections.newArrivals,
    },
  });

  return defer({products, brandId: brand.id, brand});
}

export default function Index() {
  const {products, brandId, brand} = useLoaderData<typeof loader>();
  const {onCartOpen} = useOutletContext<{onCartOpen: () => void}>();
  const isAvantGarde = brandId === 'avant-garde';

  return (
    <div>
      {/* ヒーロー */}
      <HeroSection brand={brand} isAvantGarde={isAvantGarde} />

      {/* フィーチャード商品 */}
      <section className="section-pad">
        <div className="container-brand">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-xs tracking-widest uppercase mb-2"
                style={{color: isAvantGarde ? 'var(--color-accent)' : 'var(--color-primary)'}}
              >
                {isAvantGarde ? 'SELECTION' : 'おすすめ'}
              </p>
              <h2
                className={clsx(
                  'text-display-md',
                  isAvantGarde ? 'tracking-[0.1em] uppercase' : 'italic',
                )}
                style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
              >
                {isAvantGarde ? 'FEATURED PIECES' : '注目のアイテム'}
              </h2>
            </div>
            <Link
              to="/collections/all"
              className="text-xs tracking-widest uppercase hidden md:block transition-opacity hover:opacity-60"
              style={{color: isAvantGarde ? 'var(--color-text-muted)' : 'var(--color-primary)'}}
            >
              {isAvantGarde ? 'VIEW ALL →' : 'すべて見る →'}
            </Link>
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <Await resolve={products}>
              {(data: any) => {
                const items = data?.featured?.products?.nodes ?? [];
                if (items.length === 0) return <EmptyState isAvantGarde={isAvantGarde} />;
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
      </section>

      {/* コンセプトバナー */}
      <ConceptSection brand={brand} isAvantGarde={isAvantGarde} />

      {/* 新着 */}
      <section className="section-pad">
        <div className="container-brand">
          <div className="mb-10">
            <p
              className="text-xs tracking-widest uppercase mb-2"
              style={{color: isAvantGarde ? 'var(--color-accent)' : 'var(--color-primary)'}}
            >
              {isAvantGarde ? 'NEW ARRIVALS' : '新着アイテム'}
            </p>
            <h2
              className={clsx(
                'text-display-md',
                isAvantGarde ? 'tracking-[0.1em] uppercase' : 'italic',
              )}
              style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
            >
              {isAvantGarde ? 'NEW IN' : '新着'}
            </h2>
          </div>

          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <Await resolve={products}>
              {(data: any) => {
                const items = data?.newArrivals?.products?.nodes ?? [];
                if (items.length === 0) return <EmptyState isAvantGarde={isAvantGarde} />;
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
      </section>
    </div>
  );
}

function HeroSection({brand, isAvantGarde}: {brand: any; isAvantGarde: boolean}) {
  return (
    <section
      className="relative min-h-[85vh] md:min-h-screen flex items-end overflow-hidden"
      style={{backgroundColor: isAvantGarde ? '#0D0D0D' : '#F0EBE3'}}
    >
      {/* 背景装飾 */}
      {isAvantGarde ? (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 39px, #E8E8E8 39px, #E8E8E8 40px)',
            }}
          />
          <div
            className="absolute top-0 right-0 w-px h-full"
            style={{backgroundColor: 'var(--color-border)'}}
          />
          <div
            className="absolute top-0 left-[40%] w-px h-full opacity-30"
            style={{backgroundColor: 'var(--color-border)'}}
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          <div
            className="absolute right-0 top-0 bottom-0 w-[55%] opacity-20"
            style={{
              background: 'radial-gradient(ellipse at right, #C9A96E 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      <div className="container-brand relative z-10 pb-16 md:pb-24">
        {isAvantGarde ? (
          <div className="max-w-3xl">
            <p
              className="text-xs tracking-[0.4em] uppercase mb-6"
              style={{color: 'var(--color-accent)'}}
            >
              NEW COLLECTION
            </p>
            <h1
              className="leading-none tracking-[0.05em] uppercase mb-8"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                color: 'var(--color-text)',
              }}
            >
              {brand.tagline.split(' ').map((word: string, i: number) => (
                <span key={i} className="block">
                  {word}
                </span>
              ))}
            </h1>
            <p
              className="text-sm tracking-widest max-w-md mb-10 leading-loose"
              style={{color: 'var(--color-text-muted)'}}
            >
              {brand.taglineJa}
            </p>
            <div className="flex items-center gap-6">
              <Link to="/collections/all" className="btn-primary">
                EXPLORE
              </Link>
              <Link to="/products" className="btn-outline">
                ALL ITEMS
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{fontFamily: 'var(--font-heading)', color: 'var(--color-primary)'}}
            >
              NEW ARRIVAL
            </p>
            <h1
              className="leading-[1.05] mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--color-text)',
              }}
            >
              {brand.tagline}
            </h1>
            <p
              className="text-sm leading-loose max-w-md mb-10"
              style={{fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)'}}
            >
              {brand.taglineJa}
            </p>
            <div className="flex items-center gap-6">
              <Link to="/collections/all" className="btn-primary">
                コレクションを見る
              </Link>
              <Link to="/products" className="btn-outline">
                すべての商品
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ConceptSection({brand, isAvantGarde}: {brand: any; isAvantGarde: boolean}) {
  return (
    <section
      className="section-pad"
      style={{backgroundColor: isAvantGarde ? 'var(--color-surface)' : '#F0EBE3'}}
    >
      <div className="container-brand">
        <div className={clsx('max-w-2xl', isAvantGarde ? 'mx-auto text-center' : '')}>
          {isAvantGarde ? (
            <>
              <div
                className="w-16 h-px mx-auto mb-8"
                style={{backgroundColor: 'var(--color-accent)'}}
              />
              <h2
                className="text-4xl md:text-6xl tracking-[0.15em] uppercase mb-6"
                style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
              >
                OUR PHILOSOPHY
              </h2>
              <p
                className="leading-loose tracking-wide text-sm md:text-base"
                style={{color: 'var(--color-text-muted)'}}
              >
                {brand.taglineJa}
                <br />
                <br />
                年齢や体型に関係なく、ファッションは自己表現の手段。
                私たちは、独自のスタイルを持つ大人のための服を作ります。
              </p>
              <div
                className="w-16 h-px mx-auto mt-8"
                style={{backgroundColor: 'var(--color-accent)'}}
              />
            </>
          ) : (
            <>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-4"
                style={{fontFamily: 'var(--font-heading)', color: 'var(--color-primary)'}}
              >
                OUR STORY
              </p>
              <h2
                className="text-3xl md:text-5xl mb-6 italic"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 300,
                  color: 'var(--color-text)',
                }}
              >
                すべての体型に
                <br />
                美しい羽織を
              </h2>
              <p
                className="text-sm leading-loose mb-8"
                style={{fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)'}}
              >
                プラスサイズの女性のための、上質な羽織物のコレクション。
                エレガントなデザインと日本の美意識を融合させ、
                あなたの美しさを引き立てるアイテムをお届けします。
              </p>
              <Link to="/pages/about" className="btn-outline">
                ブランドについて
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductGridSkeleton({count = 6}: {count?: number}) {
  return (
    <div className="product-grid">
      {Array.from({length: count}).map((_, i) => (
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

function EmptyState({isAvantGarde}: {isAvantGarde: boolean}) {
  return (
    <div className="text-center py-16">
      <p
        className="text-sm tracking-widest"
        style={{color: 'var(--color-text-muted)'}}
      >
        {isAvantGarde ? 'NO PRODUCTS FOUND' : '商品がありません'}
      </p>
    </div>
  );
}
