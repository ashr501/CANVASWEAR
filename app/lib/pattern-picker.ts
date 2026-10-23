import commonPatternsData from './common-patterns.json';

/**
 * Alo Lore の「柄見本から選ぶ」（共通193柄）。
 * Alo Loreではテーマが特定の商品にだけ表示している。CANVASWEARSでは同じ商品に
 * タグ「柄見本選択」を付け、そのタグがある商品だけに PatternPicker を出す。
 * 柄の一覧は Alo Lore のテーマが使っているものの写し（2026/10/23時点）。
 */
export type CommonPattern = {
  id: string;
  name: string;
  category: string;
  swatch: string;
};

export const PATTERN_PICKER_TAG = '柄見本選択';
export const COMMON_PATTERNS = commonPatternsData as CommonPattern[];

/**
 * 古い商品説明の中に埋め込まれた柄選び（Alo Loreのテーマではスクリプトで動くが、
 * CANVASWEARSでは動かず空の枠になる）を取り除く。
 */
export function stripLegacyPatternPicker(descriptionHtml: string): string {
  return descriptionHtml
    .replace(/<section id="alo-common-picker"[\s\S]*?<\/section>/g, '')
    .replace(/<script>\(function\(\)\{const root=document\.getElementById\('alo-common-picker'\)[\s\S]*?<\/script>/g, '')
    .replace(/<style>[^<]*#alo-common-picker[\s\S]*?<\/style>/g, '');
}
