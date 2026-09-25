import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {NEWS_ARTICLE_QUERY} from '~/lib/queries';
import {getBrandConfig} from '~/lib/brand.server';
import {titleTemplate} from '~/lib/seo';
import {formatNewsDate} from '~/lib/news';

export const meta = ({data}: any) =>
  getSeoMeta({
    title: data?.article?.title ?? 'お知らせ',
    titleTemplate: titleTemplate(data?.brandName ?? ''),
    description: data?.article?.excerpt ?? undefined,
    url: data?.seoUrl,
    media: data?.article?.image?.url,
  });

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  if (!brand.newsBlog || !params.handle) {
    throw new Response('Not found', {status: 404});
  }

  const data: any = await context.storefront.query(NEWS_ARTICLE_QUERY, {
    variables: {
      blog: brand.newsBlog,
      handle: params.handle,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: context.storefront.CacheShort(),
  });

  const article = data?.blog?.articleByHandle;
  if (!article) {
    throw new Response('Not found', {status: 404});
  }

  return {article, seoUrl: request.url, brandName: brand.name};
}

export default function NewsArticle() {
  const {article} = useLoaderData<typeof loader>();

  return (
    <div className="section-pad">
      <div className="container-brand max-w-3xl mx-auto">
        <Link
          to="/news"
          className="inline-block text-xs tracking-widest mb-8 hover:opacity-60 transition-opacity"
          style={{color: 'var(--color-text-muted)'}}
        >
          ← お知らせ一覧
        </Link>

        <time
          dateTime={article.publishedAt}
          className="block text-xs mb-2"
          style={{color: 'var(--color-text-muted)'}}
        >
          {formatNewsDate(article.publishedAt)}
        </time>
        <h1
          className="mb-10"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            lineHeight: 1.4,
            color: 'var(--color-text)',
          }}
        >
          {article.title}
        </h1>

        {/* 本文はShopifyの記事（日次処理が作る新商品一覧、または管理画面で書いたお知らせ） */}
        <div
          className="text-sm leading-loose news-body"
          style={{color: 'var(--color-text)'}}
          dangerouslySetInnerHTML={{__html: article.contentHtml}}
        />
      </div>
    </div>
  );
}
