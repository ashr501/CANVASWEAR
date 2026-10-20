/**
 * 旧Hydrogen（2024年版）にあって、2026-10版で無くなった表示部品の置き換え。
 * Image / Money / Pagination / getPaginationVariables / getSeoMeta を、
 * 既存の画面が使っていた形（props）のまま使えるようにしている。
 */
import {formatMoney, type MoneyV2} from '@shopify/hydrogen';
import {Fragment, type CSSProperties, type ReactNode} from 'react';
import {Link, useLocation, useNavigation} from 'react-router';

/* ───────────── 画像 ───────────── */

type ImageData = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

const SHOPIFY_CDN_HOSTS = ['cdn.shopify.com', 'mock.shop'];
const SRCSET_WIDTHS = [200, 400, 600, 800, 1000, 1200, 1600, 2000];

/** ShopifyのCDN画像だけ、幅を指定したURLにする（他サイトの画像はそのまま） */
export function shopifyImageUrl(url: string, width?: number): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const isShopify = SHOPIFY_CDN_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );
  if (!isShopify) return url;
  if (width) parsed.searchParams.set('width', String(width));
  return parsed.toString();
}

export function Image({
  data,
  sizes = '100vw',
  className,
  style,
  alt,
  loading = 'lazy',
}: {
  data: ImageData;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  loading?: 'lazy' | 'eager';
}) {
  const maxWidth = data.width ?? undefined;
  const widths = SRCSET_WIDTHS.filter((w) => !maxWidth || w <= maxWidth);
  const srcSet = widths.map((w) => `${shopifyImageUrl(data.url, w)} ${w}w`).join(', ');
  return (
    <img
      src={shopifyImageUrl(data.url, widths.at(-1) ?? undefined)}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={alt ?? data.altText ?? ''}
      width={data.width ?? undefined}
      height={data.height ?? undefined}
      loading={loading}
      decoding="async"
      className={className}
      style={style}
    />
  );
}

/* ───────────── 価格 ───────────── */

/** 日本円の表示（例: ¥3,000）。金額の計算はせず、Shopifyから来た値を整形するだけ */
export function formatPrice(money: Pick<MoneyV2, 'amount' | 'currencyCode'>): string {
  return formatMoney(money as MoneyV2, {locale: 'ja-JP'}).toString();
}

export function Money({
  data,
  as: Tag = 'div',
  className,
  style,
  withoutTrailingZeros,
}: {
  data: Pick<MoneyV2, 'amount' | 'currencyCode'> | null | undefined;
  as?: 'div' | 'span' | 'p';
  /** 円は小数が無いので見た目は変わらないが、旧部品と同じ指定を受け付ける */
  withoutTrailingZeros?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  if (!data) return null;
  return (
    <Tag className={className} style={style}>
      {withoutTrailingZeros
        ? formatMoney(data as MoneyV2, {locale: 'ja-JP'}).withoutTrailingZeros
        : formatPrice(data)}
    </Tag>
  );
}

/* ───────────── ページ送り（もっと見る） ───────────── */

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

/** URLの ?cursor=&direction= から、商品一覧の問い合わせ変数を作る */
export function getPaginationVariables(request: Request, {pageBy}: {pageBy: number}) {
  const params = new URL(request.url).searchParams;
  const cursor = params.get('cursor') ?? undefined;
  const isPrevious = params.get('direction') === 'previous';
  return isPrevious
    ? {last: pageBy, startCursor: cursor ?? null}
    : {first: pageBy, endCursor: cursor ?? null};
}

/**
 * 旧Hydrogenの <Pagination> と同じ使い方の部品。
 * 「もっと見る」を押すと次のページを読み込み、表示済みの商品の下に足していく
 * （それまでの商品は画面遷移のstateで引き継ぐ）。
 */
export function Pagination<T extends {id: string}>({
  connection,
  children,
}: {
  connection: {nodes: T[]; pageInfo: PageInfo};
  children: (args: {
    nodes: T[];
    isLoading: boolean;
    PreviousLink: (props: {className?: string; children: ReactNode}) => ReactNode;
    NextLink: (props: {className?: string; children: ReactNode}) => ReactNode;
  }) => ReactNode;
}) {
  const location = useLocation();
  const navigation = useNavigation();
  const state = (location.state ?? {}) as {nodes?: T[]; pageInfo?: PageInfo; direction?: string};

  // 前のページで表示していた商品と、今回読み込んだ商品をつなげる（重複は除く）
  const previousNodes = state.nodes ?? [];
  const seen = new Set<string>();
  const nodes =
    state.direction === 'previous'
      ? [...connection.nodes, ...previousNodes]
      : [...previousNodes, ...connection.nodes];
  const merged = nodes.filter((node) => (seen.has(node.id) ? false : (seen.add(node.id), true)));

  const firstPageInfo = state.direction === 'previous' ? connection.pageInfo : state.pageInfo;
  const lastPageInfo = state.direction === 'previous' ? state.pageInfo : connection.pageInfo;
  const hasNextPage = (lastPageInfo ?? connection.pageInfo).hasNextPage;
  const hasPreviousPage = (firstPageInfo ?? connection.pageInfo).hasPreviousPage;
  const endCursor = (lastPageInfo ?? connection.pageInfo).endCursor;
  const startCursor = (firstPageInfo ?? connection.pageInfo).startCursor;

  function pageUrl(cursor: string, direction: 'next' | 'previous') {
    const params = new URLSearchParams(location.search);
    params.set('cursor', cursor);
    params.set('direction', direction);
    return `${location.pathname}?${params.toString()}`;
  }

  const isLoading = navigation.state === 'loading';

  const NextLink = ({className, children: label}: {className?: string; children: ReactNode}) =>
    hasNextPage && endCursor ? (
      <Link
        to={pageUrl(endCursor, 'next')}
        preventScrollReset
        replace
        state={{nodes: merged, pageInfo: {...connection.pageInfo, hasPreviousPage}, direction: 'next'}}
        className={className}
      >
        {label}
      </Link>
    ) : null;

  const PreviousLink = ({className, children: label}: {className?: string; children: ReactNode}) =>
    hasPreviousPage && startCursor ? (
      <Link
        to={pageUrl(startCursor, 'previous')}
        preventScrollReset
        replace
        state={{nodes: merged, pageInfo: {...connection.pageInfo, hasNextPage}, direction: 'previous'}}
        className={className}
      >
        {label}
      </Link>
    ) : null;

  return <>{children({nodes: merged, isLoading, PreviousLink, NextLink})}</>;
}

/* ───────────── 検索エンジン向けのタグ ───────────── */

type SeoInput = {
  title?: string | null;
  titleTemplate?: string | null;
  description?: string | null;
  url?: string | null;
  media?: string | {url: string; altText?: string | null; type?: string} | null;
  jsonLd?: object | object[];
  robots?: {noIndex?: boolean; noFollow?: boolean};
};

/** 旧Hydrogenの getSeoMeta と同じタグ（title・description・OGP・canonical・JSON-LD）を作る */
export function getSeoMeta(...inputs: Array<SeoInput | null | undefined>) {
  const seo = Object.assign({}, ...inputs.filter(Boolean)) as SeoInput;
  const tags: Array<Record<string, unknown>> = [];

  if (seo.title) {
    const title = seo.titleTemplate ? seo.titleTemplate.replace('%s', seo.title) : seo.title;
    tags.push({title});
    tags.push({property: 'og:title', content: title});
    tags.push({property: 'twitter:title', content: title});
  }
  if (seo.description) {
    tags.push({name: 'description', content: seo.description});
    tags.push({property: 'og:description', content: seo.description});
    tags.push({property: 'twitter:description', content: seo.description});
  }
  if (seo.url) {
    // 旧Hydrogenと同じく、末尾の / は付けない（トップページは https://canvaswears.com）
    const withoutSlash = (url: string) => url.replace(/\/(?=\?|$)/, '');
    tags.push({tagName: 'link', rel: 'canonical', href: withoutSlash(seo.url.split('?')[0])});
    tags.push({property: 'og:url', content: withoutSlash(seo.url.split('?')[0])});
  }
  if (seo.media) {
    const media = typeof seo.media === 'string' ? {url: seo.media} : seo.media;
    tags.push({property: 'og:image:url', content: media.url});
    tags.push({property: 'og:image:secure_url', content: media.url});
    const type = media.url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i)?.[1]?.toLowerCase();
    if (type) tags.push({property: 'og:image:type', content: `image/${type === 'jpg' ? 'jpeg' : type}`});
    if ('altText' in media && media.altText) tags.push({property: 'og:image:alt', content: media.altText});
  }
  if (seo.robots?.noIndex || seo.robots?.noFollow) {
    tags.push({
      name: 'robots',
      content: [seo.robots.noIndex ? 'noindex' : 'index', seo.robots.noFollow ? 'nofollow' : 'follow'].join(','),
    });
  }
  const jsonLd = seo.jsonLd ? (Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd]) : [];
  // 旧Hydrogenと同じく、複数あるときは1つのscriptに配列でまとめる
  if (jsonLd.length) tags.push({'script:ld+json': jsonLd.length === 1 ? jsonLd[0] : jsonLd});
  return tags;
}

/* ───────────── サイズ・カラーの選択 ───────────── */

type VariantLike = {
  id: string;
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
};

/**
 * 旧Hydrogenの <VariantSelector> と同じ使い方の部品。
 * 各値は「その値を選んだ商品ページ」へのリンク（?サイズ=M など）になる。
 * 選択中の値は、表示中のバリアント（selectedVariant）から決める。
 */
export function VariantSelector({
  handle,
  options,
  variants,
  selectedVariant,
  children,
}: {
  handle: string;
  options: Array<{name: string; values: string[]}>;
  variants: VariantLike[];
  selectedVariant?: VariantLike | null;
  children: (args: {
    option: {
      name: string;
      values: Array<{value: string; isAvailable: boolean; isActive: boolean; to: string}>;
    };
  }) => ReactNode;
}) {
  const current = new Map(
    (selectedVariant?.selectedOptions ?? []).map((o) => [o.name, o.value] as const),
  );
  return (
    <>
      {options.map((option) => {
        const values = option.values.map((value) => {
          const wanted = new Map(current);
          wanted.set(option.name, value);
          // 他の選択はそのままで、この値に変えたバリアント。無ければこの値を含む最初のバリアント
          const exact = variants.find((v) =>
            v.selectedOptions.every((o) => wanted.get(o.name) === o.value),
          );
          const fallback = variants.find((v) =>
            v.selectedOptions.some((o) => o.name === option.name && o.value === value),
          );
          const target = exact ?? fallback;
          const params = new URLSearchParams();
          for (const o of target?.selectedOptions ?? []) params.set(o.name, o.value);
          if (!target) params.set(option.name, value);
          return {
            value,
            isAvailable: Boolean(target?.availableForSale),
            isActive: current.get(option.name) === value,
            to: `/products/${handle}?${params.toString()}`,
          };
        });
        return <Fragment key={option.name}>{children({option: {name: option.name, values}})}</Fragment>;
      })}
    </>
  );
}
