/**
 * 柄ライブラリ（ZD Customの柄 約1万点）。一覧のデータは浅原さんが整理した
 * https://canvaswears-pattern.pages.dev/patterns.json を読み、同じワーカーの中では使い回す。
 */
const LIBRARY_URL = 'https://canvaswears-pattern.pages.dev/patterns.json';

export type LibraryPattern = {
  /** 柄番号（ZDへの発注に使う） */
  code: string;
  /** 分類（日本語） */
  category: string;
  thumb: string;
  full: string;
};

/** ZDの分類名（中国語）→ サイトに出す日本語 */
export const PATTERN_CATEGORIES: Record<string, string> = {
  波利尼西亚: 'ハワイアン・ポリネシアン',
  花草植物: '花・植物',
  海洋沙滩: '海・ビーチ',
  图案类: '柄・模様',
  部落民族风: 'トライバル・民族調',
};

let cache: Promise<LibraryPattern[]> | null = null;

export function loadPatternLibrary(): Promise<LibraryPattern[]> {
  if (!cache) {
    cache = fetch(LIBRARY_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`柄ライブラリを読み込めませんでした（${res.status}）`);
        return res.json() as Promise<Array<{t: string; c: string; th: string; f: string}>>;
      })
      .then((rows) =>
        rows.map((row) => ({
          code: row.t,
          category: PATTERN_CATEGORIES[row.c] ?? row.c,
          thumb: row.th,
          full: row.f,
        })),
      )
      .catch((error) => {
        cache = null; // 失敗したら次のリクエストで読み直す
        throw error;
      });
  }
  return cache;
}
