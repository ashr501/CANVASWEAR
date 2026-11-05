import type {LoaderFunctionArgs} from 'react-router';
import {PATTERN_CATEGORIES, loadPatternLibrary} from '~/lib/pattern-library.server';

const PAGE = 60;

/** 柄ライブラリの検索。?category=&q=&offset= で絞り込み、60点ずつ返す */
export async function loader({request}: LoaderFunctionArgs) {
  const params = new URL(request.url).searchParams;
  const category = params.get('category') ?? '';
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const offset = Math.max(0, Number(params.get('offset') ?? 0) || 0);

  try {
    const all = await loadPatternLibrary();
    const filtered = all.filter(
      (p) => (!category || p.category === category) && (!q || p.code.toLowerCase().includes(q)),
    );
    return Response.json(
      {
        total: filtered.length,
        categories: Object.values(PATTERN_CATEGORIES).map((name) => ({
          name,
          count: all.filter((p) => p.category === name).length,
        })),
        items: filtered.slice(offset, offset + PAGE),
        nextOffset: offset + PAGE < filtered.length ? offset + PAGE : null,
      },
      {headers: {'Cache-Control': 'public, max-age=3600'}},
    );
  } catch (error) {
    return Response.json(
      {error: error instanceof Error ? error.message : '柄ライブラリを読み込めませんでした'},
      {status: 502},
    );
  }
}
