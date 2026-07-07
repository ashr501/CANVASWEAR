// 環境変数が未設定のときに使うフォールバック値。
// publicStorefrontToken はブラウザ露出前提の「公開」トークン（商品読み取りのみ）なのでコミット可。
// PRIVATEトークンやSESSION_SECRETは絶対にここに書かないこと。
export const FALLBACK_STORE = {
  // TODO: xxxx.myshopify.com 形式のストアドメイン
  storeDomain: 'REPLACE_ME.myshopify.com',
  // TODO: Storefront APIの公開アクセストークン
  publicStorefrontToken: 'REPLACE_ME',
};
