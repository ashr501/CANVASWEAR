/**
 * マルチサイトのブランド定義。
 *
 * ここに1ブランド追加するだけで新しいサイトが1つ増える。
 * サーバー専用の値（トークン等）は入れないこと（このファイルはブラウザにも配信される）。
 * ストアの接続情報は環境変数 `<envPrefix>_STORE_DOMAIN` / `<envPrefix>_STOREFRONT_API_TOKEN`
 * から読む（app/lib/brand.server.ts を参照）。
 */

export type BrandId = 'elegant-plus' | 'avant-garde' | 'bridal' | 'custom-print';

/**
 * 見た目の系統。ボタン・余白・和文/英文ラベルの出し分けに使う。
 * - elegant: セリフ体・細い罫線（HAORI+ / BRILLAR）
 * - bold:    極太・大文字・英文ラベル（NOCT.）
 * - clean:   サンセリフ・角丸（スポーツ/カジュアル系）
 */
export type BrandUiMode = 'elegant' | 'bold' | 'clean';

export interface BrandTheme {
  cssVars: Record<string, string>;
  googleFonts: string;
}

export interface BrandNavItem {
  label: string;
  /** Shopifyのコレクションhandle */
  handle: string;
}

/** トップページ中段のコンセプト文 */
export interface BrandConcept {
  eyebrow: string;
  /** 改行位置を保つため行ごとの配列 */
  heading: string[];
  body: string;
}

/** サイト内の固定文言。ブランドごとに和文/英文を切り替える */
export interface BrandCopy {
  heroEyebrow: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  featuredEyebrow: string;
  featuredHeading: string;
  newEyebrow: string;
  newHeading: string;
  viewAll: string;
  navCollections: string;
  navAllItems: string;
  allItemsEyebrow: string;
  allItemsHeading: string;
  empty: string;
}

/**
 * ヒーローの構成。
 * - tagline: 英字タグラインを大きく出す（HAORI+ / NOCT. / BRILLAR）
 * - split:   和文の見出しを主役にし、右に実際の商品を並べる（CANVASWEAR）
 */
export type BrandHeroLayout = 'tagline' | 'split';

export interface BrandDefinition {
  id: BrandId;
  name: string;
  nameJa: string;
  tagline: string;
  taglineJa: string;
  uiMode: BrandUiMode;
  heroLayout: BrandHeroLayout;
  /** heroLayout: 'split' のときの見出し（改行位置を保つため行ごと） */
  heroHeading?: string[];
  /** heroLayout: 'split' のときの説明文 */
  heroBody?: string;
  /** ホスト名にこの文字列が含まれていればこのブランドと判定（独自ドメイン運用時） */
  hostMatches: string[];
  /** ストア接続情報を読む環境変数の接頭辞 */
  envPrefix: string;
  /** ブランド専用コレクションのhandle */
  collections: {
    featured: string;
    newArrivals: string;
    /** 「全商品」ページとナビの起点になるコレクション */
    all: string;
  };
  /** ヘッダー/フッターに並べるカテゴリ */
  nav: BrandNavItem[];
  concept: BrandConcept;
  copy: BrandCopy;
  theme: BrandTheme;
}

const JA_COPY: BrandCopy = {
  heroEyebrow: 'NEW ARRIVAL',
  heroPrimaryCta: 'コレクションを見る',
  heroSecondaryCta: 'すべての商品',
  featuredEyebrow: 'おすすめ',
  featuredHeading: '注目のアイテム',
  newEyebrow: '新着アイテム',
  newHeading: '新着',
  viewAll: 'すべて見る →',
  navCollections: 'コレクション',
  navAllItems: '全商品',
  allItemsEyebrow: '全商品',
  allItemsHeading: 'すべてのアイテム',
  empty: '商品がありません',
};

const EN_COPY: BrandCopy = {
  heroEyebrow: 'NEW COLLECTION',
  heroPrimaryCta: 'EXPLORE',
  heroSecondaryCta: 'ALL ITEMS',
  featuredEyebrow: 'SELECTION',
  featuredHeading: 'FEATURED PIECES',
  newEyebrow: 'NEW ARRIVALS',
  newHeading: 'NEW IN',
  viewAll: 'VIEW ALL →',
  navCollections: 'COLLECTION',
  navAllItems: 'ALL ITEMS',
  allItemsEyebrow: 'ALL ITEMS',
  allItemsHeading: 'COLLECTION',
  empty: 'NO PRODUCTS FOUND',
};

export const BRANDS: Record<BrandId, BrandDefinition> = {
  'elegant-plus': {
    id: 'elegant-plus',
    name: 'HAORI+',
    nameJa: 'ハオリプラス',
    tagline: 'Elegance Without Limits',
    taglineJa: '大きなサイズの美しさを、すべての女性へ',
    uiMode: 'elegant',
    heroLayout: 'tagline',
    hostMatches: ['haori'],
    envPrefix: 'BRAND1',
    collections: {
      featured: 'elegant-featured',
      newArrivals: 'elegant-new-arrivals',
      all: 'elegant-all',
    },
    nav: [{label: '全アイテム', handle: 'elegant-all'}],
    concept: {
      eyebrow: 'OUR STORY',
      heading: ['すべての体型に', '美しい羽織を'],
      body: 'プラスサイズの女性のための、上質な羽織物のコレクション。エレガントなデザインと日本の美意識を融合させ、あなたの美しさを引き立てるアイテムをお届けします。',
    },
    copy: JA_COPY,
    theme: {
      cssVars: {
        '--color-bg': '#FAFAF8',
        '--color-surface': '#FFFFFF',
        '--color-hero-bg': '#F0EBE3',
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
  },

  'avant-garde': {
    id: 'avant-garde',
    name: 'NOCT.',
    nameJa: 'ノクト',
    tagline: 'After Midnight Forever',
    taglineJa: '夜を知る大人のための、V系とY2Kの再解釈。',
    uiMode: 'bold',
    heroLayout: 'tagline',
    hostMatches: ['noct'],
    envPrefix: 'BRAND2',
    collections: {
      featured: 'noct-featured',
      newArrivals: 'noct-new-arrivals',
      all: 'noct-all',
    },
    nav: [{label: 'ALL', handle: 'noct-all'}],
    concept: {
      eyebrow: 'OUR PHILOSOPHY',
      heading: ['OUR PHILOSOPHY'],
      body: '年齢や体型に関係なく、ファッションは自己表現の手段。私たちは、独自のスタイルを持つ大人のための服を作ります。',
    },
    copy: EN_COPY,
    theme: {
      cssVars: {
        '--color-bg': '#0D0D0D',
        '--color-surface': '#1A1A1A',
        '--color-hero-bg': '#0D0D0D',
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
  },

  // bridesmaids.jp から切り出したブライダル専門サイト。
  // ブランド名を変えるときは name / nameJa / tagline を書き換えるだけでよい。
  bridal: {
    id: 'bridal',
    name: 'BRILLAR',
    nameJa: 'ブリラー',
    tagline: 'For Your One Day',
    taglineJa: 'ウェディングドレスとブライダルアクセサリーの専門店',
    uiMode: 'elegant',
    heroLayout: 'tagline',
    hostMatches: ['brillar', 'bridal'],
    envPrefix: 'BRAND3',
    collections: {
      featured: 'bridal-all',
      newArrivals: 'bridal-new-arrivals',
      all: 'bridal-all',
    },
    nav: [
      {label: 'ウェディングドレス', handle: 'bridal-dress'},
      {label: 'アクセサリー', handle: 'bridal-accessories'},
      {label: 'ベール・ブーケ', handle: 'bridal-veil'},
    ],
    concept: {
      eyebrow: 'OUR STORY',
      heading: ['一生に一度の日を', '飾るために'],
      body: 'ドレスからベール、ヘッドピース、イヤリングまで。花嫁のための一式を、ひとつのお店で選んでいただけます。すべてBridesmaidsJPが実際に取り扱っている商品です。',
    },
    copy: {
      ...JA_COPY,
      heroEyebrow: 'BRIDAL COLLECTION',
      featuredEyebrow: 'おすすめ',
      featuredHeading: '人気のアイテム',
    },
    theme: {
      cssVars: {
        '--color-bg': '#FBF8F6',
        '--color-surface': '#FFFFFF',
        '--color-hero-bg': '#F3EBE6',
        '--color-primary': '#A88B7D',
        '--color-secondary': '#7A5F55',
        '--color-accent': '#A88B7D',
        '--color-text': '#33292B',
        '--color-text-muted': '#8A7A78',
        '--color-border': '#EBE1DC',
        '--font-heading': "'Marcellus'",
        '--font-body': "'Noto Serif JP'",
        '--section-spacing': '5.5rem',
        '--gutter': '1.5rem',
        '--ease': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '--radius': '2px',
      },
      googleFonts:
        'https://fonts.googleapis.com/css2?family=Marcellus&family=Noto+Serif+JP:wght@300;400;500&display=swap',
    },
  },

  // カスタムプリントのサイト。
  // いまは BridesmaidsJP の custom-print コレクション（15点・tag: print）を見ている。
  // 別ストアに移す場合は BRAND4_STORE_DOMAIN / BRAND4_STOREFRONT_API_TOKEN を
  // そのストアの値に変え、下の collections / nav をそのストアのhandleに差し替える。
  'custom-print': {
    id: 'custom-print',
    name: 'CANVASWEAR',
    nameJa: 'キャンバスウェア',
    tagline: 'Your Canvas',
    taglineJa: '昇華プリントで、どんな柄も1点から。',
    uiMode: 'clean',
    heroLayout: 'split',
    heroHeading: ['どんな柄でも、', '1点から。'],
    heroBody:
      '写真もイラストも全面フルカラー。染料が繊維そのものを染めるので、ごわつかず、洗っても色落ちしません。',
    hostMatches: ['canvaswear', 'custom-print'],
    envPrefix: 'BRAND4',
    collections: {
      featured: 'custom-print',
      newArrivals: 'custom-print',
      all: 'custom-print',
    },
    nav: [{label: 'カスタムプリント', handle: 'custom-print'}],
    concept: {
      eyebrow: 'ABOUT SUBLIMATION',
      heading: ['どんな柄でも、', '1点から。'],
      body: '昇華プリントなので、写真もイラストも全面フルカラーで再現できます。染料が生地の繊維そのものに定着するため、プリント部分がごわつかず、洗ってもひび割れや色落ちがありません。在庫の柄に縛られず、1点からお作りします。',
    },
    copy: {
      ...JA_COPY,
      heroEyebrow: 'CUSTOM PRINT',
      featuredEyebrow: '人気の柄',
      featuredHeading: 'ピックアップ',
      allItemsEyebrow: 'ALL PRINTS',
      allItemsHeading: 'すべての柄',
      heroPrimaryCta: '柄を見る',
      heroSecondaryCta: 'データを入稿する',
    },
    theme: {
      cssVars: {
        '--color-bg': '#FFFFFF',
        '--color-surface': '#F7F7F5',
        '--color-hero-bg': '#EFEDE9',
        '--color-primary': '#1F1F1F',
        '--color-secondary': '#4A4A4A',
        '--color-accent': '#FF5A36',
        '--color-text': '#141414',
        '--color-text-muted': '#767676',
        '--color-border': '#E2E0DC',
        '--font-heading': "'Outfit'",
        '--font-body': "'Noto Sans JP'",
        '--section-spacing': '4.5rem',
        '--gutter': '1.25rem',
        '--ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
        '--radius': '8px',
      },
      googleFonts:
        'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap',
    },
  },
};

/**
 * ブラウザに渡すブランド情報。
 * ストアドメインやトークンは含めない（root.tsxのloaderがこの形で返す）。
 */
export type PublicBrand = Pick<
  BrandDefinition,
  | 'id'
  | 'name'
  | 'nameJa'
  | 'tagline'
  | 'taglineJa'
  | 'uiMode'
  | 'heroLayout'
  | 'heroHeading'
  | 'heroBody'
  | 'nav'
  | 'copy'
  | 'concept'
  | 'collections'
> & {googleFonts: string};

export const BRAND_IDS = Object.keys(BRANDS) as BrandId[];

/**
 * 環境変数 BRAND_ID が未設定のときに表示するサイト。
 * 他のサイトとして動かすときは、デプロイ先で BRAND_ID を設定する。
 */
export const DEFAULT_BRAND_ID: BrandId = 'custom-print';

export function isBrandId(value: unknown): value is BrandId {
  return typeof value === 'string' && (BRAND_IDS as string[]).includes(value);
}

/** ブランドIDから見た目の系統を引く（コンポーネントはこれで分岐する） */
export function getUiMode(brandId: string): BrandUiMode {
  return isBrandId(brandId) ? BRANDS[brandId].uiMode : 'elegant';
}

export function isBoldBrand(brandId: string): boolean {
  return getUiMode(brandId) === 'bold';
}

export function getCssVarsString(theme: BrandTheme): string {
  return Object.entries(theme.cssVars)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}
