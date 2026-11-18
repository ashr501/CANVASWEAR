import {type LoaderFunctionArgs} from 'react-router';
import {SOCIAL_LINKS} from '~/components/SocialIcons';
import {Await, useLoaderData, useOutletContext, Link} from 'react-router';
import {Suspense} from 'react';
import {getSeoMeta} from '~/lib/shopify-ui';
import {
  HOME_PRODUCTS_QUERY,
  CATEGORY_PRODUCTS_QUERY,
  VIDEO_TAGGED_PRODUCTS_QUERY,
  NEWS_LIST_QUERY,
} from '~/lib/queries';
import {formatNewsDate} from '~/lib/news';
import {formatCount} from '~/lib/format';
import {countCollections} from '~/lib/counts.server';
import ProductCard from '~/components/ProductCard';
import FaqSection from '~/components/FaqSection';
import PatternTile from '~/components/PatternTile';
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

  // トップに出す最新のお知らせ。取得に失敗してもトップページ自体は表示したいので空で返す。
  const news = brand.newsBlog
    ? storefront
        .query(NEWS_LIST_QUERY, {
          variables: {
            blog: brand.newsBlog,
            country: storefront.i18n.country,
            language: storefront.i18n.language,
          },
          cache: storefront.CacheShort(),
        })
        .then((data: any) => (data?.blog?.articles?.nodes ?? []).slice(0, 3))
        .catch(() => [])
    : Promise.resolve([]);

  // 商品数（全体とカテゴリごと）。数えるのに時間がかかるので待たずにページを返し、あとから流し込む。
  const counts: Promise<Record<string, number>> =
    brand.id === 'custom-print'
      ? countCollections(storefront, [
          brand.collections.all,
          ...brand.nav.map((n) => n.handle),
        ]).catch(() => ({}))
      : Promise.resolve({});

  const origin = originOf(request);

  // brandをそのまま返すとStorefrontトークンまでブラウザに渡ってしまうので、
  // 表示用のブランド情報はroot.tsxのoutlet contextから受け取る
  return ({
    products,
    categoryProducts,
    activeCat,
    news,
    counts,
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
        ? SOCIAL_LINKS.map((link) => link.href)
        : [],
  });
}

export default function Index() {
  const {products, categoryProducts, activeCat, news, counts, brandId} =
    useLoaderData<typeof loader>();
  const {brand} = useOutletContext<{brand: PublicBrand; onCartOpen: () => void}>();

  if (brandId === 'custom-print') {
    return (
      <CanvaswearHome
        brand={brand}
        products={products}
        categoryProducts={categoryProducts}
        activeCat={activeCat}
        news={news}
        counts={counts}
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
            <Await resolve={products} errorElement={null}>
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
            <Await resolve={products} errorElement={null}>
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
            <Await resolve={products} errorElement={null}>
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
  news,
  counts,
}: {
  brand: PublicBrand;
  products: any;
  categoryProducts: any;
  activeCat: string;
  news: Promise<any[]>;
  counts: Promise<Record<string, number>>;
}) {
  const copy = brand.copy;
  const isAll = activeCat === brand.collections.all;
  const activeLabel = brand.nav.find((n) => n.handle === activeCat)?.label;

  return (
    <div>
      <CanvaswearHero brand={brand} products={products} counts={counts} />
      <Ticker />

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

          {/* 件数は後から届くので、それまでは件数なしのタブを出しておく（タブ自体は待たせない） */}
          <Suspense
            fallback={
              <CategoryTabs nav={brand.nav} allHandle={brand.collections.all} activeCat={activeCat} />
            }
          >
            <Await resolve={counts} errorElement={null}>
              {(c: Record<string, number>) => (
                <CategoryTabs
                  nav={brand.nav}
                  allHandle={brand.collections.all}
                  activeCat={activeCat}
                  counts={c}
                />
              )}
            </Await>
          </Suspense>

          <Suspense fallback={<ProductGridSkeleton />}>
            <Await resolve={categoryProducts} errorElement={null}>
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

      <StatementBand body={brand.concept.body} />
      <HowToOrder categoryCount={brand.nav.length} />
      <BulkBand />

      <Suspense fallback={null}>
        <Await resolve={news} errorElement={null}>
          {(articles: any[]) => <NewsSection articles={articles} viewAllLabel={copy.viewAll} />}
        </Await>
      </Suspense>

      <FaqSection />
    </div>
  );
}

/** トップの「お知らせ」欄。最新3件の日付とタイトルだけを並べ、詳細は /news へ送る。
 *  記事がなければ欄ごと出さない。 */
function NewsSection({articles, viewAllLabel}: {articles: any[]; viewAllLabel: string}) {
  if (!articles?.length) return null;

  return (
    <section className="section-pad">
      <div className="container-brand max-w-3xl mx-auto">
        <SectionHeading
          eyebrow="NEWS"
          heading="お知らせ"
          viewAllHref="/news"
          viewAllLabel={viewAllLabel}
        />
        <ul style={{borderTop: '1px solid var(--color-border)'}}>
          {articles.map((article) => (
            <li key={article.handle} style={{borderBottom: '1px solid var(--color-border)'}}>
              <Link
                to={`/news/${article.handle}`}
                className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 py-5 group"
              >
                <time
                  dateTime={article.publishedAt}
                  className="text-xs shrink-0 md:w-32"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  {formatNewsDate(article.publishedAt)}
                </time>
                <span
                  className="text-sm md:text-base group-hover:opacity-70 transition-opacity"
                  style={{color: 'var(--color-text)'}}
                >
                  {article.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center md:hidden">
          <Link to="/news" className="btn-outline">
            お知らせをすべて見る
          </Link>
        </div>
      </div>
    </section>
  );
}

/** トップページのカテゴリ切り替えタブ。?cat= を付け替えるだけのリンクなので
 *  JSなしでも動き、スクロール位置は #category で維持される。 */
function CategoryTabs({
  nav,
  allHandle,
  activeCat,
  counts,
}: {
  nav: PublicBrand['nav'];
  allHandle: string;
  activeCat: string;
  counts?: Record<string, number>;
}) {
  const tabs = [{label: 'すべて', handle: allHandle}, ...nav];

  return (
    <div className="flex gap-2 mb-8 md:mb-10 overflow-x-auto no-scrollbar -mx-[var(--gutter)] px-[var(--gutter)] md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
      {tabs.map(({label, handle}) => {
        const isActive = handle === activeCat;
        return (
          <Link
            key={handle}
            to={handle === allHandle ? '/#category' : `/?cat=${handle}#category`}
            preventScrollReset
            prefetch="intent"
            className="px-4 py-2 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[var(--color-text)]"
            style={{
              borderRadius: '9999px',
              backgroundColor: isActive ? 'var(--color-text)' : 'var(--color-surface)',
              color: isActive ? 'var(--color-bg)' : 'var(--color-text)',
              border: `1px solid ${isActive ? 'var(--color-text)' : 'var(--color-border)'}`,
            }}
          >
            {label}
            {counts?.[handle] != null && (
              <span className="ml-1.5" style={{opacity: 0.6}}>
                {formatCount(counts[handle])}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** ヒーロー: 左にコピー、右に「同じ柄を帽子からドレスまで」のラインナップ画像。
 *  以前は文字の下に画像を全幅で敷いていたが、PCでは文字の右半分が空き、
 *  画像が最初の画面に入らなかったため2カラムにした。スマホでは縦に積む。 */
function CanvaswearHero({
  brand,
  products,
  counts,
}: {
  brand: PublicBrand;
  products: any;
  counts: Promise<Record<string, number>>;
}) {
  const heading = brand.heroHeading ?? [brand.taglineJa];
  const heroImage = brand.copy.heroImage;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg)',
        // 布目のような細かい点。右上にだけ出して、文字の後ろは無地にする
        backgroundImage:
          'radial-gradient(circle at 1px 1px, var(--color-border) 1.5px, transparent 0)',
        backgroundSize: '22px 22px',
        backgroundPosition: 'right top',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, var(--color-bg) 0%, var(--color-bg) 38%, transparent 75%)',
        }}
      />
      <div className="container-brand relative py-10 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <p
              className="flex items-center gap-3 text-xs mb-5"
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-display, var(--font-heading))',
                fontWeight: 500,
                letterSpacing: '0.24em',
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block w-8 h-[2px]"
                style={{backgroundColor: 'var(--color-primary)'}}
              />
              {brand.copy.heroEyebrow}
            </p>
            <h1
              className="mb-6"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: 'clamp(2.3rem, 4.9vw, 4.25rem)',
                lineHeight: 1.22,
                letterSpacing: '0.01em',
                color: 'var(--color-text)',
              }}
            >
              {heading.map((line, i) => (
                <span
                  key={i}
                  className="block whitespace-nowrap"
                  style={i === heading.length - 1 ? {color: 'var(--color-primary)'} : undefined}
                >
                  {line}
                </span>
              ))}
            </h1>
            <p
              className="text-[15px] leading-loose max-w-md mb-8"
              style={{fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)'}}
            >
              {brand.heroBody ?? brand.concept?.body ?? brand.taglineJa}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/collections/${brand.collections.all}`} className="btn-primary">
                {brand.copy.heroPrimaryCta}
              </Link>
              <Link to={brand.copy.heroSecondaryHref ?? '/products'} className="btn-outline">
                {brand.copy.heroSecondaryCta}
              </Link>
            </div>
            {/* 品ぞろえの多さを最初に伝える。件数が届くまでは何も出さない（高さは確保してレイアウトが跳ねないようにする） */}
            <div className="mt-9 min-h-[3.25rem]">
              <Suspense fallback={null}>
                <Await resolve={counts} errorElement={null}>
                  {(c: Record<string, number>) => {
                    const total = c[brand.collections.all];
                    if (!total) return null;
                    return (
                      <dl
                        className="flex flex-wrap gap-x-7 gap-y-3 pt-5"
                        style={{borderTop: '1px solid var(--color-border)'}}
                      >
                        {[
                          [formatCount(total), 'アイテム'],
                          [String(brand.nav.length), 'カテゴリ'],
                          ['1', '点から製作'],
                        ].map(([num, unit]) => (
                          <div key={unit} className="flex items-baseline gap-1.5">
                            <dt className="sr-only">{unit}</dt>
                            <dd
                              style={{
                                fontFamily: 'var(--font-display, var(--font-heading))',
                                fontWeight: 700,
                                fontSize: '1.75rem',
                                lineHeight: 1,
                                color: 'var(--color-text)',
                              }}
                            >
                              {num}
                            </dd>
                            <span className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                              {unit}
                            </span>
                          </div>
                        ))}
                      </dl>
                    );
                  }}
                </Await>
              </Suspense>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            {heroImage && (
              <>
                {/* 飾りは商品やモデルに重ならないよう、画像の左上の角と下辺の空いたところにだけ置く */}
                <PatternTile
                  kind="diamond"
                  tone="red"
                  size={84}
                  className="absolute -top-6 -left-3 md:-top-8 md:-left-8 z-10 w-14 h-14 md:w-[84px] md:h-[84px]"
                  style={{transform: 'rotate(-8deg)', boxShadow: '0 10px 24px rgba(31,27,24,0.14)'}}
                />
                <PatternTile
                  kind="wave"
                  tone="ink"
                  size={72}
                  className="hidden md:block absolute -bottom-8 left-[42%] z-10"
                  style={{transform: 'rotate(10deg)', boxShadow: '0 10px 24px rgba(31,27,24,0.14)'}}
                />
              </>
            )}
            {heroImage ? (
              // ラインナップ画像は白背景なので、白い台紙（キャンバス）に載せて見せる
              <figure
                className="relative overflow-hidden"
                style={{
                  borderRadius: '28px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 24px 60px rgba(31, 27, 24, 0.08)',
                }}
              >
                <img
                  src={heroImage.url}
                  alt={heroImage.alt}
                  width={1600}
                  height={967}
                  className="w-full h-auto block"
                  loading="eager"
                  fetchPriority="high"
                />
                <figcaption
                  className="absolute left-4 bottom-4 md:left-5 md:bottom-5 px-3.5 py-1.5 rounded-full text-[11px] md:text-xs font-medium"
                  style={{backgroundColor: 'var(--color-text)', color: 'var(--color-bg)'}}
                >
                  同じ柄を、帽子からドレスまで
                </figcaption>
              </figure>
            ) : (
              <div className="relative aspect-[4/5] max-h-[440px]">
                <Suspense fallback={<HeroImageSkeleton />}>
                  <Await resolve={products} errorElement={null}>
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
      </div>
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

/** ヒーロー直下の3つの特長。どれもFAQに書いてある確定した事実だけを載せる。 */
const VALUE_POINTS = [
  {
    title: '1点から製作',
    body: '柄の在庫を持たない受注生産です',
    icon: <path d="M9.5 8.5 13 6v12M9.5 18h7" />,
  },
  {
    title: '全面フルカラー',
    body: '写真もイラストもそのままプリント',
    icon: (
      <>
        <circle cx="9" cy="10" r="5.5" />
        <circle cx="15" cy="10" r="5.5" />
        <circle cx="12" cy="15" r="5.5" />
      </>
    ),
  },
  {
    title: '洗っても色落ちしにくい',
    body: '染料が繊維そのものに定着します',
    icon: <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11ZM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />,
  },
];

/** ヒーロー直下を横に流れる帯。店の約束を短い言葉で繰り返す。
 *  動きを減らす設定の人には止めて見せる（app.css の .cw-ticker）。 */
const TICKER_WORDS = ['1点から製作', '全面フルカラー', '写真もイラストも', '洗っても色落ちしにくい', 'スマホの写真でOK'];

function Ticker() {
  const row = (hidden: boolean) => (
    <ul className="cw-ticker__row" aria-hidden={hidden || undefined}>
      {TICKER_WORDS.map((word) => (
        <li key={word} className="flex items-center gap-6 md:gap-8 pr-6 md:pr-8">
          <span>{word}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M5 0L10 5L5 10L0 5Z" fill="var(--color-primary)" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className="cw-ticker py-3.5 md:py-4 text-sm md:text-base"
      style={{
        backgroundColor: '#1F1B18',
        color: '#FBF7F2',
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
      }}
    >
      {row(false)}
      {row(true)}
      {row(true)}
    </div>
  );
}

/** 昇華プリントの説明。墨色の大きな帯にして、白い商品一覧との間にめりはりを付ける。 */
function StatementBand({body}: {body: string}) {
  return (
    <section
      className="section-pad relative overflow-hidden"
      style={{backgroundColor: '#1F1B18', color: '#FBF7F2'}}
    >
      <PatternTile
        kind="arc"
        tone="red"
        size={220}
        className="absolute -right-16 -top-16 opacity-90 hidden md:block"
        style={{transform: 'rotate(180deg)'}}
      />
      <PatternTile
        kind="diamond"
        tone="red"
        size={64}
        className="absolute right-6 top-6 md:hidden"
        style={{transform: 'rotate(8deg)'}}
      />
      <div className="container-brand relative">
        <p
          className="text-xs mb-4"
          style={{
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-display, var(--font-heading))',
            fontWeight: 500,
            letterSpacing: '0.2em',
          }}
        >
          ABOUT SUBLIMATION PRINT
        </p>
        <h2
          className="mb-6 max-w-3xl"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: 'clamp(1.75rem, 3.6vw, 3rem)',
            lineHeight: 1.4,
            color: '#FBF7F2',
          }}
        >
          <span className="block">写真も、絵も、</span>
          <span className="block">そのまま服になる。</span>
        </h2>
        <p className="text-sm md:text-[15px] leading-loose max-w-2xl mb-10 md:mb-12" style={{color: '#D8CEC2'}}>
          {body}
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {VALUE_POINTS.map(({title, body: text, icon}) => (
            <li
              key={title}
              className="flex items-center gap-4 p-5"
              style={{backgroundColor: '#2B2520', borderRadius: 'var(--radius)'}}
            >
              <span
                className="flex items-center justify-center w-11 h-11 rounded-full shrink-0"
                style={{backgroundColor: 'var(--color-primary)', color: '#FFFFFF'}}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {icon}
                </svg>
              </span>
              <div>
                <p className="text-[15px]" style={{fontFamily: 'var(--font-heading)', fontWeight: 700}}>
                  {title}
                </p>
                <p className="text-xs mt-1" style={{color: '#B9AEA2'}}>
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** まとめて注文の割引。割引率はFAQ（FaqSection.tsx「チームウェアやノベルティなど…」）と同じ。
 *  カートでは自動で適用されないので、買い物かごではなく問い合わせへ送る。 */
const BULK_TIERS = [
  {range: '5〜9点', off: '10'},
  {range: '10〜19点', off: '15'},
  {range: '20点以上', off: '25'},
];

function BulkBand() {
  return (
    <section className="section-pad" style={{backgroundColor: 'var(--color-surface)'}}>
      <div className="container-brand">
        <div
          className="relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-7 md:p-12"
          style={{backgroundColor: 'var(--color-primary)', color: '#FFFFFF', borderRadius: '28px'}}
        >
          <PatternTile
            kind="dots"
            tone="ink"
            size={120}
            className="absolute -right-8 -top-10 opacity-25"
            style={{transform: 'rotate(12deg)'}}
          />
          <div className="relative">
            <p
              className="text-xs mb-3"
              style={{
                fontFamily: 'var(--font-display, var(--font-heading))',
                fontWeight: 500,
                letterSpacing: '0.2em',
              }}
            >
              FOR TEAMS &amp; EVENTS
            </p>
            <h2
              className="mb-4"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                lineHeight: 1.4,
                color: '#FFFFFF',
              }}
            >
              おそろいで作ると、
              <br />
              最大25%OFF。
            </h2>
            <p className="text-sm leading-loose mb-7 max-w-md" style={{color: '#FFE9E3'}}>
              チームウェアやノベルティなど、まとめてのご注文には数量割引があります。同じデザインでサイズを組み合わせることもできます。割引はカートでは自動で付かないため、枚数と用途をお知らせください。
            </p>
            <Link
              to="/pages/contact"
              className="inline-block px-8 py-3.5 rounded-full text-sm transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#1F1B18',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              見積もりを相談する
            </Link>
          </div>
          <ul className="relative grid grid-cols-3 gap-2.5 md:gap-4">
            {BULK_TIERS.map(({range, off}) => (
              <li
                key={range}
                className="text-center py-6 md:py-9 px-2"
                style={{backgroundColor: '#FFFFFF', color: '#1F1B18', borderRadius: 'var(--radius)'}}
              >
                <p className="text-xs md:text-sm font-medium mb-2">{range}</p>
                <p
                  style={{
                    fontFamily: 'var(--font-display, var(--font-heading))',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: 'var(--color-primary)',
                  }}
                >
                  <span style={{fontSize: 'clamp(2rem, 4.4vw, 3.25rem)'}}>{off}</span>
                  <span className="text-sm md:text-lg">%OFF</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** ご注文の流れ。初めての人が「どうやって頼むのか」を商品ページへ行く前に分かるようにする。
 *  納期・データ形式はFAQ（FaqSection.tsx）と同じ内容。変えるときは両方直すこと。 */
function HowToOrder({categoryCount}: {categoryCount: number}) {
  const steps = [
    {
      title: '商品を選ぶ',
      body: `Tシャツ、ドレス、バッグ、シューズなど${categoryCount}カテゴリからお選びください。`,
    },
    {
      title: '写真・イラストを送る',
      body: '商品ページからそのままアップロード。スマホで撮った写真で大丈夫です（PNG・JPEG、20MBまで）。',
    },
    {
      title: '1点ずつ製作してお届け',
      body: '受注生産で、通常はデザイン確定後およそ1ヶ月。お急ぎ仕上げならデータ確認後およそ2週間です。',
    },
  ];

  return (
    <section className="section-pad" style={{backgroundColor: 'var(--color-hero-bg)'}}>
      <div className="container-brand">
        <SectionHeading eyebrow="HOW TO ORDER" heading="ご注文の流れ" />
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {steps.map(({title, body}, i) => (
            <li
              key={title}
              className="p-6 md:p-8"
              style={{backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius)'}}
            >
              <p
                aria-hidden="true"
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-display, var(--font-heading))',
                  fontWeight: 700,
                  fontSize: '2rem',
                  lineHeight: 1,
                  color: 'var(--color-primary)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3
                className="text-lg mb-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  lineHeight: 1.5,
                  color: 'var(--color-text)',
                }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                {body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link to="/faq" className="btn-outline">
            よくあるご質問を見る
          </Link>
        </div>
      </div>
    </section>
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
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
      <div>
        <p
          className="text-xs mb-2.5"
          style={{
            color: 'var(--color-primary)',
            fontFamily: 'var(--font-display, var(--font-heading))',
            fontWeight: 500,
            letterSpacing: '0.2em',
          }}
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
      {viewAllHref && viewAllLabel && (
        <Link
          to={viewAllHref}
          className="text-sm font-medium hidden md:block shrink-0 pb-1 transition-colors hover:text-[var(--color-primary)]"
          style={{borderBottom: '1px solid currentColor'}}
        >
          {viewAllLabel}
        </Link>
      )}
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

