import translations from './chat-translations.ja.json';

/**
 * Shopify Inbox（AIチャット）の表示文言とあいさつ。
 * 通常のShopifyテーマではアプリ埋め込みが <script id="shopify-chat-page-data"> を自動で出すが、
 * Hydrogenでは出ないため、同じ形のデータをここで作る（無いとチャットが英語で表示される）。
 * 文言は Alo Lore（同じストア）のアプリ埋め込みが出している日本語訳の写し（2026/10/21時点）。
 */
export function getChatPageData(shopName: string) {
  return {
    greetingMessage: `${shopName}へようこそ。何かお手伝いできることはありますか？`,
    customerServiceEmail: 'contact@e-clat.jp',
    onlineStorePasswordProtected: false,
    continueAsChip: true,
    exportCommand: false,
    shopName,
    translations,
  };
}
