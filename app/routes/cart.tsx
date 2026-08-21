import {
  json,
  defer,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money, CartForm, type CartQueryDataReturn} from '@shopify/hydrogen';
import {getBrandConfig} from '~/lib/brand.server';
import clsx from 'clsx';
import {isBoldBrand} from '~/lib/brands';

export const meta = () => [{title: 'カート'}];

/**
 * サイト全体のカート操作をここで受ける。
 * 商品ページやカートドロワーの <CartForm route="/cart"> がこのactionに送信する。
 */
export async function action({request, context}: ActionFunctionArgs) {
  const {cart} = context;
  const formData = await request.formData();
  const {action: cartAction, inputs} = CartForm.getFormInput(formData);

  if (!cartAction) {
    throw new Error('カート操作が指定されていません');
  }

  let result: CartQueryDataReturn;

  switch (cartAction) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;
      const discountCodes = (formDiscountCode ? [formDiscountCode] : []) as string[];
      discountCodes.push(...inputs.discountCodes);
      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    default:
      throw new Error(`未対応のカート操作です: ${cartAction}`);
  }

  // 新規カートのIDをCookieに書き戻す（これを忘れると毎回空のカートになる）
  const headers = result?.cart?.id ? cart.setCartId(result.cart.id) : new Headers();

  return json(result, {status: 200, headers});
}

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  const cart = context.cart.get();
  return defer({cart, brandId: brand.id});
}

export default function CartPage() {
  const {cart, brandId} = useLoaderData<typeof loader>();
  const isAvantGarde = isBoldBrand(brandId);

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

                            {/* カスタムプリント等の指定内容（line item properties） */}
                            {line.attributes?.length > 0 && (
                              <ul className="mt-2 space-y-0.5">
                                {line.attributes.map((attr: any) => (
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
                              <CartLineQuantity line={line} />
                              <Money
                                data={line.cost.totalAmount}
                                className="text-sm"
                                style={{color: 'var(--color-text)'} as any}
                              />
                            </div>

                            <CartForm
                              route="/cart"
                              action={CartForm.ACTIONS.LinesRemove}
                              inputs={{lineIds: [line.id]}}
                            >
                              <button
                                type="submit"
                                className="text-xs mt-3 underline transition-opacity hover:opacity-60"
                                style={{color: 'var(--color-text-muted)'}}
                              >
                                削除
                              </button>
                            </CartForm>
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

function CartLineQuantity({line}: {line: any}) {
  const {id, quantity} = line;

  return (
    <div className="flex items-center gap-3">
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesUpdate}
        inputs={{lines: [{id, quantity: Math.max(0, quantity - 1)}]}}
      >
        <button
          type="submit"
          className="w-7 h-7 flex items-center justify-center text-sm transition-opacity hover:opacity-60"
          style={{border: '1px solid var(--color-border)', color: 'var(--color-text)'}}
          aria-label="数量を減らす"
        >
          −
        </button>
      </CartForm>

      <span className="text-xs w-4 text-center" style={{color: 'var(--color-text)'}}>
        {quantity}
      </span>

      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesUpdate}
        inputs={{lines: [{id, quantity: quantity + 1}]}}
      >
        <button
          type="submit"
          className="w-7 h-7 flex items-center justify-center text-sm transition-opacity hover:opacity-60"
          style={{border: '1px solid var(--color-border)', color: 'var(--color-text)'}}
          aria-label="数量を増やす"
        >
          +
        </button>
      </CartForm>
    </div>
  );
}
