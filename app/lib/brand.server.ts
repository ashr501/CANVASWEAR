export type BrandId = 'elegant-plus' | 'avant-garde';

export interface BrandConfig {
  id: BrandId;
  name: string;
  nameJa: string;
  tagline: string;
  taglineJa: string;
  storeDomain: string;
  storefrontApiToken: string;
  theme: BrandTheme;
  /** Storefront APIの商品絞り込みに使うタグ（1ストア内でブランドを分離する） */
  productTag: string;
  /** ブランド専用スマートコレクションのハンドル */
  collections: {
    featured: string;
    newArrivals: string;
  };
}

export interface BrandTheme {
  cssVars: Record<string, string>;
  googleFonts: string;
}

const themes: Record<BrandId, BrandTheme> = {
  'elegant-plus': {
    cssVars: {
      '--color-bg': '#FAFAF8',
      '--color-surface': '#FFFFFF',
      '--color-primary': '#C9A96E',
      '--color-secondary': '#8B6914',
      '--color-accent': '#C9A96E',
      '--color-text': '#2C2416',
      '--color-text-muted': '#8A7968',
      '--color-border': '#E8E0D4',
      '--font-heading': "'Cormorant Garamond'",
      '--font-body': "'Noto Serif JP'",
      '--section-spacing': '5rem',
      '--gutter': '1.5rem',
      '--ease': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      '--radius': '2px',
    },
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Noto+Serif+JP:wght@300;400;500&display=swap',
  },
  'avant-garde': {
    cssVars: {
      '--color-bg': '#0D0D0D',
      '--color-surface': '#1A1A1A',
      '--color-primary': '#E8E8E8',
      '--color-secondary': '#B0B0B0',
      '--color-accent': '#CC0000',
      '--color-text': '#E8E8E8',
      '--color-text-muted': '#808080',
      '--color-border': '#2A2A2A',
      '--font-heading': "'Bebas Neue'",
      '--font-body': "'Noto Sans JP'",
      '--section-spacing': '6rem',
      '--gutter': '1.5rem',
      '--ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
      '--radius': '0px',
    },
    googleFonts:
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans+JP:wght@300;400;500;700&display=swap',
  },
};

const brandMeta: Record<
  BrandId,
  Pick<BrandConfig, 'name' | 'nameJa' | 'tagline' | 'taglineJa' | 'productTag' | 'collections'>
> = {
  'elegant-plus': {
    name: 'HAORI+',
    nameJa: 'ハオリプラス',
    tagline: 'Elegance Without Limits',
    taglineJa: '大きなサイズの美しさを、すべての女性へ',
    productTag: 'brand:elegant-plus',
    collections: {
      featured: 'elegant-featured',
      newArrivals: 'elegant-new-arrivals',
    },
  },
  'avant-garde': {
    name: 'NOCT.',
    nameJa: 'ノクト',
    tagline: 'After Midnight Forever',
    taglineJa: '夜を知る大人のための、V系とY2Kの再解釈。',
    productTag: 'brand:avant-garde',
    collections: {
      featured: 'noct-featured',
      newArrivals: 'noct-new-arrivals',
    },
  },
};

export function getBrandConfig(env: Env): BrandConfig {
  const id: BrandId = (env.BRAND_ID as BrandId) || 'elegant-plus';
  const meta = brandMeta[id];
  const theme = themes[id];

  let storeDomain: string;
  let storefrontApiToken: string;

  if (id === 'elegant-plus') {
    storeDomain = env.BRAND1_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN;
    storefrontApiToken = env.BRAND1_STOREFRONT_API_TOKEN || env.PUBLIC_STOREFRONT_API_TOKEN;
  } else {
    storeDomain = env.BRAND2_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN;
    storefrontApiToken = env.BRAND2_STOREFRONT_API_TOKEN || env.PUBLIC_STOREFRONT_API_TOKEN;
  }

  return {
    id,
    ...meta,
    storeDomain,
    storefrontApiToken,
    theme,
  };
}

export function getCssVarsString(theme: BrandTheme): string {
  return Object.entries(theme.cssVars)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}
