import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, useOutletContext, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {getSeoMeta} from '@shopify/hydrogen';
import {
  HOME_PRODUCTS_QUERY,
  CATEGORY_PRODUCTS_QUERY,
  VIDEO_TAGGED_PRODUCTS_QUERY,
} from '~/lib/queries';
import ProductCard from '~/components/ProductCard';
import FaqSection from '~/components/FaqSection';
import {getBrandConfig} from '~/lib/brand.server';
import {siteJsonLd, originOf} from '~/lib/seo';
import clsx from 'clsx';
import {isBoldBrand, type PublicBrand} from '~/lib/brands';

export const meta = ({data}: any) =>
  getSeoMeta({
    title: data?.seoTitle,
    description: data?.seoDescription,
    url: data?.seoUrl,
    // jsonLdはloaderで作らずここで組み立てる。loaderに入れると
    // ハイドレーション用のJSONにも同じ内容が載って二重に転送されるため。
    jsonLd: data?.origin
      ? siteJsonLd({
          origin: data.origin,
          name: data.brandName,
          description: data.seoDescription,
          sameAs: data.sameAs ?? [],
        })
      : undefined,
  });

/** 並びを毎回変えるためのシャッフル（Fisher-Yates）。
 *  サーバー側で決めた並びをそのまま返すので、画面のちらつきは起きない。 */
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

  // トップページのカテゴリ切り替え。?cat=<handle> で表示するコレクションを選ぶ。
  // 未指定なら全商品コレクション。ナビにないhandleは無視する（不正値対策）。
  const requestedCat = new URL(request.url).searchParams.get('cat');
  const activeCat =
    requestedCat && brand.nav.some((n) => n.handle === requestedCat)
      ? requestedCat
      : brand.collections.all;

  // 動画つき商品を先に見せる。全949件中172件しか動画がないため、コレクションから
  // 60件取って絞る方式では先頭に1件も入らなかった。「動画あり」タグで直接引き、
  // 足りない分だけコレクションの通常商品で埋める。
  const HOME_TILE_COUNT = 8;
  const categoryLabel = brand.nav.find((n) => n.handle === activeCat)?.label;
  // カテゴリ選択中はそのカテゴリの動画つき商品に絞る（「すべて」なら絞らない）
  const videoQuery =
    activeCat === brand.collections.all
      ? 'tag:動画あり'
      : `tag:動画あり AND tag:'${categoryLabel}'`;

  // アクセスのたびに違う商品を見せたいので、表示数より多めに取ってから毎回選び直す。
  // 取得結果はキャッシュに載せたまま、選び直しだけをリクエストごとに行うので
  // APIの呼び出し回数は増えない。
  const POOL_SIZE = 50;

  const categoryProducts = Promise.all([
    storefront.query(VIDEO_TAGGED_PRODUCTS_QUERY, {
      variables: {
        query: videoQuery,
        first: POOL_SIZE,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheShort(),
    }),
    storefront.query(CATEGORY_PRODUCTS_QUERY, {
      variables: {
        handle: activeCat,
        first: POOL_SIZE,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheShort(),
    }),
  ]).then(([tagged, collection]: any[]) => {
    const withVideo = shuffle(tagged?.products?.nodes ?? []);
    const rest = collection?.collection?.products?.nodes ?? [];
    const seen = new Set(withVideo.map((p: any) => p.id));
    // 動画つきを先に見せ、8件に足りないぶんだけ通常商品で埋める
    const filler = shuffle(rest.filter((p: any) => !seen.has(p.id)));
    return {
      collection: {
        products: {nodes: [...withVideo, ...filler].slice(0, HOME_TILE_COUNT)},
      },
    };
  });

  const origin = originOf(request);

  // brandをそのまま返すとStorefrontトークンまでブラウザに渡ってしまうので、
  // 表示用のブランド情報はroot.tsxのoutlet contextから受け取る
  return defer({
    products,
    categoryProducts,
    activeCat,
    brandId: brand.id,
    seoTitle: `${brand.nameJa}｜${brand.taglineJa}`,
    seoDescription:
      brand.id === 'custom-print'
        ? '写真もイラストも全面フルカラーの昇華プリント。Tシャツ・ドレス・バッグ・シューズ・キッチン用品まで1点から製作します。データを入稿するだけ、オリジナルグッズのオーダーメイド通販。'
        : brand.taglineJa,
    seoUrl: request.url,
    brandName: brand.name,
    // custom-print以外のブランドではOrganization/WebSiteを出さない
    origin: brand.id === 'custom-print' ? origin : undefined,
    sameAs:
      brand.id === 'custom-print'
        ? ['https://www.instagram.com/canvas_wears_tokyo']
        : [],
  });
}

export default function Index() {
  const {products, categoryProducts, activeCat, brandId} = useLoaderData<typeof loader>();
  const {brand} = useOutletContext<{brand: PublicBrand; onCartOpen: () => void}>();

  if (brandId === 'custom-print') {
    return (
      <CanvaswearHome
        brand={brand}
        products={products}
        categoryProducts={categoryProducts}
        activeCat={activeCat}
      />
    );
  }

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
              <Link to={brand.copy.heroSecondaryHref ?? '/products'} className="btn-outline">
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
              <Link to={brand.copy.heroSecondaryHref ?? '/products'} className="btn-outline">
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
              <Link to={brand.copy.heroSecondaryHref ?? '/products'} className="btn-outline">
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

/* ===================================================================
   CANVASWEAR（custom-print）専用トップページ
   design.md（暖色・丸みのある和文プレミアムテンプレート）の
   配色・タイポグラフィ・レイアウトパターンを、実際の商品データに
   合わせて再構成したもの。
   =================================================================== */

function CanvaswearHome({
  brand,
  products,
  categoryProducts,
  activeCat,
}: {
  brand: PublicBrand;
  products: any;
  categoryProducts: any;
  activeCat: string;
}) {
  const copy = brand.copy;
  const isAll = activeCat === brand.collections.all;
  const activeLabel = brand.nav.find((n) => n.handle === activeCat)?.label;

  return (
    <div>
      <CanvaswearHero brand={brand} products={products} />
      <InfoBanner />

      {/* カテゴリを選んで商品を切り替えられるセクション。
          ?cat=<handle> で選択（SSR。クライアント状態を持たない） */}
      <section
        id="category"
        className="section-pad"
        style={{
          backgroundColor: 'var(--color-surface)',
          // 固定ヘッダーの下に見出しが隠れないようアンカー位置をずらす
          scrollMarginTop: 'calc(var(--header-height) + var(--nav-height))',
        }}
      >
        <div className="container-brand">
          <SectionHeading
            eyebrow="SHOP BY CATEGORY"
            heading={isAll ? 'カテゴリから探す' : (activeLabel ?? copy.newHeading)}
            viewAllHref={`/collections/${activeCat}`}
            viewAllLabel={copy.viewAll}
          />

          <CategoryTabs nav={brand.nav} allHandle={brand.collections.all} activeCat={activeCat} />

          <Suspense fallback={<ProductGridSkeleton />}>
            <Await resolve={categoryProducts}>
              {(data: any) => {
                const items = data?.collection?.products?.nodes ?? [];
                if (items.length === 0) return <EmptyState label={copy.empty} />;
                return <MenuGrid items={items} brandId={brand.id} />;
              }}
            </Await>
          </Suspense>

          {/* ここに出せるのは8件だけなので、続きへ進む導線を商品の真下にも置く。
              見出し右のリンクはスマホでは出ないため、こちらが主な導線になる。 */}
          <div className="mt-10 text-center">
            <Link to={`/collections/${activeCat}`} className="btn-outline">
              {isAll ? '全商品を見る' : `${activeLabel}をすべて見る`}
            </Link>
          </div>
        </div>
      </section>

      <FaqSection />
    </div>
  );
}

/** トップページのカテゴリ切り替えタブ。?cat= を付け替えるだけのリンクなので
 *  JSなしでも動き、スクロール位置は #category で維持される。 */
function CategoryTabs({
  nav,
  allHandle,
  activeCat,
}: {
  nav: PublicBrand['nav'];
  allHandle: string;
  activeCat: string;
}) {
  const tabs = [{label: 'すべて', handle: allHandle}, ...nav];

  return (
    <div className="flex flex-wrap gap-2 mb-10">
      {tabs.map(({label, handle}) => {
        const isActive = handle === activeCat;
        return (
          <Link
            key={handle}
            to={handle === allHandle ? '/#category' : `/?cat=${handle}#category`}
            preventScrollReset
            prefetch="intent"
            className="px-4 py-2 text-xs tracking-wider transition-all duration-150"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: isActive ? 'var(--color-text)' : 'transparent',
              color: isActive ? 'var(--color-bg)' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/** ヒーロー: 2カラム（左に和文コピー、右に実商品の角丸大判画像）。design.mdの
 *  「Hero: 2-column asymmetric grid + deeply rounded image」を再現。 */
function CanvaswearHero({brand, products}: {brand: PublicBrand; products: any}) {
  const heading = brand.heroHeading ?? [brand.taglineJa];

  const heroImage = brand.copy.heroImage;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        // ラインナップ画像は白背景なので、セクションもそろえないと
        // 画像の上端に色の境目が線となって出てしまう
        backgroundColor: heroImage ? '#FFFFFF' : 'var(--color-bg)',
      }}
    >
      <div
        className={clsx(
          'container-brand',
          // 画像は下に全幅で敷くので、そのぶん下の余白を詰める
          heroImage ? 'pt-14 pb-8 md:pt-20 md:pb-10' : 'py-14 md:py-24',
        )}
      >
        <div
          className={clsx(
            heroImage
              ? 'max-w-2xl'
              : 'grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center',
          )}
        >
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase mb-6"
              style={{
                backgroundColor: 'var(--color-hero-bg)',
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
              }}
            >
              {brand.copy.heroEyebrow}
            </span>
            <h1
              className="mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)',
                lineHeight: 1.3,
                color: 'var(--color-text)',
                textWrap: 'pretty',
              }}
            >
              {heading.map((line, i) => (
                <span
                  key={i}
                  className="block"
                  style={i === heading.length - 1 ? {color: 'var(--color-primary)'} : undefined}
                >
                  {line}
                </span>
              ))}
            </h1>
            {/* 以前はここに短いheroBodyを置き、下のCommitmentSectionで同じ見出しと
                詳しい説明を繰り返していた。見出しの重複をなくすため、説明文を
                こちらに集約してCommitmentSectionは削除した。 */}
            <p
              className="text-sm leading-loose max-w-md mb-9"
              style={{fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)'}}
            >
              {brand.concept?.body ?? brand.heroBody ?? brand.taglineJa}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to={`/collections/${brand.collections.all}`} className="btn-primary">
                {brand.copy.heroPrimaryCta}
              </Link>
              <Link to={brand.copy.heroSecondaryHref ?? '/products'} className="btn-outline">
                {brand.copy.heroSecondaryCta}
              </Link>
            </div>
          </div>

          {heroImage ? null : (
          <div className="relative aspect-[4/5] md:aspect-[4/5] max-h-[440px]">
            <Suspense fallback={<HeroImageSkeleton />}>
              <Await resolve={products}>
                {(data: any) => {
                  const items = data?.featured?.products?.nodes ?? [];
                  if (items.length === 0) return <HeroImageSkeleton />;
                  const [main] = items;
                  if (!main?.featuredImage?.url) return <HeroImageSkeleton />;
                  return (
                    <Link
                      to={`/products/${main.handle}`}
                      className="block absolute inset-0 overflow-hidden"
                      style={{
                        borderRadius: '32px',
                        backgroundColor: 'var(--color-hero-bg)',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <img
                        src={main.featuredImage.url}
                        alt={main.featuredImage.altText ?? main.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                    </Link>
                  );
                }}
              </Await>
            </Suspense>
          </div>
          )}
        </div>
      </div>

      {/* 同じ柄が帽子からドレスまで展開できることを一目で見せる。
          横長なので2カラムの右側ではなく、テキストの下に全幅で敷く。 */}
      {heroImage && (
        <img
          src={heroImage.url}
          alt={heroImage.alt}
          width={1600}
          height={967}
          className="w-full h-auto block"
          loading="eager"
          fetchPriority="high"
        />
      )}
    </section>
  );
}

function HeroImageSkeleton() {
  return (
    <div
      className="absolute inset-0 animate-pulse"
      style={{borderRadius: '32px', backgroundColor: 'var(--color-border)'}}
    />
  );
}

/** 全幅の案内バー。design.mdの Notice Banner に相当。
 *  入稿できるデータ形式・サイズという既に確定している事実だけを載せる。 */
function InfoBanner() {
  return (
    <div className="py-4" style={{backgroundColor: 'var(--color-hero-bg)'}}>
      <p
        className="container-brand text-center text-xs md:text-sm tracking-wide"
        style={{color: 'var(--color-secondary)', fontFamily: 'var(--font-body)'}}
      >
        入稿データは PNG・JPEG に対応（20MBまで）。商品ページからそのままアップロードできます。
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  heading,
  viewAllHref,
  viewAllLabel,
}: {
  eyebrow: string;
  heading: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <p
          className="text-xs tracking-widest uppercase mb-2"
          style={{color: 'var(--color-primary)'}}
        >
          {eyebrow}
        </p>
        <h2
          className="text-display-md"
          style={{fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text)'}}
        >
          {heading}
        </h2>
      </div>
      <Link
        to={viewAllHref}
        className="text-xs tracking-widest uppercase hidden md:block transition-opacity hover:opacity-60"
        style={{color: 'var(--color-primary)'}}
      >
        {viewAllLabel}
      </Link>
    </div>
  );
}

/** design.mdの Menu Card（画像+リボン+タイトル+価格）を、既存の
 *  ProductCardに「人気」リボンとホバーで浮き上がる動きを足して再現。 */
function MenuGrid({
  items,
  brandId,
  highlightFirst,
}: {
  items: any[];
  brandId: string;
  highlightFirst?: boolean;
}) {
  return (
    <div className="product-grid">
      {items.map((product: any, i: number) => (
        <div key={product.id} className="relative transition-transform duration-300 hover:-translate-y-1">
          {highlightFirst && i === 0 && (
            <span
              className="absolute top-2 left-2 z-10 px-3 py-1 rounded-full text-[10px] tracking-widest uppercase font-semibold"
              style={{backgroundColor: 'var(--color-primary)', color: '#FFFFFF'}}
            >
              人気
            </span>
          )}
          <ProductCard product={product} brandId={brandId} />
        </div>
      ))}
    </div>
  );
}

