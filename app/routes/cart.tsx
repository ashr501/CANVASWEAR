import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {defer} from '@shopify/remix-oxygen';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';

export const meta = () => [{title: 'カート'}];

export async function loader({context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env);
  const cart = context.cart.get();
  return defer({cart, brandId: brand.id});
}

export default function CartPage() {
  const {cart, brandId} = useLoaderData<typeof loader>();
  const isAvantGarde = brandId === 'avant-garde';

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

        <Suspense
          fallback={
            <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>
              読み込み中...
            </div>
          }
        >
          <Await resolve={cart}>
            {(resolvedCart: any) => {
              if (!resolvedCart || resolvedCart.totalQuantity === 0) {
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
                          {line.merchandise.image && (
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
                              {line.merchandise.product.title}
                            </p>
                            <p className="text-xs mt-1" style={{color: 'var(--color-text-muted)'}}>
                              {line.merchandise.selectedOptions
                                .filter((o: any) => o.value !== 'Default Title')
                                .map((o: any) => o.value)
                                .join(' / ')}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                              <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                                ×{line.quantity}
                              </p>
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
                        href={resolvedCart.checkoutUrl}
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
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
