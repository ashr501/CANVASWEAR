import {useMemo, useState} from 'react';
import {type LoaderFunctionArgs, useLoaderData} from 'react-router';
import {
  CANVASWEAR_FAQ,
  CopyrightNotice,
  FAQ_CATEGORIES,
  FaqItemRow,
} from '~/components/FaqSection';
import {getBrandConfig} from '~/lib/brand.server';
import {originOf, titleTemplate} from '~/lib/seo';
import {getSeoMeta} from '~/lib/shopify-ui';

export const meta = ({data}: any) =>
  getSeoMeta({
    title: 'よくあるご質問',
    titleTemplate: titleTemplate(data?.brandName ?? ''),
    description:
      '入稿データ・デザイン・ご注文・納期・送料・お支払い・返品など、カスタムプリントについてよくいただくご質問にお答えします。',
    url: data?.seoUrl,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: CANVASWEAR_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {'@type': 'Answer', text: item.a},
      })),
    },
  });

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);
  return {brandName: brand.name, seoUrl: request.url, origin: originOf(request)};
}

/** よくあるご質問の一覧ページ。分類ごとにまとめ、キーワードで絞り込める */
export default function FaqPage() {
  useLoaderData<typeof loader>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return CANVASWEAR_FAQ;
    return CANVASWEAR_FAQ.filter((item) => item.q.includes(q) || item.a.includes(q));
  }, [query]);

  return (
    <div className="section-pad">
      <div className="container-brand max-w-3xl mx-auto">
        <p
          className="text-xs tracking-widest uppercase mb-2 text-center"
          style={{color: 'var(--color-primary)'}}
        >
          FAQ
        </p>
        <h1
          className="text-center mb-8"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
            color: 'var(--color-text)',
          }}
        >
          よくあるご質問
        </h1>

        {/* 分類へのジャンプ */}
        <nav aria-label="質問の分類" className="flex flex-wrap justify-center gap-2 mb-6">
          {FAQ_CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`#${encodeURIComponent(cat)}`}
              className="px-4 py-2 text-xs"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 999,
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              {cat}
            </a>
          ))}
        </nav>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワードで探す（例：納期、送料、テンプレート）"
          aria-label="キーワードで質問を探す"
          className="w-full p-3 text-sm mb-8"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface)',
          }}
        />

        <CopyrightNotice />

        {filtered.length === 0 && (
          <p className="text-sm text-center py-8" style={{color: 'var(--color-text-muted)'}}>
            該当する質問が見つかりませんでした。<a href="/pages/contact" className="underline">お問い合わせ</a>
            からお気軽にご質問ください。
          </p>
        )}

        {FAQ_CATEGORIES.map((cat) => {
          const items = filtered.filter((item) => item.cat === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} id={encodeURIComponent(cat)} className="mb-10" style={{scrollMarginTop: 140}}>
              <h2
                className="text-base md:text-lg mb-4 pb-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  borderBottom: '2px solid var(--color-primary)',
                }}
              >
                {cat}
                <span className="ml-2 text-xs" style={{color: 'var(--color-text-muted)', fontWeight: 400}}>
                  {items.length}件
                </span>
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <FaqItemRow key={item.q} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        <p className="text-sm text-center mt-12" style={{color: 'var(--color-text-muted)'}}>
          ここにないご質問は、<a href="/pages/contact" className="underline">お問い合わせ</a>
          またはLINEからお気軽にどうぞ。
        </p>
      </div>
    </div>
  );
}
