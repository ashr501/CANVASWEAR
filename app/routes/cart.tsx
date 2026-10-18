import {type LoaderFunctionArgs, useLoaderData, Link} from 'react-router';
import {Image, Money} from '~/lib/shopify-ui';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';
import {isBoldBrand} from '~/lib/brands';
import {useCart} from '~/lib/cart';
import {CartLineControls} from '~/components/CartLineControls';

export const meta = () => [{title: 'カート'}];

// カートの中身はルートで読み込んだもの（CartProvider）を使う。追加・変更は /api/cart が受ける
export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  return {brandId: brand.id};
}

export default function CartPage() {
  const {brandId} = useLoaderData<typeof loader>();
  const isAvantGarde = isBoldBrand(brandId);
  const resolvedCart = useCart((state) => state.data);
  const loading = useCart((state) => state.loading);
  const totalsPending = useCart((state) => state.pending.cost === true || state.revalidating === true);

  return (
    <div className="section-pad">
      <div className="container-brand max-w-4xl">
        <div className="mb-10">
          <h1
            className={clsx(
              'text-display-lg',
              isAvantGarde ? 'tracking-[0.1em] uppercase' : 'italic',
            )}
            style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
          >
            {isAvantGarde ? 'YOUR CART' : 'カート'}
          </h1>
        </div>

        {loading ? (
          <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>
            読み込み中...
          </div>
        ) : (() => {
              if (!resolvedCart || resolvedCart.totalQuantity === 0 || resolvedCart.lines.nodes.length === 0) {
                return (
                  <div className="text-center py-24">
                    <p
                      className="text-sm tracking-widest mb-8"
                      style={{color: 'var(--color-text-muted)'}}
                    >
                      {isAvantGarde ? 'YOUR CART IS EMPTY' : 'カートは空です'}
                    </p>
                    <Link to="/products" className="btn-primary">
                      {isAvantGarde ? 'SHOP NOW' : 'ショッピングを続ける'}
                    </Link>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* アイテムリスト */}
                  <div className="md:col-span-2">
                    <ul style={{borderTop: '1px solid var(--color-border)'}}>
                      {resolvedCart.lines.nodes.map((line: any) => (
                        <li
                          key={line.id}
                          className="flex gap-5 py-6"
                          style={{borderBottom: '1px solid var(--color-border)'}}
                        >
                          {line.merchandise?.image && (
                            <div
                              className="w-24 h-32 flex-shrink-0 overflow-hidden"
                              style={{borderRadius: 'var(--radius)'}}
                            >
                              <Image
                                data={line.merchandise.image}
                                className={clsx(
                                  'w-full h-full object-cover',
                                  isAvantGarde && 'grayscale',
                                )}
                                sizes="96px"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm" style={{color: 'var(--color-text)'}}>
                              {line.merchandise?.product?.title ?? line.merchandise?.title}
                            </p>
                            <p className="text-xs mt-1" style={{color: 'var(--color-text-muted)'}}>
                              {(line.merchandise?.selectedOptions ?? [])
                                .filter((o: any) => o.value !== 'Default Title')
                                .map((o: any) => o.value)
                                .join(' / ')}
                            </p>

                            {/* カスタムプリント等の指定内容（line item properties） */}
                            {line.attributes?.some((a: any) => !a.key.startsWith('_')) && (
                              <ul className="mt-2 space-y-0.5">
                                {line.attributes.filter((a: any) => !a.key.startsWith('_')).map((attr: any) => (
                                  <li
                                    key={attr.key}
                                    className="text-xs"
                                    style={{color: 'var(--color-text-muted)'}}
                                  >
                                    {attr.key}: {attr.value}
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="flex items-center justify-between mt-4">
                              <CartLineControls line={line} />
                              <Money
                                data={line.cost.totalAmount}
                                className="text-sm"
                                style={{color: 'var(--color-text)'} as any}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 合計 */}
                  <div>
                    <div
                      className="sticky top-24 p-6 space-y-4"
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      <h2
                        className="text-xs tracking-widest uppercase"
                        style={{color: 'var(--color-text-muted)'}}
                      >
                        {isAvantGarde ? 'ORDER SUMMARY' : '注文サマリー'}
                      </h2>
                      <div
                        className="space-y-2 py-4"
                        style={{borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)'}}
                      >
                        <div className="flex justify-between text-sm">
                          <span style={{color: 'var(--color-text-muted)'}}>小計</span>
                          <Money
                            data={resolvedCart.cost.subtotalAmount}
                            className={totalsPending ? 'opacity-40' : undefined}
                            style={{color: 'var(--color-text)'} as any}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span style={{color: 'var(--color-text-muted)'}}>送料</span>
                          <span
                            className="text-xs"
                            style={{color: 'var(--color-text-muted)'}}
                          >
                            チェックアウト時に計算
                          </span>
                        </div>
                      </div>
                      <a
                        href={resolvedCart.checkoutUrl ?? '/checkout'}
                        className="btn-primary w-full text-center block"
                      >
                        {isAvantGarde ? 'PROCEED TO CHECKOUT' : 'チェックアウトへ進む'}
                      </a>
                      <Link
                        to="/products"
                        className="btn-outline w-full text-center block text-xs"
                      >
                        {isAvantGarde ? 'CONTINUE SHOPPING' : 'ショッピングを続ける'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
        })()}
      </div>
    </div>
  );
}
