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
  CartForm,
} from '@shopify/hydrogen';
import {PRODUCT_QUERY} from '~/lib/queries';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';
import {isBoldBrand} from '~/lib/brands';

export const meta = ({data}: any) => [
  {title: data?.product?.title ?? '商品'},
];

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

  return defer({product: product.product, brandId: brand.id});
}

export default function ProductDetail() {
  const {product, brandId} = useLoaderData<typeof loader>();
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

  // カスタムプリント商品は、入稿データと指定内容を注文明細
  // （line item properties）として持たせる。
  // CANVASWEARサイトは全商品がカスタムプリント対応（Aloloreの
  // カスタムプリントコレクションのみを表示するため）。
  // 他ブランドで個別商品にだけ入稿欄を出したい場合のために
  // `custom-print` タグでも判定できるようにしておく。
  const isCustomPrint =
    brandId === 'custom-print' ||
    product.tags.some((tag: string) => tag.toLowerCase() === 'custom-print');

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
              {product.images.nodes[selectedImage] ? (
                <Image
                  data={product.images.nodes[selectedImage]}
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
            {product.images.nodes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.nodes.map((img: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={clsx(
                      'flex-shrink-0 w-16 h-20 overflow-hidden transition-opacity',
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
                    <Image
                      data={img}
                      className={clsx(
                        'w-full h-full object-cover',
                        isAvantGarde && 'grayscale',
                      )}
                      sizes="64px"
                    />
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
                className="text-xl"
                style={{
                  color: isAvantGarde ? 'var(--color-text)' : 'var(--color-primary)',
                }}
              >
                {selectedVariant && <Money data={selectedVariant.price} />}
              </p>
            </div>

            {/* バリアント選択 */}
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
                <p
                  className="block text-xs tracking-widest uppercase mb-3"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  デザインデータ
                </p>

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
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading
                    ? 'アップロード中...'
                    : printFile
                    ? `${printFile.fileName} を選択中（変更する）`
                    : 'ファイルを選ぶ（PNG / JPEG / WebP / SVG / PDF・20MBまで）'}
                </label>

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
                <label
                  htmlFor="print-note"
                  className="block text-xs tracking-widest uppercase mb-3"
                  style={{color: 'var(--color-text-muted)'}}
                >
                  ご指定・ご要望
                </label>
                <textarea
                  id="print-note"
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
      </div>
    </div>
  );
}
