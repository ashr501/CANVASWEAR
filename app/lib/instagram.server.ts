/**
 * Instagram（@canvas_wears_tokyo）の最近の投稿を読む。
 *
 * Instagram API with Instagram Login を使う。アクセストークンは環境変数 INSTAGRAM_ACCESS_TOKEN
 * （Meta の App Dashboard で発行する長期トークン。60日有効）。設定方法は DEPLOY.md を参照。
 * トークンが無い・切れている・APIが落ちているときは空の配列を返し、トップページは
 * フォローへの案内だけを出す（ページ自体は止めない）。
 *
 * - 投稿の一覧は1時間キャッシュする（表示のたびにInstagramへ問い合わせない）
 * - トークンは7日に1回、裏で延長（refresh）を呼ぶ。延長しても文字列が変わる場合に備え、
 *   画像が出なくなったらトークンを発行し直して環境変数を差し替える
 */

export interface InstagramPost {
  id: string;
  permalink: string;
  imageUrl: string;
  caption: string;
  isVideo: boolean;
}

const GRAPH = 'https://graph.instagram.com';
const FEED_CACHE_KEY = 'https://cache.local/instagram-feed-v1';
const REFRESH_CACHE_KEY = 'https://cache.local/instagram-refresh-v1';
const FEED_TTL = 60 * 60; // 1時間
const REFRESH_INTERVAL = 7 * 24 * 60 * 60; // 7日

type RawMedia = {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
};

function toPosts(data: RawMedia[], limit: number): InstagramPost[] {
  return data
    .map((m) => ({
      id: m.id,
      permalink: m.permalink,
      // 動画はサムネイル、写真・複数枚投稿は1枚目の画像。著作権のある音源などで画像が返らない投稿は飛ばす
      imageUrl: (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url) ?? '',
      caption: (m.caption ?? '').split('\n')[0].slice(0, 80),
      isVideo: m.media_type === 'VIDEO',
    }))
    .filter((p) => p.imageUrl && p.permalink)
    .slice(0, limit);
}

export async function getInstagramPosts({
  token,
  cache,
  waitUntil,
  limit = 6,
}: {
  token?: string;
  cache?: Cache;
  waitUntil?: (p: Promise<unknown>) => void;
  limit?: number;
}): Promise<InstagramPost[]> {
  if (!token) return [];

  try {
    const cached = await cache?.match(FEED_CACHE_KEY);
    if (cached) return toPosts(((await cached.json()) as {data: RawMedia[]}).data ?? [], limit);
  } catch {
    // キャッシュが使えない環境ではそのまま問い合わせる
  }

  try {
    const url = new URL(`${GRAPH}/me/media`);
    url.searchParams.set('fields', 'id,media_type,media_url,thumbnail_url,permalink,caption');
    url.searchParams.set('limit', String(limit + 6));
    url.searchParams.set('access_token', token);
    const res = await fetch(url, {signal: AbortSignal.timeout(4000)});
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('Instagram feed error', res.status, (await res.text()).slice(0, 200));
      return [];
    }
    const body = (await res.json()) as {data: RawMedia[]};

    const work = (async () => {
      await cache
        ?.put(
          FEED_CACHE_KEY,
          new Response(JSON.stringify({data: body.data ?? []}), {
            headers: {'content-type': 'application/json', 'cache-control': `max-age=${FEED_TTL}`},
          }),
        )
        .catch(() => {});
      await refreshTokenOccasionally(token, cache);
    })();
    if (waitUntil) waitUntil(work);
    else await work;

    return toPosts(body.data ?? [], limit);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Instagram feed error', error);
    return [];
  }
}

/** 長期トークンの期限（60日）を延ばす。7日に1回だけ呼ぶ */
async function refreshTokenOccasionally(token: string, cache?: Cache) {
  try {
    if (!cache || (await cache.match(REFRESH_CACHE_KEY))) return;
    const url = new URL(`${GRAPH}/refresh_access_token`);
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', token);
    const res = await fetch(url, {signal: AbortSignal.timeout(4000)});
    if (!res.ok) return;
    await cache.put(
      REFRESH_CACHE_KEY,
      new Response('ok', {headers: {'cache-control': `max-age=${REFRESH_INTERVAL}`}}),
    );
  } catch {
    // 延長に失敗しても表示には影響しない
  }
}
