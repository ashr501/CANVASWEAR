import type {CartDataFromHandlers} from '@shopify/hydrogen';
import {createCartComponents} from '@shopify/hydrogen/react';
import type {cartHandlers} from '~/lib/cart-handlers';

export type CartData = CartDataFromHandlers<typeof cartHandlers>;

export const {CartProvider, useCart, useCartForm, useCartActions} =
  createCartComponents<typeof cartHandlers>();

type CartLineAddInput = {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{key: string; value: string}>;
};

type StandardActions = {
  updateCart: ((payload: {lines: CartLineAddInput[]}) => Promise<{
    userErrors?: Array<{message: string}>;
  }>) & {isDefault(): boolean};
};

/**
 * 商品をカートに入れる（入稿データ・お急ぎ仕上げの明細属性つき）。
 * Shopifyの標準アクション経由で送るので、カートの表示（ドロワー・件数）も自動で更新される。
 * 本体とお急ぎ仕上げは1回の呼び出しでまとめて送る（別々に送ると、カートが2つできることがある）。
 */
export async function addLinesToCart(lines: CartLineAddInput[]): Promise<void> {
  const actions = await waitForCartActions();
  const result = await actions.updateCart({lines});
  const message = result?.userErrors?.map((e) => e.message).join('\n');
  if (message) throw new Error(message);
}

/** カートの仕組みの準備（CartProviderが送り先を設定するまで）を最大5秒待つ */
async function waitForCartActions(): Promise<StandardActions> {
  for (let i = 0; i < 50; i++) {
    const actions = (window as any).Shopify?.actions as StandardActions | undefined;
    if (actions?.updateCart && !actions.updateCart.isDefault()) return actions;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('カートの準備ができませんでした。ページを再読み込みしてもう一度お試しください。');
}
