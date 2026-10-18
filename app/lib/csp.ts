/**
 * Content-Security-Policy（どこから読み込んでよいかの許可リスト）。
 * 旧Hydrogenの createContentSecurityPolicy が無くなったため、同じ内容をここで組み立てる。
 * Shopifyのスクリプト（カート・分析・同意バナー・Inboxチャット）が使う通信先も許可している。
 */
export function createContentSecurityPolicy({
  storeDomain,
  uploadOrigin,
  isDev,
}: {
  storeDomain: string;
  uploadOrigin: string | null;
  isDev: boolean;
}) {
  const nonce = createNonce();
  const shopifyHosts = [
    'https://cdn.shopify.com',
    'https://shopify.com',
    'https://*.shopify.com',
    'https://*.shopifysvc.com',
    'https://*.shopifycloud.com',
    'https://*.shopifyapps.com',
    'https://*.shopify.ai',
    'https://shop.app',
  ];
  const store = storeDomain ? [`https://${storeDomain}`] : [];
  const directives: Record<string, string[]> = {
    'base-uri': ["'self'"],
    'default-src': ["'self'", 'https://cdn.shopify.com', 'https://shopify.com', `'nonce-${nonce}'`],
    'script-src': ["'self'", 'https://cdn.shopify.com', `'nonce-${nonce}'`],
    'frame-ancestors': ["'self'"],
    'frame-src': ["'self'", ...shopifyHosts],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.shopify.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdn.shopify.com'],
    'connect-src': [
      "'self'",
      ...shopifyHosts,
      ...store,
      ...(isDev ? ['ws://localhost:*', 'ws://127.0.0.1:*'] : []),
    ],
    // LINE公式アカウントのQRコード画像（お問い合わせページ）と、入稿ファイル（R2）のプレビューを許可
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      ...shopifyHosts,
      'https://qr-official.line.me',
      ...(uploadOrigin ? [uploadOrigin] : []),
    ],
    // 商品動画は cdn.shopify.com ではなくストアのプライマリドメイン（alolore.shop/cdn/shop/videos/...）から配信される
    'media-src': ["'self'", 'data:', 'blob:', 'https://cdn.shopify.com', 'https://alolore.shop'],
  };
  const header = Object.entries(directives)
    .map(([name, values]) => `${name} ${[...new Set(values)].join(' ')}`)
    .join('; ');
  return {nonce, header};
}

function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
