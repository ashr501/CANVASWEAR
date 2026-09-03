/** descriptionHtmlなどのHTMLからmeta descriptionを作る。タグを除去し155字程度に丸める。 */
export function stripHtml(html: string, maxLength = 155): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/** 全ページ共通のタイトル書式（「ページ名｜CANVASWEARS」）。
 *  検索結果でブランド名が出るようにする。ホームは自前でブランド名を
 *  含むタイトルを作るので、この書式は使わない。 */
export function titleTemplate(brandName: string): string {
  return brandName ? `%s｜${brandName}` : '%s';
}

/** パンくずのJSON-LD。検索結果にパンくずが出て、階層も伝わる。 */
export function breadcrumbJsonLd(
  origin: string,
  trail: Array<{name: string; path: string}>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}

/** サイト全体を表すOrganization + WebSite。トップページにだけ入れる。 */
export function siteJsonLd({
  origin,
  name,
  description,
  sameAs,
}: {
  origin: string;
  name: string;
  description: string;
  sameAs: string[];
}) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url: origin,
      description,
      sameAs,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      url: origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${origin}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/** リクエストURLからオリジン（https://canvaswears.com）を取り出す */
export function originOf(request: Request): string {
  return new URL(request.url).origin;
}
