import type {Storefront} from '@shopify/hydrogen';

/**
 * コレクションの商品数を数える。
 *
 * Storefront APIのCollectionには件数を返す項目がないため、商品IDだけを250件ずつ
 * たどって数える。ページ表示のたびに数え直すと重いので、結果は長めにキャッシュする
 * （1時間は新鮮扱い、その後も1日は古い値を返しつつ裏で更新）。
 * privateトークンはCANVASWEARチャネルの商品しか返さないので、数はサイトの表示と一致する。
 */
const COUNT_QUERY = `#graphql
  query CollectionCount(
    $handle: String!
    $after: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250, after: $after) {
        nodes { id }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

/** 1コレクションあたりの上限ページ数（250件×20＝5,000件）。想定外の無限ループ防止 */
const MAX_PAGES = 20;

export async function countCollection(
  storefront: Storefront,
  handle: string,
): Promise<number | null> {
  let total = 0;
  let after: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const data: any = await storefront.query(COUNT_QUERY, {
      variables: {
        handle,
        after,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
      cache: storefront.CacheCustom({
        mode: 'public',
        maxAge: 60 * 60,
        staleWhileRevalidate: 60 * 60 * 23,
      }),
    });
    const products = data?.collection?.products;
    if (!products) return null;
    total += products.nodes.length;
    if (!products.pageInfo.hasNextPage) return total;
    after = products.pageInfo.endCursor;
  }
  return total;
}

/** 複数コレクションをまとめて数える。数えられなかったものは結果に含めない。 */
export async function countCollections(
  storefront: Storefront,
  handles: string[],
): Promise<Record<string, number>> {
  const results = await Promise.all(
    handles.map((handle) => countCollection(storefront, handle).catch(() => null)),
  );
  const counts: Record<string, number> = {};
  handles.forEach((handle, i) => {
    const n = results[i];
    if (typeof n === 'number') counts[handle] = n;
  });
  return counts;
}
