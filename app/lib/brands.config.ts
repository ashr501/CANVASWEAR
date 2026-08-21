// 環境変数が未設定のときに使うフォールバック値。
// publicStorefrontToken はブラウザ露出前提の「公開」トークン（商品読み取りのみ）なのでコミット可。
// PRIVATEトークンやSESSION_SECRETは絶対にここに書かないこと。
export const FALLBACK_STORE = {
  // BridesmaidsJPストア。Storefront APIはmyshopify.comドメインで呼ぶのが確実
  // （独自ドメイン shop.bridesmaids.jp でも通ることはあるが、リダイレクトで失敗しやすい）
  storeDomain: 'bridesmaidsjp.myshopify.com',
  // TODO: Storefront APIの公開アクセストークンを設定（設定するまでサイトは案内ページを表示）
  publicStorefrontToken: 'REPLACE_ME',
};
