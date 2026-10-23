/**
 * 古い商品説明の中に埋め込まれた Alo Lore 用の柄選び（共通193柄）を取り除く。
 * Alo Loreのテーマではスクリプトで動くが、CANVASWEARSでは動かず空の枠になるため。
 */
export function stripLegacyPatternPicker(descriptionHtml: string): string {
  return descriptionHtml
    .replace(/<section id="alo-common-picker"[\s\S]*?<\/section>/g, '')
    .replace(/<script>\(function\(\)\{const root=document\.getElementById\('alo-common-picker'\)[\s\S]*?<\/script>/g, '')
    .replace(/<style>[^<]*#alo-common-picker[\s\S]*?<\/style>/g, '');
}
