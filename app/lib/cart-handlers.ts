import {createCartServerHandlers} from '@shopify/hydrogen';

// 標準のカート問い合わせに、行の属性（入稿内容・お急ぎ仕上げ）と商品ハンドルが含まれているので追加項目は不要
export const cartHandlers = createCartServerHandlers();
