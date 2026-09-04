import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  Await,
  useLoaderData,
  useOutletContext,
  Link,
} from '@remix-run/react';
import {Suspense, useState} from 'react';
import {
  Image,
  Money,
  VariantSelector,
  getSelectedProductOptions,
  getSeoMeta,
  CartForm,
} from '@shopify/hydrogen';
import {PRODUCT_QUERY, RELATED_PRODUCTS_QUERY} from '~/lib/queries';
import {getBrandConfig} from '~/lib/brand.server';
import {stripHtml, titleTemplate, breadcrumbJsonLd, originOf} from '~/lib/seo';
import clsx from 'clsx';
import {isBoldBrand} from '~/lib/brands';
import ProductCard from '~/components/ProductCard';
import FaqSection from '~/components/FaqSection';

export const meta = ({data}: any) => {
  if (!data?.product) return [{title: '商品'}];
  const {product, seoUrl, brandName, origin} = data;
  const price = product.selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const canonical = seoUrl.split('?')[0];
  const description = product.descriptionHtml
    ? stripHtml(product.descriptionHtml)
    : undefined;

  return getSeoMeta({
    title: product.title,
    titleTemplate: titleTemplate(brandName),
    description,
    url: seoUrl,
    media: product.images.nodes[0]
      ? {url: product.images.nodes[0].url, altText: product.images.nodes[0].altText ?? product.title}
      : undefined,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description,
        image: product.images.nodes.map((img: any) => img.url),
        sku: product.selectedVariant?.sku ?? undefined,
        brand: {'@type': 'Brand', name: brandName},
        offers: {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: price.currencyCode,
          price: price.amount,
          itemCondition: 'https://schema.org/NewCondition',
          availability: product.selectedVariant?.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {'@type': 'Organization', name: brandName},
        },
      },
      breadcrumbJsonLd(origin, [
        {name: 'ホーム', path: '/'},
        {name: '全商品', path: '/products'},
        {name: product.title, path: `/products/${product.handle}`},
      ]),
    ],
  });
};

const TRUST_ICONS: Record<'delivery' | 'material' | 'care' | 'print', JSX.Element> = {
  delivery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="7" width="13" height="10" rx="1" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="6" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  ),
  material: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h10l6 6v10H4z" />
      <path d="M14 4v6h6" />
    </svg>
  ),
  care: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
  print: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z" />
    </svg>
  ),
};

function StepBadge({n, label}: {n: number; label: string}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
        style={{backgroundColor: 'var(--color-primary)', color: '#fff'}}
      >
        {n}
      </span>
      <p
        className="text-xs tracking-widest uppercase"
        style={{color: 'var(--color-text-muted)'}}
      >
        {label}
      </p>
    </div>
  );
}

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {handle} = params;
  if (!handle) throw new Response('Not found', {status: 404});

  const brand = getBrandConfig(context.env, request);
  const selectedOptions = getSelectedProductOptions(request);

  const product = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  if (!product.product) throw new Response('Not found', {status: 404});

  // このShopifyストアは他ブランド（BridesmaidsJP等）と共有されているため、
  // custom-printブランドではタイトルが「カスタムプリント」を含む商品のみ許可する
  // （custom-printコレクションの絞り込みルールと同じ条件）。
  // これがないと、他ブランドの商品handleを直接叩けば表示できてしまう。
  if (
    brand.id === 'custom-print' &&
    !product.product.title.includes('カスタムプリント')
  ) {
    throw new Response('Not found', {status: 404});
  }

  // 「同じジャンルの商品」として、ナビゲーションのカテゴリ名と一致する
  // タグ（例: バッグ・レディース）を優先し、なければ素材タグや商品コード
  // （P37Bのような英数字のみのタグ）を除く最初のタグで絞り込む。
  // ギャラリー等は待たせたくないので defer して後から流し込む。
  const navLabels = new Set(brand.nav.map((n) => n.label));
  const skuLikeTag = /^[a-z0-9]+$/i;
  const relatedTag =
    product.product.tags.find((tag: string) => navLabels.has(tag)) ??
    product.product.tags.find(
      (tag: string) => !tag.startsWith('素材:') && !skuLikeTag.test(tag),
    );
  const relatedProducts = relatedTag
    ? context.storefront
        .query(RELATED_PRODUCTS_QUERY, {
          variables: {
            searchQuery: `tag:'${relatedTag}' -handle:'${handle}'`,
            first: 5,
            country: context.storefront.i18n.country,
            language: context.storefront.i18n.language,
          },
        })
        .then((data: any) =>
          data.products.nodes.filter((p: any) => p.handle !== handle).slice(0, 4),
        )
    : Promise.resolve([]);

  return defer({
    product: product.product,
    brandId: brand.id,
    relatedProducts,
    seoUrl: request.url,
    brandName: brand.name,
    origin: originOf(request),
  });
}

export default function ProductDetail() {
  const {product, brandId, relatedProducts} = useLoaderData<typeof loader>();
  const {onCartOpen} = useOutletContext<{onCartOpen: () => void}>();
  const isAvantGarde = isBoldBrand(brandId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [printNote, setPrintNote] = useState('');
  const [printFile, setPrintFile] = useState<{url: string; fileName: string} | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedVariant = product.selectedVariant ?? product.variants.nodes[0];
  const isAvailable = selectedVariant?.availableForSale;

  // 画像と動画（Shopify商品メディア）を1つのギャラリーとして扱う。
  // 動画がある商品は、着用イメージが伝わりやすい動画を先頭に出す。
  const videoItems = (product.media?.nodes ?? []).filter(
    (n: any) => n.__typename === 'Video',
  );
  const galleryItems = [
    ...videoItems.map((v: any) => ({type: 'video' as const, video: v})),
    ...product.images.nodes.map((img: any) => ({type: 'image' as const, image: img})),
  ];
  const selectedItem = galleryItems[selectedImage];

  // カスタムプリント商品は、入稿データと指定内容を注文明細
  // （line item properties）として持たせる。
  // CANVASWEARサイトは全商品がカスタムプリント対応（Aloloreの
  // カスタムプリントコレクションのみを表示するため）。
  // 他ブランドで個別商品にだけ入稿欄を出したい場合のために
  // `custom-print` タグでも判定できるようにしておく。
  const isCustomPrint =
    brandId === 'custom-print' ||
    product.tags.some((tag: string) => tag.toLowerCase() === 'custom-print');

  const materialTag = product.tags.find((tag: string) => tag.startsWith('素材:'));
  const trustItems = [
    {
      icon: TRUST_ICONS.delivery,
      label: '納期',
      text: '受注生産のため、ご注文から約1ヶ月でお届けします。',
    },
    ...(materialTag
      ? [
          {
            icon: TRUST_ICONS.material,
            label: '素材',
            text: materialTag.replace('素材:', ''),
          },
        ]
      : []),
    {
      icon: TRUST_ICONS.care,
      label: 'お手入れ',
      text: '染料が生地の繊維に定着するため、洗濯を重ねても色落ちやひび割れが起きにくい仕上がりです。',
    },
    {
      icon: TRUST_ICONS.print,
      label: '昇華プリント',
      text: '写真もイラストも全面フルカラーで再現できます。',
    },
  ];

  const attributes = isCustomPrint
    ? [
        ...(printFile
          ? [
              {key: 'プリント画像', value: printFile.url},
              {key: 'ファイル名', value: printFile.fileName},
            ]
          : []),
        ...(printNote.trim() ? [{key: 'プリント内容', value: printNote.trim()}] : []),
      ]
    : [];

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/upload', {method: 'POST', body});
      const data: any = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? 'アップロードに失敗しました');
      }
      setPrintFile({url: data.url, fileName: data.fileName});
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'アップロードに失敗しました',
      );
      setPrintFile(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="section-pad">
      <div className="container-brand">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* 画像 */}
          <div className="space-y-3">
            <div
              className="aspect-[3/4] overflow-hidden"
              style={{borderRadius: 'var(--radius)'}}
            >
              {selectedItem?.type === 'video' ? (
                <video
                  key={selectedItem.video.id}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  poster={selectedItem.video.previewImage?.url}
                >
                  {selectedItem.video.sources
                    .filter((s: any) => s.format === 'mp4')
                    .map((s: any) => (
                      <source key={s.url} src={s.url} type="video/mp4" />
                    ))}
                </video>
              ) : selectedItem ? (
                <Image
                  data={selectedItem.image}
                  className={clsx(
                    'w-full h-full object-cover',
                    isAvantGarde &&
                      'grayscale hover:grayscale-0 transition-all duration-500',
                  )}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{backgroundColor: 'var(--color-border)'}}
                >
                  <span
                    className="text-xs tracking-widest"
                    style={{color: 'var(--color-text-muted)'}}
                  >
                    NO IMAGE
                  </span>
                </div>
              )}
            </div>

            {/* サムネイル */}
            {galleryItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={clsx(
                      'relative flex-shrink-0 w-16 h-20 overflow-hidden transition-opacity',
                      i === selectedImage ? 'opacity-100' : 'opacity-50 hover:opacity-80',
                    )}
                    style={{
                      borderRadius: 'var(--radius)',
                      outline:
                        i === selectedImage
                          ? '1px solid var(--color-primary)'
                          : 'none',
                    }}
                  >
                    {item.type === 'video' ? (
                      <>
                        {item.video.previewImage?.url && (
                          <img
                            src={item.video.previewImage.url}
                            alt={item.video.alt ?? ''}
                            className={clsx(
                              'w-full h-full object-cover',
                              isAvantGarde && 'grayscale',
                            )}
                          />
                        )}
                        <span
                          className="absolute inset-0 flex items-center justify-center text-white text-xs"
                          style={{backgroundColor: 'rgba(0,0,0,0.25)'}}
                          aria-hidden="true"
                        >
                          ▶
                        </span>
                      </>
                    ) : (
                      <Image
                        data={item.image}
                        className={clsx(
                          'w-full h-full object-cover',
                          isAvantGarde && 'grayscale',
                        )}
                        sizes="64px"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 商品情報 */}
          <div className="py-2">
            <div className="mb-6">
              <h1
                className={clsx(
                  'text-display-md mb-4',
                  isAvantGarde ? 'tracking-[0.08em] uppercase' : 'italic',
                )}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: isAvantGarde ? 400 : 300,
                  color: 'var(--color-text)',
                }}
              >
                {product.title}
              </h1>
              <p
                className="flex items-baseline gap-2"
                style={{
                  color: isAvantGarde ? 'var(--color-text)' : 'var(--color-primary)',
                }}
              >
                {selectedVariant && (
                  <span
                    className="font-bold"
                    style={{fontSize: 'clamp(1.75rem, 4vw, 2.25rem)'}}
                  >
                    <Money
                      as="span"
                      data={selectedVariant.price}
                      withoutTrailingZeros
                    />
                  </span>
                )}
                <span
                  className="text-xs"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  {isAvantGarde ? 'TAX INCL.' : '税込'}
                </span>
              </p>
            </div>

            {/* バリアント選択 */}
            {isCustomPrint &&
              product.options.some((o: any) => o.values.length > 1) && (
                <StepBadge n={1} label="サイズ・カラーを選ぶ" />
              )}
            <VariantSelector
              handle={product.handle}
              options={product.options.filter((o: any) => o.values.length > 1)}
              variants={product.variants.nodes}
            >
              {({option}) => (
                <div className="mb-6">
                  <p
                    className="text-xs tracking-widest uppercase mb-3"
                    style={{color: 'var(--color-text-muted)'}}
                  >
                    {option.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map(({value, isAvailable: optAvailable, isActive, to}) => (
                      <Link
                        key={value}
                        to={to}
                        prefetch="intent"
                        replace
                        className="px-4 py-2 text-xs tracking-wider uppercase transition-all duration-150"
                        style={{
                          borderRadius: 'var(--radius)',
                          backgroundColor: isActive
                            ? 'var(--color-text)'
                            : 'transparent',
                          color: isActive
                            ? 'var(--color-bg)'
                            : optAvailable
                            ? 'var(--color-text)'
                            : 'var(--color-text-muted)',
                          border: '1px solid var(--color-border)',
                          opacity: optAvailable ? 1 : 0.4,
                          cursor: optAvailable ? 'pointer' : 'not-allowed',
                        }}
                        aria-disabled={!optAvailable}
                      >
                        {value}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </VariantSelector>

            {/* カスタムプリントの入稿 */}
            {isCustomPrint && (
              <div className="mb-6">
                <StepBadge n={2} label="デザインデータを入稿" />

                <label
                  className="flex items-center justify-center gap-2 w-full p-4 text-sm cursor-pointer transition-colors"
                  style={{
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading
                    ? 'アップロード中...'
                    : printFile
                    ? `${printFile.fileName} を選択中（変更する）`
                    : 'ファイルを選ぶ（PNG / JPEG・20MBまで）'}
                </label>

                {/* 権利侵害データは製作を中止せざるを得ず、受注生産のため返金もできない。
                    FAQまで読まない人が多いので、実際に入稿するこの場所にも出す。 */}
                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{color: 'var(--color-primary)'}}
                >
                  キャラクター・ブランドロゴ・芸能人の写真など、著作権のあるデータはお受けできません。
                </p>

                {printFile && (
                  <div className="flex items-center gap-3 mt-3">
                    <img
                      src={printFile.url}
                      alt="入稿データのプレビュー"
                      className="w-16 h-16 object-cover"
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                      }}
                      onError={(e) => {
                        // PDF等はプレビューできないので枠だけ残す
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPrintFile(null)}
                      className="text-xs underline transition-opacity hover:opacity-60"
                      style={{color: 'var(--color-text-muted)'}}
                    >
                      取り消す
                    </button>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs mt-2" style={{color: 'var(--color-accent)'}}>
                    {uploadError}
                  </p>
                )}
              </div>
            )}

            {/* カスタムプリントの指定 */}
            {isCustomPrint && (
              <div className="mb-6">
                <StepBadge n={3} label="ご指定・ご要望" />
                <textarea
                  id="print-note"
                  aria-label="ご指定・ご要望"
                  value={printNote}
                  onChange={(e) => setPrintNote(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="入れる文字、配置、色味のご希望などをご記入ください"
                  className="w-full p-3 text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <p className="text-xs mt-2" style={{color: 'var(--color-text-muted)'}}>
                  ご記入内容がそのまま注文情報に記録されます（{printNote.length}/200）
                </p>
              </div>
            )}

            {/* カートボタン */}
            <div className="space-y-3 mb-8">
              {isCustomPrint && <StepBadge n={4} label="カートに追加" />}
              {isAvailable && selectedVariant?.id ? (
                <CartForm
                  route="/cart"
                  action={CartForm.ACTIONS.LinesAdd}
                  inputs={{
                    lines: [
                      {
                        merchandiseId: selectedVariant.id,
                        quantity: 1,
                        attributes,
                      },
                    ],
                  }}
                >
                  {(fetcher: any) => {
                    const adding = fetcher.state !== 'idle';
                    return (
                      <button
                        type="submit"
                        onClick={onCartOpen}
                        disabled={adding}
                        className={clsx(
                          'btn-primary w-full text-center transition-opacity',
                          adding && 'opacity-60',
                        )}
                      >
                        {adding
                          ? isAvantGarde
                            ? 'ADDING...'
                            : '追加中...'
                          : isAvantGarde
                          ? 'ADD TO CART'
                          : 'カートに追加'}
                      </button>
                    );
                  }}
                </CartForm>
              ) : (
                <button
                  disabled
                  className="btn-primary w-full opacity-40 cursor-not-allowed text-center"
                >
                  {isAvantGarde ? 'SOLD OUT' : '売り切れ'}
                </button>
              )}
            </div>

            {/* 信頼性セクション */}
            <div
              className="grid grid-cols-2 gap-4 mb-8 pt-6"
              style={{borderTop: '1px solid var(--color-border)'}}
            >
              {trustItems.map(({icon, label, text}) => (
                <div key={label} className="flex gap-3">
                  <span
                    className="w-6 h-6 shrink-0"
                    style={{color: 'var(--color-primary)'}}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                  <div>
                    <p
                      className="text-xs font-bold mb-1"
                      style={{color: 'var(--color-text)'}}
                    >
                      {label}
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{color: 'var(--color-text-muted)'}}
                    >
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 商品説明 */}
            {product.descriptionHtml && (
              <div
                className="prose prose-sm max-w-none"
                style={{color: 'var(--color-text-muted)'}}
                dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
              />
            )}

            {/* タグ */}
            {product.tags.length > 0 && (
              <div
                className="mt-6 pt-6"
                style={{borderTop: '1px solid var(--color-border)'}}
              >
                <p
                  className="text-xs tracking-widest uppercase mb-3"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  {isAvantGarde ? 'TAGS' : 'タグ'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1"
                      style={{
                        color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 関連商品 */}
        <Suspense fallback={null}>
          <Await resolve={relatedProducts}>
            {(items: any[]) =>
              items.length > 0 && (
                <div className="mt-16 pt-16" style={{borderTop: '1px solid var(--color-border)'}}>
                  <h2
                    className="text-center mb-8"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: isAvantGarde ? 400 : 300,
                      fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {isAvantGarde ? 'YOU MAY ALSO LIKE' : '合わせて見られています'}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {items.map((item) => (
                      <ProductCard key={item.id} product={item} brandId={brandId} />
                    ))}
                  </div>
                </div>
              )
            }
          </Await>
        </Suspense>
      </div>

      <FaqSection compact />
    </div>
  );
}
