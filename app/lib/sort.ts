export const SORT_OPTIONS = [
  {value: '', label: 'おすすめ順'},
  {value: 'newest', label: '新着順'},
  {value: 'price-asc', label: '価格が安い順'},
  {value: 'price-desc', label: '価格が高い順'},
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export function getSortVariables(sort: string | null) {
  switch (sort) {
    case 'newest':
      return {sortKey: 'CREATED', reverse: true};
    case 'price-asc':
      return {sortKey: 'PRICE', reverse: false};
    case 'price-desc':
      return {sortKey: 'PRICE', reverse: true};
    default:
      return {sortKey: 'COLLECTION_DEFAULT', reverse: false};
  }
}
