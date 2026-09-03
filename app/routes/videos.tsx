import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import {getSeoMeta} from '@shopify/hydrogen';
import {VIDEO_PRODUCTS_QUERY} from '~/lib/queries';
import {getBrandConfig} from '~/lib/brand.server';
import {titleTemplate} from '~/lib/seo';
import {isBoldBrand} from '~/lib/brands';

const MAX_PAGES = 5; // 250件 x 5 = 1250件までの商品をスキャンする

export const meta = ({data}: any) =>
  getSeoMeta({
    title: '動画でみる',
    titleTemplate: titleTemplate(data?.brandName ?? ''),
    description:
      'カスタムプリント商品の着用イメージや質感を動画でご覧いただけます。生地感やシルエットを確認してからご注文ください。',
    url: data?.seoUrl,
  });

export async function loader({request, context}: LoaderFunctionArgs) {
  const brand = getBrandConfig(context.env, request);

  const videos: Array<{
    productId: string;
    title: string;
    handle: string;
    previewImage: string | null;
    sources: Array<{url: string; format: string}>;
  }> = [];

  let after: string | undefined;
  for (let i = 0; i < MAX_PAGES; i++) {
    const data: any = await context.storefront.query(VIDEO_PRODUCTS_QUERY, {
      variables: {
        handle: brand.collections.all,
        first: 250,
        after,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
      // 動画一覧は頻繁には変わらないので長めにキャッシュする
      cache: context.storefront.CacheCustom({
        mode: 'public',
        maxAge: 600,
        staleWhileRevalidate: 3600,
      }),
    });

    const connection = data?.collection?.products;
    if (!connection) break;

    for (const product of connection.nodes) {
      const video = product.media.nodes.find((m: any) => m.__typename === 'Video');
      if (video) {
        videos.push({
          productId: product.id,
          title: product.title,
          handle: product.handle,
          previewImage: video.previewImage?.url ?? null,
          sources: video.sources.filter((s: any) => s.format === 'mp4'),
        });
      }
    }

    if (!connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return {videos, brandId: brand.id, seoUrl: request.url, brandName: brand.name};
}

export default function VideosPage() {
  const {videos, brandId} = useLoaderData<typeof loader>();
  const isAvantGarde = isBoldBrand(brandId);

  return (
    <div className="section-pad">
      <div className="container-brand">
        <div className="mb-12 pb-8" style={{borderBottom: '1px solid var(--color-border)'}}>
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{color: isAvantGarde ? 'var(--color-accent)' : 'var(--color-primary)'}}
          >
            VIDEO
          </p>
          <h1
            className="text-display-lg italic"
            style={{fontFamily: 'var(--font-heading)', color: 'var(--color-text)'}}
          >
            動画でみる
          </h1>
          <p className="mt-4 text-sm" style={{color: 'var(--color-text-muted)'}}>
            着用イメージや製作の様子を動画でご覧いただけます（{videos.length}件）
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm tracking-widest" style={{color: 'var(--color-text-muted)'}}>
              動画がありません
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {videos.map((video) => (
              <Link
                key={video.productId}
                to={`/products/${video.handle}`}
                className="group block"
              >
                <div
                  className="relative aspect-[3/4] overflow-hidden mb-2"
                  style={{borderRadius: 'var(--radius)', backgroundColor: 'var(--color-border)'}}
                >
                  {video.previewImage && (
                    <img
                      src={video.previewImage}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <span
                    className="absolute inset-0 flex items-center justify-center text-white text-2xl"
                    style={{backgroundColor: 'rgba(0,0,0,0.15)'}}
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </div>
                <p
                  className="text-xs leading-snug line-clamp-2"
                  style={{color: 'var(--color-text)'}}
                >
                  {video.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
