import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {NEWS_LIST_QUERY} from '~/lib/queries';
import {getBrandConfig} from '~/lib/brand.server';
import {titleTemplate} from '~/lib/seo';
import {formatNewsDate} from '~/lib/news';

export const meta = ({data}: any) =>
  getSeoMeta({
    title: 'お知らせ',
    titleTemplate: titleTemplate(data?.brandName ?? ''),
    description: '新商品の追加など、CANVASWEARSからのお知らせです。',
    url: data?.seoUrl,
  });

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  // お知らせ用のブログを持たないブランドにはこのページを出さない
  if (!brand.newsBlog) {
    throw new Response('Not found', {status: 404});
  }

  const data: any = await context.storefront.query(NEWS_LIST_QUERY, {
    variables: {
      blog: brand.newsBlog,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: context.storefront.CacheShort(),
  });

  return {
    articles: data?.blog?.articles?.nodes ?? [],
    seoUrl: request.url,
    brandName: brand.name,
  };
}

export default function NewsIndex() {
  const {articles} = useLoaderData<typeof loader>();

  return (
    <div className="section-pad">
      <div className="container-brand max-w-3xl mx-auto">
        <div className="mb-12 pb-8" style={{borderBottom: '1px solid var(--color-border)'}}>
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{color: 'var(--color-primary)'}}
          >
            NEWS
          </p>
          <h1
            className="text-display-lg"
            style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
          >
            お知らせ
          </h1>
        </div>

        {articles.length === 0 ? (
          <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>
            お知らせはまだありません。
          </p>
        ) : (
          <ul>
            {articles.map((article: any) => (
              <li key={article.handle} style={{borderBottom: '1px solid var(--color-border)'}}>
                <Link
                  to={`/news/${article.handle}`}
                  className="flex items-center gap-5 py-6 group"
                >
                  {article.image?.url && (
                    <img
                      src={`${article.image.url}&width=200`}
                      alt={article.image.altText ?? ''}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover shrink-0"
                      style={{borderRadius: 'var(--radius)'}}
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <time
                      dateTime={article.publishedAt}
                      className="block text-xs mb-1"
                      style={{color: 'var(--color-text-muted)'}}
                    >
                      {formatNewsDate(article.publishedAt)}
                    </time>
                    <p
                      className="text-base font-medium mb-1 group-hover:opacity-70 transition-opacity"
                      style={{color: 'var(--color-text)'}}
                    >
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className="text-sm line-clamp-2" style={{color: 'var(--color-text-muted)'}}>
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
