import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, useOutletContext, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {HOME_PRODUCTS_QUERY} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

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

  // brandをそのまま返すとStorefrontトークンまでブラウザに渡ってしまうので、
  // 表示用のブランド情報はroot.tsxのoutlet contextから受け取る
  return defer({products, brandId: brand.id});
}

export default function Index() {
  const {products, brandId} = useLoaderData<typeof loader>();
  const {brand} = useOutletContext<{brand: PublicBrand; onCartOpen: () => void}>();
  const isAvantGarde = isBoldBrand(brandId);
  const copy = brand.copy;

  return (
    <div>
      {/* ヒーロー */}
      <HeroSection brand={brand} isAvantGarde={isAvantGarde} products={products} />

      {/* フィーチャード商品 */}
      <section className="section-pad">
        <div className="container-brand">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-xs tracking-widest uppercase mb-2"
                style={{color: isAvantGarde ? 'var(--color-accent)' : 'var(--color-primary)'}}
              >
                {copy.featuredEyebrow}
              </p>
              <h2
                className={clsx(
                  'text-display-md',
                  isAvantGarde ? 'tracking-[0.1em] uppercase' : 'italic',
                )}
                style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
              >
                {copy.featuredHeading}
              </h2>
            </div>
            <Link
              to={`/collections/${brand.collections.all}`}
              className="text-xs tracking-widest uppercase hidden md:block transition-opacity hover:opacity-60"
              style={{color: isAvantGarde ? 'var(--color-text-muted)' : 'var(--color-primary)'}}
            >
              {copy.viewAll}
            </Link>
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <Await resolve={products}>
              {(data: any) => {
                const items = data?.featured?.products?.nodes ?? [];
                if (items.length === 0) return <EmptyState label={copy.empty} />;
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
              {copy.newEyebrow}
            </p>
            <h2
              className={clsx(
                'text-display-md',
                isAvantGarde ? 'tracking-[0.1em] uppercase' : 'italic',
              )}
              style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
            >
              {copy.newHeading}
            </h2>
          </div>

          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <Await resolve={products}>
              {(data: any) => {
                const items = data?.newArrivals?.products?.nodes ?? [];
                if (items.length === 0) return <EmptyState label={copy.empty} />;
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

/** 右側に並べる商品カードの位置（%指定なので画面幅に追従する） */
const HERO_CARD_LAYOUT = [
  {left: '5%', top: '13%', rotate: '-5deg', zIndex: 1},
  {left: '31%', top: '25%', rotate: '3deg', zIndex: 2},
  {left: '57%', top: '9%', rotate: '7deg', zIndex: 1},
];

/**
 * 和文の見出しを主役にしたヒーロー。右側には実際の売り物を並べる。
 * 「何を売っている店か」を文字と現物の両方で伝えるための構成。
 */
function SplitHero({brand, products}: {brand: PublicBrand; products: any}) {
  return (
    <section
      className="relative overflow-hidden"
      style={{backgroundColor: 'var(--color-bg)'}}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 md:min-h-[72vh]">
        {/* コピー */}
        <div className="flex flex-col justify-center py-14 md:py-20 order-2 md:order-1">
          <div className="container-brand md:pr-16 md:max-w-[46rem] md:ml-auto md:mr-0 w-full">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-5"
              style={{fontFamily: 'var(--font-heading)', color: 'var(--color-accent)'}}
            >
              {brand.copy.heroEyebrow}
            </p>
            <h1
              className="mb-6"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(2rem, 4.4vw, 3.75rem)',
                fontWeight: 700,
                lineHeight: 1.28,
                letterSpacing: '-0.01em',
                color: 'var(--color-text)',
                textWrap: 'pretty',
              }}
            >
              {(brand.heroHeading ?? [brand.taglineJa]).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p
              className="text-sm leading-loose max-w-md mb-9"
              style={{fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)'}}
            >
              {brand.heroBody ?? brand.taglineJa}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={`/collections/${brand.collections.all}`}
                className="btn-primary"
              >
                {brand.copy.heroPrimaryCta}
              </Link>
              <Link to="/products" className="btn-outline">
                {brand.copy.heroSecondaryCta}
              </Link>
            </div>
          </div>
        </div>

        {/* 実際の商品 */}
        <div
          className="relative overflow-hidden min-h-[360px] md:min-h-full order-1 md:order-2"
          style={{backgroundColor: 'var(--color-hero-bg)'}}
        >
          <Suspense fallback={<HeroCardsSkeleton />}>
            <Await resolve={products}>
              {(data: any) => {
                const items = (data?.featured?.products?.nodes ?? []).slice(0, 3);
                if (items.length === 0) return <HeroCardsSkeleton />;
                return (
                  <div className="absolute inset-0">
                    {items.map((product: any, i: number) => {
                      const pos = HERO_CARD_LAYOUT[i];
                      return (
                        <Link
                          key={product.id}
                          to={`/products/${product.handle}`}
                          className="absolute block w-[34%] overflow-hidden transition-transform duration-500 hover:-translate-y-1"
                          style={{
                            left: pos.left,
                            top: pos.top,
                            zIndex: pos.zIndex,
                            aspectRatio: '3 / 4',
                            transform: `rotate(${pos.rotate})`,
                            borderRadius: 'var(--radius)',
                            boxShadow: '0 18px 40px rgba(20, 20, 20, 0.16)',
                            backgroundColor: 'var(--color-surface)',
                          }}
                        >
                          {product.featuredImage?.url && (
                            <img
                              src={product.featuredImage.url}
                              alt={product.featuredImage.altText ?? product.title}
                              className="w-full h-full object-cover"
                              loading="eager"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function HeroCardsSkeleton() {
  return (
    <div className="absolute inset-0">
      {HERO_CARD_LAYOUT.map((pos, i) => (
        <div
          key={i}
          className="absolute w-[34%] animate-pulse"
          style={{
            left: pos.left,
            top: pos.top,
            zIndex: pos.zIndex,
            aspectRatio: '3 / 4',
            transform: `rotate(${pos.rotate})`,
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-border)',
          }}
        />
      ))}
    </div>
  );
}

function HeroSection({
  brand,
  isAvantGarde,
  products,
}: {
  brand: PublicBrand;
  isAvantGarde: boolean;
  products: any;
}) {
  if (brand.heroLayout === 'split') {
    return <SplitHero brand={brand} products={products} />;
  }

  return (
    <section
      className="relative min-h-[85vh] md:min-h-screen flex items-end overflow-hidden"
      style={{backgroundColor: 'var(--color-hero-bg)'}}
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
              background:
                'radial-gradient(ellipse at right, var(--color-primary) 0%, transparent 70%)',
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
              {brand.copy.heroEyebrow}
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
              <Link
                to={`/collections/${brand.collections.all}`}
                className="btn-primary"
              >
                {brand.copy.heroPrimaryCta}
              </Link>
              <Link to="/products" className="btn-outline">
                {brand.copy.heroSecondaryCta}
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-6"
              style={{fontFamily: 'var(--font-heading)', color: 'var(--color-primary)'}}
            >
              {brand.copy.heroEyebrow}
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
              <Link
                to={`/collections/${brand.collections.all}`}
                className="btn-primary"
              >
                {brand.copy.heroPrimaryCta}
              </Link>
              <Link to="/products" className="btn-outline">
                {brand.copy.heroSecondaryCta}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ConceptSection({
  brand,
  isAvantGarde,
}: {
  brand: PublicBrand;
  isAvantGarde: boolean;
}) {
  const {eyebrow, heading, body} = brand.concept;

  return (
    <section
      className="section-pad"
      style={{
        backgroundColor: isAvantGarde ? 'var(--color-surface)' : 'var(--color-hero-bg)',
      }}
    >
      <div className="container-brand">
        <div className={clsx('max-w-2xl', isAvantGarde ? 'mx-auto text-center' : '')}>
          {isAvantGarde ? (
            <div
              className="w-16 h-px mx-auto mb-8"
              style={{backgroundColor: 'var(--color-accent)'}}
            />
          ) : (
            <p
              className="text-xs tracking-[0.3em] uppercase mb-4"
              style={{fontFamily: 'var(--font-heading)', color: 'var(--color-primary)'}}
            >
              {eyebrow}
            </p>
          )}

          <h2
            className={clsx(
              'mb-6',
              isAvantGarde
                ? 'text-4xl md:text-6xl tracking-[0.15em] uppercase'
                : 'text-3xl md:text-5xl italic',
            )}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: isAvantGarde ? 400 : 300,
              color: 'var(--color-text)',
            }}
          >
            {heading.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>

          <p
            className={clsx(
              isAvantGarde
                ? 'leading-loose tracking-wide text-sm md:text-base'
                : 'text-sm leading-loose mb-8',
            )}
            style={{fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)'}}
          >
            {body}
          </p>

          {isAvantGarde ? (
            <div
              className="w-16 h-px mx-auto mt-8"
              style={{backgroundColor: 'var(--color-accent)'}}
            />
          ) : (
            <Link to={`/collections/${brand.collections.all}`} className="btn-outline">
              {brand.copy.heroPrimaryCta}
            </Link>
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

function EmptyState({label}: {label: string}) {
  return (
    <div className="text-center py-16">
      <p
        className="text-sm tracking-widest"
        style={{color: 'var(--color-text-muted)'}}
      >
        {label}
      </p>
    </div>
  );
}
