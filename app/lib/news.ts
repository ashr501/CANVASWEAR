/** 記事の日付を「2026年9月25日」の形にする。サーバーとブラウザで表示がずれないよう日本時間で固定する。 */
export function formatNewsDate(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}
